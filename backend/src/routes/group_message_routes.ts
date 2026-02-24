// backend/src/routes/group_message_routes.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // gets :groupId from parent

// ── helpers ──────────────────────────────────────────────────────────────

async function isCoachOfGroup(groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('coaching_groups')
    .select('id')
    .eq('id', groupId)
    .eq('coach_id', userId)
    .maybeSingle();
  return !!data;
}

async function isMemberOfGroup(groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return !!data;
}

async function hasGroupAccess(groupId: string, userId: string): Promise<boolean> {
  return (
    (await isCoachOfGroup(groupId, userId)) ||
    (await isMemberOfGroup(groupId, userId))
  );
}

// ── GET /groups/:groupId/messages ─────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    if (!(await hasGroupAccess(groupId, userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, email
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (err) {
    console.error('Error fetching group messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ── POST /groups/:groupId/messages ────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    if (!(await hasGroupAccess(groupId, userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, email
        )
      `)
      .single();

    if (error) throw error;
    res.status(201).json({ message: data });
  } catch (err) {
    console.error('Error sending group message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ── DELETE /groups/:groupId/messages/:messageId ───────────────────────────
// Coach can delete any message; member can only delete their own
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user!.userId;

    const coach = await isCoachOfGroup(groupId, userId);

    const query = supabase
      .from('group_messages')
      .delete()
      .eq('id', messageId)
      .eq('group_id', groupId);

    // Non-coaches can only delete their own messages
    if (!coach) query.eq('sender_id', userId);

    const { error } = await query;
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting group message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ── GET /groups/:groupId/members ──────────────────────────────────────────
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    if (!(await hasGroupAccess(groupId, userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('group_memberships')
      .select(`
        id,
        joined_at,
        membership_type,
        users!group_memberships_user_id_fkey(
          id, first_name, last_name, email
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const members = (data || []).map((row: any) => ({
      membershipId: row.id,
      joinedAt: row.joined_at,
      membershipType: row.membership_type,
      ...row.users,
    }));

    res.json({ members });
  } catch (err) {
    console.error('Error fetching group members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ── POST /groups/:groupId/members ─────────────────────────────────────────
// Coach adds a member by email
router.post('/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;
    const { email } = req.body;

    if (!(await isCoachOfGroup(groupId, userId))) {
      return res.status(403).json({ error: 'Only the coach can add members' });
    }

    // Find user by email
    const { data: targetUser, error: userErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (userErr) throw userErr;
    if (!targetUser) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    // Check not already a member
    const { data: existing } = await supabase
      .from('group_memberships')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existing?.status === 'active') {
      return res.status(409).json({ error: 'User is already a member' });
    }

    // Insert or reactivate
    if (existing) {
      await supabase
        .from('group_memberships')
        .update({ status: 'active' })
        .eq('id', existing.id);
    } else {
      await supabase.from('group_memberships').insert({
        group_id: groupId,
        user_id: targetUser.id,
        status: 'active',
        membership_type: 'added_by_coach',
        joined_at: new Date().toISOString(),
      });
    }

    res.status(201).json({ member: targetUser });
  } catch (err) {
    console.error('Error adding group member:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ── DELETE /groups/:groupId/members/:memberId ─────────────────────────────
// Coach removes a member
router.delete('/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user!.userId;

    if (!(await isCoachOfGroup(groupId, userId))) {
      return res.status(403).json({ error: 'Only the coach can remove members' });
    }

    const { error } = await supabase
      .from('group_memberships')
      .update({ status: 'removed' })
      .eq('group_id', groupId)
      .eq('user_id', memberId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing group member:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;