-- Add 'suspended' to the account_status enum.
-- Suspended volunteers retain their member_role but lose admin access until unsuspended.
ALTER TYPE public.account_status_type ADD VALUE IF NOT EXISTS 'suspended';
