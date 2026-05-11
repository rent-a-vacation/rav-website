import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify("0.0.0-test"),
    __BUILD_NUMBER__: JSON.stringify("0"),
    __BUILD_HASH__: JSON.stringify("test"),
    __BUILD_TIME__: JSON.stringify("2026-01-01T00:00:00.000Z"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/**/*.{test,spec}.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**",
        "src/hooks/**",
        "src/contexts/**",
        // #445 — edge function logic. Excludes the thin Deno.serve wrappers
        // (index.ts / *.ts at top of each fn dir) which import URL deps that
        // Vitest can't resolve. The handler.ts / *-resolver.ts / helper files
        // are the testable units.
        "supabase/functions/**/handler.ts",
        "supabase/functions/**/conversation-logger.ts",
        "supabase/functions/**/intent-classifier.ts",
        "supabase/functions/**/support-tools.ts",
        "supabase/functions/**/context-resolver.ts",
      ],
      exclude: [
        "src/hooks/use-mobile.tsx",
        "src/hooks/use-toast.ts",
        // Test fixtures + mocks — never measure
        "supabase/functions/_shared/__tests__/**",
      ],
      // Thresholds raised to 70% on 2026-05-11 (actual coverage: ~75% stmts, ~77% branches, ~83% fns).
      // Gap between actual and threshold is intentional — buffer for new untested code during active dev.
      // REVIEW TRIGGER: raise to 80% when E2E automation covers 15+ of the 30 manual scenarios,
      // or before any acquisition due diligence process begins — whichever comes first.
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    reporters: ["default", "junit"],
    outputFile: { junit: "./test-results/junit.xml" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
