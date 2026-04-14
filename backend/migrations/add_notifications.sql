-- migrations/add_notifications.sql
-- Safe to re-run. Adds only what's missing to the existing notifications table.
-- (Table was pre-existing in Supabase with schema: notification_type, body, sent_at)

-- Add data column for sync metadata (already applied to production 2026-04-13)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';
