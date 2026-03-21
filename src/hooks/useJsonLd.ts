import { useEffect } from 'react';

/**
 * Injects a JSON-LD <script> tag into <head> with the given ID.
 * Removes it on unmount or when data is null.
 */
export function useJsonLd(id: string, data: object | null): void {
  useEffect(() => {
    if (!data) return;

    // Remove any existing script with same ID
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [id, JSON.stringify(data)]);
}
