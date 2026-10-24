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
