import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

function getGitInfo() {
  try {
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const commitCount = execSync("git rev-list --count HEAD").toString().trim();
    return { commitHash, commitCount };
  } catch {
    return { commitHash: "unknown", commitCount: "0" };
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { commitHash, commitCount } = getGitInfo();
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
  );

  // Load env vars (including SENTRY_AUTH_TOKEN from .env.local) for plugin config
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: {
      sourcemap: "hidden",
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_NUMBER__: JSON.stringify(commitCount),
      __BUILD_HASH__: JSON.stringify(commitHash),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "unsplash-image-cache",
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: "Rent-A-Vacation",
          short_name: "RAV",
          description: "Name Your Price. Book Your Paradise. Rent vacation club and timeshare weeks directly from owners at 20-40% off resort rates.",
          theme_color: "#1C7268",
          background_color: "#F8F6F3",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          categories: ["travel", "lifestyle"],
          icons: [
            { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
      // Sentry source map upload — runs last, only in production builds with a token
      mode === "production" &&
        env.SENTRY_AUTH_TOKEN &&
        sentryVitePlugin({
          org: "rent-a-vacation-org",
          project: "rav-website",
          authToken: env.SENTRY_AUTH_TOKEN,
          release: {
            name: `rav-website@${pkg.version}`,
          },
          sourcemaps: {
            filesToDeleteAfterUpload: "**/*.map",
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
