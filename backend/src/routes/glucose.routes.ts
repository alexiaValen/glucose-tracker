// backend/src/routes/glucose.routes.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/glucose - Create new glucose reading
router.post(
  '/',
  [
    body('glucose_level').isFloat({ min: 20, max: 600 }),
    body('timestamp').isISO8601(),
    body('notes').optional().isString(),
    body('source').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { glucose_level, timestamp, notes, source, meal_context } = req.body;
      const userId = req.user!.userId;

      console.log('📝 Creating glucose reading:', { userId, glucose_level, timestamp });

      // Use 'value' column name (not 'glucose_level')
      const result = await pool.query(
        `INSERT INTO glucose_readings (user_id, value, measured_at, notes, source, meal_context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, glucose_level, timestamp, notes || '', source || 'manual', meal_context]
      );

      console.log('✅ Glucose reading created:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('❌ Error creating glucose reading:', error);
      console.error('Error details:', error.message, error.code);
      res.status(500).json({ 
        error: 'Failed to create glucose reading',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// GET /api/glucose - Get glucose readings
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('source').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const { startDate, endDate, source } = req.query;

      console.log('📊 Fetching glucose readings for user:', userId);

      let query = `
        SELECT 
          id, 
          user_id, 
          value as glucose_level, 
          measured_at as timestamp, 
          notes, 
          source, 
          meal_context,
          created_at
        FROM glucose_readings 
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND measured_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      if (endDate) {
        query += ` AND measured_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      if (source) {
        query += ` AND source = $${paramIndex}`;
        params.push(source);
        paramIndex++;
      }

      query += ` ORDER BY measured_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      console.log(`✅ Found ${result.rows.length} glucose readings`);
      res.json({ readings: result.rows });
    } catch (error: any) {
      console.error('❌ Error fetching glucose readings:', error);
      console.error('Error details:', error.message);
      res.status(500).json({ 
        error: 'Failed to fetch glucose readings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// GET /api/glucose/stats - Get glucose statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    console.log('📈 Fetching glucose stats for user:', userId);

    let query = `
      SELECT 
        AVG(value) as average,
        MIN(value) as min,
        MAX(value) as max,
        COUNT(*) as count,
        SUM(CASE WHEN value >= 70 AND value <= 180 THEN 1 ELSE 0 END) as in_range_count
      FROM glucose_readings
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND measured_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND measured_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    const stats = result.rows[0];

    if (!stats || stats.count === '0') {
      return res.json({
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        in_range_percentage: 0,
        target_range: { min: 70, max: 180 },
      });
    }

    const inRangePercentage = (parseInt(stats.in_range_count) / parseInt(stats.count)) * 100;

    console.log('✅ Stats calculated:', { count: stats.count, avg: stats.average });

    res.json({
      average: Math.round(parseFloat(stats.average)),
      min: parseFloat(stats.min),
      max: parseFloat(stats.max),
      count: parseInt(stats.count),
      in_range_percentage: Math.round(inRangePercentage),
      target_range: {
        min: 70,
        max: 180,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching glucose stats:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch glucose stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/glucose/chart - Get chart data
router.get('/chart', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const interval = (req.query.interval as 'hour' | 'day') || 'day';

    console.log('📉 Fetching chart data for user:', userId);

    let query = `
      SELECT value as glucose_level, measured_at as timestamp
      FROM glucose_readings
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND measured_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND measured_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY measured_at ASC`;

    const result = await pool.query(query, params);

    const chartData = result.rows.map(reading => ({
      timestamp: reading.timestamp,
      value: reading.glucose_level,
    }));

    console.log(`✅ Chart data: ${chartData.length} points`);
    res.json({ data: chartData, interval });
  } catch (error: any) {
    console.error('❌ Error fetching chart data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chart data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/glucose/:id - Delete glucose reading
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    console.log('🗑️ Deleting glucose reading:', id);

    const result = await pool.query(
      `DELETE FROM glucose_readings 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    console.log('✅ Glucose reading deleted');
    res.json({ message: 'Reading deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting glucose reading:', error);
    res.status(500).json({ 
      error: 'Failed to delete glucose reading',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;