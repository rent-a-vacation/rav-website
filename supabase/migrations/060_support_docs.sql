-- Migration 060: support_docs — runtime index for docs/support/*.md
-- Phase 22 A2 (#397) — DEC-036 RAVIO Support Architecture.
--
-- Source of truth is markdown in docs/support/ (git-versioned). This table is
-- a build-time cache populated by the ingest-support-docs edge function on
-- every push to main that touches docs/support/**.
--
-- Agent tool query_support_docs(query, doc_type?) reads this table for fast
-- keyword retrieval via the search_tsv GIN index.

-- ── Extensions ───────────────────────────────────────────────────────────────
-- pgvector is optional — if added later we can ALTER TABLE to add embedding
-- column without rewriting this migration.

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_doc_type') THEN
    CREATE TYPE public.support_doc_type AS ENUM ('policy', 'faq', 'process', 'guide');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_doc_status') THEN
    CREATE TYPE public.support_doc_status AS ENUM ('active', 'draft', 'archived');
  END IF;
END $$;

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_docs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  doc_type    public.support_doc_type NOT NULL,
  status      public.support_doc_status NOT NULL DEFAULT 'draft',
  audience    text[] NOT NULL DEFAULT '{}',
  version     text NOT NULL DEFAULT '1.0.0',
  tags        text[] NOT NULL DEFAULT '{}',

  legal_review_required boolean NOT NULL DEFAULT false,
  reviewed_by           text,
  reviewed_date         date,

  frontmatter jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections    jsonb NOT NULL DEFAULT '{}'::jsonb,
  body        text,

  source_path text NOT NULL,
  source_sha  text,

  search_tsv  tsvector,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.support_docs IS
  'Build-time cache of docs/support/*.md. Canonical source is git. Populated by ingest-support-docs edge function. See docs/support/README.md.';
COMMENT ON COLUMN public.support_docs.slug IS
  'Stable identifier derived from file path, e.g. policies/cancellation-policy';
COMMENT ON COLUMN public.support_docs.sections IS
  'Parsed body sections keyed by heading slug: summary, details, examples, related';
COMMENT ON COLUMN public.support_docs.source_path IS
  'Repo-relative path to the canonical markdown file';
COMMENT ON COLUMN public.support_docs.source_sha IS
  'Commit SHA at which this row was last ingested';

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_docs_doc_type   ON public.support_docs (doc_type);
CREATE INDEX IF NOT EXISTS idx_support_docs_status     ON public.support_docs (status);
CREATE INDEX IF NOT EXISTS idx_support_docs_audience   ON public.support_docs USING GIN (audience);
CREATE INDEX IF NOT EXISTS idx_support_docs_tags       ON public.support_docs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_support_docs_search_tsv ON public.support_docs USING GIN (search_tsv);

-- ── search_tsv trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.support_docs_update_search_tsv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.sections->>'summary', '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.sections->>'details', '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.sections->>'examples', '')), 'D') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_docs_search_tsv ON public.support_docs;
CREATE TRIGGER trg_support_docs_search_tsv
  BEFORE INSERT OR UPDATE ON public.support_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.support_docs_update_search_tsv();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.support_docs ENABLE ROW LEVEL SECURITY;

-- Active docs are readable by any authenticated user (agent + user-facing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_docs' AND policyname = 'support_docs_read_active'
  ) THEN
    CREATE POLICY support_docs_read_active
      ON public.support_docs
      FOR SELECT
      TO authenticated
      USING (status = 'active');
  END IF;

  -- Drafts + archived are readable by RAV team only (admin tooling)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_docs' AND policyname = 'support_docs_read_all_rav_team'
  ) THEN
    CREATE POLICY support_docs_read_all_rav_team
      ON public.support_docs
      FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;

  -- Writes are restricted to service_role (the ingest edge function)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'support_docs' AND policyname = 'support_docs_service_role_write'
  ) THEN
    CREATE POLICY support_docs_service_role_write
      ON public.support_docs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT SELECT ON public.support_docs TO authenticated;
GRANT ALL    ON public.support_docs TO service_role;
