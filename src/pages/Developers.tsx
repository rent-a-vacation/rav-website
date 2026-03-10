import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSwaggerUI = (): any => (window as Record<string, unknown>).SwaggerUIBundle;

/**
 * Public API documentation page using Swagger UI.
 * No auth required — accessible to all visitors.
 * Renders the public-api.yaml spec (partner-facing, read-only endpoints only).
 * Route: /developers
 */
export default function Developers() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      const SwaggerUIBundle = getSwaggerUI();
      if (containerRef.current && SwaggerUIBundle) {
        SwaggerUIBundle({
          url: "/api/public-api.yaml",
          dom_id: "#swagger-ui-public",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
        });
        initialized.current = true;
      }
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Developer API
            </h1>
            <p className="text-muted-foreground mt-2">
              REST API for accessing RAV marketplace data. Browse listings, search properties,
              and explore destinations programmatically.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                v1
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                Read-Only
              </span>
              <span className="text-sm text-muted-foreground">
                Base URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/functions/v1/api-gateway</code>
              </span>
            </div>
          </div>
          <div id="swagger-ui-public" ref={containerRef} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
