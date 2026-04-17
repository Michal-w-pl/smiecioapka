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
      status: "ok" | "partial" | "source_only" | "error";
      provider?: { id: string; name: string };
      message?: string;
      schedule?: ScheduleItem[];
      sourceLinks?: SourceLink[];
    };

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
    // fallback lokalny
  }

  const normalizedInput = slugify(cleaned);

  const localMatches = ADDRESS_FALLBACKS.filter((item) =>
    item.needles.some((needle) => normalizedInput.includes(slugify(needle)))
  ).map((item) => item.result);

  return localMatches;
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

  if (status === "source_only") {
    return (
      <Pill variant="soft">
        <ExternalLink size={14} /> Źródła publiczne
      </Pill>
    );
  }

  return (
    <Pill variant="soft">
      <AlertCircle size={14} /> Częściowa obsługa
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
      setMatches(results);

      if (!results.length) {
        setError(
          "Nie udało się potwierdzić adresu w geokoderze. Spróbuj dodać miasto lub wpisz adres w formacie: ulica numer, kod pocztowy, miejscowość."
        );
      }
    } catch (e: any) {
      setError(e?.message || "Wystąpił błąd.");
      setMatches([]);
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

  const links = providerResult && "sourceLinks" in providerResult ? providerResult.sourceLinks ?? [] : [];

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
                      Frontend wysyła adres do backendu. Backend geokoduje lokalizację, dobiera providera i zwraca
                      harmonogram albo oficjalne źródła. To baza pod rozwój do pełnej wersji produkcyjnej.
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
              <p className="section-desc">Co już jest gotowe, a co dokładamy dalej.</p>

              <div className="info-list">
                <div className="mini-card">
                  <div className="mini-title">Gotowe teraz</div>
                  <p className="mini-text">
                    Geokodowanie adresu, backend API, registry providerów, oficjalne źródła oraz pierwszy provider z
                    pobraniem strony.
                  </p>
                </div>

                <div className="mini-card">
                  <div className="mini-title">Najbliższy krok</div>
                  <p className="mini-text">
                    Parser prawdziwych dat i frakcji dla konkretnego źródła, np. COM-D albo Warszawa.
                  </p>
                </div>

                <div className="mini-card">
                  <div className="mini-title">Realne ograniczenie</div>
                  <p className="mini-text">
                    Nie każda gmina udostępnia harmonogram po samym adresie. Czasem potrzebny jest rejon, sektor albo
                    PDF z mapowaniem ulic.
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
                          {"provider" in providerResult && providerResult.provider?.name ? (
                            <Pill variant="outline">{providerResult.provider.name}</Pill>
                          ) : null}
                        </div>

                        {"message" in providerResult && providerResult.message ? (
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

                        {"schedule" in providerResult && providerResult.schedule?.length ? (
                          <ScheduleList items={providerResult.schedule} />
                        ) : (
                          <div className="empty">
                            Ten adres nie ma jeszcze bezpośrednio sparsowanego harmonogramu. Sprawdź zakładkę „Źródła”.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="source-list">
                        {links.length ? (
                          links.map((link, idx) => (
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
            <h2 className="section-title">Jak rozwijać tę wersję</h2>
            <p className="section-desc">Najbardziej sensowna kolejność dalszych prac.</p>

            <div className="plan-grid" style={{ marginTop: 18 }}>
              {[
                {
                  title: "1. Provider registry w bazie",
                  text: "Wyciągnij listę providerów z kodu do bazy lub pliku konfiguracyjnego.",
                },
                {
                  title: "2. Pierwszy pełny parser",
                  text: "Dodaj prawdziwe daty i frakcje dla COM-D albo Warszawy.",
                },
                {
                  title: "3. Cache backendowy",
                  text: "Cache po adresie i po źródle, żeby nie pobierać tego samego przy każdym wejściu.",
                },
                {
                  title: "4. Pokrycie gmin",
                  text: "Dodawaj kolejne providery według największego zwrotu: duże miasta i operatorzy wielu gmin.",
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
