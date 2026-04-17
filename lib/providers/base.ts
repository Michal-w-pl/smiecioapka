import { GeocodeResult, ProviderResponse } from '@/lib/types';

export interface WasteProvider {
  id: string;
  name: string;
  matches(location: GeocodeResult): boolean;
  fetchSchedule(location: GeocodeResult): Promise<ProviderResponse>;
}
