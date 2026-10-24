# Architectural & Engineering Decisions (DECISIONS.md)

This log records autonomous decisions made during the development of "Museum of Us" to ensure consistency, reproducibility, and auditability.

## Decision Log

### 1. Zero-Config Demo Mode by Default

- **Context:** Recipient and creator experiences must function immediately without requiring Supabase credentials or third-party cloud services.
- **Decision:** If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not provided, the application automatically enters Demo Mode. Storage and state are handled via in-memory and IndexedDB storage, and real-time multiplayer between tabs is executed via browser `BroadcastChannel`. A unified `DataClient` interface abstracts both Demo and Supabase backends.

### 2. Procedural Anime Toon Avatars

- **Context:** External avatar services like Ready Player Me have discontinued service or require external API dependencies.
- **Decision:** Build a procedural, self-contained Three.js avatar system with anime-leaning proportions (head ≈ 1/6.5 body), toon shading (`MeshToonMaterial` with gradient map), subtle rim lighting, and inverted-hull outlines. Procedural joint pivots drive smooth idle, walk, run, sit, wave, clap, and dance animations.

### 3. Heart-Shaped QR Encoding and Density

- **Context:** QR codes shaped as hearts must remain 100% scannable by commodity phone cameras while preserving an aesthetic heart silhouette.
- **Decision:** Adopt the prototype-verified algorithm: encode standard QR at Error Correction level H with core width = 46% of heart width. Surround the core with a 2-module clear margin and fill the surrounding heart area with pseudo-random decorative modules (density 0.45, seeded by the URL slug). Finders are rendered as concentric rounded squares.

### 4. Client-side EXIF/GPS Stripping & WebP Transcoding

- **Context:** Privacy is paramount for shared personal photos.
- **Decision:** All uploaded images (JPEG, PNG, HEIC via `heic2any`) are re-drawn to an offscreen canvas and re-encoded as WebP (max dimension 2048px, quality ~0.82). This inherently strips all EXIF and GPS metadata before any upload or local storage occurs.

### 5. PGlite for SQL & RLS Verification

- **Context:** Verification must be fast, self-contained, deterministic, and runnable offline without Docker or remote database connections.
- **Decision:** Use `@electric-sql/pglite` to execute the exact Supabase SQL migration (`0001_init.sql`) against an in-process Postgres engine with auth and storage shims.

### 6. Browser-Native Share Card PNG Generation
- **Context:** `pngjs` depends on Node.js streams and `util.inherits`, which crashes in Vite client browser bundles.
- **Decision:** Created `src/lib/browserShareCard.ts` utilizing browser-native HTML5 Canvas 2D API (`createRadialGradient`, rounded rectangles, high-DPI scaling) for generating 1080x1080 square and 1080x1920 story PNG share cards. Separated Node test PNG utilities into `src/lib/heartQrPng.ts`, keeping `src/lib/heartQr.ts` free of Node dependencies.

### 7. WCAG AA Color Contrast Adjustments
- **Context:** Automated `axe-core` accessibility audits flagged contrast ratios on `#0B0D1F` (navy) backgrounds where `#E4325B` (raspberry) yielded 4.49:1 vs 4.5:1 required for normal body text.
- **Decision:** Enhanced failure status badges and interactive action text to `text-rose-400` / `text-rose-300`, exceeding 6.2:1 contrast ratio while retaining the warm raspberry/rose design palette.

