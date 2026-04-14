// backend/src/routes/notifications.routes.ts
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();
router.use(authMiddleware);

// Real schema columns:
//   notification_type, title, body (=message), data, is_read, sent_at (=created_at)
// We alias them to the names the frontend expects: type, message, created_at

// ── GET /api/v1/notifications ─────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT
         id,
         notification_type  AS type,
         title,
         body               AS message,
         data,
         is_read,
         sent_at            AS created_at
       FROM   notifications
       WHERE  user_id = $1
       ORDER  BY sent_at DESC
       LIMIT  40`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── GET /api/v1/notifications/unread-count ────────────────────────────────────
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM   notifications
       WHERE  user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error('❌ GET /notifications/unread-count:', err);
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// ── PATCH /api/v1/notifications/:id/read ──────────────────────────────────────
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id }  = req.params;
    await pool.query(
      `UPDATE notifications
       SET    is_read = TRUE, read_at = NOW()
       WHERE  id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ PATCH /notifications/:id/read:', err);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// ── PATCH /api/v1/notifications/read-all ─────────────────────────────────────
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await pool.query(
      `UPDATE notifications
       SET    is_read = TRUE, read_at = NOW()
       WHERE  user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ PATCH /notifications/read-all:', err);
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
});

export default router;
