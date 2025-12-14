import { Router, Request, Response } from 'express';
import { glucoseService } from '../services/glucose.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';

// Interface - FIXED role type
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'coach' | 'admin';  // ✅ Must match UserPayload type
  };
}

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/glucose
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit, offset, startDate, endDate, source } = req.query;

      const readings = await glucoseService.getReadings(req.user!.id, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        source: source as string,
      });

      res.json({ readings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/glucose
router.post(
  '/',
  [
    body('value').isFloat({ min: 20, max: 600 }),
    body('measuredAt').isISO8601(),
    body('unit').optional().isIn(['mg/dL', 'mmol/L']),
    body('mealContext').optional().isIn(['fasting', 'pre_meal', 'post_meal', 'bedtime', 'other']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const reading = await glucoseService.createReading(req.user!.id, {
        value: req.body.value,
        measuredAt: new Date(req.body.measuredAt),
        unit: req.body.unit,
        notes: req.body.notes,
        mealContext: req.body.mealContext,
        source: 'manual',
      });

      res.status(201).json(reading);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/v1/glucose/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await glucoseService.getStats(req.user!.id, start, end);

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/glucose/chart
router.get('/chart', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, interval = 'day' } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const chartData = await glucoseService.getChartData(
      req.user!.id,
      start,
      end,
      interval as 'hour' | 'day'
    );

    res.json({ data: chartData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/glucose/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await glucoseService.deleteReading(req.user!.id, req.params.id);
    res.json({ message: 'Reading deleted' });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;