import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
      thresholds: {
        statements: 25,
        branches: 25,
        functions: 30,
        lines: 25,
      },
    },
    reporters: ["default", "junit"],
    outputFile: { junit: "./test-results/junit.xml" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
