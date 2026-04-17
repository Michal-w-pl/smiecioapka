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
          type: /\.pdf/i.test(item.href) ? ('pdf' as const) : ('official' as const),
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

import * as cheerio from "cheerio";
import { NormalizedLocation, Provider, SourceLink } from "../types";

async function extractComdLinks(url: string): Promise<SourceLink[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Smiecioapka/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    const links: SourceLink[] = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();

      if (!href) return;

      const absoluteUrl = href.startsWith("http")
        ? href
        : new URL(href, url).toString();

      if (
        absoluteUrl.includes("com-d.pl") ||
        /\.pdf/i.test(absoluteUrl)
      ) {
        links.push({
          label: text || "Załącznik harmonogramu",
          url: absoluteUrl,
          type: /\.pdf/i.test(absoluteUrl) ? "pdf" : "html",
        });
      }
    });

    const unique = new Map<string, SourceLink>();
    for (const item of links) {
      if (!unique.has(item.url)) {
        unique.set(item.url, item);
      }
    }

    return Array.from(unique.values()).slice(0, 12);
  } catch {
    return [];
  }
}

export const comdProvider: Provider = {
  id: "com-d",
  name: "COM-D",
  match(location: NormalizedLocation) {
    return location.keyMunicipality === "paszowice";
  },
  async getSchedule() {
    const url = "https://www.com-d.pl/komunalne/harm/paszowice-2026r-gmina";
    const extractedLinks = await extractComdLinks(url);

    return {
      status: "partial",
      provider: {
        id: "com-d",
        name: "COM-D",
      },
      message:
        "Rozpoznano gminę obsługiwaną przez COM-D. Źródło zostało pobrane po stronie backendu. Następny krok to parser dat i frakcji.",
      sourceLinks: extractedLinks.length
        ? extractedLinks
        : [
            {
              label: "COM-D – harmonogram gminy Paszowice",
              url,
              type: "html",
            },
          ],
    };
  },
};
