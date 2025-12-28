// backend/src/routes/coach.routes.ts
import { Router } from 'express';
import { authMiddleware, requireCoach } from '../middleware/auth.middleware';
import { supabase } from '../config/database';

const router = Router();

// All routes require authentication AND coach/admin role
router.use(authMiddleware);
router.use(requireCoach);

// Get coach's clients with stats
router.get('/clients', async (req, res) => {
  try {
    const coachId = req.user!.userId;

    // Get all clients assigned to this coach
    const { data: clientRelations, error: relError } = await supabase
      .from('coach_clients')
      .select('client_id')
      .eq('coach_id', coachId);

    if (relError) throw relError;

    if (!clientRelations || clientRelations.length === 0) {
      return res.json({ clients: [] });
    }

    const clientIds = clientRelations.map(r => r.client_id);

    // Get client details
    const { data: clients, error: clientsError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, updated_at')
      .in('id', clientIds);

    if (clientsError) throw clientsError;

    // Get stats for each client
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const { data: readings } = await supabase
          .from('glucose_readings')
          .select('value, measured_at')
          .eq('user_id', client.id)
          .gte('measured_at', sevenDaysAgo.toISOString())
          .order('measured_at', { ascending: false });

        const avgGlucose = readings && readings.length > 0
          ? readings.reduce((sum, r) => sum + r.value, 0) / readings.length
          : 0;

        const lastReading = readings && readings.length > 0
          ? readings[0].value
          : 0;

        const inRange = readings && readings.length > 0
          ? (readings.filter(r => r.value >= 70 && r.value <= 180).length / readings.length) * 100
          : 0;

        return {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          lastActive: client.updated_at,
          recentStats: {
            avgGlucose: Math.round(avgGlucose),
            lastReading: Math.round(lastReading),
            timeInRange: Math.round(inRange),
          },
        };
      })
    );

    res.json({ clients: clientsWithStats });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client's glucose readings
router.get('/clients/:clientId/glucose', async (req, res) => {
  try {
    const coachId = req.user!.userId;
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify coach has access to this client
    const { data: access } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get glucose readings
    const { data: readings, error } = await supabase
      .from('glucose_readings')
      .select('*')
      .eq('user_id', clientId)
      .order('measured_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ readings: readings || [] });
  } catch (error) {
    console.error('Get client glucose error:', error);
    res.status(500).json({ error: 'Failed to fetch glucose data' });
  }
});

// Get client's stats
router.get('/clients/:clientId/stats', async (req, res) => {
  try {
    const coachId = req.user!.userId;
    const { clientId } = req.params;

    // Verify access
    const { data: access } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: readings, error } = await supabase
      .from('glucose_readings')
      .select('value')
      .eq('user_id', clientId)
      .gte('measured_at', sevenDaysAgo.toISOString());

    if (error) throw error;

    if (!readings || readings.length === 0) {
      return res.json({
        avgGlucose: 0,
        minGlucose: 0,
        maxGlucose: 0,
        stdDeviation: 0,
        timeInRange: 0,
        readingsCount: 0,
        trend: 'stable',
      });
    }

    const values = readings.map(r => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRange = (values.filter(v => v >= 70 && v <= 180).length / values.length) * 100;

    res.json({
      avgGlucose: avg,
      minGlucose: min,
      maxGlucose: max,
      stdDeviation: 0,
      timeInRange: inRange,
      readingsCount: readings.length,
      trend: 'stable',
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get client's symptoms
router.get('/clients/:clientId/symptoms', async (req, res) => {
  try {
    const coachId = req.user!.userId;
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify access
    const { data: access } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: symptoms, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('user_id', clientId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ symptoms: symptoms || [] });
  } catch (error) {
    console.error('Get client symptoms error:', error);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Get client's cycle data
router.get('/clients/:clientId/cycle', async (req, res) => {
  try {
    const coachId = req.user!.userId;
    const { clientId } = req.params;

    // Verify access
    const { data: access } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: currentCycle } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', clientId)
      .is('cycle_end_date', null)
      .single();

    const { data: cycles } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', clientId)
      .order('cycle_start_date', { ascending: false })
      .limit(12);

    res.json({
      currentCycle: currentCycle || null,
      cycles: cycles || [],
    });
  } catch (error) {
    console.error('Get client cycle error:', error);
    res.status(500).json({ error: 'Failed to fetch cycle data' });
  }
});

export default router;