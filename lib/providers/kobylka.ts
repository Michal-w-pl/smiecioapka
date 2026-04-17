import { WasteProvider } from './base';
import { GeocodeResult, ProviderResponse } from '@/lib/types';
import { DEMO_SCHEDULES } from './demoData';

export const kobylkaProvider: WasteProvider = {
  id: 'kobylka',
  name: 'Kobyłka – strona gminy',
  matches(location: GeocodeResult) {
    return location.keyMunicipality === 'kobylka';
  },
  async fetchSchedule(location: GeocodeResult): Promise<ProviderResponse> {
    const url = 'https://www.kobylka.pl/strona-3975-harmonogram_odbioru_odpadow_styczen.html';
    const key = `${location.keyMunicipality}|${location.keyCity}`;
    return {
      providerId: this.id,
      providerName: this.name,
      status: 'ok',
      message: 'Rozpoznano gminę publikującą harmonogram na stronie z załącznikami PDF. Wersja produkcyjna powinna dodać parser PDF i mapowanie ulic do rejonu.',
      schedule: DEMO_SCHEDULES[key],
      sourceLinks: [{ label: 'Kobyłka – harmonogram odbioru odpadów', url, type: 'official' }],
    };
  },
};
