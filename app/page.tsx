'use client';

import { useMemo, useState } from 'react';
import type { GeocodeResult, ProviderResponse } from '@/lib/types';

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function Page() {
  const [query, setQuery] = useState('ul. Puławska 1, Warszawa');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<GeocodeResult[]>([]);
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [providers, setProviders] = useState<ProviderResponse[]>([]);

  const bestProvider = useMemo(() => providers.find((p) => p.status === 'ok') || providers[0] || null, [providers]);

  async function searchAddress() {
    setLoading(true);
    setError('');
    setProviders([]);
    setSelected(null);
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Błąd geokodowania');
      setMatches(data.results || []);
      if (!(data.results || []).length) {
        setError('Nie udało się znaleźć adresu. Backend zadziałał, ale nie zwrócił dopasowań.');
      }
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchedule(location: GeocodeResult) {
    setSelected(location);
    setResolving(true);
    setProviders([]);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Błąd pobierania harmonogramu');
      setProviders(data.providers || []);
    } catch (e: any) {
      setError(e.message || 'Nie udało się pobrać harmonogramu');
    } finally {
      setResolving(false);
    }
  }

  return (
    <main className="container stack">
      <section className="grid grid-2">
        <div className="card stack">
          <div>
            <h1 className="title">Harmonogram odpadów w Polsce</h1>
            <p className="subtitle">
              Wersja full-stack: frontend pyta własny backend, backend geokoduje adres na serwerze i dobiera publiczne źródła harmonogramu z internetu.
            </p>
          </div>
          <div className="row">
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="np. ul. Puławska 1, Warszawa" />
            <button className="button" onClick={searchAddress} disabled={loading}>{loading ? 'Szukam...' : 'Szukaj adresu'}</button>
          </div>
          <div className="small">
            Przykładowe adresy testowe: <strong>ul. Puławska 1, Warszawa</strong>, <strong>Paszowice</strong>, <strong>Kobyłka</strong>.
          </div>
          {error ? <div className="error">{error}</div> : null}
          <div className="success">
            Backend endpoints: <code>POST /api/geocode</code> i <code>POST /api/schedule</code>.
          </div>
        </div>

        <div className="card stack">
          <div className="badge outline">Co jest naprawdę po stronie serwera</div>
          <div className="small">
            1. Geokodowanie przez Nominatim z serwera. <br />
            2. Registry providerów. <br />
            3. Pobieranie publicznych stron operatorów i gmin. <br />
            4. Miejsce na parsery HTML/PDF dla kolejnych gmin.
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card stack">
          <h2 style={{ margin: 0 }}>1. Dopasowane adresy</h2>
          <div className="list">
            {!matches.length ? <div className="item muted">Po wyszukaniu zobaczysz tu dopasowania z backendu.</div> : null}
            {matches.map((m, i) => (
              <div className="item kv" key={`${m.label}-${i}`}>
                <strong>{m.label}</strong>
                <div className="small">gmina: {m.municipality || '—'} · miejscowość: {m.city || '—'} · dzielnica/rejon: {m.suburb || '—'}</div>
                <button className="button secondary" onClick={() => fetchSchedule(m)}>Sprawdź harmonogram</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0 }}>2. Harmonogram i źródła</h2>
          {!selected ? <div className="item muted">Wybierz adres z listy po lewej.</div> : null}
          {selected ? <div className="small"><strong>Wybrany adres:</strong> {selected.label}</div> : null}
          {resolving ? <div className="item muted">Pobieram dane z providerów...</div> : null}
          {bestProvider ? (
            <div className="stack">
              <div className="badge">{bestProvider.providerName} · {bestProvider.status === 'ok' ? 'harmonogram znaleziony' : bestProvider.status === 'partial' ? 'częściowy wynik' : 'błąd'}</div>
              {bestProvider.message ? <div className="small">{bestProvider.message}</div> : null}
              {bestProvider.schedule?.length ? (
                <div className="list">
                  {bestProvider.schedule.map((item, idx) => (
                    <div className="item" key={`${item.date}-${item.fraction}-${idx}`}>
                      <strong>{formatDate(item.date)}</strong>
                      <div className="small">{item.fraction}{item.note ? ` · ${item.note}` : ''}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="item muted">Brak sparsowanego harmonogramu dla tego providera, ale źródła są poniżej.</div>}

              <div className="stack">
                {bestProvider.sourceLinks.map((link, idx) => (
                  <a key={`${link.url}-${idx}`} href={link.url} target="_blank" rel="noreferrer" className="item">
                    <strong>{link.label}</strong>
                    <div className="small link">{link.url}</div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {providers.length > 1 ? (
            <div className="stack">
              <h3 style={{ marginBottom: 0 }}>Pozostali providerzy</h3>
              {providers.slice(1).map((provider) => (
                <div className="item kv" key={provider.providerId}>
                  <strong>{provider.providerName}</strong>
                  <div className="small">{provider.message || 'Brak komunikatu.'}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
