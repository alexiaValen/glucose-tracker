import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface GlucoseReadingInput {
  value: number;
  unit?: 'mg/dL' | 'mmol/L';
  measuredAt: Date;
  source?: 'manual' | 'healthkit' | 'terra' | 'dexcom';
  sourceDevice?: string;
  notes?: string;
  mealContext?: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other';
}

export interface GlucoseStats {
  avgGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  stdDeviation: number;
  timeInRange: number; // percentage
  readingsCount: number;
  trend: 'rising' | 'falling' | 'stable';
}

export class GlucoseService {
  // Create glucose reading
  async createReading(userId: string, data: GlucoseReadingInput) {
    const { value, unit = 'mg/dL', measuredAt, source = 'manual', sourceDevice, notes, mealContext } = data;

    // Validate glucose value
    if (value < 20 || value > 600) {
      throw new Error('Glucose value out of valid range (20-600 mg/dL)');
    }

    const result = await pool.query(
      `INSERT INTO glucose_readings 
       (user_id, value, unit, measured_at, source, source_device, notes, meal_context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, value, unit, measuredAt, source, sourceDevice, notes, mealContext]
    );

    const reading = result.rows[0];

    // Check for alerts
    await this.checkAlerts(userId, reading);

    return reading;
  }

  // Bulk create readings (for syncing)
  async bulkCreateReadings(userId: string, readings: GlucoseReadingInput[]) {
    const client = await pool.connect();
    const synced: any[] = [];
    const skipped: any[] = [];

    try {
      await client.query('BEGIN');

      for (const reading of readings) {
        // Check if reading already exists (by timestamp)
        const existing = await client.query(
          `SELECT id FROM glucose_readings 
           WHERE user_id = $1 AND measured_at = $2`,
          [userId, reading.measuredAt]
        );

        if (existing.rows.length > 0) {
          skipped.push(reading);
          continue;
        }

        const result = await client.query(
          `INSERT INTO glucose_readings 
           (user_id, value, unit, measured_at, source, source_device, notes, meal_context)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [userId, reading.value, reading.unit || 'mg/dL', reading.measuredAt, 
           reading.source || 'healthkit', reading.sourceDevice, reading.notes, reading.mealContext]
        );

        synced.push(result.rows[0]);
      }

      await client.query('COMMIT');

      // Update last sync time
      await pool.query(
        'UPDATE user_profiles SET healthkit_last_sync = NOW() WHERE user_id = $1',
        [userId]
      );

      return { synced: synced.length, skipped: skipped.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get readings with pagination
  async getReadings(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      source?: string;
    } = {}
  ) {
    const { limit = 50, offset = 0, startDate, endDate, source } = options;

    let query = `
      SELECT * FROM glucose_readings 
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
    return result.rows;
  }

  // Get glucose statistics
  async getStats(userId: string, startDate: Date, endDate: Date): Promise<GlucoseStats> {
    // Get user's target range
    const profileResult = await pool.query(
      'SELECT target_glucose_min, target_glucose_max FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const targetMin = profileResult.rows[0]?.target_glucose_min || 70;
    const targetMax = profileResult.rows[0]?.target_glucose_max || 100;

    const result = await pool.query(
      `SELECT 
         AVG(value) as avg_glucose,
         MIN(value) as min_glucose,
         MAX(value) as max_glucose,
         STDDEV(value) as std_deviation,
         COUNT(*) as readings_count,
         SUM(CASE WHEN value >= $2 AND value <= $3 THEN 1 ELSE 0 END) as in_range_count
       FROM glucose_readings
       WHERE user_id = $1 AND measured_at >= $4 AND measured_at <= $5`,
      [userId, targetMin, targetMax, startDate, endDate]
    );

    const stats = result.rows[0];

    // Calculate time in range percentage
    const timeInRange = stats.readings_count > 0
      ? (stats.in_range_count / stats.readings_count) * 100
      : 0;

    // Calculate trend (last 5 readings)
    const trendResult = await pool.query(
      `SELECT value FROM glucose_readings
       WHERE user_id = $1 AND measured_at >= $2 AND measured_at <= $3
       ORDER BY measured_at DESC LIMIT 5`,
      [userId, startDate, endDate]
    );

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (trendResult.rows.length >= 3) {
      const values = trendResult.rows.map(r => r.value);
      const avgFirst = (values[0] + values[1]) / 2;
      const avgLast = (values[values.length - 2] + values[values.length - 1]) / 2;
      const diff = avgFirst - avgLast;

      if (diff > 10) trend = 'rising';
      else if (diff < -10) trend = 'falling';
    }

    return {
      avgGlucose: parseFloat(stats.avg_glucose) || 0,
      minGlucose: parseFloat(stats.min_glucose) || 0,
      maxGlucose: parseFloat(stats.max_glucose) || 0,
      stdDeviation: parseFloat(stats.std_deviation) || 0,
      timeInRange: parseFloat(timeInRange.toFixed(1)),
      readingsCount: parseInt(stats.readings_count) || 0,
      trend,
    };
  }

  // Get chart data (time-series)
  async getChartData(userId: string, startDate: Date, endDate: Date, interval: 'hour' | 'day' = 'day') {
    const groupBy = interval === 'hour'
      ? `DATE_TRUNC('hour', measured_at)`
      : `DATE_TRUNC('day', measured_at)`;

    const result = await pool.query(
      `SELECT 
         ${groupBy} as timestamp,
         AVG(value) as avg_value,
         MIN(value) as min_value,
         MAX(value) as max_value,
         COUNT(*) as count
       FROM glucose_readings
       WHERE user_id = $1 AND measured_at >= $2 AND measured_at <= $3
       GROUP BY timestamp
       ORDER BY timestamp ASC`,
      [userId, startDate, endDate]
    );

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      avg: parseFloat(row.avg_value),
      min: parseFloat(row.min_value),
      max: parseFloat(row.max_value),
      count: parseInt(row.count),
    }));
  }

  // Check for alerts
  private async checkAlerts(userId: string, reading: any) {
    const profileResult = await pool.query(
      'SELECT target_glucose_min, target_glucose_max FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    const targetMin = profileResult.rows[0]?.target_glucose_min || 70;
    const targetMax = profileResult.rows[0]?.target_glucose_max || 140;

    let alertType: string | null = null;
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let message = '';

    if (reading.value < 54) {
      alertType = 'low_glucose';
      severity = 'critical';
      message = `Critical low glucose: ${reading.value} mg/dL. Immediate action required.`;
    } else if (reading.value < targetMin) {
      alertType = 'low_glucose';
      severity = 'warning';
      message = `Low glucose detected: ${reading.value} mg/dL`;
    } else if (reading.value > 180) {
      alertType = 'high_glucose';
      severity = 'critical';
      message = `High glucose detected: ${reading.value} mg/dL`;
    } else if (reading.value > targetMax) {
      alertType = 'high_glucose';
      severity = 'warning';
      message = `Glucose above target: ${reading.value} mg/dL`;
    }

    if (alertType) {
      await pool.query(
        `INSERT INTO alerts (user_id, alert_type, severity, message, related_glucose_reading_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, alertType, severity, message, reading.id]
      );

      // TODO: Send push notification or email
    }
  }

  // Delete reading
  async deleteReading(userId: string, readingId: string) {
    const result = await pool.query(
      'DELETE FROM glucose_readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Reading not found');
    }

    return { deleted: true };
  }
}

export const glucoseService = new GlucoseService();