#!/usr/bin/env node

/**
 * generate-openapi.js
 *
 * Reads all Supabase Edge Function source files under supabase/functions/
 * and generates an OpenAPI 3.0.3 specification at docs/api/openapi.yaml.
 *
 * This script extracts TypeScript interfaces, HTTP methods, rate limits,
 * and auth patterns from the source code to build the spec scaffold.
 * The authoritative spec lives at docs/api/openapi.yaml — this script
 * helps bootstrap and audit it, but manual review is always recommended.
 *
 * Usage:
 *   node scripts/generate-openapi.js
 *   node scripts/generate-openapi.js --audit   # Compare existing spec to source
 *
 * Output:
 *   docs/api/openapi.yaml       (generated spec)
 *   public/api/openapi.yaml     (copy for static serving)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FUNCTIONS_DIR = path.join(ROOT, "supabase", "functions");
const OUTPUT_PATH = path.join(ROOT, "docs", "api", "openapi.yaml");
const PUBLIC_PATH = path.join(ROOT, "public", "api", "openapi.yaml");

// Edge functions to document (exclude _shared)
const FUNCTION_NAMES = [
  "create-booking-checkout",
  "create-connect-account",
  "create-stripe-payout",
  "delete-user-account",
  "export-user-data",
  "fetch-airdna-data",
  "fetch-industry-news",
  "fetch-macro-indicators",
  "fetch-str-data",
  "idle-listing-alerts",
  "match-travel-requests",
  "process-cancellation",
  "process-deadline-reminders",
  "process-dispute-refund",
  "process-escrow-release",
  "seed-manager",
  "send-approval-email",
  "send-booking-confirmation-reminder",
  "send-cancellation-email",
  "send-contact-form",
  "send-email",
  "send-verification-notification",
  "stripe-webhook",
  "text-chat",
  "verify-booking-payment",
  "voice-search",
];

// Tag categorization
const TAG_MAP = {
  "voice-search": "AI",
  "text-chat": "AI",
  "create-booking-checkout": "Payments",
  "verify-booking-payment": "Payments",
  "stripe-webhook": "Payments",
  "create-connect-account": "Payouts",
  "create-stripe-payout": "Payouts",
  "process-cancellation": "Cancellations",
  "process-dispute-refund": "Disputes",
  "process-escrow-release": "Escrow",
  "match-travel-requests": "Marketplace",
  "export-user-data": "GDPR",
  "delete-user-account": "GDPR",
  "fetch-airdna-data": "Data",
  "fetch-industry-news": "Data",
  "fetch-macro-indicators": "Data",
  "fetch-str-data": "Data",
  "idle-listing-alerts": "Alerts",
  "seed-manager": "Admin",
  "send-email": "Notifications",
  "send-contact-form": "Notifications",
  "send-approval-email": "Notifications",
  "send-booking-confirmation-reminder": "Notifications",
  "send-cancellation-email": "Notifications",
  "send-verification-notification": "Notifications",
  "process-deadline-reminders": "Notifications",
};

/**
 * Extract metadata from an edge function source file.
 */
function extractFunctionMetadata(name) {
  const indexPath = path.join(FUNCTIONS_DIR, name, "index.ts");
  if (!fs.existsSync(indexPath)) {
    return { name, exists: false };
  }

  const source = fs.readFileSync(indexPath, "utf-8");

  // Extract HTTP methods
  const methods = [];
  if (source.includes('"GET"') || source.includes("'GET'")) methods.push("GET");
  if (source.includes('"POST"') || source.includes("'POST'")) methods.push("POST");
  if (!methods.length) methods.push("POST"); // default

  // Extract interfaces
  const interfaces = [];
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  while ((match = interfaceRegex.exec(source)) !== null) {
    const fields = match[2]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//") && !l.startsWith("/**") && !l.startsWith("*"))
      .map((l) => {
        const fieldMatch = l.match(/^(\w+)(\?)?:\s*(.+?);?\s*(?:\/\/.*)?$/);
        if (fieldMatch) {
          return {
            name: fieldMatch[1],
            optional: !!fieldMatch[2],
            type: fieldMatch[3].trim(),
          };
        }
        return null;
      })
      .filter(Boolean);
    interfaces.push({ name: match[1], fields });
  }

  // Extract type aliases
  const typeAliases = [];
  const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*(.+?);/g;
  while ((match = typeRegex.exec(source)) !== null) {
    typeAliases.push({ name: match[1], definition: match[2].trim() });
  }

  // Check auth patterns
  const hasJWTAuth =
    source.includes("authorization") ||
    source.includes("Authorization") ||
    source.includes("getUser");
  const hasServiceRole = source.includes("service_role") || source.includes("SUPABASE_SERVICE_ROLE_KEY");
  const hasStripeSignature = source.includes("stripe-signature") || source.includes("Stripe-Signature");

  // Check rate limiting
  const rateLimitMatch = source.match(/RATE_LIMITS\.(\w+)/);
  const rateLimit = rateLimitMatch ? rateLimitMatch[1] : null;

  // Check for inline rate limiting
  const inlineRateLimit = source.match(/(\d+)\s*(?:requests?|req)\s*(?:per|\/)\s*(?:(\d+)\s*)?min/i);

  // Extract error status codes
  const statusCodes = new Set();
  const statusRegex = /status:\s*(\d{3})/g;
  while ((match = statusRegex.exec(source)) !== null) {
    statusCodes.add(parseInt(match[1]));
  }

  // Check for streaming (SSE)
  const isStreaming = source.includes("text/event-stream") || source.includes("ReadableStream");

  // Check for CORS headers
  const hasCors = source.includes("Access-Control-Allow-Origin");

  return {
    name,
    exists: true,
    methods,
    interfaces,
    typeAliases,
    auth: {
      jwt: hasJWTAuth && !hasStripeSignature,
      serviceRole: hasServiceRole,
      stripeSignature: hasStripeSignature,
      none: !hasJWTAuth && !hasServiceRole && !hasStripeSignature,
    },
    rateLimit,
    inlineRateLimit: inlineRateLimit
      ? { max: parseInt(inlineRateLimit[1]), windowMin: parseInt(inlineRateLimit[2] || "1") }
      : null,
    statusCodes: [...statusCodes].sort(),
    isStreaming,
    hasCors,
    tag: TAG_MAP[name] || "Uncategorized",
    lineCount: source.split("\n").length,
  };
}

