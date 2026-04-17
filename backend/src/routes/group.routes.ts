// backend/src/routes/group.routes.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { GroupService } from '../services/group.service';

const router = Router();
const groupService = new GroupService(supabase);

// All routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

function generateAccessCode(): string {
  const prefix = 'HFR';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

async function verifyGroupMembership(groupId: string, userId: string): Promise<boolean> {
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membership) return true;

  const { data: group } = await supabase
    .from('coaching_groups')
    .select('coach_id')
    .eq('id', groupId)
    .single();

  return group?.coach_id === userId;
}

// ─────────────────────────────────────────────────────────────
// COACH ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/v1/groups - Create a new coaching group (Coach only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const coachId = req.user!.id;
    const groupData = req.body;

    let accessCode = generateAccessCode();
    let codeExists = true;
    while (codeExists) {
      const { data: existing } = await supabase
        .from('coaching_groups')
        .select('id')
        .eq('access_code', accessCode)
        .single();
      if (!existing) {
        codeExists = false;
      } else {
        accessCode = generateAccessCode();
      }
    }

    const startDate = new Date(groupData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + groupData.durationWeeks * 7);

    const { data: group, error } = await supabase
      .from('coaching_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        coach_id: coachId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_weeks: groupData.durationWeeks,
        access_code: accessCode,
        max_members: groupData.maxMembers,
        pricing: groupData.pricing,
        meeting_schedule: groupData.meetingSchedule,
        status: groupData.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ group, accessCode });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/v1/groups/coach/my-groups - Get all groups for current coach
