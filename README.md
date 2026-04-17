# Harmonogram odpadów – Polska

Pełniejszy projekt Next.js z backendem API.

## Co robi

- `POST /api/geocode` – geokoduje polski adres po stronie serwera przez Nominatim.
- `POST /api/schedule` – dobiera providerów do lokalizacji i zwraca harmonogram lub oficjalne źródła.
- Frontend działa na `/` i korzysta wyłącznie z własnego backendu.

## Uruchomienie

```bash
npm install
npm run dev
```

## Architektura

- `lib/geocode.ts` – geokodowanie serwerowe z fallbackami demo.
- `lib/providers/*` – registry providerów.
- `app/api/geocode/route.ts` – endpoint geokodowania.
- `app/api/schedule/route.ts` – endpoint harmonogramów.

## Ważne ograniczenie

W Polsce nie istnieje jedno kompletne, publiczne API dla wszystkich harmonogramów wywozu odpadów. Ten projekt pokazuje właściwy kierunek produkcyjny: serwerowe geokodowanie, registry providerów i parsery per źródło.

## Co rozszerzyć dalej

1. Dodać parser PDF dla gmin publikujących harmonogramy jako załączniki.
2. Dodać cache oraz kolejkę odświeżania źródeł.
3. Dodać browser automation dla dynamicznych formularzy.
4. Dodać bazę rejonów ulic i mapowanie adres → sektor/rejon.
