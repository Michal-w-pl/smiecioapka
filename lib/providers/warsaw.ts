import { NormalizedLocation, Provider } from "../types";

export const warsawProvider: Provider = {
  id: "warszawa",
  name: "Warszawa / oficjalne źródła",
  match(location: NormalizedLocation) {
    return location.keyMunicipality === "warszawa";
  },
  async getSchedule(location: NormalizedLocation) {
    return {
      status: "source_only",
      provider: {
        id: "warszawa",
        name: "Warszawa / oficjalne źródła",
      },
      message:
        "Dla Warszawy zwracam oficjalne źródła. Następny krok to bezpośredni parser formularza lub integracja requestów źródła.",
      sourceLinks: [
        {
          label: "Warszawa 19115 – harmonogram wywozu odpadów",
          url: "https://warszawa19115.pl/harmonogramy-wywozu-odpadow",
          type: "official",
        },
        {
          label: "MPO Warszawa – harmonogram odbioru odpadów",
          url: "https://www.mpo.com.pl/uslugi/harmonogram-odbioru-odpadow",
          type: "form",
        },
        {
          label: `Wyszukaj oficjalny harmonogram dla ${location.road || "adresu w Warszawie"}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`harmonogram odbioru odpadów Warszawa ${location.road || ""} ${location.houseNumber || ""}`)}`,
          type: "search",
        },
      ],
    };
  },
};
