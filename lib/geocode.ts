import { ADDRESS_FALLBACKS } from './fallbacks';
import { normalizeAddressParts, slugify } from './normalize';
import { GeocodeResult } from './types';

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const cleaned = (query || '').trim();
  if (!cleaned) return [];

  const variants = [
    cleaned,
    cleaned.includes('Polska') ? cleaned : `${cleaned}, Polska`,
  ];

  for (const variant of variants) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=pl&limit=5&accept-language=pl&q=${encodeURIComponent(variant)}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pl',
          'User-Agent': 'waste-backend-app/0.1 (contact: replace@example.com)',
          'Referer': 'http://localhost:3000',
        },
        cache: 'no-store',
      });
      if (!response.ok) continue;
      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(normalizeAddressParts) : [];
      if (normalized.length) return normalized;
    } catch {
      // try next variant
    }
  }

  const normalizedInput = slugify(cleaned);
  const localMatches = ADDRESS_FALLBACKS.filter((item) =>
    item.needles.some((needle) => normalizedInput.includes(slugify(needle)))
  ).map((item) => item.result);

  return localMatches;
}
