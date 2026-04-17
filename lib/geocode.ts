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

import { NormalizedLocation } from "./types";
import { slugify } from "./utils";

function normalizeAddressParts(place: any): NormalizedLocation {
  const a = place.address || {};
  const city = a.city || a.town || a.village || a.municipality || a.hamlet || "";
  const suburb = a.suburb || a.city_district || a.neighbourhood || a.quarter || "";
  const road = a.road || "";
  const houseNumber = a.house_number || "";
  const postcode = a.postcode || "";
  const county = a.county || "";
  const state = a.state || "";
  const municipality = a.municipality || a.city || a.town || a.village || "";

  return {
    label: place.display_name,
    lat: String(place.lat || ""),
    lon: String(place.lon || ""),
    city,
    suburb,
    road,
    houseNumber,
    postcode,
    county,
    state,
    municipality,
    keyCity: slugify(city || municipality),
    keySuburb: slugify(suburb),
    keyMunicipality: slugify(municipality || city),
  };
}

export async function geocodeAddress(query: string): Promise<NormalizedLocation[]> {
  const cleaned = (query || "").trim();
  if (!cleaned) return [];

  const variants = [
    cleaned,
    cleaned.includes("Polska") ? cleaned : `${cleaned}, Polska`,
  ];

  for (const variant of variants) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=pl&limit=5&accept-language=pl&q=${encodeURIComponent(variant)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "pl",
          "User-Agent": "Smiecioapka/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) continue;

      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(normalizeAddressParts) : [];
      if (normalized.length) return normalized;
    } catch {
      // spróbuj kolejny wariant
    }
  }

  return [];
}
