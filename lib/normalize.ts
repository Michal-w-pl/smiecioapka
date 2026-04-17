import { GeocodeResult } from './types';

export function slugify(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeAddressParts(place: any): GeocodeResult {
  const a = place.address || {};
  const city = a.city || a.town || a.village || a.municipality || a.hamlet || '';
  const suburb = a.suburb || a.city_district || a.neighbourhood || a.quarter || '';
  const municipality = a.municipality || a.city || a.town || a.village || '';

  return {
    label: place.display_name || [a.road, a.house_number, city, a.state, 'Polska'].filter(Boolean).join(', '),
    lat: String(place.lat ?? ''),
    lon: String(place.lon ?? ''),
    city,
    suburb,
    road: a.road || '',
    houseNumber: a.house_number || '',
    postcode: a.postcode || '',
    county: a.county || '',
    state: a.state || '',
    municipality,
    keyCity: slugify(city || municipality),
    keySuburb: slugify(suburb),
    keyMunicipality: slugify(municipality || city),
  };
}
