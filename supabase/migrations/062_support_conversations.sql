-- Migration 062: RAVIO support conversation logging
-- Phase 22 D1 (#410) — DEC-036.
--
-- Two dedicated tables (deliberately NOT extending the Phase 21 `conversations`
-- table, which models user↔user messaging). The agent data model is genuinely
-- different: tool calls are first-class, there's only one human participant,
-- and the analytics workload wants purpose-built columns (escalated_at,
-- classifier_context_used, etc.).
--
-- Populated by the text-chat edge function (service-role writes; per-turn,
-- best-effort — write failures never break the user's chat). Read by the
-- #411 admin Support Interactions tab + future "My conversations" UX.

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_turn_type') THEN
    CREATE TYPE public.support_turn_type AS ENUM (
      'user',
      'assistant',
      'tool_call',
      'tool_result',
      'error'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_chat_context') THEN
    CREATE TYPE public.support_chat_context AS ENUM (
      'rentals',
      'property-detail',
      'bidding',
      'support',
      'general'
    );
  END IF;
END $$;

-- ── support_conversations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Context resolution at conversation-start time. classifier_context_detected
  -- captures what the intent classifier said; classifier_context_used is what
  -- the edge fn actually used (usually identical, differs only if the user
  -- dismissed the chip and re-asked).
  route_context                  public.support_chat_context NOT NULL,
  classifier_context_detected    public.support_chat_context,
  classifier_context_used        public.support_chat_context NOT NULL,
  classifier_dismissed           boolean NOT NULL DEFAULT false,

  started_at                     timestamptz NOT NULL DEFAULT now(),
  last_turn_at                   timestamptz NOT NULL DEFAULT now(),
  ended_at                       timestamptz,

  -- Counters maintained by the logger (cheap to compute on the fly, but
  -- pre-aggregated for fast listing queries).
  user_message_count             integer NOT NULL DEFAULT 0,
  assistant_message_count        integer NOT NULL DEFAULT 0,
  tool_call_count                integer NOT NULL DEFAULT 0,

  -- Escalation — stamped when the agent's `open_dispute` tool succeeds.
  escalated_to_dispute_id        uuid REFERENCES public.disputes(id) ON DELETE SET NULL,
  escalated_at                   timestamptz,

  -- User feedback (#411 thumbs up/down — columns ready, UI ships later).
  user_rating                    smallint CHECK (user_rating IN (-1, 0, 1)),
  rating_submitted_at            timestamptz,

  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.support_conversations IS
  'One row per RAVIO support chat session. Populated by text-chat edge fn; read by #411 admin tab. See docs/support/processes/customer-support-escalation.md.';
COMMENT ON COLUMN public.support_conversations.escalated_to_dispute_id IS
  'Set when the agent opened a dispute (source=ravio_support) during this conversation. NULL = no escalation.';
COMMENT ON COLUMN public.support_conversations.user_rating IS
  '-1 thumbs down, 0 neutral (legacy), 1 thumbs up. NULL = no rating yet. Collected via #411 UI.';

CREATE INDEX IF NOT EXISTS idx_support_conversations_user_started
  ON public.support_conversations (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_conversations_escalated
  ON public.support_conversations (escalated_at)
  WHERE escalated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_conversations_ended
  ON public.support_conversations (ended_at);
CREATE INDEX IF NOT EXISTS idx_support_conversations_last_turn
  ON public.support_conversations (last_turn_at DESC);

-- ── support_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,

  -- Monotonic per-conversation so transcripts render in order without tiebreakers.
  turn_index         integer NOT NULL,
  turn_type          public.support_turn_type NOT NULL,

  -- Content fields — which are populated depends on turn_type:
  --   'user' / 'assistant' / 'error' — content is the text
  --   'tool_call'                    — tool_name + tool_args
  --   'tool_result'                  — tool_name + tool_result_json (success/error/data)
  content            text,
  tool_name          text,
  tool_args          jsonb,
  tool_result_json   jsonb,

  -- Optional metadata for #411 analytics; best-effort.
  tokens_used        integer,
  model              text,

  created_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE (conversation_id, turn_index)
);

COMMENT ON TABLE public.support_messages IS
  'One row per turn in a RAVIO support conversation. turn_type distinguishes user/assistant/tool_call/tool_result/error.';

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_turn
  ON public.support_messages (conversation_id, turn_index);
CREATE INDEX IF NOT EXISTS idx_support_messages_tool_name
  ON public.support_messages (tool_name)
  WHERE tool_name IS NOT NULL;

-- ── updated_at trigger for support_conversations ────────────────────────────
DROP TRIGGER IF EXISTS trg_support_conversations_updated_at ON public.support_conversations;
CREATE TRIGGER trg_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- support_conversations: user sees their own, RAV team sees all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_conversations' AND policyname = 'support_conversations_read_own'
  ) THEN
    CREATE POLICY support_conversations_read_own
      ON public.support_conversations
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_conversations' AND policyname = 'support_conversations_read_rav_team'
  ) THEN
    CREATE POLICY support_conversations_read_rav_team
      ON public.support_conversations
      FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;

  -- User can set their own rating (#411 UI). No other updates permitted.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_conversations' AND policyname = 'support_conversations_rate_own'
  ) THEN
    CREATE POLICY support_conversations_rate_own
      ON public.support_conversations
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Writes are restricted to service_role (the text-chat edge function).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_conversations' AND policyname = 'support_conversations_service_role'
  ) THEN
    CREATE POLICY support_conversations_service_role
      ON public.support_conversations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- support_messages: user sees messages in conversations they own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_messages' AND policyname = 'support_messages_read_own'
  ) THEN
    CREATE POLICY support_messages_read_own
      ON public.support_messages
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.support_conversations c
          WHERE c.id = support_messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_messages' AND policyname = 'support_messages_read_rav_team'
  ) THEN
    CREATE POLICY support_messages_read_rav_team
      ON public.support_messages
      FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_messages' AND policyname = 'support_messages_service_role'
  ) THEN
    CREATE POLICY support_messages_service_role
      ON public.support_messages
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── Grants ──────────────────────────────────────────────────────────────────
GRANT SELECT, UPDATE ON public.support_conversations TO authenticated;
GRANT SELECT          ON public.support_messages      TO authenticated;
GRANT ALL             ON public.support_conversations TO service_role;
GRANT ALL             ON public.support_messages      TO service_role;
