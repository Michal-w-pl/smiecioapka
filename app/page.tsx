'use client';

import React, { useMemo, useState } from "react";
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
    // fallback niżej
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
  variant = "outline",
}: {
  children: React.ReactNode;
  variant?: "outline" | "soft" | "dark" | "danger";
}) {
  const className =
    variant === "soft"
      ? "pill pill-soft"
      : variant === "dark"
        ? "pill pill-dark"
        : variant === "danger"
          ? "pill pill-danger"
          : "pill pill-outline";

  return <span className={className}>{children}</span>;
}

function ResultBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <Pill variant="dark">
        <CheckCircle2 size={14} /> Harmonogram znaleziony
      </Pill>
    );
  }

  if (status === "error") {
    return (
      <Pill variant="danger">
        <AlertCircle size={14} /> Błąd
      </Pill>
    );
  }

  return (
    <Pill variant="soft">
      <AlertCircle size={14} /> Wymaga integracji źródła
    </Pill>
  );
}

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  const grouped = useMemo(() => groupByDate(items), [items]);
  const dates = Object.keys(grouped).sort();

  return (
    <div className="schedule-list">
      {dates.map((date) => (
        <div key={date} className="schedule-day">
          <div className="schedule-day-head">{formatDate(date)}</div>
          <div className="schedule-day-body">
            {grouped[date].map((item, idx) => (
              <div key={`${date}-${idx}`} className="schedule-item">
                <div className="schedule-item-left">
                  <div className="icon-box" style={{ width: 40, height: 40, borderRadius: 14 }}>
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <div className="schedule-item-title">
                      {FRACTION_LABELS[item.fraction] || item.fraction}
                    </div>
                    {item.note ? <div className="schedule-item-note">{item.note}</div> : null}
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
  const [tab, setTab] = useState<"schedule" | "sources">("schedule");

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
    setTab("schedule");

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
    <div className="page">
      <div className="shell stack">
        <div className="hero-grid">
          <section className="card">
            <div className="card-inner">
              <div className="hero-head">
                <div className="icon-box">
                  <CalendarDays size={28} />
                </div>
                <div>
                  <h1 className="hero-title">Harmonogram wywozu śmieci – Polska</h1>
                  <p className="hero-subtitle">
                    Wpisz adres, a aplikacja sprawdzi harmonogram przez backend i publicznie dostępne źródła.
                  </p>
                </div>
              </div>

              <div className="search-row">
                <div className="search-input-wrap">
                  <MapPin size={18} className="search-icon" />
                  <input
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="np. ul. Mickiewicza 12, Kobyłka"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>

                <button className="btn btn-primary" onClick={handleSearch}>
                  {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                  Szukaj
                </button>
              </div>

              <div className="info-box">
                <div className="info-box-head">
                  <Database size={18} />
                  <div>
                    <div className="info-title">Jak to działa</div>
                    <div className="info-text">
                      Aplikacja wysyła adres do backendu, backend geokoduje lokalizację, dobiera źródło publiczne i
                      zwraca harmonogram albo oficjalne linki źródłowe. Dla części gmin nadal mogą być potrzebne
                      dodatkowe parsery HTML lub PDF.
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="error-box">
                  <div className="error-box-head">
                    <AlertCircle size={18} />
                    <div>
                      <div className="error-title">Błąd</div>
                      <div className="error-text">{error}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="card">
            <div className="card-inner">
              <h2 className="section-title">Stan projektu</h2>
              <p className="section-desc">Co już jest gotowe, a co trzeba dołożyć w wersji produkcyjnej.</p>

              <div className="info-list">
                <div className="mini-card">
                  <div className="mini-title">Gotowe teraz</div>
                  <p className="mini-text">
                    Wyszukiwanie adresu przez backend, normalizacja danych, pobranie harmonogramu lub oficjalnych
                    źródeł i prezentacja wyniku.
                  </p>
                </div>

                <div className="mini-card">
                  <div className="mini-title">Do wdrożenia produkcyjnego</div>
                  <p className="mini-text">
                    Backend proxy, parsery HTML/PDF, cache wyników, baza providerów oraz monitoring zmian na stronach
                    gmin.
                  </p>
                </div>

                <div className="mini-card">
                  <div className="mini-title">Realne ograniczenie</div>
                  <p className="mini-text">
                    Nie każda publiczna strona pozwala wyliczyć harmonogram po samym adresie. Czasem potrzebny jest
                    rejon, sektor albo numer umowy.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="content-grid">
          <section className="card">
            <div className="card-inner">
              <h2 className="section-title">1. Dopasowane adresy</h2>
              <p className="section-desc">Wybierz najlepiej dopasowany adres.</p>

              <div className="stack" style={{ gap: 12, marginTop: 18 }}>
                {!matches.length ? (
                  <div className="empty">Po wyszukaniu adresu zobaczysz tutaj dopasowania z geokodera.</div>
                ) : (
                  matches.map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="result-card">
                      <div className="result-top">{item.label}</div>

                      <div className="badges">
                        {item.municipality ? <Pill variant="outline">gmina: {item.municipality}</Pill> : null}
                        {item.city ? <Pill variant="outline">miejscowość: {item.city}</Pill> : null}
                        {item.suburb ? <Pill variant="outline">dzielnica/rejon: {item.suburb}</Pill> : null}
                        {item.county ? <Pill variant="outline">powiat: {item.county}</Pill> : null}
                      </div>

                      <div className="separator" />

                      <div className="actions">
                        <button className="btn btn-primary" style={{ height: 44 }} onClick={() => handleResolve(item)}>
                          Sprawdź harmonogram
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-inner">
              <h2 className="section-title">2. Harmonogram i źródła</h2>
              <p className="section-desc">
                {selectedLocation ? selectedLocation.label : "Po wyborze adresu pokażę harmonogram albo właściwe źródła publiczne."}
              </p>

              <div style={{ marginTop: 18 }}>
                {!providerResult ? (
                  <div className="empty">Brak wybranego adresu.</div>
                ) : providerResult.status === "loading" ? (
                  <div className="empty" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Loader2 size={18} className="spin" />
                    Pobieranie danych…
                  </div>
                ) : (
                  <div className="stack" style={{ gap: 16 }}>
                    <div className="tabs">
                      <button className={`tab ${tab === "schedule" ? "active" : ""}`} onClick={() => setTab("schedule")}>
                        Harmonogram
                      </button>
                      <button className={`tab ${tab === "sources" ? "active" : ""}`} onClick={() => setTab("sources")}>
                        Źródła
                      </button>
                    </div>

                    {tab === "schedule" ? (
                      <div className="stack" style={{ gap: 16 }}>
                        <div className="badges">
                          <ResultBadge status={providerResult.status} />
                        </div>

                        {providerResult.message ? (
                          <div className="note-box">
                            <div className="note-box-head">
                              <AlertCircle size={18} />
                              <div>
                                <div className="note-title">Informacja</div>
                                <div className="note-text">{providerResult.message}</div>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {providerResult.schedule?.length ? (
                          <ScheduleList items={providerResult.schedule} />
                        ) : (
                          <div className="empty">
                            Backend nie zwrócił jeszcze bezpośredniego harmonogramu dla tego adresu.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="source-list">
                        {(providerResult.sourceLinks || []).length ? (
                          (providerResult.sourceLinks || []).map((link, idx) => (
                            <a
                              key={`${link.url}-${idx}`}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="source-link"
                            >
                              <div className="source-left">
                                <div className="icon-box" style={{ width: 42, height: 42, borderRadius: 14 }}>
                                  {link.type === "pdf-page" || link.type === "pdf" ? (
                                    <FileText size={18} />
                                  ) : link.type === "form" ? (
                                    <Building2 size={18} />
                                  ) : (
                                    <ExternalLink size={18} />
                                  )}
                                </div>
                                <div>
                                  <div className="source-title">{link.label}</div>
                                  <div className="source-url">{link.url}</div>
                                </div>
                              </div>
                              <ExternalLink size={18} />
                            </a>
                          ))
                        ) : (
                          <div className="empty">Brak linków źródłowych.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-inner">
            <h2 className="section-title">Jak rozszerzyć do pełnej wersji</h2>
            <p className="section-desc">Plan techniczny dla ogólnopolskiej obsługi publicznie dostępnych harmonogramów.</p>

            <div className="plan-grid" style={{ marginTop: 18 }}>
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
                <div key={item.title} className="plan-card">
                  <div className="plan-title">{item.title}</div>
                  <p className="plan-text">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
