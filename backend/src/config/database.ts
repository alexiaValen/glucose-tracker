// backend/src/config/database.ts
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking DATABASE_URL...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 60) + '...');

// PostgreSQL Pool for direct queries
// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,  // ← Disable SSL for local development
});


pool.on('connect', () => {
  console.log('✅ Database connected to Supabase via Pool');
});

pool.on('error', (err) => {
  console.error('❌ Database Pool error:', err);
});

// Supabase Client for easier queries (needed for coach routes)
console.log('🔍 Checking Supabase credentials...');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.warn('⚠️ Coach dashboard features will not work without these!');
  console.warn('⚠️ Add them to your .env file from Supabase Dashboard → Settings → API');
}

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '', // Use service_role key for backend (has admin access)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

console.log('✅ Supabase client initialized');