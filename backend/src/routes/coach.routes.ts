// backend/src/routes/coach.routes.ts
import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware, requireCoach } from '../middleware/auth.middleware';

const router = Router();

// PUBLIC USER ROUTE - Must come BEFORE requireCoach middleware
// GET /api/v1/coach/my-coach - Get the current user's assigned coach
router.get('/my-coach', authMiddleware, async (req, res) => {
  console.log('🔍 /my-coach route hit!');
  console.log('User from token:', req.user);
  
  try {
    const userId = req.user!.userId;
    console.log('Looking for coach for user ID:', userId);

    const { data: relationship, error: relError } = await supabase
      .from('coach_clients')
      .select('coach_id')
      .eq('client_id', userId)
      .single();

    console.log('Relationship result:', { relationship, error: relError });

    if (relError || !relationship) {
      console.log('No coach relationship found');
      return res.json({ coach: null });
    }

    const { data: coach, error: coachError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', relationship.coach_id)
      .eq('role', 'coach')
      .single();

    console.log('Coach result:', { coach, error: coachError });

    if (coachError || !coach) {
      return res.json({ coach: null });
    }

    res.json({ coach });
  } catch (error) {
    console.error('❌ Error in /my-coach:', error);
    res.status(500).json({ error: 'Failed to fetch coach' });
  }
});

// All coach routes require authentication and coach role
router.use(authMiddleware);
router.use(requireCoach);

// Get all clients for the current coach
router.get('/clients', async (req, res) => {
  try {
    const coachId = req.user!.userId;

    // Get coach-client relationships
    const { data: relationships, error: relError } = await supabase
      .from('coach_clients')
      .select('client_id')
      .eq('coach_id', coachId);

    if (relError) throw relError;

    if (!relationships || relationships.length === 0) {
      return res.json({ clients: [] });
    }

    const clientIds = relationships.map(r => r.client_id);

    // Get client details
    const { data: clients, error: clientError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .in('id', clientIds);

    if (clientError) throw clientError;

    // Get recent stats for each client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        // Get last 7 days of glucose readings
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: readings } = await supabase
          .from('glucose_readings')
          .select('value, measured_at')
          .eq('user_id', client.id)
          .gte('measured_at', sevenDaysAgo.toISOString())
          .order('measured_at', { ascending: false });

        const values = (readings || []).map(r => r.value);
        const avgGlucose = values.length > 0 
          ? values.reduce((a, b) => a + b, 0) / values.length 
          : 0;
        const lastReading = values.length > 0 ? values[0] : 0;
        const inRange = values.filter(v => v >= 70 && v <= 180).length;
        const timeInRange = values.length > 0 
          ? (inRange / values.length) * 100 
          : 0;

        return {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          lastActive: readings && readings.length > 0 
            ? readings[0].measured_at 
            : client.created_at,
          recentStats: {
            avgGlucose: Math.round(avgGlucose),
            lastReading: Math.round(lastReading),
            timeInRange: Math.round(timeInRange),
          },
        };
      })
    );

    res.json({ clients: clientsWithStats });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get specific client's glucose readings
router.get('/clients/:clientId/glucose', async (req, res) => {
  try {
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify this client belongs to the coach
    const coachId = req.user!.userId;
    const { data: relationship } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }

    const { data: readings, error } = await supabase
      .from('glucose_readings')
      .select('*')
      .eq('user_id', clientId)
      .order('measured_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ readings: readings || [] });
  } catch (error) {
    console.error('Error fetching client glucose:', error);
    res.status(500).json({ error: 'Failed to fetch glucose readings' });
  }
});

// Get specific client's symptoms
router.get('/clients/:clientId/symptoms', async (req, res) => {
  try {
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify this client belongs to the coach
    const coachId = req.user!.userId;
    const { data: relationship } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
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
    console.error('Error fetching client symptoms:', error);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Get specific client's stats
router.get('/clients/:clientId/stats', async (req, res) => {
  try {
    const { clientId } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Verify this client belongs to the coach
    const coachId = req.user!.userId;
    const { data: relationship } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: readings, error } = await supabase
      .from('glucose_readings')
      .select('value')
      .eq('user_id', clientId)
      .gte('measured_at', start.toISOString())
      .lte('measured_at', end.toISOString());

    if (error) throw error;

    if (!readings || readings.length === 0) {
      return res.json({
        avgGlucose: 0,
        lowestGlucose: 0,
        highestGlucose: 0,
        timeInRange: 0,
        totalReadings: 0,
      });
    }

    const values = readings.map(r => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRange = values.filter(v => v >= 70 && v <= 180).length;
    const timeInRange = (inRange / values.length) * 100;

    res.json({
      avgGlucose: Math.round(avg),
      lowestGlucose: Math.round(min),
      highestGlucose: Math.round(max),
      timeInRange: Math.round(timeInRange),
      totalReadings: values.length,
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get specific client's cycle data
router.get('/clients/:clientId/cycle', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verify this client belongs to the coach
    const coachId = req.user!.userId;
    const { data: relationship } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .single();

    if (!relationship) {
      return res.status(403).json({ error: 'Not authorized to view this client' });
    }

    const { data: cycle, error } = await supabase
      .from('menstrual_cycles')
      .select('*')
      .eq('user_id', clientId)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ cycle: cycle || null });
  } catch (error) {
    console.error('Error fetching client cycle:', error);
    res.status(500).json({ error: 'Failed to fetch cycle data' });
  }
});

export default router;