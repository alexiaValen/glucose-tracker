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

export default router;