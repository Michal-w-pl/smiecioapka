import { load } from "cheerio";
import { NormalizedLocation, Provider, SourceLink } from "../types";

async function extractComdLinks(url: string): Promise<SourceLink[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Smiecioapka/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = load(html);

    const links: SourceLink[] = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();

      if (!href) {
        return;
      }

      const absoluteUrl = href.startsWith("http")
        ? href
        : new URL(href, url).toString();

      if (absoluteUrl.includes("com-d.pl") || /\.pdf/i.test(absoluteUrl)) {
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
  async getSchedule(_location: NormalizedLocation) {
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
