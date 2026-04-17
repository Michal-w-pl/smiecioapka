import { WasteProvider } from './base';
import { GeocodeResult, ProviderResponse } from '@/lib/types';

export const kiedysmieciProvider: WasteProvider = {
  id: 'kiedysmieci',
  name: 'Kiedy Śmieci',
  matches() {
    return true;
  },
  async fetchSchedule(location: GeocodeResult): Promise<ProviderResponse> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:kiedysmieci.info ${location.municipality || location.city} harmonogram odpadów`)}`;
    return {
      providerId: this.id,
      providerName: this.name,
      status: 'partial',
      message: 'Warstwa ogólnopolska. W praktyce ten provider powinien mieć własny parser dla gmin dostępnych w serwisie Kiedy Śmieci.',
      sourceLinks: [
        { label: 'Kiedy Śmieci', url: 'https://kiedysmieci.info/', type: 'aggregator' },
        { label: 'Szukaj strony gminy lub Kiedy Śmieci', url: searchUrl, type: 'search' },
      ],
    };
  },
};
