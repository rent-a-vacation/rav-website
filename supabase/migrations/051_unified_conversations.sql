-- Migration 051: Unified Conversation Layer
-- One conversation per owner-traveler-property combination.
-- Replaces 4 isolated messaging systems with a single unified inbox.

-- ============================================================
-- PART 1: TABLES
-- ============================================================

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Property context
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,

  -- Current context
  context_type TEXT NOT NULL CHECK (context_type IN ('inquiry', 'booking', 'bid', 'travel_request')),
  context_id UUID, -- polymorphic FK; NULL when conversation precedes interaction record

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),

  -- Denormalized unread counts (updated by trigger)
  owner_unread_count INTEGER NOT NULL DEFAULT 0,
  traveler_unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,

  -- One conversation per owner-traveler-property
  CONSTRAINT conversations_unique_participants UNIQUE (owner_id, traveler_id, property_id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  read_at TIMESTAMPTZ, -- NULL = unread
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.conversation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'inquiry_started',
    'booking_requested',
    'booking_confirmed',
    'booking_cancelled',
    'bid_placed',
    'bid_countered',
    'bid_accepted',
    'bid_rejected',
    'bid_expired',
    'proposal_sent',
    'proposal_accepted',
    'proposal_rejected',
    'check_in_confirmed',
    'review_left'
  )),

  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 2: FK ADDITIONS TO EXISTING TABLES
-- ============================================================

ALTER TABLE public.listing_inquiries
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

ALTER TABLE public.listing_bids
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- ============================================================
-- PART 3: INDEXES
-- ============================================================

CREATE INDEX idx_conversations_owner ON public.conversations(owner_id, last_message_at DESC);
CREATE INDEX idx_conversations_traveler ON public.conversations(traveler_id, last_message_at DESC);
CREATE INDEX idx_conversations_property ON public.conversations(property_id);
CREATE INDEX idx_conversations_status ON public.conversations(status) WHERE status = 'active';

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id, created_at ASC);
CREATE INDEX idx_conversation_messages_unread ON public.conversation_messages(conversation_id, read_at) WHERE read_at IS NULL;

CREATE INDEX idx_conversation_events_conversation ON public.conversation_events(conversation_id, created_at ASC);

-- ============================================================
-- PART 4: TRIGGERS
-- ============================================================

-- 4a: updated_at trigger on conversations (reuse existing function)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_conversations_updated_at') THEN
    CREATE TRIGGER set_conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4b: Auto-update last_message_at and increment recipient's unread count on new message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    -- Increment recipient's unread count (the participant who did NOT send the message)
    owner_unread_count = CASE
      WHEN (SELECT owner_id FROM public.conversations WHERE id = NEW.conversation_id) = NEW.sender_id
      THEN owner_unread_count  -- sender IS the owner, so owner's count stays the same
      ELSE owner_unread_count + 1  -- sender is NOT the owner, so increment owner's unread
    END,
    traveler_unread_count = CASE
      WHEN (SELECT traveler_id FROM public.conversations WHERE id = NEW.conversation_id) = NEW.sender_id
      THEN traveler_unread_count  -- sender IS the traveler, so traveler's count stays the same
      ELSE traveler_unread_count + 1  -- sender is NOT the traveler, so increment traveler's unread
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_conversation_on_message') THEN
    CREATE TRIGGER trigger_update_conversation_on_message
      AFTER INSERT ON public.conversation_messages
      FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();
  END IF;
END $$;

-- 4c: Auto-update last_message_at when events arrive (only if NULL)
CREATE OR REPLACE FUNCTION public.update_conversation_on_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    updated_at = NOW(),
    last_message_at = COALESCE(last_message_at, NEW.created_at)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_conversation_on_event') THEN
    CREATE TRIGGER trigger_update_conversation_on_event
      AFTER INSERT ON public.conversation_events
      FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_event();
  END IF;
END $$;

-- ============================================================
-- PART 5: RLS POLICIES
-- ============================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

