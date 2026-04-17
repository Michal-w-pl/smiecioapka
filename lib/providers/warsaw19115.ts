import { WasteProvider } from './base';
import { GeocodeResult, ProviderResponse } from '@/lib/types';
import { DEMO_SCHEDULES } from './demoData';

export const warsaw19115Provider: WasteProvider = {
  id: 'warszawa-19115',
  name: 'Warszawa 19115',
  matches(location: GeocodeResult) {
    return location.keyMunicipality === 'warszawa';
  },
  async fetchSchedule(location: GeocodeResult): Promise<ProviderResponse> {
    const key = `warszawa|${location.keySuburb || location.keyCity}`;
    const demo = DEMO_SCHEDULES[key];
    return {
      providerId: this.id,
      providerName: this.name,
      status: demo ? 'ok' : 'partial',
      message: demo
        ? 'Backend rozpoznał adres warszawski i zwrócił harmonogram demonstracyjny. Produkcyjnie podłącz endpoint MCK 19115 albo browser automation dla dokładnego adresu.'
        : 'Źródło warszawskie zostało rozpoznane. Ten kod zwraca oficjalne linki i miejsce na parser konkretnego adresu.',
      schedule: demo,
      sourceLinks: [
        {
          label: 'Warszawa 19115 – harmonogramy wywozu odpadów',
          url: 'https://warszawa19115.pl/harmonogramy-wywozu-odpadow',
          type: 'official',
        },
        {
          label: 'MPO Warszawa – harmonogram odbioru odpadów',
          url: 'https://www.mpo.com.pl/uslugi/harmonogram-odbioru-odpadow',
          type: 'official',
        },
      ],
    };
  },
};