router.get('/coach/my-groups', authMiddleware, async (req, res) => {
  try {
    const coachId = req.user!.id;

    const { data: groups, error } = await supabase
      .from('coaching_groups')
      .select(`*, memberships:group_memberships(count)`)
      .eq('coach_id', coachId)
      .order('start_date', { ascending: false });

    if (error) throw error;

    res.json({ groups: groups || [] });
  } catch (error) {
    console.error('Error fetching coach groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// PATCH /api/v1/groups/:groupId/status - Update group status (Coach only)
router.patch('/:groupId/status', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;
    const coachId = req.user!.id;

    if (!['draft', 'active', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: updated, error } = await supabase
      .from('coaching_groups')
      .update({ status })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;

    res.json({ group: updated });
  } catch (error) {
    console.error('Error updating group status:', error);
    res.status(500).json({ error: 'Failed to update group status' });
  }
});

// DELETE /api/v1/groups/:groupId - Delete group (Coach only)
router.delete('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.id;

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('coaching_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// POST /api/v1/groups/:groupId/sessions - Create session (Coach only)
router.post('/:groupId/sessions', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.id;
    const sessionData = req.body;

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: session, error } = await supabase
      .from('group_sessions')
      .insert({
        group_id: groupId,
        week_number: sessionData.weekNumber,
        title: sessionData.title,
        description: sessionData.description,
        session_date: sessionData.sessionDate,
        zoom_link: sessionData.zoomLink,
        homework: sessionData.homework,
        materials: sessionData.materials || [],
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/v1/groups/:groupId/members - Get group members
// Coach gets all members; members can see the list too (for group chat context)
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: members, error } = await supabase
      .from('group_memberships')
      .select(`
        id,
        joined_at,
        membership_type,
        user:users!group_memberships_user_id_fkey(
          id, first_name, last_name, email, role
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    // Flatten user fields to top level for easier consumption
    const flat = (members || []).map((m: any) => ({
      membershipId: m.id,
      joinedAt: m.joined_at,
      membershipType: m.membership_type,
      ...m.user,
    }));

    res.json({ members: flat });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// POST /api/v1/groups/:groupId/members - Coach adds a member by email
router.post('/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.id;
    const { email } = req.body;

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Only the coach can add members' });
    }

    const { data: targetUser, error: userErr } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (userErr) throw userErr;
    if (!targetUser) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const { data: existing } = await supabase
      .from('group_memberships')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existing?.status === 'active') {
      return res.status(409).json({ error: 'User is already a member' });
    }

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
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE /api/v1/groups/:groupId/members/:memberId - Coach removes a member
router.delete('/:groupId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const coachId = req.user!.id;

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Only the coach can remove members' });
    }

    const { error } = await supabase
      .from('group_memberships')
      .update({ status: 'removed' })
      .eq('group_id', groupId)
      .eq('user_id', memberId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ─────────────────────────────────────────────────────────────
// USER ROUTES  (must all come BEFORE /:groupId catch-all)
// ─────────────────────────────────────────────────────────────

// GET /api/v1/groups - Get all active available groups
router.get('/', async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;

    res.json({ groups: groups || [] });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/v1/groups/verify-code - Verify access code
router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Access code required' });
    }

    const { data: group, error } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('access_code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !group) {
      return res.json({ valid: false, message: 'Invalid access code' });
    }

    const { count } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (count && count >= group.max_members) {
      return res.json({ valid: false, message: 'Group is full' });
    }

    res.json({
      valid: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        startDate: group.start_date,
        durationWeeks: group.duration_weeks,
        pricing: group.pricing,
        meetingSchedule: group.meeting_schedule,
      },
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// POST /api/v1/groups/join - Join group (access code required; paymentType optional)
router.post('/join', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { accessCode, paymentType = 'founding' } = req.body;

    if (!accessCode) {
      return res.status(400).json({ error: 'Access code required' });
    }

    const { data: group, error: groupError } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('access_code', accessCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Invalid access code' });
    }

    // Already a member?
    const { data: existing } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Group full?
    const { count } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (count && count >= group.max_members) {
      return res.status(400).json({ error: 'Group is full' });
    }

    const paymentAmount =
      paymentType === 'founding'
        ? group.pricing?.founding
        : group.pricing?.paymentPlan;

    const { data: membership, error: memberError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: userId,
        membership_type: 'founding',
        payment_status: 'pending',
        payment_amount: paymentAmount ?? null,
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (memberError) throw memberError;

    // Best-effort increment (non-blocking)
    try { await supabase.rpc('increment_group_members', { group_id: group.id }); } catch {}

    res.status(201).json({
      membership,
      group: { id: group.id, name: group.name, description: group.description },
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /api/v1/groups/my-groups - Get all groups the user belongs to
router.get('/my-groups', async (req, res) => {
  try {
    const userId = req.user!.id;

    const { data: memberships, error } = await supabase
      .from('group_memberships')
      .select(`
        *,
        group:coaching_groups!group_memberships_group_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) throw error;

    res.json({ groups: memberships?.map((m: any) => m.group) || [] });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /api/v1/groups/my-membership - First active membership (used by dashboard)
router.get('/my-membership', async (req, res) => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabase
      .from('group_memberships')
      .select(`
        id,
        group_id,
        membership_type,
        status,
        joined_at,
        group:coaching_groups!group_memberships_group_id_fkey(
          id, name, description, duration_weeks, start_date, status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({ membership: null });
    }

    res.json({
      membership: {
        id: data.id,
        group_id: data.group_id,
        membership_type: data.membership_type,
        group_name: (data.group as any)?.name ?? null,
        group_description: (data.group as any)?.description ?? null,
        duration_weeks: (data.group as any)?.duration_weeks ?? null,
        joined_at: data.joined_at,
      },
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ error: 'Failed to fetch membership' });
  }
});

// ─────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES  (must come LAST)
// ─────────────────────────────────────────────────────────────

// GET /api/v1/groups/:groupId - Group details
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: group, error } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;

    res.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// GET /api/v1/groups/:groupId/sessions - Sessions with user progress
router.get('/:groupId/sessions', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: sessions, error } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('week_number', { ascending: true });

    if (error) throw error;

    const { data: progress } = await supabase
      .from('user_progress')
      .select('session_id, completed, homework_submitted')
      .eq('user_id', userId)
      .eq('group_id', groupId);

    const progressMap = new Map(progress?.map((p) => [p.session_id, p]) || []);

    const sessionsWithProgress = sessions?.map((session) => ({
      ...session,
      userProgress: progressMap.get(session.id) || null,
    }));

    res.json({ sessions: sessionsWithProgress || [] });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/v1/groups/:groupId/sessions/:sessionId/complete
router.post('/:groupId/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { groupId, sessionId } = req.params;
    const userId = req.user!.id;
    const { notes, homeworkSubmitted } = req.body;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: progress, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        group_id: groupId,
        session_id: sessionId,
        completed: true,
        homework_submitted: homeworkSubmitted,
        notes,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ progress });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// GET /api/v1/groups/:groupId/messages - Group chat messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 100;
    const before = req.query.before as string | undefined;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let query = supabase
      .from('group_messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, email
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/v1/groups/:groupId/messages - Send a group message
router.post('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;
    //const { message } = req.body;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        message: content.trim(),
      })
      .select(`
        id,
        message,
        created_at,
        sender_id,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, email
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// DELETE /api/v1/groups/:groupId/messages/:messageId
router.delete('/:groupId/messages/:messageId', async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user!.id;

    const { data: message } = await supabase
      .from('group_messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('group_id', groupId)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    const isCoach = group?.coach_id === userId;
    if (message.sender_id !== userId && !isCoach) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    const { error } = await supabase
      .from('group_messages')
      .delete()
      .eq('id', messageId)
      .eq('group_id', groupId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});


// POST /api/v1/groups/:groupId/sessions/:sessionId/rsvp
router.post('/:groupId/sessions/:sessionId/rsvp', async (req, res) => {
  try {
    const { groupId, sessionId } = req.params;
    const userId = req.user!.id;

    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        group_id: groupId,
        session_id: sessionId,
        completed: false,
      }, { onConflict: 'user_id,session_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ rsvp: data });
  } catch (error) {
    console.error('Error RSVPing to session:', error);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// POST /api/v1/groups/:groupId/sessions - Coach creates session/event with notes
router.post('/:groupId/sessions', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const { data: group, error: groupError } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (groupError || group?.coach_id !== userId) {
      return res.status(403).json({ error: 'Only the coach can create sessions' });
    }

    const {
      title,
      description,
      session_date,
      zoom_link,
      week_number,
      materials,
      homework,
      recording_url,
    } = req.body;

    const { data: session, error } = await supabase
      .from('group_sessions')
      .insert({
        group_id: groupId,
        title,
        description,
        session_date,
        zoom_link,
        week_number: week_number ?? 1,
        materials: materials ?? [],
        homework,
        recording_url,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;