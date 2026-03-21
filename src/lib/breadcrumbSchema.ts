const BASE_URL = 'https://rent-a-vacation.com';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Builds a BreadcrumbList JSON-LD object from an array of breadcrumb items.
 * Each item's path is prepended with the base URL.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}
