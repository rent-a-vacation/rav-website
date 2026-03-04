export interface DestinationCity {
  slug: string;
  name: string;
  description: string;
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  description: string;
  cities: DestinationCity[];
  featured: boolean;
}

export const DESTINATIONS: Destination[] = [
  {
    slug: 'hawaii',
    name: 'Hawaii',
    region: 'Pacific',
    description: 'Experience world-class beaches, volcanic landscapes, and aloha spirit at luxury timeshare resorts across the Hawaiian islands.',
    cities: [
      { slug: 'maui', name: 'Maui', description: 'The Valley Isle — stunning beaches, whale watching, and the Road to Hana.' },
      { slug: 'oahu', name: 'Oahu', description: 'Home to Waikiki Beach, Diamond Head, and Honolulu\'s vibrant culture.' },
      { slug: 'big-island', name: 'Big Island', description: 'Active volcanoes, black sand beaches, and world-famous Kona coffee.' },
      { slug: 'kauai', name: 'Kauai', description: 'The Garden Isle — Na Pali Coast, Waimea Canyon, and lush tropical beauty.' },
    ],
    featured: true,
  },
  {
    slug: 'florida',
    name: 'Florida',
    region: 'Southeast',
    description: 'From Orlando theme parks to Miami\'s art deco coast, Florida offers year-round sunshine and endless vacation possibilities.',
    cities: [
      { slug: 'orlando', name: 'Orlando', description: 'Theme park capital — Disney, Universal, and dozens of resort communities.' },
      { slug: 'miami', name: 'Miami', description: 'Art Deco beaches, South Beach nightlife, and vibrant Latin culture.' },
      { slug: 'tampa', name: 'Tampa', description: 'Gulf Coast charm with Busch Gardens, Clearwater Beach, and waterfront dining.' },
      { slug: 'jacksonville', name: 'Jacksonville', description: 'Atlantic beaches, historic districts, and a thriving food scene.' },
    ],
    featured: true,
  },
  {
    slug: 'california',
    name: 'California',
    region: 'West',
    description: 'Sun-drenched coastlines, wine country, mountain resorts, and iconic cities make California a year-round destination.',
    cities: [
      { slug: 'san-diego', name: 'San Diego', description: 'Perfect weather, beautiful beaches, and the famous San Diego Zoo.' },
      { slug: 'palm-springs', name: 'Palm Springs', description: 'Desert oasis with mid-century modern architecture and world-class golf.' },
      { slug: 'lake-tahoe', name: 'Lake Tahoe', description: 'Crystal-clear alpine lake with skiing, hiking, and breathtaking scenery.' },
      { slug: 'napa-valley', name: 'Napa Valley', description: 'World-renowned wine country with luxury resorts and gourmet dining.' },
    ],
    featured: false,
  },
  {
    slug: 'mexico',
    name: 'Mexico',
    region: 'International',
    description: 'Turquoise waters, ancient ruins, and vibrant culture — Mexico\'s resort destinations offer affordable luxury.',
    cities: [
      { slug: 'cancun', name: 'Cancun', description: 'Caribbean beaches, Mayan ruins, and a legendary hotel zone.' },
      { slug: 'cabo-san-lucas', name: 'Cabo San Lucas', description: 'Where the desert meets the sea — deep-sea fishing and luxury resorts.' },
      { slug: 'puerto-vallarta', name: 'Puerto Vallarta', description: 'Colonial charm, golden beaches, and the Sierra Madre mountains.' },
      { slug: 'riviera-maya', name: 'Riviera Maya', description: 'Pristine cenotes, eco-parks, and boutique beachfront resorts.' },
    ],
    featured: true,
  },
  {
    slug: 'caribbean',
    name: 'Caribbean',
    region: 'International',
    description: 'Island-hop through turquoise waters, white sand beaches, and rum-infused culture across the Caribbean.',
    cities: [
      { slug: 'aruba', name: 'Aruba', description: 'One Happy Island — constant trade winds, eagle beach, and desert landscapes.' },
      { slug: 'jamaica', name: 'Jamaica', description: 'Reggae rhythms, jerk cuisine, and the stunning Blue Mountains.' },
      { slug: 'bahamas', name: 'Bahamas', description: 'Crystal-clear waters, swimming pigs, and 700 islands to explore.' },
      { slug: 'st-maarten', name: 'St. Maarten', description: 'Two cultures on one island — French and Dutch Caribbean charm.' },
    ],
    featured: false,
  },
  {
    slug: 'colorado',
    name: 'Colorado',
    region: 'Mountain',
    description: 'World-class skiing, summer hiking, and mountain town charm in the heart of the Rocky Mountains.',
    cities: [
      { slug: 'vail', name: 'Vail', description: 'Legendary ski resort with European-style village and summer adventures.' },
      { slug: 'breckenridge', name: 'Breckenridge', description: 'Historic mining town turned ski paradise with vibrant Main Street.' },
      { slug: 'aspen', name: 'Aspen', description: 'Glamorous mountain retreat with four ski areas and cultural scene.' },
      { slug: 'steamboat-springs', name: 'Steamboat Springs', description: 'Champagne powder snow and natural hot springs.' },
    ],
    featured: false,
  },
  {
    slug: 'arizona',
    name: 'Arizona',
    region: 'Southwest',
    description: 'Desert beauty, world-class spas, championship golf, and the awe-inspiring Grand Canyon.',
    cities: [
      { slug: 'scottsdale', name: 'Scottsdale', description: 'Luxury spas, championship golf, and vibrant Old Town nightlife.' },
      { slug: 'sedona', name: 'Sedona', description: 'Red rock formations, spiritual vortexes, and stunning desert landscapes.' },
      { slug: 'phoenix', name: 'Phoenix', description: 'Valley of the Sun — spring training baseball and desert mountain hikes.' },
      { slug: 'tucson', name: 'Tucson', description: 'Saguaro National Park, historic missions, and authentic Southwestern cuisine.' },
    ],
    featured: false,
  },
  {
    slug: 'nevada',
    name: 'Nevada',
    region: 'West',
    description: 'Beyond the bright lights of Las Vegas, Nevada offers Lake Tahoe shores and vast desert adventures.',
    cities: [
      { slug: 'las-vegas', name: 'Las Vegas', description: 'Entertainment capital — world-class shows, dining, and resort experiences.' },
      { slug: 'reno', name: 'Reno', description: 'The Biggest Little City — gateway to Sierra Nevada adventures.' },
    ],
    featured: false,
  },
  {
    slug: 'south-carolina',
    name: 'South Carolina',
    region: 'Southeast',
    description: 'Southern hospitality meets coastal charm with historic cities and pristine beach resorts.',
    cities: [
      { slug: 'myrtle-beach', name: 'Myrtle Beach', description: 'Grand Strand beaches, golf, and family-friendly attractions.' },
      { slug: 'hilton-head', name: 'Hilton Head', description: 'Barrier island paradise with world-class golf and cycling paths.' },
      { slug: 'charleston', name: 'Charleston', description: 'Historic district, award-winning restaurants, and plantation country.' },
    ],
    featured: false,
  },
  {
    slug: 'utah',
    name: 'Utah',
    region: 'Mountain',
    description: 'The Mighty Five national parks, world-class ski resorts, and dramatic red rock landscapes.',
    cities: [
      { slug: 'park-city', name: 'Park City', description: 'Olympic ski resort town with Sundance Film Festival and mountain biking.' },
      { slug: 'st-george', name: 'St. George', description: 'Gateway to Zion National Park with year-round golf and hiking.' },
      { slug: 'moab', name: 'Moab', description: 'Adventure capital near Arches and Canyonlands national parks.' },
    ],
    featured: false,
  },
];

/**
 * Get a destination by its slug.
 */
export function getDestinationBySlug(slug: string): Destination | null {
  return DESTINATIONS.find((d) => d.slug === slug) ?? null;
}

/**
 * Get a city within a destination by its slug.
 */
export function getCityBySlug(destinationSlug: string, citySlug: string): DestinationCity | null {
  const dest = getDestinationBySlug(destinationSlug);
  if (!dest) return null;
  return dest.cities.find((c) => c.slug === citySlug) ?? null;
}

/**
 * Map a destination/city slug to the location filter value used on the Rentals page.
 * Returns the display name (e.g., "Hawaii", "Maui") for filtering.
 */
export function getLocationFilterValue(destinationSlug: string, citySlug?: string): string | null {
  const dest = getDestinationBySlug(destinationSlug);
  if (!dest) return null;
  if (citySlug) {
    const city = dest.cities.find((c) => c.slug === citySlug);
    return city?.name ?? null;
  }
  return dest.name;
}
