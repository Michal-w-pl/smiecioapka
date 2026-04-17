'use client';

import React, { useState } from "react";
import {
  Search,
  MapPin,
  CalendarDays,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  FileText,
  Building2,
} from "lucide-react";

const FRACTION_LABELS: Record<string, string> = {
  mixed: "Zmieszane",
  bio: "Bio",
  paper: "Papier",
  glass: "Szkło",
  plastic_metal: "Metale i tworzywa",
  bulky: "Gabaryty",
  ash: "Popiół",
  elektro: "Elektroodpady",
  textile: "Tekstylia",
};

const ADDRESS_FALLBACKS = [
  {
    needles: ["puławska 1", "pulawska 1", "warszawa"],
    result: {
      label: "ul. Puławska 1, Mokotów, Warszawa, mazowieckie, Polska",
      lat: "52.1818",
      lon: "21.0227",
      city: "Warszawa",
      suburb: "Mokotów",
      road: "Puławska",
      houseNumber: "1",
      postcode: "02-515",
      county: "Warszawa",
      state: "mazowieckie",
      municipality: "Warszawa",
      keyCity: "warszawa",
      keySuburb: "mokotow",
      keyMunicipality: "warszawa",
    },
  },
  {
    needles: ["paszowice"],
    result: {
      label: "Paszowice, jaworski, dolnośląskie, Polska",
      lat: "51.0100",
      lon: "16.1500",
      city: "Paszowice",
      suburb: "Paszowice",
      road: "",
      houseNumber: "",
      postcode: "59-411",
      county: "jaworski",
      state: "dolnośląskie",
      municipality: "Paszowice",
      keyCity: "paszowice",
      keySuburb: "paszowice",
      keyMunicipality: "paszowice",
    },
  },
  {
    needles: ["kobyłka", "kobylka"],
    result: {
      label: "Kobyłka, wołomiński, mazowieckie, Polska",
      lat: "52.3390",
      lon: "21.1950",
      city: "Kobyłka",
      suburb: "Kobyłka",
      road: "",
      houseNumber: "",
      postcode: "05-230",
      county: "wołomiński",
      state: "mazowieckie",
      municipality: "Kobyłka",
      keyCity: "kobylka",
      keySuburb: "kobylka",
      keyMunicipality: "kobylka",
    },
  },
];

type LocationResult = {
  label: string;
  lat: string;
  lon: string;
  city: string;
  suburb: string;
  road: string;
  houseNumber: string;
  postcode: string;
  county: string;
  state: string;
  municipality: string;
  keyCity: string;
  keySuburb: string;
  keyMunicipality: string;
};

type ScheduleItem = {
  date: string;
  fraction: string;
  note?: string;
};

type SourceLink = {
  label: string;
  url: string;
  type: string;
};

type ProviderResult =
  | null
  | { status: "loading" }
  | {
      status: "ok" | "partial" | "error";
      message?: string;
      schedule?: ScheduleItem[];
      sourceLinks?: SourceLink[];
    };

function slugify(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function groupByDate(items: ScheduleItem[]) {
  return items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

async function geocodeAddress(query: string): Promise<LocationResult[]> {
  const cleaned = (query || "").trim();
  if (!cleaned) return [];

  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: cleaned }),
    });

    if (!response.ok) {
      throw new Error("Geokodowanie nie powiodło się.");
    }

    const data = await response.json();
    if (Array.isArray(data?.results) && data.results.length) {
      return data.results;
    }
  } catch {
    // fallback lokalny niżej
  }

  const normalizedInput = slugify(cleaned);

  const localMatches = ADDRESS_FALLBACKS.filter((item) =>
    item.needles.some((needle) => normalizedInput.includes(slugify(needle)))
  ).map((item) => item.result);

  if (localMatches.length) return localMatches;

  const tail = cleaned
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(-1)[0];

  if (tail) {
    const cityMatches = ADDRESS_FALLBACKS.filter((item) =>
      [item.result.city, item.result.municipality, item.result.suburb]
        .filter(Boolean)
        .some((v) => slugify(v) === slugify(tail))
    ).map((item) => item.result);

    if (cityMatches.length) return cityMatches;
  }

  return [];
}

async function fetchSchedule(location: LocationResult) {
  const response = await fetch("/api/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location }),
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać harmonogramu.");
  }

  return response.json();
}

