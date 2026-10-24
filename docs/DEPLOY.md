# Deployment & Production Runbook — Museum of Us

This guide covers deploying **Museum of Us** to Cloudflare Pages (primary recommendation) or GitHub Pages (optional), connecting Supabase for real-time multiplayer and cloud persistence, and verifying operational readiness.

---

## 1. Zero-Configuration Demo Mode

Museum of Us is architected to run immediately with **zero configuration**:

- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app boots into **Demo Mode**.
- In Demo Mode:
  - Artworks and drafts persist in the visitor's local IndexedDB and memory.
  - Real-time multiplayer functions across browser tabs on the same device via `BroadcastChannel`.
  - A pre-seeded `/m/demo` museum is available out of the box.
  - A discreet top banner indicates Demo Mode with a link to `/setup`.
- No rebuild is required to switch between Demo and Live modes — only environment variables.

---

## 2. Going Live with Supabase

To enable multi-device sharing, permanent cloud storage, and global multiplayer presence:

### Step 2.1: Create a Supabase Project

1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon public key** (`eyJh...`)
3. Under **Project Settings -> Database -> Connection string -> URI**, copy the PostgreSQL connection string (`postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`).

### Step 2.2: Apply Database Migrations

Run the idempotent database migration script from the repository root:

```bash
# In your local environment or CI:
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres" npm run db:migrate
```

This applies `supabase/migrations/0001_init.sql`, which configures:

- Row-Level Security (RLS) on `museums`, `artworks`, `replies`, `reports`.
- Atomic RPC stored procedures: `get_museum`, `track_visit`, `post_reply`, `post_report`.
- Updated timestamp triggers and foreign key constraints.

### Step 2.3: Storage Bucket

1. In the Supabase Dashboard, navigate to **Storage**.
2. Verify that a public bucket named `artworks` is created (created automatically by migrations or manually set to Public).
3. Ensure the bucket has file size limits configured (up to 10MB per WebP image).

### Step 2.4: Authentication & Redirects

1. In Supabase Dashboard, go to **Authentication -> URL Configuration**.
2. Add your production domain under **Redirect URLs** (e.g., `https://yourdomain.com/**` or `https://*.pages.dev/**`).

---

## 3. Deploying to Cloudflare Pages (Recommended)

Cloudflare Pages provides global edge distribution, static asset caching, and native SPA routing.

### Automatic Git Integration

1. Push your repository to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages -> Create Application -> Pages -> Connect to Git**.
3. Select the `museum-of-us` repository.
4. Configure Build Settings:
   - **Framework preset:** `None` (or `Vite`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
5. Configure Environment Variables:
   - `NODE_VERSION`: `20`
   - `VITE_SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJh...`
6. Click **Save and Deploy**.

### SPA Routing & Security Headers

The repository includes:

- `public/_redirects`: `/* /index.html 200` ensures client-side routing on deep links (`/m/:slug`, `/share/:id`, `/setup`).
- `public/_headers`: Enforces Content Security Policy (CSP), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `X-Robots-Tag: noindex, nofollow` on private `/m/*` rooms.

---

## 4. Deploying to GitHub Pages (Optional)

For users who want to host strictly on GitHub Pages:

1. Ensure GitHub Actions and Pages are enabled under repository **Settings -> Pages** (Source: **GitHub Actions**).
2. Go to the **Actions** tab in GitHub and select the **Deploy to GitHub Pages** workflow.
3. Click **Run workflow**, entering your repository name (e.g. `museum-of-us`) for the base path.
4. The workflow builds with `VITE_BASE=/<repo>/`, creates `dist/404.html` for SPA navigation, and publishes to GitHub Pages.

---

## 5. Deployment Verification (/setup)

Once deployed, visit `/setup` on your production URL:

- Inspects all 6 system pillars:
  1. Supabase Environment Variables
  2. Supabase Reachability
  3. Database Schema & RPC Functions
  4. Storage Bucket Configuration
  5. Auth Redirect URL matching
  6. Realtime engine (BroadcastChannel in Demo, Supabase Realtime in Live)
- All diagnostics provide exact green checks or clear remediation hints without ever exposing secrets.

---

## 6. Physical Card Printing Guidelines

When printing the white heart QR gift card for physical presentation:

- **Export Format:** Download the 1080x1080 PNG from `/share/:id`.
- **Dimensions:** Print at 300 DPI for a crisp 3.6 × 3.6 inch (9.1 × 9.1 cm) card, or 6 × 6 inch table card.
- **Paper:** 300–350 gsm heavy matte or linen cardstock. Avoid glossy laminates that cause camera reflections when scanning.
- **Corner Radius:** Cut corners with an 8% corner radius (~7.5 mm) to match the digital card silhouette.
