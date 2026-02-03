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

      console.log(`✅ Found ${result.rows.length} symptoms`);
      
      // Return as array for web app compatibility
      res.json(result.rows);
    } catch (error: any) {
      console.error('❌ Error fetching symptoms:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/symptoms
router.post(
  '/',
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      
      // Accept BOTH formats:
      // Web app: { symptomType, severity, notes }
      // Mobile app: { symptom_type, severity, notes, loggedAt }
      const symptomType = req.body.symptomType || req.body.symptom_type;
      const severity = req.body.severity;
      const loggedAt = req.body.loggedAt || req.body.logged_at || new Date().toISOString();
      const notes = req.body.notes;
      const glucoseReadingId = req.body.glucoseReadingId || req.body.glucose_reading_id;

      console.log('📝 Creating symptom:', { userId, symptomType, severity });

      if (!symptomType || severity === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: symptomType and severity' 
        });
      }

      // Validate severity range
      const severityNum = parseInt(severity);
      if (isNaN(severityNum) || severityNum < 1 || severityNum > 10) {
        return res.status(400).json({ 
          error: 'Severity must be between 1 and 10' 
        });
      }

      const result = await pool.query(
        `INSERT INTO symptoms 
         (user_id, symptom_type, severity, logged_at, notes, glucose_reading_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          symptomType,
          severityNum,
          loggedAt,
          notes,
          glucoseReadingId,
        ]
      );

      console.log('✅ Symptom created:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('❌ Error creating symptom:', error);
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

    console.log('✅ Symptom deleted');
    res.json({ message: 'Symptom deleted' });
  } catch (error: any) {
    console.error('❌ Error deleting symptom:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;