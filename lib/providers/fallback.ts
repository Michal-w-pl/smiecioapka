import { NormalizedLocation, Provider } from "../types";

export const fallbackProvider: Provider = {
  id: "fallback",
  name: "Fallback / źródła publiczne",
  match: () => true,
  async getSchedule(location: NormalizedLocation) {
    const cityOrMunicipality = location.municipality || location.city || "tej gminy";

    return {
      status: "source_only",
      provider: {
        id: "fallback",
        name: "Fallback / źródła publiczne",
      },
      message:
        "Nie mam jeszcze gotowego parsera dla tego adresu. Pokazuję oficjalne lub najbardziej prawdopodobne publiczne źródła harmonogramu.",
      sourceLinks: [
        {
          label: `Wyszukaj harmonogram dla ${cityOrMunicipality}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`harmonogram odbioru odpadów ${cityOrMunicipality} ${location.road || ""}`)}`,
          type: "search",
        },
        {
          label: "Kiedy Śmieci",
          url: "https://kiedysmieci.info/",
          type: "aggregator",
        },
      ],
    };
  },
};
