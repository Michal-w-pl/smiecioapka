import { load } from 'cheerio';
import { WasteProvider } from './base';
import { GeocodeResult, ProviderResponse } from '@/lib/types';
import { DEMO_SCHEDULES } from './demoData';

const MUNICIPALITY_PAGES: Record<string, string> = {
  paszowice: 'https://www.com-d.pl/komunalne/harm/paszowice-2026r-gmina',
  boleslawiec: 'https://www.com-d.pl/komunalne/harm/boleslawiec-2026r-gmina',
};

export const comdProvider: WasteProvider = {
  id: 'com-d',
  name: 'COM-D',
  matches(location: GeocodeResult) {
    return Boolean(MUNICIPALITY_PAGES[location.keyMunicipality]);
  },
  async fetchSchedule(location: GeocodeResult): Promise<ProviderResponse> {
    const url = MUNICIPALITY_PAGES[location.keyMunicipality];
    const key = `${location.keyMunicipality}|${location.keySuburb || location.keyCity}`;
    const demo = DEMO_SCHEDULES[key];

    try {
      const html = await fetch(url, { cache: 'no-store' }).then((r) => r.text());
      const $ = load(html);
      const links = $('a')
        .map((_, el) => ({
          href: $(el).attr('href') || '',
          text: $(el).text().trim(),
        }))
        .get()
        .filter((item) => /harmonogram|pdf|odpado/i.test(item.text) || /\.pdf/i.test(item.href))
        .slice(0, 6)
        .map((item) => ({
          label: item.text || 'Załącznik harmonogramu',
          url: item.href.startsWith('http') ? item.href : new URL(item.href, url).toString(),
          type: (/\.pdf/i.test(item.href) ? 'pdf' : 'official') as const,
        }));

      return {
        providerId: this.id,
        providerName: this.name,
        status: demo ? 'ok' : 'partial',
        message: demo
          ? 'Znaleziono stronę operatora COM-D. Demo zwraca harmonogram i prawdziwe publiczne linki do strony źródłowej.'
          : 'Znaleziono stronę operatora COM-D. Parser PDF/HTML dla dokładnej ulicy nie jest jeszcze gotowy, ale backend pobrał realne linki źródłowe.',
        schedule: demo,
        sourceLinks: links.length
          ? links
          : [{ label: 'COM-D – harmonogram', url, type: 'official' }],
      };
    } catch (error) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: demo ? 'ok' : 'error',
        message: demo ? 'Nie udało się pobrać strony operatora, ale zachowano dane demonstracyjne.' : 'Nie udało się pobrać strony operatora COM-D.',
        schedule: demo,
        sourceLinks: [{ label: 'COM-D – harmonogram', url, type: 'official' }],
      };
    }
  },
};
