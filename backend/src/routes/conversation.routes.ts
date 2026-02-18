// backend/src/routes/conversation.routes.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ===========================================
// CONVERSATION ROUTES (1:1 Coach-Client)
// ===========================================

/**
 * POST /api/v1/conversations/create
 * Create a new 1:1 conversation between coach and client
 * Coach-only endpoint
 */
router.post('/create', async (req, res) => {
  try {
    const { coach_id, client_ids, is_private = true } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!coach_id || !client_ids?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only one client for 1:1 conversations
    if (client_ids.length > 1) {
      return res.status(400).json({ error: 'Only one client allowed for 1:1 conversations' });
    }

    const clientId = client_ids[0];

    // Verify user is the coach
    if (userId !== coach_id) {
      return res.status(403).json({ error: 'Only the coach can create conversations' });
    }

    // Check if conversation already exists
    const conversationId = `conv_${coach_id}_${clientId}`;
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (existing) {
      return res.status(200).json({ 
        conversation: existing,
        message: 'Conversation already exists'
      });
    }

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        coach_id: coach_id,
        client_ids: [clientId],
        is_private: is_private,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * POST /api/v1/conversations/get-or-create
 * Get existing conversation or create new one
 * Auto-creates if doesn't exist
 */
router.post('/get-or-create', async (req, res) => {
  try {
    const { coach_id, client_id } = req.body;
    const userId = req.user!.userId;

    if (!coach_id || !client_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user is either coach or client
    if (userId !== coach_id && userId !== client_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversationId = `conv_${coach_id}_${client_id}`;

    // Try to get existing conversation
    let { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    // If doesn't exist, create it
    if (error || !conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          coach_id: coach_id,
          client_ids: [client_id],
          is_private: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConv;
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * GET /api/v1/conversations
 * Get all conversations for current user (coach or client)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get conversations where user is coach or in client_ids
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`coach_id.eq.${userId},client_ids.cs.{${userId}}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Enrich with last message for each conversation
    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('conversation_messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          last_message: messages?.content || null,
          last_message_at: messages?.created_at || conv.updated_at,
        };
      })
    );

    res.json({ conversations: enriched });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/v1/conversations/:conversationId
 * Get specific conversation details
 */
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    // Verify user is participant
    const isParticipant =
      conversation.coach_id === userId ||
      conversation.client_ids.includes(userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PATCH /api/v1/conversations/:conversationId
 * Update conversation settings (e.g., privacy)
 */
router.patch('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { is_private } = req.body;
    const userId = req.user!.userId;

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only client can update privacy
    const isClient = conversation.client_ids.includes(userId);
    if (!isClient) {
      return res.status(403).json({ error: 'Only client can update privacy settings' });
    }

    // Update conversation
    const { data: updated, error } = await supabase
      .from('conversations')
      .update({ 
        is_private,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;

    res.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * PUT /api/v1/conversations/:conversationId/read
 * Mark all messages in conversation as read
 */
router.put('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;

    // Verify user is participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('coach_id, client_ids')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.coach_id === userId ||
      conversation.client_ids.includes(userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark messages as read (update read_at for messages not sent by current user)
    const { error } = await supabase
      .from('conversation_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;