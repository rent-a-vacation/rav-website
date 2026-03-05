-- Migration 041: Expand dispute categories for owner-filed disputes
-- Issue #180

-- Each ADD VALUE must be a separate statement (PostgreSQL limitation)
ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'renter_damage';
ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'renter_no_show';
ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'unauthorized_guests';
ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'rule_violation';
ALTER TYPE dispute_category ADD VALUE IF NOT EXISTS 'late_checkout';

-- Evidence URLs on disputes
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_urls text[] DEFAULT '{}';
