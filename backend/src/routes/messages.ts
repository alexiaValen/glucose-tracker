// backend/src/routes/messages.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    console.log('📬 Fetching conversations for user:', userId);

    const { data: conversations, error } = await supabase
      .from('messages')
      .select(
        `
        id,
        sender_id,
        recipient_id,
        message,
        read,
        created_at,
        sender:users!messages_sender_id_fkey(id, first_name, last_name, email),
        recipient:users!messages_recipient_id_fkey(id, first_name, last_name, email)
      `
      )
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const conversationMap = new Map<string, any>();

    (conversations || []).forEach((msg: any) => {
      const isSender = msg.sender_id === userId;
      const partnerId = isSender ? msg.recipient_id : msg.sender_id;
      const partner = isSender ? msg.recipient : msg.sender;

      // âœ… Safe partner fields (joins can be null)
      const partnerFirst = (partner?.first_name ?? '').toString();
      const partnerLast = (partner?.last_name ?? '').toString();
      const partnerEmail = (partner?.email ?? '').toString();

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          user: {
            id: partner?.id ?? partnerId,
            firstName: partnerFirst,
            lastName: partnerLast,
            email: partnerEmail,
          },
          lastMessage: {
            id: msg.id,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            message: msg.message,
            read: msg.read,
            created_at: msg.created_at,
          },
          unreadCount: 0,
        });
      }

      // Count unread messages (only those sent TO current user)
      if (msg.recipient_id === userId && !msg.read) {
        const conv = conversationMap.get(partnerId);
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    });

    res.json({ conversations: Array.from(conversationMap.values()) });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// âœ… IMPORTANT: this must come BEFORE "/:userId"
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get messages by conversation_id (NEW - supports conversation-based messaging)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { conversation_id, limit = 50 } = req.query;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    // Verify user is participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('coach_id, client_ids')
      .eq('id', conversation_id as string)
      .single();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.coach_id === userId ||
      conversation.client_ids.includes(userId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversation_id as string)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({ 
      messages: messages || [],
      conversation: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get messages with a specific user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user!.userId;
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message (supports both legacy recipientId and new conversation_id)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user!.userId;
    const { recipientId, message, conversation_id, content } = req.body;

    // Support both old and new API
    const messageText = content || message;
    
    if (!messageText) {
      return res.status(400).json({ error: 'Missing message content' });
    }

    // NEW: conversation-based messaging
    if (conversation_id) {
      // Verify user is participant
      const { data: conversation } = await supabase
        .from('conversations')
        .select('coach_id, client_ids')
        .eq('id', conversation_id)
        .single();

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const isParticipant =
        conversation.coach_id === senderId ||
        conversation.client_ids.includes(senderId);

      if (!isParticipant) {
        return res.status(403).json({ error: 'Not a participant in this conversation' });
      }

      // Insert into conversation_messages table
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation_id,
          sender_id: senderId,
          content: String(messageText).trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id);

      return res.status(201).json({ message: data });
    }

    // LEGACY: direct user-to-user messaging
    if (!recipientId) {
      return res.status(400).json({ error: 'Missing recipientId or conversation_id' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        message: String(messageText).trim(),
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: data });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:userId/read', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user!.userId;
    const { userId } = req.params;

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', userId)
      .eq('recipient_id', currentUserId)
      .eq('read', false);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;