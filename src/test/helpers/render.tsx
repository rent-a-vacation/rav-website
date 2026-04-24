import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersOptions {
  /** Initial route entries for MemoryRouter */
  initialEntries?: string[];
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(options: ProvidersOptions = {}) {
  const { initialEntries = ["/"] } = options;
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <TooltipProvider>{children}</TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

/**
 * Renders a component wrapped in QueryClientProvider + MemoryRouter.
 * Each call creates a fresh QueryClient (retry: false).
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & ProvidersOptions
) {
  const { initialEntries, ...renderOpts } = options ?? {};
  return render(ui, {
    wrapper: createWrapper({ initialEntries }),
    ...renderOpts,
  });
}

/**
 * Creates a wrapper for renderHook with providers.
 */
export function createHookWrapper(options: ProvidersOptions = {}) {
  return createWrapper(options);
}

// Re-export common testing-library utilities
 
export { screen, waitFor, within, act, fireEvent } from "@testing-library/react";
export { renderWithProviders as render };
