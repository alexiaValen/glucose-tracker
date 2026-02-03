import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Calculate cycle phase based on day
function calculatePhase(day: number): string {
  if (day >= 1 && day <= 5) return 'menstrual';
  if (day >= 6 && day <= 13) return 'follicular';
  if (day >= 14 && day <= 16) return 'ovulation';
  if (day >= 17 && day <= 28) return 'luteal';
  return 'follicular'; // Default
}

// GET /api/v1/cycles - List cycles
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit = 12 } = req.query;

    const result = await pool.query(
      `SELECT * FROM cycle_logs 
       WHERE user_id = $1 
       ORDER BY cycle_start_date DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ cycles: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/cycles/current - Get current active cycle (FIXED: added 's')
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT * FROM cycle_logs 
       WHERE user_id = $1 AND cycle_end_date IS NULL 
       ORDER BY cycle_start_date DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return null instead of 404 to match frontend expectations
      return res.json({ cycle: null });
    }

    const cycle = result.rows[0];
    
    // Calculate current day
    const startDate = new Date(cycle.cycle_start_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Update current day and phase
    const phase = calculatePhase(currentDay);
    
    await pool.query(
      `UPDATE cycle_logs SET current_day = $1, phase = $2 WHERE id = $3`,
      [currentDay, phase, cycle.id]
    );

    cycle.current_day = currentDay;
    cycle.phase = phase;

    res.json({ cycle });
  } catch (error: any) {
    console.error('Error fetching current cycle:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/cycles - Start new cycle (FIXED: added 's')
router.post(
  '/',
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      
      // Accept both camelCase (cycleStartDate) and snake_case (start_date)
      const startDate = req.body.cycleStartDate || req.body.start_date;
      const flow = req.body.flow;
      const symptoms = req.body.symptoms;

      console.log('📅 Logging cycle start:', { userId, startDate, flow, symptoms });

      if (!startDate) {
        return res.status(400).json({ 
          error: 'Missing required field: cycleStartDate or start_date' 
        });
      }

      // Validate date format
      if (isNaN(Date.parse(startDate))) {
        return res.status(400).json({ 
          error: 'Invalid date format for start date' 
        });
      }

      // Check if there's already an active cycle
      const activeResult = await pool.query(
        `SELECT id FROM cycle_logs 
         WHERE user_id = $1 AND cycle_end_date IS NULL`,
        [userId]
      );

      if (activeResult.rows.length > 0) {
        return res.status(400).json({ 
          error: 'You already have an active cycle. End it first before starting a new one.' 
        });
      }

      const currentDay = 1;
      const phase = calculatePhase(currentDay);

      const result = await pool.query(
        `INSERT INTO cycle_logs 
         (user_id, cycle_start_date, phase, current_day, flow, symptoms)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          userId,
          startDate,
          phase,
          currentDay,
          flow,
          JSON.stringify(symptoms || []),
        ]
      );

      console.log('✅ Cycle logged:', result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('❌ Error logging cycle:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// PATCH /api/v1/cycles/:id - Update cycle (end it) (FIXED: added 's')
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Accept both camelCase and snake_case
    const cycleEndDate = req.body.cycleEndDate || req.body.cycle_end_date;
    const flow = req.body.flow;
    const symptoms = req.body.symptoms;

    console.log('📅 Ending cycle:', { id: req.params.id, cycleEndDate });

    const result = await pool.query(
      `UPDATE cycle_logs 
       SET cycle_end_date = $1, flow = COALESCE($2, flow), symptoms = COALESCE($3, symptoms)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [cycleEndDate, flow, JSON.stringify(symptoms), req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    console.log('✅ Cycle ended:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ Error ending cycle:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/cycles/predict - Predict next cycle (FIXED: added 's')
router.get('/predict', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get last 3 completed cycles to calculate average length
    const result = await pool.query(
      `SELECT cycle_start_date, cycle_end_date 
       FROM cycle_logs 
       WHERE user_id = $1 AND cycle_end_date IS NOT NULL
       ORDER BY cycle_start_date DESC 
       LIMIT 3`,
      [userId]
    );

    if (result.rows.length === 0) {
      // No history, use default 28 days
      const today = new Date();
      const predictedStart = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);
      const predictedEnd = new Date(predictedStart.getTime() + 5 * 24 * 60 * 60 * 1000);

      return res.json({
        predictedStart: predictedStart.toISOString(),
        predictedEnd: predictedEnd.toISOString(),
      });
    }

    // Calculate average cycle length
    let totalDays = 0;
    for (let i = 0; i < result.rows.length - 1; i++) {
      const start1 = new Date(result.rows[i].cycle_start_date);
      const start2 = new Date(result.rows[i + 1].cycle_start_date);
      const diff = Math.abs(start1.getTime() - start2.getTime());
      totalDays += Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const avgCycleLength = Math.round(totalDays / (result.rows.length - 1));
    const lastCycleStart = new Date(result.rows[0].cycle_start_date);
    
    const predictedStart = new Date(lastCycleStart.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
    const predictedEnd = new Date(predictedStart.getTime() + 5 * 24 * 60 * 60 * 1000);

    res.json({
      predictedStart: predictedStart.toISOString(),
      predictedEnd: predictedEnd.toISOString(),
      avgCycleLength,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;