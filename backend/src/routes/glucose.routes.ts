// backend/src/routes/glucose.routes.ts
import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { supabase } from '../config/database';
import { AuthRequest } from "../middleware/auth.middleware";
import { GlucoseReading } from '../types/group';

// ── Shared helper: create a notification row ──────────────────────────────────
async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  // Real column names: notification_type, body, data (JSONB)
  await pool.query(
    `INSERT INTO notifications (user_id, notification_type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [opts.userId, opts.type, opts.title, opts.message, opts.data ?? {}]
  );
}

// ── Shared helper: find coach for a given client ──────────────────────────────
async function findCoachId(clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', clientId)
    .single();
  return data?.coach_id ?? null;
}

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/v1/glucose - Create new glucose reading (ACCEPTS BOTH FORMATS)
router.post(
  '/',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      console.log('Received request to create glucose reading for user:', userId);


      // Accept BOTH formats:
      // Web app: { value, measuredAt, notes }
      // Mobile app: { glucose_level, timestamp, notes }
      const value = req.body.value || req.body.glucose_level;
      const measuredAt = req.body.measuredAt || req.body.measured_at || req.body.timestamp;
      const notes = req.body.notes || '';
      const source = req.body.source || 'manual';
      const unit = req.body.unit || 'mg/dL';
      const mealContext = req.body.meal_context;

      console.log('Creating glucose reading:', { userId, value, measuredAt, source });

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
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      //const coachId = req.query.coachId as string | undefined;

      console.log('Fetching glucose readings for user:', userId);

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

      console.log(`Found ${result.rows.length} glucose readings`);
      
      // Return array directly for web app
      res.json(result.rows);
    } catch (error: any) {
      console.error('❌ Error fetching glucose readings:', error);
      res.status(500).json({ error: 'Failed to fetch glucose readings' });
    }
  }
);

// GET /api/v1/glucose/stats - Get glucose statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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

// ── POST /api/v1/glucose/sync ─────────────────────────────────────────────────
// Bulk-upsert readings from Apple Watch / HealthKit.
// Deduplicates by (user_id, measured_at). Creates coach + user notifications.
router.post('/sync', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const readings: Array<{
    value: number;
    measuredAt: string;
    unit?: string;
    source?: string;
    sourceDevice?: string;
    notes?: string;
  }> = req.body.readings;

  if (!Array.isArray(readings) || readings.length === 0) {
    return res.status(400).json({ error: 'readings array is required' });
  }

  const client = await pool.connect();
  const synced: any[] = [];
  const skipped: string[] = [];
  const alerts: Array<{ value: number; type: string; severity: string }> = [];

  try {
    await client.query('BEGIN');

    for (const r of readings) {
      // Basic validation
      if (!r.value || !r.measuredAt) { skipped.push(r.measuredAt ?? 'unknown'); continue; }
      const val = Number(r.value);
      if (val < 20 || val > 600) { skipped.push(r.measuredAt); continue; }

      // Duplicate check
      const dup = await client.query(
        `SELECT id FROM glucose_readings WHERE user_id = $1 AND measured_at = $2`,
        [userId, r.measuredAt]
      );
      if (dup.rows.length > 0) { skipped.push(r.measuredAt); continue; }

      const row = await client.query(
        `INSERT INTO glucose_readings
           (user_id, value, measured_at, unit, source, source_device, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [userId, val, r.measuredAt, r.unit ?? 'mg/dL',
         r.source ?? 'healthkit', r.sourceDevice ?? null, r.notes ?? null]
      );
      synced.push(row.rows[0]);

      // Collect alert-level readings
      if (val < 54) {
        alerts.push({ value: val, type: 'low_glucose', severity: 'critical' });
      } else if (val < 70) {
        alerts.push({ value: val, type: 'low_glucose', severity: 'warning' });
      } else if (val > 180) {
        alerts.push({ value: val, type: 'high_glucose', severity: 'critical' });
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Sync transaction failed:', err);
    return res.status(500).json({ error: 'Sync failed' });
  } finally {
    client.release();
  }

  // Update last sync timestamp (non-critical — column may not exist yet)
  pool.query(
    `UPDATE user_profiles SET healthkit_last_sync = NOW() WHERE user_id = $1`,
    [userId]
  ).catch((e) => console.warn('⚠️ healthkit_last_sync update skipped:', e?.message));

  // ── Post-sync notifications (non-blocking) ─────────────────────────────────
  try {
    const coachId = await findCoachId(userId);

    // Fetch user name for coach notification
    const userRow = await pool.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [userId]
    );
    const userName = userRow.rows[0]
      ? `${userRow.rows[0].first_name} ${userRow.rows[0].last_name}`.trim()
      : 'Your client';

    // Notify coach: client synced
    if (coachId && synced.length > 0) {
      const highCount = alerts.filter(a => a.type === 'high_glucose').length;
      const lowCount  = alerts.filter(a => a.type === 'low_glucose').length;
      let msg = `${userName} synced ${synced.length} new reading${synced.length !== 1 ? 's' : ''} from Apple Watch.`;
      if (highCount)   msg += ` ${highCount} high reading${highCount !== 1 ? 's' : ''}.`;
      if (lowCount)    msg += ` ${lowCount} low reading${lowCount !== 1 ? 's' : ''}.`;

      await createNotification({
        userId:  coachId,
        type:    'client_synced',
        title:   `${userName} synced data`,
        message: msg,
        data:    { clientId: userId, synced: synced.length, highCount, lowCount },
      });
    }

    // Notify coach + user on critical readings
    for (const alert of alerts) {
      const isCritical = alert.severity === 'critical';
      const notifType  = isCritical ? 'critical_glucose' : alert.type as any;
      const prefix     = alert.type === 'high_glucose' ? 'High' : 'Low';

      if (coachId) {
        await createNotification({
          userId:  coachId,
          type:    notifType,
          title:   `${isCritical ? '⚠️ Critical: ' : ''}${prefix} glucose — ${userName}`,
          message: `${userName} had a ${prefix.toLowerCase()} glucose reading of ${alert.value} mg/dL.`,
          data:    { clientId: userId, value: alert.value, severity: alert.severity },
        });
      }

      // Notify the user themselves
      await createNotification({
        userId,
        type:    notifType,
        title:   `${isCritical ? '⚠️ ' : ''}${prefix} glucose detected`,
        message: `A ${prefix.toLowerCase()} glucose reading of ${alert.value} mg/dL was found during your sync.`,
        data:    { value: alert.value, severity: alert.severity },
      });
    }
  } catch (notifErr) {
    // Never fail the sync because a notification errored
    console.error('⚠️ Notification creation failed (non-fatal):', notifErr);
  }

  console.log(`✅ Sync complete for user ${userId}: ${synced.length} synced, ${skipped.length} skipped`);
  res.json({
    synced:  synced.length,
    skipped: skipped.length,
    alerts:  alerts.map(a => ({ value: a.value, type: a.type, severity: a.severity })),
  });
});

// ── DELETE /api/v1/glucose/:id - Delete glucose reading
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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