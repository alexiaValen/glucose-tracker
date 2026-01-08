// backend/src/routes/glucose.routes.ts
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { supabase } from '../config/database';

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

      const { data, error } = await supabase
        .from('glucose_readings')
        .insert([{
          user_id: userId,
          glucose_level,
          timestamp,
          notes: notes || '',
          source: source || 'manual',
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      console.error('Error creating glucose reading:', error);
      res.status(500).json({ error: 'Failed to create glucose reading' });
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

      let query = supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      // Optional filters
      if (startDate) {
        query = query.gte('timestamp', startDate as string);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate as string);
      }
      if (source) {
        query = query.eq('source', source as string);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({ readings: data || [] });
    } catch (error: any) {
      console.error('Error fetching glucose readings:', error);
      res.status(500).json({ error: 'Failed to fetch glucose readings' });
    }
  }
);

// GET /api/glucose/stats - Get glucose statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    let query = supabase
      .from('glucose_readings')
      .select('glucose_level')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        in_range_percentage: 0,
      });
    }

    // Calculate statistics
    const values = data.map(r => r.glucose_level);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate in-range percentage (70-180 mg/dL)
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const inRangePercentage = (inRange / values.length) * 100;

    res.json({
      average: Math.round(average),
      min,
      max,
      count: values.length,
      in_range_percentage: Math.round(inRangePercentage),
      target_range: {
        min: 70,
        max: 180,
      },
    });
  } catch (error: any) {
    console.error('Error fetching glucose stats:', error);
    res.status(500).json({ error: 'Failed to fetch glucose stats' });
  }
});

// GET /api/glucose/chart - Get chart data
router.get('/chart', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const interval = (req.query.interval as 'hour' | 'day') || 'day';

    let query = supabase
      .from('glucose_readings')
      .select('glucose_level, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data for charting
    const chartData = (data || []).map(reading => ({
      timestamp: reading.timestamp,
      value: reading.glucose_level,
    }));

    res.json({ data: chartData, interval });
  } catch (error: any) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// DELETE /api/glucose/:id - Delete glucose reading
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('glucose_readings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the reading

    if (error) throw error;

    res.json({ message: 'Reading deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting glucose reading:', error);
    res.status(500).json({ error: 'Failed to delete glucose reading' });
  }
});

export default router;