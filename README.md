# Museum of Us 🏛️❤️

> A 3D multiplayer love-letter museum & scannable heart-shaped QR gift card generator.

**Museum of Us** allows anyone to turn cherished photos, memories, and personal notes into an intimate, walk-through 3D virtual art museum. Creators generate an aesthetic, scannable **heart-shaped QR code** on a crisp white gift card. When recipients scan it with their phone or open it on desktop, they customize their avatar at the neoclassical museum doors, stroll through warm golden-hour galleries, inspect personal plaques up close, sit together on benches, and explore the museum together in real time.

---

## ✨ Highlights & Features

- **❤️ Scannable Heart QR Code:** Encodes links into a heart silhouette with Error Correction Level H, retaining 100% scannability across standard phone cameras. Includes a toggle to traditional monochrome Classic QR.
- **🖼️ 3D Neoclassical Art Gallery:** Built with Three.js & `@react-three/fiber`. Features limestone pilasters, wood double doors with ring pulls, track lighting, herringbone floors, and a cinema nook.
- **🎨 Procedural Anime Toon Avatars:** Zero external avatar dependencies. Fully procedural anime-proportioned characters with inverted-hull toon outlines, skin swatches, hair styles, and outfit presets.
- **🎭 Animations & Emotes:** Smooth skeletal procedural animations for walking, running, sitting on benches, clapping, waving, floating hearts, and a synchronized couple dance.
- **🔍 Cinematic Viewing Modes:** Press **E** or tap the interaction chip to dolly into framed memories and dedicated plaques with the signature dark-glass _"Viewing"_ pill.
- **🌐 Dual-Engine Multiplayer:**
  - **Demo Mode (Zero Config):** Cross-tab multiplayer using native browser `BroadcastChannel` with entity interpolation and flood guards.
  - **Live Mode (Supabase):** Global multiplayer presence and broadcast channels over WebSockets.
- **🤖 Scripted Host Companion & Takeover:** An AI companion guides the recipient through the museum if the creator is away. If the creator joins with `?as=host`, they seamlessly take control of the host avatar in real time.
- **📱 Responsive & Accessible:** Touch controls with virtual joystick on mobile. Fallback 2D carousel view (`?lite=1`) for screen readers and low-power devices. Fully audited with `axe-core` (WCAG AA).
- **🔒 Ironclad Privacy:** Client-side HTML5 canvas transcoding re-encodes photos to WebP ($\le 2048$ px) and **strips all EXIF/GPS metadata** before data ever leaves the browser. `noindex, nofollow` headers on all private rooms.

---

## 🚀 Quick Start

### 1. Zero-Configuration Local Development

The repository runs out of the box in **Demo Mode** with zero environment variables and no cloud accounts:

```bash
# Clone the repository
git clone https://github.com/your-username/museum-of-us.git
cd museum-of-us

# Install dependencies (Node 20 LTS recommended)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore:

- `/` — Atmospheric nocturnal landing page with live interactive 3D preview.
- `/create` — 6-step museum builder with autosave.
- `/m/demo` — Pre-seeded showcase museum.
- `/dashboard` — Local collection manager and guestbook inbox.
- `/setup` — Diagnostic panel checking live environment status.

---

## 🚢 Going Live

Going live for real-world sharing requires only a free Supabase project and two environment variables:

1. **Set Environment Variables:**

   ```bash
   VITE_SUPABASE_URL="https://<your-project>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<your-anon-key>"
   ```

2. **Apply Database Migration:**

   ```bash
   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<your-project>.supabase.co:5432/postgres" npm run db:migrate
   ```

3. **Verify at `/setup`:**
   Open `http://localhost:5173/setup` to inspect green diagnostic checks for database tables, RLS security rules, storage buckets, and realtime connectivity.

For detailed deployment guides to **Cloudflare Pages** and **GitHub Pages**, see [docs/DEPLOY.md](docs/DEPLOY.md).

---

## 🧪 Testing & Verification

The test suite contains **0 skipped tests** and **0 loose mocks**:

```bash
# Run the complete verification pipeline (required for all pull requests)
npm run verify
```

The verification pipeline executes:

1. `npm run typecheck` — TypeScript strict type checking (`tsc --noEmit`).
2. `npm run lint` — ESLint strict style and code quality rules.
3. `npm run test:unit` — Vitest unit tests (QR algorithms, avatars, colliders, image pipeline, slugs, layouts).
4. `npm run test:sql` — PGlite in-process PostgreSQL tests verifying Row-Level Security (RLS) policies and RPCs.
5. `npm run build` — Vite production compilation with Three.js chunk lazy loading.
6. `npm run check:size` — Bundle size budget enforcement ($\le 200$ kB gzip initial entry chunk).
7. `npm run test:e2e` — Playwright end-to-end tests across Chromium Desktop and Mobile viewports with `axe-core` accessibility audits.

---

## 🎨 Design System Tokens

```css
:root {
  --bg-0: #07080f; /* Deep nocturnal abyss */
  --bg-1: #0b0d1f; /* Midnight museum navy */
  --glow: #3a3320; /* Warm spotlight halo */
  --cream: #f3ead3; /* Museum plinth cream */
  --cream-dim: #b9b09a; /* Muted plaque cream */
  --gold: #c8b98a; /* Gilded brass accent */
  --sage: #b9b585; /* Start button sage */
  --ink: #0e0e10; /* Charcoal text */
  --heart: #e4325b; /* Raspberry heart QR */
  --card: #f7f4ef; /* Textured cardstock white */
  --presence: #2bc6b4; /* Online live indicator */
}
```

---

## 📖 Documentation

- [Deployment Guide (Cloudflare & GitHub Pages)](docs/DEPLOY.md)
- [Sharing, Card Printing & Scannability](docs/SHARE.md)
- [Privacy Architecture & Terms Templates](docs/PRIVACY_TERMS_TEMPLATES.md)
- [Engineering Decisions Log](DECISIONS.md)
- [Open-Source Asset Attribution](ASSETS.md)
- [Engineering Handoff & Architecture](HANDOFF.md)

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details. All third-party fonts and assets are open-source and documented in [ASSETS.md](ASSETS.md).
