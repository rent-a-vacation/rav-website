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
      include: ["src/lib/**", "src/hooks/**", "src/contexts/**"],
      exclude: ["src/hooks/use-mobile.tsx", "src/hooks/use-toast.ts"],
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
