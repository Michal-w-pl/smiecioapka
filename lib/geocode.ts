// force redeploy
import { NormalizedLocation } from "./types";

function slugify(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    label: place.display_name || "",
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
      if (normalized.length) {
        return normalized;
      }
    } catch {
      // próbujemy kolejny wariant
    }
  }

  return [];
}
