-- Migration 040: Admin audit trail for property/listing edits
-- Shared migration for Issues #177 and #178

-- Properties audit columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES profiles(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- Listings audit columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES profiles(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS admin_edit_notes text;
