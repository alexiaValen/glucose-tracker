import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware: All coach routes require 'coach' role
router.use(authMiddleware);
router.use(requireRole(['coach', 'admin']));

// GET /api/v1/coach/clients - List coach's clients
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const { status = 'active', search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        cc.status, cc.accepted_at, cc.notes as relationship_notes,
        (
          SELECT value FROM glucose_readings 
          WHERE user_id = u.id 
          ORDER BY measured_at DESC 
          LIMIT 1
        ) as last_glucose,
        (
          SELECT measured_at FROM glucose_readings 
          WHERE user_id = u.id 
          ORDER BY measured_at DESC 
          LIMIT 1
        ) as last_glucose_time,
        (
          SELECT COUNT(*) FROM alerts 
          WHERE user_id = u.id AND acknowledged_at IS NULL AND severity = 'critical'
        ) as critical_alerts
      FROM coach_clients cc
      JOIN users u ON cc.client_id = u.id
      WHERE cc.coach_id = $1
    `;

    const params: any[] = [coachId];
    let paramIndex = 2;

    if (status) {
      query += ` AND cc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.last_name, u.first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      clients: result.rows,
      total: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/coach/clients/invite - Invite client
router.post('/clients/invite', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const { clientEmail, notes } = req.body;

    // Check if client exists
    const clientResult = await pool.query(
      'SELECT id, role FROM users WHERE email = $1 AND is_active = true',
      [clientEmail]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const client = clientResult.rows[0];

    if (client.role !== 'user') {
      return res.status(400).json({ error: 'Can only invite users with role "user"' });
    }

    // Check if relationship already exists
    const existingResult = await pool.query(
      'SELECT id, status FROM coach_clients WHERE coach_id = $1 AND client_id = $2',
      [coachId, client.id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Client relationship already exists' });
    }

    // Create relationship
    const result = await pool.query(
      `INSERT INTO coach_clients (coach_id, client_id, status, notes)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [coachId, client.id, notes]
    );

    // TODO: Send notification to client
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, body)
       VALUES ($1, 'coach_invite', 'Coach Invitation', $2)`,
      [client.id, `You have been invited to connect with a coach. Accept the invitation to share your health data.`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/coach/clients/:id/overview - Client overview
router.get('/clients/:id/overview', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const clientId = req.params.id;

    // Verify relationship
    const relationshipResult = await pool.query(
      'SELECT id FROM coach_clients WHERE coach_id = $1 AND client_id = $2 AND status = $3',
      [coachId, clientId, 'active']
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }

    // Get client info
    const clientResult = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.date_of_birth,
        up.target_glucose_min, up.target_glucose_max
       FROM users u
       JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientResult.rows[0];

    // Get last 7 days stats
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const glucoseStatsResult = await pool.query(
      `SELECT 
         AVG(value) as avg_glucose,
         MIN(value) as min_glucose,
         MAX(value) as max_glucose,
         COUNT(*) as readings_count,
         SUM(CASE WHEN value >= $2 AND value <= $3 THEN 1 ELSE 0 END) as in_range_count
       FROM glucose_readings
       WHERE user_id = $1 AND measured_at >= $4 AND measured_at <= $5`,
      [clientId, client.target_glucose_min, client.target_glucose_max, sevenDaysAgo, now]
    );

    const glucoseStats = glucoseStatsResult.rows[0];

    // Get fasting compliance
    const fastingResult = await pool.query(
      `SELECT 
         COUNT(*) as total_sessions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions
       FROM fasting_sessions
       WHERE user_id = $1 AND started_at >= $2`,
      [clientId, sevenDaysAgo]
    );

    const fastingStats = fastingResult.rows[0];

    // Get active alerts
    const alertsResult = await pool.query(
      `SELECT COUNT(*) as alert_count, severity
       FROM alerts
       WHERE user_id = $1 AND acknowledged_at IS NULL
       GROUP BY severity`,
      [clientId]
    );

    const alerts = alertsResult.rows.reduce((acc, row) => {
      acc[row.severity] = parseInt(row.alert_count);
      return acc;
    }, {});

    // Get current fasting status
    const currentFastingResult = await pool.query(
      `SELECT id, started_at, target_duration_hours
       FROM fasting_sessions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY started_at DESC
       LIMIT 1`,
      [clientId]
    );

    const timeInRange = glucoseStats.readings_count > 0
      ? (glucoseStats.in_range_count / glucoseStats.readings_count) * 100
      : 0;

    const complianceRate = fastingStats.total_sessions > 0
      ? (fastingStats.completed_sessions / fastingStats.total_sessions) * 100
      : 0;

    res.json({
      client: {
        id: client.id,
        email: client.email,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
      },
      glucoseStats: {
        avg: parseFloat(glucoseStats.avg_glucose) || 0,
        min: parseFloat(glucoseStats.min_glucose) || 0,
        max: parseFloat(glucoseStats.max_glucose) || 0,
        readingsCount: parseInt(glucoseStats.readings_count) || 0,
        timeInRange: parseFloat(timeInRange.toFixed(1)),
        targetRange: {
          min: client.target_glucose_min,
          max: client.target_glucose_max,
        },
      },
      fastingStats: {
        totalSessions: parseInt(fastingStats.total_sessions) || 0,
        completedSessions: parseInt(fastingStats.completed_sessions) || 0,
        complianceRate: parseFloat(complianceRate.toFixed(1)),
      },
      currentFasting: currentFastingResult.rows[0] || null,
      alerts: {
        critical: alerts.critical || 0,
        warning: alerts.warning || 0,
        info: alerts.info || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/coach/clients/:id/glucose - Client's glucose data
router.get('/clients/:id/glucose', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const clientId = req.params.id;
    const { startDate, endDate, limit = 100 } = req.query;

    // Verify relationship
    const relationshipResult = await pool.query(
      'SELECT id FROM coach_clients WHERE coach_id = $1 AND client_id = $2 AND status = $3',
      [coachId, clientId, 'active']
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }

    let query = `
      SELECT id, value, unit, measured_at, source, source_device, meal_context, notes
      FROM glucose_readings
      WHERE user_id = $1
    `;
    const params: any[] = [clientId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND measured_at >= $${paramIndex}`;
      params.push(new Date(startDate as string));
      paramIndex++;
    }

    if (endDate) {
      query += ` AND measured_at <= $${paramIndex}`;
      params.push(new Date(endDate as string));
      paramIndex++;
    }

    query += ` ORDER BY measured_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      readings: result.rows,
      total: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/coach/clients/:id/notes - Add coach note
router.post('/clients/:id/notes', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const clientId = req.params.id;
    const { noteType, content, isVisibleToClient = true, relatedGlucoseReadingId, relatedFastingSessionId } = req.body;

    // Verify relationship
    const relationshipResult = await pool.query(
      'SELECT id FROM coach_clients WHERE coach_id = $1 AND client_id = $2 AND status = $3',
      [coachId, clientId, 'active']
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to add notes for this client' });
    }

    const result = await pool.query(
      `INSERT INTO coach_notes 
       (coach_id, client_id, note_type, content, is_visible_to_client, related_glucose_reading_id, related_fasting_session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [coachId, clientId, noteType, content, isVisibleToClient, relatedGlucoseReadingId, relatedFastingSessionId]
    );

    // Send notification to client if visible
    if (isVisibleToClient) {
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, body, action_url)
         VALUES ($1, 'coach_note', 'New note from your coach', $2, '/notes')`,
        [clientId, content.substring(0, 100)]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/coach/alerts - All client alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const { severity, acknowledged, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.id, a.alert_type, a.severity, a.message, a.triggered_at, a.acknowledged_at,
        u.id as user_id, u.first_name, u.last_name, u.email,
        gr.value as glucose_value, gr.measured_at as glucose_time
      FROM alerts a
      JOIN users u ON a.user_id = u.id
      JOIN coach_clients cc ON cc.client_id = u.id
      LEFT JOIN glucose_readings gr ON a.related_glucose_reading_id = gr.id
      WHERE cc.coach_id = $1 AND cc.status = 'active'
    `;

    const params: any[] = [coachId];
    let paramIndex = 2;

    if (severity) {
      query += ` AND a.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (acknowledged === 'false') {
      query += ` AND a.acknowledged_at IS NULL`;
    } else if (acknowledged === 'true') {
      query += ` AND a.acknowledged_at IS NOT NULL`;
    }

    query += ` ORDER BY a.triggered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      alerts: result.rows,
      total: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/v1/coach/alerts/:id/acknowledge - Acknowledge alert
router.patch('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const coachId = (req as any).user!.id;
    const alertId = req.params.id;

    // Verify coach has access to this alert
    const checkResult = await pool.query(
      `SELECT a.id FROM alerts a
       JOIN coach_clients cc ON cc.client_id = a.user_id
       WHERE a.id = $1 AND cc.coach_id = $2 AND cc.status = 'active'`,
      [alertId, coachId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to acknowledge this alert' });
    }

    const result = await pool.query(
      'UPDATE alerts SET acknowledged_at = NOW(), acknowledged_by = $1 WHERE id = $2 RETURNING *',
      [coachId, alertId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;