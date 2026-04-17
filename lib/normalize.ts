import { NormalizedLocation } from "./types";

export function slugify(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeAddressParts(place: any): NormalizedLocation {
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
