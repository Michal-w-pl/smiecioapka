export type GeocodeResult = {
  label: string;
  lat: string;
  lon: string;
  city: string;
  suburb: string;
  road: string;
  houseNumber: string;
  postcode: string;
  county: string;
  state: string;
  municipality: string;
  keyCity: string;
  keySuburb: string;
  keyMunicipality: string;
};

export type SourceLink = {
  label: string;
  url: string;
  type: 'official' | 'aggregator' | 'search' | 'pdf' | 'form';
};

export type ScheduleEntry = {
  date: string;
  fraction: string;
  note?: string;
};

export type ProviderResponse = {
  providerId: string;
  providerName: string;
  status: 'ok' | 'partial' | 'error';
  message?: string;
  schedule?: ScheduleEntry[];
  sourceLinks: SourceLink[];
};
