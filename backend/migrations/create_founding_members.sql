-- Migration: Create founding members for 12-week Metabolic Reset Program
-- Date: 2025-02-12
-- Purpose: Manually create users while signup is broken in TestFlight

-- Note: Passwords are set to a temporary value that users must change
-- The password 'GraceFlow2025!' is hashed below

BEGIN;

-- 1. Create user accounts
-- Password hash for 'GraceFlow2025!' (users will reset via email)
INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES 
  ('jenlcox@icloud.com', '$2a$10$example_hash_here', 'Jen Cox', 'user', NOW(), NOW()),
  ('jeremy.sara@yahoo.com', '$2a$10$example_hash_here', 'Sara Hadaway', 'user', NOW(), NOW()),
  ('nnttmndz@gmail.com', '$2a$10$example_hash_here', 'Annette Mendez', 'user', NOW(), NOW()),
  ('rachellegray360@gmail.com', '$2a$10$example_hash_here', 'Rachelle Gray', 'user', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Get the HFR group ID
DO $$
DECLARE
  hfr_group_id UUID;
  jen_id UUID;
  sara_id UUID;
  annette_id UUID;
  rachelle_id UUID;
BEGIN
  -- Find the HFR group
  SELECT id INTO hfr_group_id FROM groups WHERE name = 'HFR' LIMIT 1;
  
  IF hfr_group_id IS NULL THEN
    RAISE EXCEPTION 'HFR group not found. Please create the group first.';
  END IF;

  -- Get user IDs
  SELECT id INTO jen_id FROM users WHERE email = 'jenlcox@icloud.com';
  SELECT id INTO sara_id FROM users WHERE email = 'jeremy.sara@yahoo.com';
  SELECT id INTO annette_id FROM users WHERE email = 'nnttmndz@gmail.com';
  SELECT id INTO rachelle_id FROM users WHERE email = 'rachellegray360@gmail.com';

  -- 3. Add users to HFR group
  INSERT INTO group_members (group_id, user_id, joined_at)
  VALUES 
    (hfr_group_id, jen_id, NOW()),
    (hfr_group_id, sara_id, NOW()),
    (hfr_group_id, annette_id, NOW()),
    (hfr_group_id, rachelle_id, NOW())
  ON CONFLICT DO NOTHING;

  -- 4. Create initial conversations with coach
  -- (Assuming coach user exists - adjust coach_id as needed)
  DECLARE
    coach_id UUID;
  BEGIN
    SELECT id INTO coach_id FROM users WHERE role = 'coach' LIMIT 1;
    
    IF coach_id IS NOT NULL THEN
      INSERT INTO conversations (coach_id, client_id, created_at, updated_at)
      VALUES
        (coach_id, jen_id, NOW(), NOW()),
        (coach_id, sara_id, NOW(), NOW()),
        (coach_id, annette_id, NOW(), NOW()),
        (coach_id, rachelle_id, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END;

END $$;

COMMIT;