-- Add onboarding columns to existing users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS use_system_defaults BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Update comments for clarity
COMMENT ON COLUMN users.use_system_defaults IS 'If true, user can use system ENV tokens (admin/demo only)';
COMMENT ON COLUMN users.onboarding_complete IS 'If true, user has connected required integrations';
