# NutriScore IN

A mobile-first web app that lets Indian consumers scan or search packaged
foods and instantly see an A–E Nutri-Score-style quality rating, a full
nutrient breakdown, and India-specific ingredient red flags (added sugar,
palm oil, high sodium, additive load).

## 1. Architecture overview

```
nutriscore-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout, fonts, metadata, viewport
│   │   ├── page.tsx           # Main screen: search, scan, product view, states
│   │   └── globals.css        # Tailwind layers + base styles
│   ├── components/
│   │   ├── SearchBar.tsx        # Debounced autocomplete search
│   │   ├── BarcodeScanner.tsx   # html5-qrcode camera modal
│   │   ├── ProductCard.tsx      # Product summary + badge
│   │   ├── ScoreBadge.tsx       # A–E badge + gauge strip
│   │   ├── NutrientBreakdown.tsx# Per-100g / per-serving table + red flags
│   │   ├── AlternativesSection.tsx # "Better alternatives" for D/E grades
│   │   └── StateViews.tsx       # Skeletons, empty/not-found/error states
│   ├── lib/
│   │   ├── types.ts               # Shared domain types
│   │   ├── calculateNutriScore.ts # Nutri-Score A–E scoring engine
│   │   ├── redFlags.ts            # Indian-market ingredient red-flag rules
│   │   ├── foodService.ts         # Open Food Facts client + mock fallback
│   │   └── mockData.ts            # Offline Indian packaged-food dataset
│   └── hooks/
│       └── useDebounce.ts
├── tailwind.config.ts   # Design tokens (color/type/radius)
├── next.config.js
└── package.json
```

**Data flow:** `SearchBar` / `BarcodeScanner` → `foodService.ts` (tries Open
Food Facts, normalizes the payload, falls back to `mockData.ts` on a miss or
network error) → `scoreProduct()` (uses the source's own `nutriscore_grade`
when present, otherwise runs `calculateNutriScore()`) → `page.tsx` renders
the result through a single `AppState` union (`idle | loading | success |
not_found | error`), so every screen state is explicit and testable.

## 2. Setup

```bash
npx create-next-app@latest --typescript --tailwind --app  # if starting fresh,
# then drop these files in, or just copy this folder directly.

cd nutriscore-app
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Barcode scanning requires camera permission
and (on most mobile browsers) HTTPS — use `next dev --experimental-https`
or deploy to Vercel/similar for real-device testing.

### Notes on Open Food Facts usage
- No API key is required.
- OFF's usage policy asks for a descriptive User-Agent; this is set via the
  `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_CONTACT` env vars.
- Search is scoped with `countries_tags_en=india`. If you need more India
  coverage, consider contributing missing products back to OFF.

## 3. Extending

- **Real Indian nutrient database**: swap/augment `mockData.ts` with a
  proper FSSAI-aligned dataset or a licensed source; `foodService.ts` only
  needs a function returning the `Product` shape.
- **Beverage/cheese/fat-specific scoring**: `calculateNutriScore.ts`
  currently implements the general-foods table only (documented in the
  file's header comment) — add category-specific tables if you need exact
  parity with the official multi-category algorithm.
- **Caching**: add a simple in-memory or IndexedDB cache in `foodService.ts`
  keyed by barcode to avoid refetching recently viewed products.
- **Auth/history**: the `ScoredProduct` shape is already serializable —
  straightforward to persist a scan history per user.
