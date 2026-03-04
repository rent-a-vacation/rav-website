import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSwaggerUI = (): any => (window as Record<string, unknown>).SwaggerUIBundle;

/**
 * Internal API documentation page using Swagger UI (loaded via CDN).
 * Access restricted to RAV admin/staff or when VITE_STAFF_ONLY_MODE is enabled.
 * Route: /api-docs
 */
export default function ApiDocs() {
  const { user, isRavTeam, isLoading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const isStaffOnlyMode = import.meta.env.VITE_STAFF_ONLY_MODE === "true";
  const isAuthorized = isStaffOnlyMode || (user && isRavTeam());

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthorized, navigate]);

  // Load Swagger UI from CDN
  useEffect(() => {
    if (!isAuthorized || !containerRef.current || initialized.current) return;

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
          url: "/api/openapi.yaml",
          dom_id: "#swagger-ui",
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
      // Cleanup on unmount
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, [isAuthorized]);

  if (isLoading) return null;
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            RAV API Documentation
          </h1>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
            Internal Only
          </span>
        </div>
        <div id="swagger-ui" ref={containerRef} />
      </div>
    </div>
  );
}
