// import { Pool } from 'pg';

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
// });

// // Test connection
// pool.on('connect', () => {
//   console.log('✅ Database connected');
// });

// pool.on('error', (err) => {
//   console.error('❌ Database error:', err);
// });


import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking DATABASE_URL...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 60) + '...');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('✅ Database connected to Supabase');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});