'use client'

import React, { useState } from "react";
import { motion } from "framer-motion";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const FRACTION_LABELS = {
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

function groupByDate(items: Array<{ date: string; fraction: string; note?: string }>) {
  return items.reduce<Record<string, Array<{ date: string; fraction: string; note?: string }>>>((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

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

function ResultBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <Badge className="gap-1 rounded-full px-3 py-1 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" /> Harmonogram znaleziony
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1 rounded-full px-3 py-1 text-xs">
        <AlertCircle className="h-3.5 w-3.5" /> Błąd
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1 text-xs">
      <AlertCircle className="h-3.5 w-3.5" /> Wymaga integracji źródła
    </Badge>
  );
}

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  const grouped = groupByDate(items);
  const dates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {dates.map((date) => (
        <Card key={date} className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{formatDate(date)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {grouped[date].map((item, idx) => (
              <div key={`${date}-${idx}`} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border p-2">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{FRACTION_LABELS[item.fraction as keyof typeof FRACTION_LABELS] || item.fraction}</div>
                    {item.note ? <div className="text-sm text-muted-foreground">{item.note}</div> : null}
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Odbiór
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <Card className="rounded-[28px] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border p-3">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Harmonogram wywozu śmieci – Polska</CardTitle>
                  <CardDescription className="mt-1 text-sm leading-6">
                    Wpisz adres, a aplikacja sprawdzi harmonogram przez backend i publicznie dostępne źródła.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="np. ul. Mickiewicza 12, Kobyłka"
                    className="h-12 rounded-2xl pl-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>
                <Button onClick={handleSearch} className="h-12 rounded-2xl px-5">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Szukaj
                </Button>
              </div>

              <Alert className="rounded-2xl">
                <Database className="h-4 w-4" />
                <AlertTitle>Jak to działa</AlertTitle>
                <AlertDescription className="leading-6">
                  Aplikacja wysyła adres do backendu, backend geokoduje lokalizację, dobiera źródło publiczne i zwraca harmonogram albo oficjalne linki źródłowe. Dla części gmin nadal mogą być potrzebne dodatkowe parsery HTML lub PDF.
                </AlertDescription>
              </Alert>

              {error ? (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Błąd</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Stan projektu</CardTitle>
              <CardDescription>Co już jest gotowe, a co trzeba dołożyć w wersji produkcyjnej.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6">
              <div className="rounded-2xl border p-4">
                <div className="font-medium">Gotowe teraz</div>
                <div className="mt-1 text-muted-foreground">
                  Wyszukiwanie adresu przez backend, normalizacja danych, pobranie harmonogramu lub oficjalnych źródeł i prezentacja wyniku.
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium">Do wdrożenia produkcyjnego</div>
                <div className="mt-1 text-muted-foreground">
                  Backend proxy, parsery HTML/PDF, cache wyników, baza providerów oraz monitoring zmian na stronach gmin.
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium">Realne ograniczenie</div>
                <div className="mt-1 text-muted-foreground">
                  Nie każda publiczna strona pozwala wyliczyć harmonogram po samym adresie. Czasem potrzebny jest rejon, sektor albo numer umowy.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[28px] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">1. Dopasowane adresy</CardTitle>
              <CardDescription>Wybierz najlepiej dopasowany adres.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!matches.length ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                  Po wyszukaniu adresu zobaczysz tutaj dopasowania z geokodera.
                </div>
              ) : (
                matches.map((item, idx) => (
                  <motion.div
                    key={`${item.label}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border p-4"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{item.label}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.municipality ? <Badge variant="outline">gmina: {item.municipality}</Badge> : null}
                        {item.city ? <Badge variant="outline">miejscowość: {item.city}</Badge> : null}
                        {item.suburb ? <Badge variant="outline">dzielnica/rejon: {item.suburb}</Badge> : null}
                        {item.county ? <Badge variant="outline">powiat: {item.county}</Badge> : null}
                      </div>
                      <Separator />
                      <div className="pt-2">
                        <Button className="rounded-2xl" onClick={() => handleResolve(item)}>
                          Sprawdź harmonogram
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">2. Harmonogram i źródła</CardTitle>
              <CardDescription>
                {selectedLocation ? selectedLocation.label : "Po wyborze adresu pokażę harmonogram albo właściwe źródła publiczne."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!providerResult ? (
                <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                  Brak wybranego adresu.
                </div>
              ) : providerResult.status === "loading" ? (
                <div className="flex items-center gap-3 rounded-2xl border p-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pobieranie danych…
                </div>
              ) : (
                <Tabs defaultValue="schedule" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                    <TabsTrigger value="schedule" className="rounded-2xl">
                      Harmonogram
                    </TabsTrigger>
                    <TabsTrigger value="sources" className="rounded-2xl">
                      Źródła
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="schedule" className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <ResultBadge status={providerResult.status} />
                    </div>

                    {providerResult.message ? (
                      <Alert className="rounded-2xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Informacja</AlertTitle>
                        <AlertDescription>{providerResult.message}</AlertDescription>
                      </Alert>
                    ) : null}

                    {providerResult.schedule?.length ? (
                      <ScheduleList items={providerResult.schedule} />
                    ) : (
                      <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                        Backend nie zwrócił jeszcze bezpośredniego harmonogramu dla tego adresu.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sources" className="space-y-3">
                    {(providerResult.sourceLinks || []).length ? (
                      providerResult.sourceLinks.map((link, idx) => (
                        <a
                          key={`${link.url}-${idx}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start justify-between gap-3 rounded-2xl border p-4 transition hover:bg-muted/40"
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
                              <div className="text-sm text-muted-foreground break-all">{link.url}</div>
                            </div>
                          </div>
                          <ExternalLink className="mt-1 h-4 w-4 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                        Brak linków źródłowych.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[28px] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Jak rozszerzyć do pełnej wersji</CardTitle>
            <CardDescription>Plan techniczny dla ogólnopolskiej obsługi publicznie dostępnych harmonogramów.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
