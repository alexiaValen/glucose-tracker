import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/symptoms
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { limit, offset } = req.query;

      const result = await pool.query(
        `SELECT * FROM symptoms 
         WHERE user_id = $1 
         ORDER BY logged_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit || 50, offset || 0]
      );

      res.json({ symptoms: result.rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/symptoms
router.post(
  '/',
  [
    body('symptomType').notEmpty().isString(),
    body('severity').isInt({ min: 1, max: 10 }),
    body('loggedAt').optional().isISO8601(),
    body('notes').optional().isString(),
    body('glucoseReadingId').optional().isUUID(),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { symptomType, severity, loggedAt, notes, glucoseReadingId } = req.body;

      const result = await pool.query(
        `INSERT INTO symptoms 
         (user_id, symptom_type, severity, logged_at, notes, glucose_reading_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          symptomType,
          severity,
          loggedAt || new Date().toISOString(),
          notes,
          glucoseReadingId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/v1/symptoms/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      'DELETE FROM symptoms WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Symptom not found' });
    }

    res.json({ message: 'Symptom deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;