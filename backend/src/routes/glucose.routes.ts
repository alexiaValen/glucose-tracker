// backend/src/routes/glucose.routes.ts - UPDATED VERSION
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/v1/glucose - Create new glucose reading (ACCEPTS BOTH FORMATS)
router.post(
  '/',
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Accept BOTH formats:
      // Web app: { value, measuredAt, notes }
      // Mobile app: { glucose_level, timestamp, notes }
      const value = req.body.value || req.body.glucose_level;
      const measuredAt = req.body.measuredAt || req.body.measured_at || req.body.timestamp;
      const notes = req.body.notes || '';
      const source = req.body.source || 'manual';
      const unit = req.body.unit || 'mg/dL';
      const mealContext = req.body.meal_context;

      console.log('ðŸ“ Creating glucose reading:', { userId, value, measuredAt, source });

      // Validate required fields
      if (!value || !measuredAt) {
        return res.status(400).json({ 
          error: 'Missing required fields: value and measuredAt' 
        });
      }

      // Validate value range
      if (value < 20 || value > 600) {
        return res.status(400).json({ 
          error: 'Glucose value must be between 20 and 600 mg/dL' 
        });
      }

      const result = await pool.query(
        `INSERT INTO glucose_readings (user_id, value, measured_at, notes, source, unit, meal_context)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, value, measuredAt, notes, source, unit, mealContext]
      );

      console.log('âœ… Glucose reading created:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('âŒ Error creating glucose reading:', error);
      res.status(500).json({ error: 'Failed to create glucose reading' });
    }
  }
);

// GET /api/v1/glucose - Get glucose readings (RETURNS ARRAY)
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      console.log('ðŸ“Š Fetching glucose readings for user:', userId);

      const result = await pool.query(
        `SELECT 
          id, 
          user_id, 
          value, 
          measured_at, 
          unit,
          notes, 
          source, 
          created_at
        FROM glucose_readings 
        WHERE user_id = $1
        ORDER BY measured_at DESC 
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      console.log(`âœ… Found ${result.rows.length} glucose readings`);
      
      // Return array directly for web app
      res.json(result.rows);
    } catch (error: any) {
      console.error('âŒ Error fetching glucose readings:', error);
      res.status(500).json({ error: 'Failed to fetch glucose readings' });
    }
  }
);

// GET /api/v1/glucose/stats - Get glucose statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    console.log('📊 Fetching glucose stats for user:', userId);

    // Build query with optional date filters
    let query = `
      SELECT 
        COUNT(*)::int as total_readings,
        ROUND(AVG(value)::numeric, 1)::float as average,
        MIN(value)::float as min_value,
        MAX(value)::float as max_value,
        ROUND(STDDEV(value)::numeric, 1)::float as std_dev
      FROM glucose_readings 
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (startDate) {
      query += ` AND measured_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND measured_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    
    const stats = result.rows[0] || {
      total_readings: 0,
      average: 0,
      min_value: 0,
      max_value: 0,
      std_dev: 0,
    };

    console.log('✅ Stats calculated:', stats);
    res.json(stats);
  } catch (error: any) {
    console.error('❌ Error fetching glucose stats:', error);
    res.status(500).json({ error: 'Failed to fetch glucose statistics' });
  }
});

// DELETE /api/v1/glucose/:id - Delete glucose reading
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM glucose_readings 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    console.log('âœ… Glucose reading deleted');
    res.json({ message: 'Reading deleted successfully' });
  } catch (error: any) {
    console.error('âŒ Error deleting glucose reading:', error);
    res.status(500).json({ error: 'Failed to delete glucose reading' });
  }
});

export default router;