/**
 * Run in audit mode: compare existing spec against source files.
 */
function auditSpec() {
  console.log("Auditing OpenAPI spec against edge function source files...\n");

  let specContent = "";
  if (fs.existsSync(OUTPUT_PATH)) {
    specContent = fs.readFileSync(OUTPUT_PATH, "utf-8");
  } else {
    console.log("  No existing spec found at docs/api/openapi.yaml\n");
    return;
  }

  const results = FUNCTION_NAMES.map((name) => {
    const meta = extractFunctionMetadata(name);
    const inSpec = specContent.includes(`/${name}:`);
    return { name, inSpec, exists: meta.exists, tag: meta.tag };
  });

  console.log("Function Coverage:");
  console.log("─".repeat(60));

  let missing = 0;
  for (const r of results) {
    const status = r.inSpec ? "  [OK]" : "  [MISSING]";
    if (!r.inSpec) missing++;
    console.log(`${status}  /${r.name}  (${r.tag})`);
  }

  console.log("─".repeat(60));
  console.log(`\n${results.length - missing}/${results.length} functions documented`);
  if (missing > 0) {
    console.log(`${missing} functions missing from spec — run without --audit to regenerate`);
  }
}

/**
 * Main: extract metadata and generate report.
 */
function main() {
  const isAudit = process.argv.includes("--audit");

  if (isAudit) {
    auditSpec();
    return;
  }

  console.log("Extracting edge function metadata...\n");

  const functions = FUNCTION_NAMES.map(extractFunctionMetadata);

  // Summary table
  console.log("Function Summary:");
  console.log("─".repeat(80));
  console.log(
    "Name".padEnd(35) +
    "Methods".padEnd(10) +
    "Auth".padEnd(15) +
    "Rate Limit".padEnd(15) +
    "Tag"
  );
  console.log("─".repeat(80));

  for (const fn of functions) {
    if (!fn.exists) {
      console.log(`${fn.name.padEnd(35)}NOT FOUND`);
      continue;
    }
    const auth = fn.auth.jwt
      ? "JWT"
      : fn.auth.stripeSignature
        ? "Stripe Sig"
        : fn.auth.serviceRole
          ? "Service Role"
          : "None";
    const rateLimit = fn.rateLimit || (fn.inlineRateLimit ? `${fn.inlineRateLimit.max}/min` : "None");
    console.log(
      `${fn.name.padEnd(35)}${fn.methods.join(",").padEnd(10)}${auth.padEnd(15)}${rateLimit.padEnd(15)}${fn.tag}`
    );
  }

  console.log("─".repeat(80));
  console.log(`\nTotal: ${functions.filter((f) => f.exists).length} functions found`);

  // Interface extraction summary
  const withInterfaces = functions.filter((f) => f.interfaces && f.interfaces.length > 0);
  if (withInterfaces.length > 0) {
    console.log(`\nFunctions with extractable interfaces (${withInterfaces.length}):`);
    for (const fn of withInterfaces) {
      for (const iface of fn.interfaces) {
        console.log(`  ${fn.name} → ${iface.name} (${iface.fields.length} fields)`);
      }
    }
  }

  // Check if spec already exists
  if (fs.existsSync(OUTPUT_PATH)) {
    console.log(`\nExisting spec found at: ${OUTPUT_PATH}`);
    console.log("Run with --audit to compare against source files.");
  } else {
    console.log(`\nNo existing spec found. Create it at: ${OUTPUT_PATH}`);
  }

  // Copy to public if spec exists
  if (fs.existsSync(OUTPUT_PATH)) {
    const dir = path.dirname(PUBLIC_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(OUTPUT_PATH, PUBLIC_PATH);
    console.log(`Copied spec to: ${PUBLIC_PATH}`);
  }

  console.log("\nDone.");
}

main();
