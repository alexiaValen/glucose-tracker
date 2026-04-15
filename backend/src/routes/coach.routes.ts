import { Router, Response } from "express";
import { supabase } from "../config/database";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// ==================== MY COACH ====================
router.get("/my-coach", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      console.error("❌ NO USER ID IN TOKEN");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: relationship, error: relError } = await supabase
      .from("coach_clients")
      .select("coach_id")
      .eq("client_id", userId)
      .single();

    if (relError || !relationship) {
      return res.json({ coach: null });
    }

    const { data: coach, error: coachError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq("id", relationship.coach_id)
      .eq("role", "coach")
      .single();

    if (coachError || !coach) {
      return res.json({ coach: null });
    }

    res.json({ coach });
  } catch (error) {
    console.error("❌ Error in /my-coach:", error);
    res.status(500).json({ error: "Failed to fetch coach" });
  }
});

// ==================== PROTECTED ====================
router.use(authMiddleware);

// ==================== GET CLIENTS ====================
router.get("/clients", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log("👤 COACH ID:", userId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: relationships, error: relError } = await supabase
      .from("coach_clients")
      .select("client_id")
      .eq("coach_id", userId);

    if (relError) {
      console.error("❌ REL ERROR:", relError);
      return res.status(500).json({ error: "relError", details: relError });
    }

    if (!relationships || relationships.length === 0) {
      return res.json({ clients: [] });
    }

    const clientIds = relationships.map((r) => r.client_id);

    console.log("📊 CLIENT IDS:", clientIds);

    const { data: clients, error: clientError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, created_at")
      .in("id", clientIds);

    if (clientError) {
      console.error("❌ CLIENT ERROR:", clientError);
      return res.status(500).json({ error: "clientError", details: clientError });
    }

    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        const { data: readings } = await supabase
          .from("glucose_readings")
          .select("value")
          .eq("user_id", client.id)
          .order("measured_at", { ascending: false })
          .limit(20);

        const values = (readings || [])
          .map((r) => r.value)
          .filter((v) => typeof v === "number");

        const avg = values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;

        const last = values.length ? values[0] : 0;

        const inRange = values.filter((v) => v >= 70 && v <= 180).length;

        const tir = values.length ? (inRange / values.length) * 100 : 0;

        return {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          recentStats: {
            avgGlucose: Math.round(avg),
            lastReading: Math.round(last),
            timeInRange: Math.round(tir),
          },
        };
      })
    );

    res.json({ clients: clientsWithStats });
  } catch (error) {
    console.error("❌ Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// ==================== ADD CLIENT BY EMAIL =====================================
// POST /api/v1/coach/clients
router.post("/clients", async (req: AuthRequest, res: Response) => {
  try {
    const coachId = req.user?.id;
    const { email } = req.body;

    if (!coachId) return res.status(401).json({ error: "Unauthorized" });
    if (!email)   return res.status(400).json({ error: "email is required" });

    // Find the user by email
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userErr || !user) {
      return res.status(404).json({ error: "No account found with that email address." });
    }

    if (user.id === coachId) {
      return res.status(400).json({ error: "You cannot add yourself as a client." });
    }

    // Check not already linked
    const { data: existing } = await supabase
      .from("coach_clients")
      .select("client_id")
      .eq("coach_id", coachId)
      .eq("client_id", user.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: "This person is already in your client list." });
    }

    const { error: insertErr } = await supabase
      .from("coach_clients")
      .insert({ coach_id: coachId, client_id: user.id });

    if (insertErr) throw insertErr;

    res.status(201).json({
      client: {
        id: user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        recentStats: { avgGlucose: 0, lastReading: 0, timeInRange: 0 },
      },
    });
  } catch (err) {
    console.error("❌ POST /coach/clients:", err);
    res.status(500).json({ error: "Failed to add client" });
  }
});

// ==================== REMOVE CLIENT ==========================================
// DELETE /api/v1/coach/clients/:clientId
router.delete("/clients/:clientId", async (req: AuthRequest, res: Response) => {
  try {
    const coachId   = req.user?.id;
    const { clientId } = req.params;

    if (!coachId) return res.status(401).json({ error: "Unauthorized" });

    const { error } = await supabase
      .from("coach_clients")
      .delete()
      .eq("coach_id",  coachId)
      .eq("client_id", clientId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /coach/clients/:id:", err);
    res.status(500).json({ error: "Failed to remove client" });
  }
});

// ==================== EDIT CLIENT INFO =======================================
// PATCH /api/v1/coach/clients/:clientId
router.patch("/clients/:clientId", async (req: AuthRequest, res: Response) => {
  try {
    const coachId   = req.user?.id;
    const { clientId } = req.params;
    const { firstName, lastName, phone } = req.body;

    if (!coachId) return res.status(401).json({ error: "Unauthorized" });

    // Verify relationship
    const { data: rel } = await supabase
      .from("coach_clients")
      .select("client_id")
      .eq("coach_id",  coachId)
      .eq("client_id", clientId)
      .single();

    if (!rel) return res.status(403).json({ error: "Not your client" });

    const updates: Record<string, string> = {};
    if (firstName) updates.first_name = firstName.trim();
    if (lastName)  updates.last_name  = lastName.trim();
    if (phone)     updates.phone      = phone.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", clientId)
      .select("id, email, first_name, last_name")
      .single();

    if (error) throw error;

    res.json({
      client: {
        id:        updated.id,
        firstName: updated.first_name,
        lastName:  updated.last_name,
        email:     updated.email,
      },
    });
  } catch (err) {
    console.error("❌ PATCH /coach/clients/:id:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// ==================== GET CLIENT GLUCOSE (for coach) ==========================
// GET /api/v1/coach/clients/:clientId/glucose
router.get("/clients/:clientId/glucose", async (req: AuthRequest, res: Response) => {
  try {
    const coachId  = req.user?.id;
    const { clientId } = req.params;
    const limit = parseInt((req.query.limit as string) || '50', 10);

    if (!coachId) return res.status(401).json({ error: "Unauthorized" });

    // Verify this coach actually coaches this client
    const { data: rel } = await supabase
      .from("coach_clients")
      .select("client_id")
      .eq("coach_id", coachId)
      .eq("client_id", clientId)
      .single();

    if (!rel) return res.status(403).json({ error: "Not your client" });

    const { data: readings, error } = await supabase
      .from("glucose_readings")
      .select("id, value, measured_at, unit, source, source_device, notes, created_at")
      .eq("user_id", clientId)
      .order("measured_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(readings ?? []);
  } catch (err) {
    console.error("❌ GET /coach/clients/:id/glucose:", err);
    res.status(500).json({ error: "Failed to fetch client glucose data" });
  }
});

export default router;