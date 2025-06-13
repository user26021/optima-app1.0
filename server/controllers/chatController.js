const { db } = require('../config/database');
const aiService = require('../services/aiService');

class ChatController {
  /**
   * Create new chat session
   */
  async createSession(req, res) {
    try {
      const { categorySlug, title } = req.body;
      const userId = req.user.id;

      if (!categorySlug) {
        return res.status(400).json({ error: 'Category slug is required' });
      }

      // Verify category exists and is active
      const category = await db.get(
        'SELECT id, name, is_premium FROM categories WHERE slug = ? AND is_active = 1',
        [categorySlug]
      );

      if (!category) {
        return res.status(404).json({ error: 'Category not found or inactive' });
      }

      // Check if premium category and user has premium access
      if (category.is_premium && !req.user.is_premium) {
        return res.status(403).json({ 
          error: 'Premium access required for this category',
          upgrade_required: true
        });
      }

      // Create session
      const result = await db.run(
        'INSERT INTO chat_sessions (user_id, category_id, title) VALUES (?, ?, ?)',
        [userId, category.id, title || `${category.name} Chat`]
      );

      const session = await db.get(
        `SELECT s.*, c.name as category_name, c.slug as category_slug 
         FROM chat_sessions s 
         JOIN categories c ON s.category_id = c.id 
         WHERE s.id = ?`,
        [result.id]
      );

      console.log(`✅ New chat session created: ${result.id} for user ${userId}`);

      res.status(201).json({
        success: true,
        session: {
          id: session.id,
          title: session.title,
          category: {
            name: session.category_name,
            slug: session.category_slug
          },
          created_at: session.created_at
        }
      });

    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  }

  /**
   * Get user's chat sessions
   */
  async getSessions(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const sessions = await db.all(
        `SELECT s.id, s.title, s.created_at, s.updated_at,
                c.name as category_name, c.slug as category_slug,
                (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
         FROM chat_sessions s
         JOIN categories c ON s.category_id = c.id
         WHERE s.user_id = ?
         ORDER BY s.updated_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      res.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          title: session.title,
          category: {
            name: session.category_name,
            slug: session.category_slug
          },
          message_count: session.message_count,
          created_at: session.created_at,
          updated_at: session.updated_at
        }))
      });

    } catch (error) {
      console.error('Error getting chat sessions:', error);
      res.status(500).json({ error: 'Failed to get chat sessions' });
    }
  }

  /**
   * Get specific chat session with messages
   */
  async getSession(req, res) {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.user.id;

      // Get session details
      const session = await db.get(
        `SELECT s.*, c.name as category_name, c.slug as category_slug
         FROM chat_sessions s
         JOIN categories c ON s.category_id = c.id
         WHERE s.id = ? AND s.user_id = ?`,
        [sessionId, userId]
      );

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get messages
      const messages = await db.all(
        'SELECT id, role, content, metadata, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
        [sessionId]
      );

      res.json({
        success: true,
        session: {
          id: session.id,
          title: session.title,
          category: {
            name: session.category_name,
            slug: session.category_slug
          },
          created_at: session.created_at,
          updated_at: session.updated_at,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
            created_at: msg.created_at
          }))
        }
      });

    } catch (error) {
      console.error('Error getting chat session:', error);
      res.status(500).json({ error: 'Failed to get chat session' });
    }
  }

  /**
   * Send message in chat session
   */
  async sendMessage(req, res) {
    try {
      const { sessionId, content, metadata } = req.body;
      const userId = req.user.id;

      if (!sessionId || !content) {
        return res.status(400).json({ error: 'Session ID and content are required' });
      }

      // Verify session belongs to user
      const session = await db.get(
        `SELECT s.*, c.slug as category_slug
         FROM chat_sessions s
         JOIN categories c ON s.category_id = c.id
         WHERE s.id = ? AND s.user_id = ?`,
        [sessionId, userId]
      );

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Store user message
      const userMessageResult = await db.run(
        'INSERT INTO chat_messages (session_id, role, content, metadata) VALUES (?, ?, ?, ?)',
        [sessionId, 'user', content, metadata ? JSON.stringify(metadata) : null]
      );

      // Get recent messages for context
      const recentMessages = await db.all(
        'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10',
        [sessionId]
      );

      // Reverse to get chronological order
      const messages = recentMessages.reverse();

      // Get user context
      const userContext = {
        location: req.user.location,
        preferences: req.user.preferences
      };

      // Generate AI response
      const aiResponse = await aiService.generateChatResponse(
        sessionId,
        messages,
        session.category_slug,
        userContext
      );

      // Store AI response
      const aiMessageResult = await db.run(
        'INSERT INTO chat_messages (session_id, role, content, metadata) VALUES (?, ?, ?, ?)',
        [sessionId, 'assistant', aiResponse.content, JSON.stringify({ usage: aiResponse.usage })]
      );

      // Update session timestamp
      await db.run(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [sessionId]
      );

      console.log(`✅ Message exchange in session ${sessionId}`);

      res.json({
        success: true,
        messages: [
          {
            id: userMessageResult.id,
            role: 'user',
            content: content,
            metadata: metadata || null,
            created_at: new Date().toISOString()
          },
          {
            id: aiMessageResult.id,
            role: 'assistant',
            content: aiResponse.content,
            metadata: { usage: aiResponse.usage },
            created_at: new Date().toISOString()
          }
        ]
      });

    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * Delete chat session
   */
  async deleteSession(req, res) {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.user.id;

      // Verify session belongs to user
      const session = await db.get(
        'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
        [sessionId, userId]
      );

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Delete session (messages will be deleted by foreign key cascade)
      await db.run('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);

      console.log(`✅ Chat session ${sessionId} deleted by user ${userId}`);

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }
}

module.exports = new ChatController();