function Pill({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const classes =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-700"
      : variant === "secondary"
        ? "bg-slate-100 text-slate-700"
        : variant === "destructive"
          ? "bg-red-100 text-red-700"
          : "bg-slate-900 text-white";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${classes}`}>
      {children}
    </span>
  );
}

function ResultBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <Pill>
        <CheckCircle2 className="h-3.5 w-3.5" /> Harmonogram znaleziony
      </Pill>
    );
  }

  if (status === "error") {
    return (
      <Pill variant="destructive">
        <AlertCircle className="h-3.5 w-3.5" /> Błąd
      </Pill>
    );
  }

  return (
    <Pill variant="secondary">
      <AlertCircle className="h-3.5 w-3.5" /> Wymaga integracji źródła
    </Pill>
  );
}

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  const grouped = groupByDate(items);
  const dates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {dates.map((date) => (
        <div key={date} className="rounded-2xl border bg-white shadow-sm">
          <div className="px-6 pb-3 pt-6">
            <div className="text-base font-semibold">{formatDate(date)}</div>
          </div>
          <div className="space-y-2 px-6 pb-6 pt-0">
            {grouped[date].map((item, idx) => (
              <div key={`${date}-${idx}`} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border p-2">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {FRACTION_LABELS[item.fraction] || item.fraction}
                    </div>
                    {item.note ? <div className="text-sm text-slate-500">{item.note}</div> : null}
                  </div>
                </div>
                <Pill variant="outline">Odbiór</Pill>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WasteSchedulePolandApp() {
  const [query, setQuery] = useState("ul. Puławska 1, Warszawa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [providerResult, setProviderResult] = useState<ProviderResult>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "sources">("schedule");

  async function handleSearch() {
    setLoading(true);
    setError("");
    setProviderResult(null);
    setSelectedLocation(null);

    try {
      const results = await geocodeAddress(query);

      const normalizedInput = slugify(query || "");
      const directFallbacks = ADDRESS_FALLBACKS.filter((item) =>
        item.needles.some((needle) => normalizedInput.includes(slugify(needle)))
      ).map((item) => item.result);

      const finalResults = results.length ? results : directFallbacks;
      setMatches(finalResults);

      if (!finalResults.length) {
        setError(
          "Nie udało się potwierdzić adresu w geokoderze. Spróbuj dodać miasto lub wpisz adres w formacie: ulica numer, kod pocztowy, miejscowość."
        );
      }
    } catch (e: any) {
      const normalizedInput = slugify(query || "");
      const directFallbacks = ADDRESS_FALLBACKS.filter((item) =>
        item.needles.some((needle) => normalizedInput.includes(slugify(needle)))
      ).map((item) => item.result);

      if (directFallbacks.length) {
        setMatches(directFallbacks);
        setError("");
      } else {
        setError(e?.message || "Wystąpił błąd.");
        setMatches([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(location: LocationResult) {
    setSelectedLocation(location);
    setProviderResult({ status: "loading" });
    setActiveTab("schedule");

    try {
      const result = await fetchSchedule(location);
      setProviderResult(result);
    } catch (e: any) {
      setProviderResult({
        status: "error",
        message: e?.message || "Nie udało się pobrać harmonogramu.",
        sourceLinks: [],
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border p-3">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Harmonogram wywozu śmieci – Polska</h1>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Wpisz adres, a aplikacja sprawdzi harmonogram przez backend i publicznie dostępne źródła.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 pb-6">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="np. ul. Mickiewicza 12, Kobyłka"
                    className="h-12 w-full rounded-2xl border bg-white pl-10 pr-4 outline-none ring-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-white"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Szukaj
                </button>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-medium">Jak to działa</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      Aplikacja wysyła adres do backendu, backend geokoduje lokalizację, dobiera źródło publiczne i
                      zwraca harmonogram albo oficjalne linki źródłowe. Dla części gmin nadal mogą być potrzebne
                      dodatkowe parsery HTML lub PDF.
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-medium">Błąd</div>
                      <div className="mt-1 text-sm">{error}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Stan projektu</h2>
              <p className="text-sm text-slate-500">Co już jest gotowe, a co trzeba dołożyć w wersji produkcyjnej.</p>
            </div>

            <div className="space-y-3 px-6 pb-6 text-sm leading-6">
              <div className="rounded-2xl border p-4">
                <div className="font-medium">Gotowe teraz</div>
                <div className="mt-1 text-slate-500">
                  Wyszukiwanie adresu przez backend, normalizacja danych, pobranie harmonogramu lub oficjalnych źródeł i
                  prezentacja wyniku.
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="font-medium">Do wdrożenia produkcyjnego</div>
                <div className="mt-1 text-slate-500">
                  Backend proxy, parsery HTML/PDF, cache wyników, baza providerów oraz monitoring zmian na stronach
                  gmin.
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="font-medium">Realne ograniczenie</div>
                <div className="mt-1 text-slate-500">
                  Nie każda publiczna strona pozwala wyliczyć harmonogram po samym adresie. Czasem potrzebny jest rejon,
                  sektor albo numer umowy.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">1. Dopasowane adresy</h2>
              <p className="text-sm text-slate-500">Wybierz najlepiej dopasowany adres.</p>
            </div>

            <div className="space-y-3 px-6 pb-6">
              {!matches.length ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-slate-500">
                  Po wyszukaniu adresu zobaczysz tutaj dopasowania z geokodera.
                </div>
              ) : (
                matches.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="rounded-2xl border p-4"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{item.label}</div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {item.municipality ? <Pill variant="outline">gmina: {item.municipality}</Pill> : null}
                        {item.city ? <Pill variant="outline">miejscowość: {item.city}</Pill> : null}
                        {item.suburb ? <Pill variant="outline">dzielnica/rejon: {item.suburb}</Pill> : null}
                        {item.county ? <Pill variant="outline">powiat: {item.county}</Pill> : null}
                      </div>

                      <div className="border-t" />

                      <div className="pt-2">
                        <button
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-white"
                          onClick={() => handleResolve(item)}
                        >
                          Sprawdź harmonogram
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold">2. Harmonogram i źródła</h2>
              <p className="text-sm text-slate-500">
                {selectedLocation ? selectedLocation.label : "Po wyborze adresu pokażę harmonogram albo właściwe źródła publiczne."}
              </p>
            </div>

            <div className="px-6 pb-6">
              {!providerResult ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-slate-500">
                  Brak wybranego adresu.
                </div>
              ) : providerResult.status === "loading" ? (
                <div className="flex items-center gap-3 rounded-2xl border p-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pobieranie danych…
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
                    <button
                      className={`rounded-2xl px-3 py-2 text-sm ${activeTab === "schedule" ? "bg-white shadow-sm" : ""}`}
                      onClick={() => setActiveTab("schedule")}
                    >
                      Harmonogram
                    </button>
                    <button
                      className={`rounded-2xl px-3 py-2 text-sm ${activeTab === "sources" ? "bg-white shadow-sm" : ""}`}
                      onClick={() => setActiveTab("sources")}
                    >
                      Źródła
                    </button>
                  </div>

                  {activeTab === "schedule" ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <ResultBadge status={providerResult.status} />
                      </div>

                      {providerResult.message ? (
                        <div className="rounded-2xl border bg-white p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            <div>
                              <div className="font-medium">Informacja</div>
                              <div className="mt-1 text-sm text-slate-500">{providerResult.message}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {providerResult.schedule?.length ? (
                        <ScheduleList items={providerResult.schedule} />
                      ) : (
                        <div className="rounded-2xl border border-dashed p-8 text-sm text-slate-500">
                          Backend nie zwrócił jeszcze bezpośredniego harmonogramu dla tego adresu.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(providerResult.sourceLinks || []).length ? (
                        (providerResult.sourceLinks || []).map((link, idx) => (
                          <a
                            key={`${link.url}-${idx}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start justify-between gap-3 rounded-2xl border p-4 transition hover:bg-slate-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl border p-2">
                                {link.type === "pdf-page" || link.type === "pdf" ? (
                                  <FileText className="h-4 w-4" />
                                ) : link.type === "form" ? (
                                  <Building2 className="h-4 w-4" />
                                ) : (
                                  <ExternalLink className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{link.label}</div>
                                <div className="break-all text-sm text-slate-500">{link.url}</div>
                              </div>
                            </div>
                            <ExternalLink className="mt-1 h-4 w-4 shrink-0" />
                          </a>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed p-8 text-sm text-slate-500">
                          Brak linków źródłowych.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border bg-white shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Jak rozszerzyć do pełnej wersji</h2>
            <p className="text-sm text-slate-500">
              Plan techniczny dla ogólnopolskiej obsługi publicznie dostępnych harmonogramów.
            </p>
          </div>

          <div className="grid gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "1. Registry providerów",
                text: "Tabela: gmina / operator / typ źródła / URL / parser / sposób mapowania ulic do rejonów.",
              },
              {
                title: "2. Backend proxy",
                text: "Endpointy pobierające HTML/PDF po stronie serwera, żeby ominąć CORS i ustabilizować parsowanie.",
              },
              {
                title: "3. Parsery źródeł",
                text: "Parser HTML, parser PDF tabelarycznych, opcjonalnie OCR dla skanów oraz walidacja dat i frakcji.",
              },
              {
                title: "4. Monitoring zmian",
                text: "Testy regresyjne i alerty, gdy gmina zmieni layout strony albo podmieni plik harmonogramu.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border p-4">
                <div className="font-medium">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
