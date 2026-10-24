# Engineering Handoff — Museum of Us

**Repository:** `museum-of-us`
**Target Production Environments:** Cloudflare Pages (primary static SPA) · GitHub Pages (optional base-path SPA)
**Backend Engines:** In-Browser Demo Mode (zero configuration) · Supabase (Postgres + RLS + Realtime + Storage)

---

## 1. System Overview

"Museum of Us" is a complete, production-grade web application where creators design personalized 3D love-letter galleries, export scannable heart-shaped QR cards, and recipients explore a 3D art exhibition with custom avatars, interactive plaques, memory walls, chat bubbles, emotes, and live multiplayer synchronization.

---

## 2. Key Architecture & File Map

```
├── .github/workflows/
│   ├── ci.yml                 # Deterministic CI: typecheck, lint, unit tests, SQL tests, build, size budget
│   └── deploy-ghpages.yml     # Manual dispatch workflow for GitHub Pages with VITE_BASE and 404.html
├── docs/
│   ├── DEPLOY.md              # Cloudflare Pages, Supabase setup, migrations, domains, and printing
│   ├── SHARE.md               # Card PNGs, Story PNGs, SVG QR, scannability guide, and recipient flow
│   └── PRIVACY_TERMS_TEMPLATES.md # EXIF stripping guarantee, no-index headers, and terms templates
├── public/
│   ├── _headers               # CSP headers, cache policies, X-Robots-Tag: noindex on /m/*
│   └── _redirects             # Cloudflare Pages SPA fallback: /* /index.html 200
├── scripts/
│   ├── checkSize.js           # Bundle size budget validator (<= 200 kB gzip entry chunk)
│   └── migrate.js             # Idempotent pg migration runner for SUPABASE_DB_URL
├── src/
│   ├── client/                # Unified DataClient: DemoClient (IndexedDB) & SupabaseClient
│   ├── components/
│   │   ├── customizer/        # DoorCustomizer: skin swatches, hair, outfits, live toon preview
│   │   ├── hud/               # HUD: speech bubbles, emotes, WASD chips, mobile joystick
│   │   ├── lite/              # LiteGallery: 2D carousel fallback (?lite=1 or WebGL-less)
│   │   └── viewing/           # PlaqueViewModal: camera fly-in dedication inspection
│   ├── lib/
│   │   ├── browserShareCard.ts # Browser-native HTML5 Canvas 2D 1080x1080 & 1080x1920 card renderer
│   │   ├── heartQr.ts         # Heart QR generator (EC Level H, 46% core, deterministic density)
│   │   ├── imagePipeline.ts   # Client-side canvas transcoder (WebP <= 2048px, EXIF/GPS stripped)
│   │   ├── interpolation.ts   # Multiplayer entity interpolation buffer (100ms render delay)
│   │   ├── layout.ts          # Pure deterministic room planning algorithm (up to 32 discrete wall slots)
│   │   └── sanitize.ts        # Tag stripping and XSS defense
│   ├── pages/
│   │   ├── LandingPage.tsx    # Atmospheric landing page with demo preview and FAQ
│   │   ├── CreatePage.tsx     # 6-step builder with IndexedDB autosave
│   │   ├── MuseumPage.tsx     # 3D recipient experience (?as=host, ?lite=1, ?preview=1)
│   │   ├── SharePage.tsx      # Share screen with live card preview and PNG/SVG download
│   │   ├── DashboardPage.tsx  # Creator collection manager, guestbook inbox, and deletion
│   │   └── SetupPage.tsx      # 6-pillar deployment diagnostics and live remediation
│   └── world/                 # Three.js / R3F scene graph, toon shaders, colliders, and avatars
├── supabase/
│   └── migrations/
│       └── 0001_init.sql      # Schema, RLS policies, RPC functions, and storage configuration
└── tests/
    ├── e2e/                   # Playwright E2E suites: recipient, creator, multiplayer, a11y
    ├── sql/                   # PGlite SQL & RLS test suite (in-process Postgres)
    └── unit/                  # Vitest unit test suite (heart QR, collision, layouts, avatars, etc.)
```

---

## 3. Verified Test Matrix (100% Passing, 0 Skipped)

