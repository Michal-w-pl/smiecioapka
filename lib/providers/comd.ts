import { NormalizedLocation, Provider } from "../types";

export const comdProvider: Provider = {
  id: "com-d",
  name: "COM-D",
  match(location: NormalizedLocation) {
    return location.keyMunicipality === "paszowice";
  },
  async getSchedule(_location: NormalizedLocation) {
    const url = "https://www.com-d.pl/komunalne/harm/paszowice-2026r-gmina";

    return {
      status: "partial",
      provider: {
        id: "com-d",
        name: "COM-D",
      },
      message:
        "Rozpoznano gminę obsługiwaną przez COM-D. Na tym etapie zwracam oficjalne źródło. Następny krok to parser dat i frakcji.",
      sourceLinks: [
        {
          label: "COM-D – harmonogram gminy Paszowice",
          url,
          type: "html",
        },
      ],
    };
  },
};
