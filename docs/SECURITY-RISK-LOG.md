---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-issue-530"
status: "active"
---

# Security Risk Log

Triage record for dependabot vulnerability alerts. Each cluster has a disposition: **PATCH** (bumped, tracked here once shipped), **ACCEPT** (no action, justified), or **DEFER** (planned patch in a later session).

Issue: [#530](https://github.com/rent-a-vacation/rav-website/issues/530).

## Triage methodology

- **Scope distinction:** `runtime` (bundled into the Vite production build → shipped to user browsers / served on `rent-a-vacation.com`) vs `development` (build tooling, test framework, CI utilities → never reaches end users).
- **Patch bar:** runtime Critical/High → patch ASAP; runtime Moderate → patch in next reasonable wave; runtime Low → accept unless a feature touches the affected code path. Dev-only of any severity → accept unless an exploitable path through CI exists.
- **Patchability check:** prefer a minor/patch `npm update` within existing semver constraints. Only escalate to `package.json` overrides or major bumps when the parent dep refuses to release the patched transitive within range.
- **Verification gate:** every patch wave runs type check, build, and P0 tests before commit. Cosmetic regressions surfaced by E2E or visual tests get reviewed but don't block security patches.

## Session 68 (2026-05-15) — initial triage + 2-Critical patch

Starting state: 63 open alerts (2 Critical / 24 High / 33 Moderate / 4 Low). 39 runtime / 24 development.

### Wave 1 PATCH — npm update (no override needed)

| Pkg | From | To | Alerts cleared | Scope | Notes |
|-----|------|-----|---------------|-------|-------|
| `protobufjs` | 7.5.4 | 7.5.8 | 4 High | runtime | Critical alert #56 (`>= 8.0.0, < 8.0.1`) is a false positive — we are on the 7.x line, never on 8.0.0. Bump fixes the 4 Highs that affect 7.x. Pulled in via `posthog-js → @opentelemetry`. |
| `basic-ftp` | 5.1.0 | 5.3.1 | 1 Critical + 1 High | development | Dev-only chain via `@lhci/cli → proxy-agent → pac-proxy-agent → get-uri`. Lighthouse CI tooling; never touches a real FTP server in our usage. Patch is trivial; bumped anyway. |

Result: 63 → 40 alerts. **0 Critical remaining.**

### Remaining 40 alerts — disposition

#### High severity — RUNTIME (5 alerts — DEFER, target next security session)

These ship in the production bundle. Exploitability varies but each is worth a real patch attempt.

| Pkg | Alerts | Fix | Why deferred this session |
|-----|--------|-----|---------------------------|
| `@remix-run/router` (via `react-router-dom`) | 1 | 7.12.0 | XSS via open redirects. Every page exposure. **Highest-priority remaining runtime patch.** Bump may require `react-router-dom` major-version coordination. |
| `picomatch` | 1 | 4.0.4 | ReDoS via extglob quantifiers. Likely transitive through build tooling that also runs at runtime via mermaid render path. Worth confirming actual exposure before bumping. |
| `minimatch` | 2 runtime | 10.2.3 / 10.2.1 | ReDoS. Two distinct advisories. Confirm via `npm ls minimatch` which parent locks the runtime copies (vs dev). |
| `glob` | 1 | 11.1.0 | Command injection via `-c/--cmd` flag — only matters if we shell out to `glob` CLI binary. We do not. Effectively no exploitability, but still worth a bump for hygiene. |
| `lodash` + `lodash-es` | 2 | 4.18.0 | Code injection via `_.template` with attacker-controlled key names. Verify we don't use `_.template()` anywhere first. If not, mark as **ACCEPTED** instead of patching. |

#### High severity — DEVELOPMENT (12 alerts — ACCEPT with rationale)

These are pulled into `node_modules` only for build / test / CI tooling. They cannot reach end users because they are not bundled by Vite into `dist/`.

| Pkg | Alerts | Why accepted |
|-----|--------|--------------|
| `minimatch` (dev) | 3 | ReDoS in dev-only glob matching. Pattern inputs are controlled by build config, not attacker-supplied. |
| `rollup` | 2 | Path traversal during bundling. Inputs are project source, not attacker-supplied. |
| `systeminformation` | 1 | Linux command injection via NetworkManager profile name. Only triggers if `networkInterfaces()` is called on a Linux dev/CI host whose NetworkManager connection profile contains shell metacharacters — none of our CI runners (GitHub-hosted Ubuntu) do. |
| `serialize-javascript` | 1 | RCE via `RegExp.flags`. Used by webpack-style serialization in test tooling, not exposed at runtime. |
| `fast-uri` (dev) | 2 | URI parsing edge cases in build tooling. |
| `basic-ftp` | 1 High remaining? | The bumped 5.3.1 fixes both Critical + High — alert should auto-close on dependabot re-scan. |
| `flatted` | 1 | Prototype pollution via `parse()`. Used in test fixtures, not runtime. |
| `@babel/plugin-transform-modules-systemjs` | 1 | Codegen risk during build. Inputs are project source. |

#### Moderate severity (33 alerts — DEFER, batch with next runtime wave)

Dominated by `dompurify` (8) via mermaid, `protobufjs/utf8`, `brace-expansion`, miscellaneous. Per the issue's "no new Critical/High introduced" CI gate idea, Moderates are below the threshold for blocking PR merges — but worth a sweep when the High batch ships.

#### Low severity (4 alerts — ACCEPT)

Below the patch bar for a small pre-launch team. Revisit if any of them escalates to higher severity.

## Cadence

- **Per-session**: `gh api 'repos/.../dependabot/alerts?state=open' --jq '.[] | .security_advisory.severity'` at session start. Any new Critical → patch in-session before any other work.
- **Weekly** (manual, until a `/schedule` routine is set up): run `npm audit --omit=dev` and compare against this log; update any newly-cleared entries; open issues for any new High that lands.
- **Per-PR (stretch)**: CI gate that fails the PR if it introduces a *new* Critical or High alert (allows pre-existing inventory through). Tracked as a sub-task of #530.

## Side-finding — separate from dependabot

GitHub Push Protection also blocked an attempted commit in Session 67 because of a Stripe service-role key in `.env.local`. Confirm: `.env.local` is gitignored and never committed. Re-verify on each session.

## Change log

| Date | Session | Issue | Author | What changed |
|------|---------|-------|--------|--------------|
| 2026-05-15 | 68 | #530 | Sujit + Claude | Initial triage. Wave 1 patch: protobufjs 7.5.4→7.5.8 + basic-ftp 5.1.0→5.3.1. 5 Highs cleared, 0 Criticals remaining. SECURITY-RISK-LOG.md created. |
