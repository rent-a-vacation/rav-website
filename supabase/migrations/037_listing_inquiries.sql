-- Migration 037: Listing Inquiries (Pre-Booking Messaging)
-- Allows renters to ask owners questions before booking

-- Inquiries table (one per listing+asker conversation)
CREATE TABLE IF NOT EXISTS listing_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  asker_id UUID NOT NULL REFERENCES profiles(id),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inquiry messages table
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES listing_inquiries(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_listing_id ON listing_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_asker_id ON listing_inquiries(asker_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_owner_id ON listing_inquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_listing_inquiries_updated_at'
  ) THEN
    CREATE TRIGGER set_listing_inquiries_updated_at
      BEFORE UPDATE ON listing_inquiries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE listing_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Listing inquiries: participants can see their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'listing_inquiries_select_own') THEN
    CREATE POLICY listing_inquiries_select_own ON listing_inquiries
      FOR SELECT USING (auth.uid() = asker_id OR auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'listing_inquiries_insert_own') THEN
    CREATE POLICY listing_inquiries_insert_own ON listing_inquiries
      FOR INSERT WITH CHECK (auth.uid() = asker_id);
  END IF;
END $$;

-- Inquiry messages: participants can see messages in their inquiries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inquiry_messages_select_participant') THEN
    CREATE POLICY inquiry_messages_select_participant ON inquiry_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM listing_inquiries
          WHERE id = inquiry_messages.inquiry_id
          AND (asker_id = auth.uid() OR owner_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inquiry_messages_insert_participant') THEN
    CREATE POLICY inquiry_messages_insert_participant ON inquiry_messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM listing_inquiries
          WHERE id = inquiry_messages.inquiry_id
          AND (asker_id = auth.uid() OR owner_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Allow participants to mark messages as read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inquiry_messages_update_read') THEN
    CREATE POLICY inquiry_messages_update_read ON inquiry_messages
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM listing_inquiries
          WHERE id = inquiry_messages.inquiry_id
          AND (asker_id = auth.uid() OR owner_id = auth.uid())
        )
      );
  END IF;
END $$;
