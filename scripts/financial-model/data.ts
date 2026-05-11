/**
 * Re-export shim — actual data definitions live in src/lib/financial-model/data.ts
 * so the React UI on /executive-dashboard/financial-model and this Node-side
 * Excel generator share a single source of truth.
 *
 * Path note: tsx (used to run this script) supports the .ts extension and the
 * absolute relative path. Vite (used to bundle the web app) resolves the same
 * module via the @/lib/financial-model/data alias for src-side imports.
 */
export * from '../../src/lib/financial-model/data.ts';
