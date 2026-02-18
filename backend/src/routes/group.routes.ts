// backend/src/routes/group.routes.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware, requireCoach } from '../middleware/auth.middleware';
import { GroupService } from '../services/group.service';

const router = Router();

// Initialize group service
// Note: You'll need to pass your database pool here
// For Supabase, we'll adapt the service to work with Supabase client
const groupService = new GroupService(supabase);

// All routes require authentication
router.use(authMiddleware);

// ===========================================
// COACH ROUTES - Create and manage groups
// ===========================================

// POST /api/v1/groups - Create a new coaching group (Coach only)
router.post('/', requireCoach, async (req, res) => {
  try {
    const coachId = req.user!.userId;
    const groupData = req.body;

    console.log('Creating group:', groupData);

    // Generate unique access code
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

    // Calculate end date
    const startDate = new Date(groupData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (groupData.durationWeeks * 7));

    // Create group
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
        status: groupData.status || 'draft' // Default to draft
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Ã¢Å“â€¦ Group created:', group);
    console.log('Ã°Å¸â€â€˜ Access code:', accessCode);

    res.status(201).json({ 
      group,
      accessCode // Return code so coach can share it
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/v1/groups/coach/my-groups - Get all groups for the current coach
router.get('/coach/my-groups', requireCoach, async (req, res) => {
  try {
    const coachId = req.user!.userId;

    const { data: groups, error } = await supabase
      .from('coaching_groups')
      .select(`
        *,
        memberships:group_memberships(count)
      `)
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
router.patch('/:groupId/status', requireCoach, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status } = req.body;
    const coachId = req.user!.userId;

    if (!['draft', 'active', 'archived', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify coach owns this group
    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update status
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
router.delete('/:groupId', requireCoach, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.userId;

    // Verify coach owns this group
    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete group (cascade will handle memberships, messages, etc.)
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

// POST /api/v1/groups/:groupId/sessions - Create session for group (Coach only)
router.post('/:groupId/sessions', requireCoach, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.userId;
    const sessionData = req.body;

    // Verify coach owns this group
    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create session
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
        status: 'upcoming'
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

// POST /api/v1/groups/:groupId/messages - Post message to group (Coach only - announcements)
router.post('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;
    const { message, messageType = 'text' } = req.body;

    // Verify user is member or coach of this group
    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Create message
    const { data: newMessage, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        message: message,
        message_type: messageType
      })
      .select(`
        *,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, role
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/v1/groups/:groupId/members - Get group members (Coach only)
router.get('/:groupId/members', requireCoach, async (req, res) => {
  try {
    const { groupId } = req.params;
    const coachId = req.user!.userId;

    // Verify coach owns this group
    const { data: group } = await supabase
      .from('coaching_groups')
      .select('coach_id')
      .eq('id', groupId)
      .single();

    if (!group || group.coach_id !== coachId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get members
    const { data: members, error } = await supabase
      .from('group_memberships')
      .select(`
        *,
        user:users!group_memberships_user_id_fkey(
          id, first_name, last_name, email, role
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) throw error;

    res.json({ members: members || [] });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ===========================================
// USER ROUTES - Join and participate in groups
// ===========================================

// GET /api/v1/groups - Get all available groups (active only)
router.get('/', async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('status', 'active') // Only show active groups
      .gte('end_date', new Date().toISOString()) // Only future/ongoing groups
      .order('start_date', { ascending: true });

    if (error) throw error;

    res.json({ groups: groups || [] });
  } catch (error) {
    console.error('Error fetching available groups:', error);
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

    // Check if group is full
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
        meetingSchedule: group.meeting_schedule
      }
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// POST /api/v1/groups/join - Join group with access code
router.post('/join', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { accessCode, paymentType } = req.body;

    if (!accessCode || !paymentType) {
      return res.status(400).json({ error: 'Access code and payment type required' });
    }

    // Get group by code
    const { data: group, error: groupError } = await supabase
      .from('coaching_groups')
      .select('*')
      .eq('access_code', accessCode.toUpperCase())
      .eq('status', 'active')
      .single();

    if (groupError || !group) {
      return res.status(404).json({ error: 'Invalid access code' });
    }

    // Check if already member
    const { data: existing } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check if group is full
    const { count } = await supabase
      .from('group_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'active');

    if (count && count >= group.max_members) {
      return res.status(400).json({ error: 'Group is full' });
    }

    // Determine payment amount
    const paymentAmount = paymentType === 'founding' 
      ? group.pricing.founding 
      : group.pricing.paymentPlan;

    // Create membership
    const { data: membership, error: memberError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: userId,
        membership_type: 'founding',
        payment_status: 'pending',
        payment_amount: paymentAmount
      })
      .select()
      .single();

    if (memberError) throw memberError;

    // Update group member count
    await supabase.rpc('increment_group_members', { group_id: group.id });

    res.status(201).json({ 
      membership,
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /api/v1/groups/my-groups - Get user's groups (MUST BE BEFORE /:groupId)
router.get('/my-groups', async (req, res) => {
  try {
    const userId = req.user!.userId;

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

    res.json({ groups: memberships?.map(m => m.group) || [] });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /api/v1/groups/:groupId - Get group details
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    // Verify user is member or coach
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

// GET /api/v1/groups/:groupId/sessions - Get group sessions
router.get('/:groupId/sessions', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;

    // Verify user is member
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

    // Get user's progress for each session
    const { data: progress } = await supabase
      .from('user_progress')
      .select('session_id, completed, homework_submitted')
      .eq('user_id', userId)
      .eq('group_id', groupId);

    const progressMap = new Map(progress?.map(p => [p.session_id, p]) || []);

    const sessionsWithProgress = sessions?.map(session => ({
      ...session,
      userProgress: progressMap.get(session.id) || null
    }));

    res.json({ sessions: sessionsWithProgress || [] });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/v1/groups/:groupId/sessions/:sessionId/complete - Mark session complete
router.post('/:groupId/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { groupId, sessionId } = req.params;
    const userId = req.user!.userId;
    const { notes, homeworkSubmitted } = req.body;

    // Verify user is member
    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Upsert progress
    const { data: progress, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        group_id: groupId,
        session_id: sessionId,
        completed: true,
        homework_submitted: homeworkSubmitted,
        notes: notes,
        completed_at: new Date().toISOString()
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

// GET /api/v1/groups/:groupId/messages - Get group messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    // Verify user is member
    const isMember = await verifyGroupMembership(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let query = supabase
      .from('group_messages')
      .select(`
        *,
        sender:users!group_messages_sender_id_fkey(
          id, first_name, last_name, role
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
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

// ===========================================
// HELPER FUNCTIONS
// ===========================================

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
  // Check if user is member
  const { data: membership } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membership) return true;

  // Check if user is coach
  const { data: group } = await supabase
    .from('coaching_groups')
    .select('coach_id')
    .eq('id', groupId)
    .single();

  return group?.coach_id === userId;
}

export default router;