-- Conversations: visible to participants and RAV team
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_select_participants') THEN
    CREATE POLICY conversations_select_participants ON public.conversations
      FOR SELECT TO authenticated
      USING (owner_id = auth.uid() OR traveler_id = auth.uid() OR public.is_rav_team(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_update_participants') THEN
    CREATE POLICY conversations_update_participants ON public.conversations
      FOR UPDATE TO authenticated
      USING (owner_id = auth.uid() OR traveler_id = auth.uid())
      WITH CHECK (owner_id = auth.uid() OR traveler_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversations_insert_participants') THEN
    CREATE POLICY conversations_insert_participants ON public.conversations
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = owner_id OR auth.uid() = traveler_id OR public.is_rav_team(auth.uid()));
  END IF;
END $$;

-- Messages: participants can read, participants can send (sender_id = auth.uid())
-- No UPDATE policy — read_at is set via mark_conversation_read RPC (SECURITY DEFINER)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversation_messages_select_participants') THEN
    CREATE POLICY conversation_messages_select_participants ON public.conversation_messages
      FOR SELECT TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE owner_id = auth.uid() OR traveler_id = auth.uid()
        ) OR public.is_rav_team(auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversation_messages_insert_sender') THEN
    CREATE POLICY conversation_messages_insert_sender ON public.conversation_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE owner_id = auth.uid() OR traveler_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Events: participants can read, inserted via insert_conversation_event RPC (SECURITY DEFINER)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'conversation_events_select_participants') THEN
    CREATE POLICY conversation_events_select_participants ON public.conversation_events
      FOR SELECT TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE owner_id = auth.uid() OR traveler_id = auth.uid()
        ) OR public.is_rav_team(auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- PART 6: RPCs
-- ============================================================

-- 6a: Idempotent conversation creation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_owner_id UUID,
  p_traveler_id UUID,
  p_property_id UUID,
  p_listing_id UUID DEFAULT NULL,
  p_context_type TEXT DEFAULT 'inquiry',
  p_context_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation for this owner-traveler-property combo
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE owner_id = p_owner_id
    AND traveler_id = p_traveler_id
    AND property_id = p_property_id;

  -- If found, optionally update the context
  IF FOUND THEN
    IF p_context_id IS NOT NULL THEN
      UPDATE public.conversations
      SET
        listing_id = COALESCE(p_listing_id, listing_id),
        context_type = p_context_type,
        context_id = p_context_id,
        status = 'active',
        updated_at = NOW()
      WHERE id = v_conversation_id;
    END IF;
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (
    owner_id, traveler_id, property_id, listing_id, context_type, context_id
  ) VALUES (
    p_owner_id, p_traveler_id, p_property_id, p_listing_id, p_context_type,
    p_context_id  -- NULL is valid when conversation precedes interaction record
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6b: Mark conversation read — reset unread count for current user
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Mark all messages as read for current user
  UPDATE public.conversation_messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND read_at IS NULL;

  -- Reset unread count
  UPDATE public.conversations
  SET
    owner_unread_count = CASE WHEN owner_id = auth.uid() THEN 0 ELSE owner_unread_count END,
    traveler_unread_count = CASE WHEN traveler_id = auth.uid() THEN 0 ELSE traveler_unread_count END,
    updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6c: Combined thread view — messages + events sorted by time
CREATE OR REPLACE FUNCTION public.get_conversation_thread(p_conversation_id UUID)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  sender_id UUID,
  body TEXT,
  event_type TEXT,
  event_data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    'message'::TEXT as item_type,
    m.sender_id,
    m.body,
    NULL::TEXT as event_type,
    NULL::JSONB as event_data,
    m.read_at,
    m.created_at
  FROM public.conversation_messages m
  WHERE m.conversation_id = p_conversation_id

  UNION ALL

  SELECT
    e.id,
    'event'::TEXT as item_type,
    NULL::UUID as sender_id,
    NULL::TEXT as body,
    e.event_type,
    e.event_data,
    NULL::TIMESTAMPTZ as read_at,
    e.created_at
  FROM public.conversation_events e
  WHERE e.conversation_id = p_conversation_id

  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6d: Insert conversation event (SECURITY DEFINER — clients MUST NOT insert directly)
CREATE OR REPLACE FUNCTION public.insert_conversation_event(
  p_conversation_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Verify caller is a participant or RAV team
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
      AND (owner_id = auth.uid() OR traveler_id = auth.uid() OR public.is_rav_team(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Not a participant in this conversation';
  END IF;

  INSERT INTO public.conversation_events (conversation_id, event_type, event_data)
  VALUES (p_conversation_id, p_event_type, p_event_data)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 7: BACKFILL (12 steps)
-- ============================================================

-- Step 1: Backfill conversations from listing_inquiries
-- listing_inquiries has asker_id (traveler) and owner_id, but NO property_id — join through listings
INSERT INTO public.conversations (owner_id, traveler_id, property_id, listing_id, context_type, context_id, last_message_at, created_at)
SELECT DISTINCT ON (li.owner_id, li.asker_id, l.property_id)
  li.owner_id,
  li.asker_id,
  l.property_id,
  li.listing_id,
  'inquiry',
  li.id,
  li.updated_at,
  li.created_at
FROM public.listing_inquiries li
JOIN public.listings l ON li.listing_id = l.id
ON CONFLICT (owner_id, traveler_id, property_id) DO NOTHING;

-- Step 2: Link inquiries to their conversations
UPDATE public.listing_inquiries li
SET conversation_id = c.id
FROM public.listings l, public.conversations c
WHERE li.listing_id = l.id
  AND c.owner_id = li.owner_id
  AND c.traveler_id = li.asker_id
  AND c.property_id = l.property_id;

-- Step 3: Backfill conversations from bookings
INSERT INTO public.conversations (owner_id, traveler_id, property_id, listing_id, context_type, context_id, last_message_at, created_at)
SELECT DISTINCT ON (l.owner_id, b.renter_id, p.id)
  l.owner_id,
  b.renter_id,
  p.id,
  b.listing_id,
  'booking',
  b.id,
  b.updated_at,
  b.created_at
FROM public.bookings b
JOIN public.listings l ON b.listing_id = l.id
JOIN public.properties p ON l.property_id = p.id
ON CONFLICT (owner_id, traveler_id, property_id) DO UPDATE
  SET context_type = 'booking', context_id = EXCLUDED.context_id;

-- Step 4: Link bookings to their conversations
UPDATE public.bookings b
SET conversation_id = c.id
FROM public.listings l, public.properties p, public.conversations c
WHERE b.listing_id = l.id
  AND l.property_id = p.id
  AND c.owner_id = l.owner_id
  AND c.traveler_id = b.renter_id
  AND c.property_id = p.id;

-- Step 5: Migrate inquiry_messages → conversation_messages
INSERT INTO public.conversation_messages (conversation_id, sender_id, body, read_at, created_at)
SELECT
  li.conversation_id,
  im.sender_id,
  im.body,
  im.read_at,
  im.created_at
FROM public.inquiry_messages im
JOIN public.listing_inquiries li ON im.inquiry_id = li.id
WHERE li.conversation_id IS NOT NULL;

-- Step 6: Migrate booking_messages → conversation_messages
INSERT INTO public.conversation_messages (conversation_id, sender_id, body, read_at, created_at)
SELECT
  b.conversation_id,
  bm.sender_id,
  bm.body,
  bm.read_at,
  bm.created_at
FROM public.booking_messages bm
JOIN public.bookings b ON bm.booking_id = b.id
WHERE b.conversation_id IS NOT NULL;

-- Step 7: Backfill conversation_events from confirmed/completed bookings
INSERT INTO public.conversation_events (conversation_id, event_type, event_data, created_at)
SELECT
  b.conversation_id,
  'booking_confirmed',
  jsonb_build_object(
    'booking_id', b.id::TEXT,
    'total', b.total_amount,
    'check_in', l.check_in_date
  ),
  b.created_at
FROM public.bookings b
JOIN public.listings l ON b.listing_id = l.id
WHERE b.conversation_id IS NOT NULL
  AND b.status IN ('confirmed', 'completed');

-- Step 8: Backfill listing_bids → conversations
INSERT INTO public.conversations (owner_id, traveler_id, property_id, listing_id, context_type, context_id, last_message_at, created_at)
SELECT DISTINCT ON (l.owner_id, lb.bidder_id, p.id)
  l.owner_id,
  lb.bidder_id,
  p.id,
  lb.listing_id,
  'bid',
  lb.id,
  lb.updated_at,
  lb.created_at
FROM public.listing_bids lb
JOIN public.listings l ON lb.listing_id = l.id
JOIN public.properties p ON l.property_id = p.id
ON CONFLICT (owner_id, traveler_id, property_id) DO UPDATE
  SET context_type = 'bid', context_id = EXCLUDED.context_id;

-- Link bids to conversations
UPDATE public.listing_bids lb
SET conversation_id = c.id
FROM public.listings l, public.properties p, public.conversations c
WHERE lb.listing_id = l.id
  AND l.property_id = p.id
  AND c.owner_id = l.owner_id
  AND c.traveler_id = lb.bidder_id
  AND c.property_id = p.id;

-- Step 9: Seed bid events
INSERT INTO public.conversation_events (conversation_id, event_type, event_data, created_at)
SELECT
  lb.conversation_id,
  CASE lb.status
    WHEN 'accepted' THEN 'bid_accepted'
    WHEN 'rejected' THEN 'bid_rejected'
    WHEN 'expired' THEN 'bid_expired'
    ELSE 'bid_placed'
  END,
  jsonb_build_object(
    'amount', lb.bid_amount,
    'check_in', lb.requested_check_in,
    'check_out', lb.requested_check_out,
    'counter', lb.counter_offer_amount
  ),
  lb.created_at
FROM public.listing_bids lb
WHERE lb.conversation_id IS NOT NULL;

-- Step 10: Backfill travel_proposals → conversations
INSERT INTO public.conversations (owner_id, traveler_id, property_id, listing_id, context_type, context_id, last_message_at, created_at)
SELECT DISTINCT ON (tp.owner_id, tr.traveler_id, tp.property_id)
  tp.owner_id,
  tr.traveler_id,
  tp.property_id,
  tp.listing_id,
  'travel_request',
  tr.id,
  tp.updated_at,
  tp.created_at
FROM public.travel_proposals tp
JOIN public.travel_requests tr ON tp.request_id = tr.id
ON CONFLICT (owner_id, traveler_id, property_id) DO UPDATE
  SET context_type = 'travel_request', context_id = EXCLUDED.context_id;

-- Link travel_requests to conversations
UPDATE public.travel_requests tr
SET conversation_id = c.id
FROM public.travel_proposals tp, public.conversations c
WHERE tp.request_id = tr.id
  AND c.owner_id = tp.owner_id
  AND c.traveler_id = tr.traveler_id
  AND c.property_id = tp.property_id;

-- Step 11: Seed proposal events
INSERT INTO public.conversation_events (conversation_id, event_type, event_data, created_at)
SELECT
  tr.conversation_id,
  CASE tp.status
    WHEN 'accepted' THEN 'proposal_accepted'
    WHEN 'rejected' THEN 'proposal_rejected'
    ELSE 'proposal_sent'
  END,
  jsonb_build_object(
    'proposal_id', tp.id::TEXT,
    'listing_id', tp.listing_id::TEXT
  ),
  tp.created_at
FROM public.travel_proposals tp
JOIN public.travel_requests tr ON tp.request_id = tr.id
WHERE tr.conversation_id IS NOT NULL;

-- Step 12: Update last_message_at from migrated messages
UPDATE public.conversations c
SET last_message_at = sub.max_created
FROM (
  SELECT conversation_id, MAX(created_at) as max_created
  FROM public.conversation_messages
  GROUP BY conversation_id
) sub
WHERE sub.conversation_id = c.id
  AND (c.last_message_at IS NULL OR sub.max_created > c.last_message_at);