| Test ID        | Description                                                              | Suite                                     | Status   |
| -------------- | ------------------------------------------------------------------------ | ----------------------------------------- | -------- |
| **Test 1**     | Pure deterministic room layout algorithm                                 | Unit (`tests/unit/layout.test.ts`)        | **PASS** |
| **Test 2**     | Heart QR and Classic QR decoding at 1024px & 512px with rotation & noise | Unit (`tests/unit/heartQr.test.ts`)       | **PASS** |
| **Test 3**     | Nanoid slug generation (10,000 slugs, 0 collisions)                      | Unit (`tests/unit/slug.test.ts`)          | **PASS** |
| **Test 4**     | Procedural toon avatar materials and outline inversion                   | Unit (`tests/unit/avatarConfig.test.ts`)  | **PASS** |
| **Test 5**     | Door customizer swatch prefill and config updates                        | Unit (`tests/unit/components.test.tsx`)   | **PASS** |
| **Test 6**     | Image processing pipeline & EXIF/GPS stripping                           | Unit (`tests/unit/imagePipeline.test.ts`) | **PASS** |
| **Test 7**     | Camera fly-in viewing modal & plaque text                                | Unit (`tests/unit/components.test.tsx`)   | **PASS** |
| **Test 8**     | Interpolation buffer position smoothing                                  | Unit (`tests/unit/interpolation.test.ts`) | **PASS** |
| **Test 9**     | Realtime flood guard rate limiter                                        | Unit (`tests/unit/floodGuard.test.ts`)    | **PASS** |
| **Test 10**    | 2D AABB collider sliding physics                                         | Unit (`tests/unit/collision.test.ts`)     | **PASS** |
| **Test 11**    | Zero-config Demo Mode vs Live Mode switch                                | Unit (`tests/unit/env.test.ts`)           | **PASS** |
| **Test 12**    | In-browser Demo DataClient CRUD                                          | Unit (`tests/unit/demoClient.test.ts`)    | **PASS** |
| **Test 13**    | Host NPC state machine transitions                                       | Unit (`tests/unit/hostNpc.test.ts`)       | **PASS** |
| **Test 14**    | HTML sanitization & XSS guard                                            | Unit (`tests/unit/sanitize.test.ts`)      | **PASS** |
| **Test 15–20** | Postgres schema, RLS, RPCs, reports, and guestbook                       | SQL / PGlite (`tests/sql/rls.test.ts`)    | **PASS** |
| **Test 21–22** | Recipient journey: loading -> Start -> customizer -> gallery -> plaque   | Playwright E2E (`recipient-flow.spec.ts`) | **PASS** |
| **Test 23–24** | Multi-tab multiplayer & host presence synchronization                    | Playwright E2E (`multiplayer.spec.ts`)    | **PASS** |
| **Test 25–26** | Creator flow: builder -> publish -> heart QR -> dashboard CRUD           | Playwright E2E (`creator-flow.spec.ts`)   | **PASS** |
| **Test 27**    | Fallback 2D carousel view (?lite=1)                                      | Playwright E2E (`recipient-flow.spec.ts`) | **PASS** |
| **Test 28**    | `/setup` diagnostic page with real-time backend checks                   | Playwright E2E (`setup-and-a11y.spec.ts`) | **PASS** |
| **Test 29**    | Automated `axe-core` accessibility audits across all routes (WCAG AA)    | Playwright E2E (`setup-and-a11y.spec.ts`) | **PASS** |
| **Test 30**    | Base-path build asset prefixing (GitHub Pages deploy)                    | Unit (`tests/unit/buildBase.test.ts`)     | **PASS** |

---

## 4. Run & Verification Commands

```bash
# Full verification suite (Typecheck, Lint, Unit, SQL, Build, Size Budget, E2E)
npm run verify

# Individual stages:
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint across src, tests, scripts
npm run test:unit       # Vitest unit test suite (14 files, 51 tests)
npm run test:sql        # PGlite in-memory Postgres RLS test suite
npm run build           # Vite production build (Three.js lazy chunk)
npm run check:size      # Entry bundle gzip budget check (<= 200 kB)
npm run test:e2e        # Playwright E2E suite (Chromium Desktop & Mobile)

# Database migration to live Supabase:
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres" npm run db:migrate
```
