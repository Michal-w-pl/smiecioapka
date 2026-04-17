import { NormalizedLocation, Provider } from "../types";

export const kiedysmieciProvider: Provider = {
  id: "kiedysmieci",
  name: "Kiedy Śmieci",
  match(_location: NormalizedLocation) {
    return true;
  },
  async getSchedule(location: NormalizedLocation) {
    const cityOrMunicipality = location.municipality || location.city || "tej gminy";
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      `site:kiedysmieci.info ${cityOrMunicipality} harmonogram odpadów`
    )}`;

    return {
      status: "partial",
      provider: {
        id: "kiedysmieci",
        name: "Kiedy Śmieci",
      },
      message:
        "Warstwa ogólnopolska. Ten provider powinien docelowo mieć własny parser dla gmin dostępnych w serwisie Kiedy Śmieci.",
      sourceLinks: [
        {
          label: "Kiedy Śmieci",
          url: "https://kiedysmieci.info/",
          type: "aggregator",
        },
        {
          label: `Wyszukaj w Kiedy Śmieci dla ${cityOrMunicipality}`,
          url: searchUrl,
          type: "search",
        },
      ],
    };
  },
};
