-- Part 1: Add new roles to the app_role enum
-- These must be committed before they can be used
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'member';