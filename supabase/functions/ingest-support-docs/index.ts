import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import matter from "npm:gray-matter@4.0.3";

/**
 * Ingest Support Docs — sync markdown from docs/support/ into support_docs table
 *
 * Phase 22 A3 (#398) — DEC-036.
 *
 * Invoked by .github/workflows/sync-support-docs.yml on every push to main
 * that touches docs/support/**. The Action reads all markdown files from the
 * repo at that commit and POSTs them here; this function parses frontmatter +
 * sections, upserts by slug, and deletes rows whose source_path is no longer
 * present (handles file deletions).
 *
 * Auth: Bearer token that must match INGEST_SUPPORT_DOCS_SECRET env var.
 * (Not user-facing — never called from the browser.)
 *
 * Payload:
 *   {
 *     "source_sha": "abc1234",
 *     "files": [
 *       { "path": "docs/support/policies/cancellation-policy.md", "content": "..." }
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "ingested": 3,
 *     "deleted": 0,
 *     "errors": []
 *   }
 */

interface IngestFile {
  path: string;
  content: string;
}

interface IngestPayload {
  source_sha?: string;
  files: IngestFile[];
}

interface ParsedDoc {
  slug: string;
  source_path: string;
  frontmatter: Record<string, unknown>;
  body: string;
  sections: Record<string, string>;
  errors: string[];
}

const SECTION_NAMES = ["summary", "details", "examples", "related"] as const;

const REQUIRED_FIELDS = [
  "title",
  "doc_type",
  "audience",
  "version",
  "legal_review_required",
  "status",
];

const VALID_DOC_TYPES = ["policy", "faq", "process", "guide"];
const VALID_STATUSES = ["active", "draft", "archived"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Derive slug from repo path: docs/support/<folder>/<name>.md → <folder>/<name>
 */
function slugFromPath(path: string): string {
  const match = path.match(/^docs\/support\/([^/]+)\/([^/]+)\.md$/);
  if (!match) throw new Error(`Invalid support doc path: ${path}`);
  return `${match[1]}/${match[2]}`;
}

/**
 * Extract section bodies keyed by lowercased heading.
 * Recognises `## Summary`, `## Details`, `## Examples`, `## Related` at the ## level.
 */
function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current && buffer.length > 0) {
      sections[current] = buffer.join("\n").trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      flush();
      const normalised = headingMatch[1].toLowerCase();
      current = SECTION_NAMES.find((s) => normalised === s) ?? null;
      continue;
    }
    if (current !== null) buffer.push(line);
  }
  flush();

  return sections;
}

function validateFrontmatter(fm: Record<string, unknown>, path: string): string[] {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (fm[field] === undefined || fm[field] === null) {
      errors.push(`${path}: missing required field \`${field}\``);
    }
  }

  if (fm.doc_type && !VALID_DOC_TYPES.includes(fm.doc_type as string)) {
    errors.push(
      `${path}: invalid doc_type "${fm.doc_type}" (expected: ${VALID_DOC_TYPES.join(", ")})`,
    );
  }

  if (fm.status && !VALID_STATUSES.includes(fm.status as string)) {
    errors.push(
      `${path}: invalid status "${fm.status}" (expected: ${VALID_STATUSES.join(", ")})`,
    );
  }

  if (fm.audience && !Array.isArray(fm.audience)) {
    errors.push(`${path}: audience must be an array`);
  }

  if (fm.legal_review_required === true && fm.status === "active") {
    if (!fm.reviewed_by || !fm.reviewed_date) {
      errors.push(
        `${path}: legal_review_required + status=active requires non-null reviewed_by and reviewed_date`,
      );
    }
  }

  return errors;
}

function parseDoc(file: IngestFile): ParsedDoc {
  const slug = slugFromPath(file.path);
  const parsed = matter(file.content);
  const fm = (parsed.data ?? {}) as Record<string, unknown>;
  const body = parsed.content ?? "";
  const sections = parseSections(body);
  const errors = validateFrontmatter(fm, file.path);

  return {
    slug,
    source_path: file.path,
    frontmatter: fm,
    body,
    sections,
    errors,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  // Auth: bearer must match INGEST_SUPPORT_DOCS_SECRET
  const expected = Deno.env.get("INGEST_SUPPORT_DOCS_SECRET");
  if (!expected) {
    console.error("INGEST_SUPPORT_DOCS_SECRET not configured");
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  let payload: IngestPayload;
  try {
    payload = (await req.json()) as IngestPayload;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  if (!payload?.files || !Array.isArray(payload.files)) {
    return new Response(
      JSON.stringify({ error: "missing_files_array" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      },
    );
  }

  const sourceSha = payload.source_sha ?? null;

  const parsedDocs: ParsedDoc[] = [];
  const errors: string[] = [];

  for (const file of payload.files) {
    try {
      const doc = parseDoc(file);
      if (doc.errors.length > 0) {
        errors.push(...doc.errors);
        continue;
      }
      parsedDocs.push(doc);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${file.path}: ${message}`);
    }
  }

  if (errors.length > 0 && parsedDocs.length === 0) {
    return new Response(
      JSON.stringify({ ingested: 0, deleted: 0, errors }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Upsert
  const rows = parsedDocs.map((doc) => ({
    slug: doc.slug,
    title: doc.frontmatter.title as string,
    doc_type: doc.frontmatter.doc_type as string,
    status: doc.frontmatter.status as string,
    audience: (doc.frontmatter.audience as string[]) ?? [],
    version: doc.frontmatter.version as string,
    tags: (doc.frontmatter.tags as string[]) ?? [],
    legal_review_required:
      (doc.frontmatter.legal_review_required as boolean) ?? false,
    reviewed_by: (doc.frontmatter.reviewed_by as string | null) ?? null,
    reviewed_date: (doc.frontmatter.reviewed_date as string | null) ?? null,
    frontmatter: doc.frontmatter,
    sections: doc.sections,
    body: doc.body,
    source_path: doc.source_path,
    source_sha: sourceSha,
  }));

  const { error: upsertError } = await supabase
    .from("support_docs")
    .upsert(rows, { onConflict: "slug" });

  if (upsertError) {
    return new Response(
      JSON.stringify({
        ingested: 0,
        deleted: 0,
        errors: [...errors, `upsert failed: ${upsertError.message}`],
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      },
    );
  }

  // Delete rows whose source_path is not in the payload (file removed upstream)
  const currentPaths = parsedDocs.map((d) => d.source_path);
  const { data: deletedRows, error: deleteError } = await supabase
    .from("support_docs")
    .delete()
    .not("source_path", "in", `(${currentPaths.map((p) => `"${p}"`).join(",")})`)
    .select("slug");

  if (deleteError) {
    return new Response(
      JSON.stringify({
        ingested: rows.length,
        deleted: 0,
        errors: [...errors, `delete failed: ${deleteError.message}`],
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ingested: rows.length,
      deleted: deletedRows?.length ?? 0,
      errors,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    },
  );
};

serve(handler);
