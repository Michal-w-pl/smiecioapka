export type NormalizedLocation = {
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

export type GeocodeResult = NormalizedLocation;

export type ScheduleItem = {
  date: string;
  fraction: string;
  note?: string;
};

export type SourceLink = {
  label: string;
  url: string;
  type: "official" | "pdf" | "pdf-page" | "form" | "aggregator" | "search" | "html";
};

export type ScheduleResponse = {
  status: "ok" | "partial" | "source_only" | "error";
  provider?: {
    id: string;
    name: string;
  };
  message?: string;
  schedule?: ScheduleItem[];
  sourceLinks?: SourceLink[];
};

export type ProviderResponse = ScheduleResponse;

export type Provider = {
  id: string;
  name: string;
  match: (location: NormalizedLocation) => boolean;
  getSchedule: (location: NormalizedLocation) => Promise<ScheduleResponse>;
};
