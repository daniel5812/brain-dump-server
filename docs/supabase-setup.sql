-- Supabase SQL: Create users table with ALL fields
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Primary identifier
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),

  -- Optional per-user integrations
  todoist_token VARCHAR(255),
  calendar_id VARCHAR(255),

  -- Optional per-user WhatsApp (Green API)
  green_api_instance_id VARCHAR(50),
  green_api_token VARCHAR(100),
  green_api_url VARCHAR(255),

  -- Security
  hmac_secret VARCHAR(255),

  -- Onboarding & permissions
  use_system_defaults BOOLEAN DEFAULT false,  -- If true, can use ENV fallback (admin only)
  onboarding_complete BOOLEAN DEFAULT false,  -- If true, all integrations connected

  -- Status & metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by phone
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- MVP policy: server has full access via service role
CREATE POLICY "Service role full access"
ON users
FOR ALL
USING (true);

-- Comments for clarity
COMMENT ON COLUMN users.use_system_defaults IS 'If true, user can use system ENV tokens (admin/demo only). Default false for safety.';
COMMENT ON COLUMN users.onboarding_complete IS 'If true, user has connected all required integrations.';
