# BUILD PROMPT — "Museum of Us": a QR-gift that opens a 3D, multiplayer love-letter museum

> You are a senior full-stack + real-time-graphics engineer working autonomously in this empty project folder.
> Read this entire file first. Then open and study **every image in `./reference/`** (they are frames from a real reel of the target experience, numbered in viewing order). Then build the product described below, phase by phase, verifying each phase before the next. Do not ask the human questions unless you are blocked on a credential you cannot obtain; otherwise decide, record the decision in `DECISIONS.md`, and continue.

---

## 0. What we are building (one paragraph)

A web product where a person (the **Creator**) uploads their photos/video and writes a short love note. The product generates a **heart-shaped, scannable QR code** on a shareable card ("☝ Scan this"). When the **Recipient** scans it (phone or laptop) it opens a website that shows a cinematic loading screen ("Our Museum — From _Ethan_ | To _Maya_"), a **Start** button, then a **character customizer** at the museum's front door, then drops them into a **3D art-gallery** where they walk a stylised avatar around, approach a lit plaque addressed to them, view each photo "framed" on gallery walls, sit on a bench in front of a video wall, chat via speech bubbles, dance — and, in real time, share the room with the Creator's avatar (live if the Creator is online, otherwise a scripted "host" companion). The Creator's own site also needs a landing page, a builder wizard, a dashboard, and a share screen.

Everything must work on **mobile browsers first** (the QR is scanned with a phone) and on desktop.

---

## 1. Ground rules

1. **Originality / IP.** The reel is _inspiration for a feature set and mood only_. Do **not** copy any third-party code, brand name, logo, copy, photo, avatar asset or music. Use no photo from the reference frames as an asset (they are someone's private photos). Placeholder artworks must be generated procedurally (see §9.3). All fonts, icons, sounds, models must be original, CC0 or OFL/open-licensed, and listed in `ASSETS.md` with license.
2. **No dead services.** Ready Player Me shut down in Jan 2026 — do **not** depend on it or any third-party avatar API. Avatars are procedural (see §8).
3. **Work in phases (§12).** After each phase: run `npm run verify`, commit with a clear message, tick the phase in `PROGRESS.md`. Never leave the repo broken at a commit.
4. **Demo Mode first.** The whole app must run with **zero external accounts** (`VITE_DEMO_MODE=1`): in-memory/localStorage data layer + `BroadcastChannel` for multiplayer between two tabs. The production adapter (Supabase) implements the _same interfaces_. Build and test against Demo Mode, then add the real adapter.
5. **Secrets.** Never commit secrets. Only the Supabase _anon_ key ever reaches the client. Provide `.env.example`. No `service_role` key in client code, ever.
6. **Quality bar.** It must _look_ like a calm, expensive art gallery — not a tutorial. Typography, spacing, easing and lighting are first-class requirements, not polish.
7. **Honesty about verification.** In your final report state what you actually ran and saw (tests, screenshots), and list anything not verified.

---

## 2. Reference: what the reel shows (frame-by-frame analysis, 18.6 s, 30 fps, 720×1280, filmed off a laptop screen)

> The reel is a screen recording of a laptop. The right edge of the browser is cropped, so the customizer panel is only partly visible — complete it sensibly (§7.2).

| Time      | Ref image      | What is on screen / what happens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0–2.0 s | `01_…`         | Social-app **DM thread** (dark navy UI, avatar "ethan ♡"). Bubble: _"i made this for you 🥺"_. A **big white rounded-square card (radius ≈ 8 % of width)** holding a **heart-shaped QR** in raspberry-red, with a pointing-hand icon + **"Scan this"** in the same red under it. Reply bubble: _"scan it ❤️"_. (This DM is the _context_ of sharing; our product must produce this card.) Slow push-in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2.0–3.0 s | `02_…`         | Card close-up. The heart is filled edge-to-edge with QR-style modules; three small rounded "finder" squares sit inside the heart (left, right, bottom). Colour ≈ `#E4325B`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3.0–4.0 s | `03_…`         | Browser tab titled "Ethan to M…". Near-black navy page with a warm radial glow. **"Our Museum"** in a tight, high-contrast display serif, cream with a soft glow. Below: **From _Ethan_ │ To _Maya_** (names in italic serif, thin vertical divider). A 2 px cream **progress line** with tiny bold labels **"Ready"** (left) and **"100%"** (right).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4.0–5.0 s | `04_…`         | Progress line is replaced by a **"Start" pill button** (sage/khaki fill ≈ `#B9B585`, dark text, fully rounded) and a checked checkbox **"Open in full screen"**. Browser shows "To exit full screen, press **Esc**" toast. Cursor hovers the checkbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 5.0 s     | `05_…`         | Cross-dissolve from the title card into a **3D neoclassical museum facade** (limestone blocks, pilasters, tall **double wooden doors with ring pulls**, stone steps, glossy floor, **warm golden-hour light**). Sign above door reads "Our Museum". An **anime-styled female avatar** (long brown hair, charcoal top with belt, cream trousers, brown ankle boots) stands in front of the door. Controls: **‹ ›** circular chevrons bottom-left/right of the avatar, a **"Close-up"** pill bottom-left, and a **right-hand glass panel**: small grey "No account needed", big serif heading ("Your character"), icon tabs, tab labels (Hair…/Skin/…), **"Skin tone"** swatches (**Original** = slashed-circle, **Sienna** = brown dot, more), hint "Drag your character to rotate", **"Your name"** input pre-filled **"Maya"**, a tiny helper line, and a **full-width black pill button** at the bottom. |
| 5.5–6.5 s | `06_…`         | **Inside the gallery** (third-person camera, slightly behind/above the avatar). Matte-black ceiling with thin tile-grid lines and small track lights; white floor with fine micro-pattern; warm-white walls; a **freestanding black feature wall** on a low white plinth with a **soft spotlight hot-spot** on it and one large **framed portrait photo**. In front: a white **pedestal with a tilted black plaque**. A second avatar — the **host** (short curly brown hair, black vest over light shirt, navy trousers, brown shoes) — has a **name-tag pill** (dark, small teal presence dot + "Jack") and a **white speech bubble** _"our whole winter is on these walls"_.                                                                                                                                                                                                                            |
| 6.5–7.5 s | `07_…`         | Avatar walks toward the pedestal; a small **interaction chip** appears at the plaque: **🔍 + [E] key-cap**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 7.5–8.5 s | `08_…`, `09_…` | Press E → **camera fly-in** (dolly + narrowing FOV, brief motion blur/wobble) onto the plaque. Top-centre dark glass **"Viewing"** pill (italic serif). The plaque fills the width: small letter-spaced gold eyebrow **A PERMANENT COLLECTION**, big serif **For Maya**, hairline divider, **"Our whole winter, hung on the walls, just for you."** (last words italic), italic sign-off **Love, Ethan** (muted). Background dark navy `#0B0D1F`.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 8.5–10 s  | `10_…`, `11_…` | Exit viewing; avatars walk along a long white wall hung with **black-framed photos with white mats**, lit by track lights. Host avatar stands facing a photo (name-tag over his head). Landscape photo in a thin black frame further along.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 10–12.5 s | `12_…`, `13_…` | **Artwork viewing mode** — camera glides to ~1.3 m in front of a frame; the black frame + white mat + photo fill the screen, "Viewing" pill on top, slight perspective tilt while the camera settles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 12.5–14 s | `14_…`         | A **second wing**: black wall, two photos side-by-side; both avatars stand in front, looking at them. Host has a name-tag with teal dot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 14–17 s   | `15_…`, `16_…` | **Cinema nook**: a big black-bezel **video/photo wall** (content changes between frames → slideshow or video). Two avatars **sit side-by-side on a low wooden bench**, backs to camera. Bubble above screen: _"i love you maya ❤️"_ with the host's name-tag. Camera sits behind them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17–18.6 s | `17_…`         | Back at the hero wall; **both avatars dancing** (emote, mirrored); host's bubble reads _"dance with me"_. (Overlay text "Make one for your partner. Link in bio ❤️" is the reel's own caption — it implies a **marketing landing page** with a "make yours" CTA.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Inferred product features** (not directly visible, but required by the experience): real-time multiplayer presence; chat bubbles; emotes (wave/dance/sit); proximity interaction with `E`; fullscreen option; personalised names; per-museum plaque text; creator-side builder + sharing.

---

## 3. Fixed technical decisions (do not re-litigate)

| Concern        | Decision                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language       | TypeScript (strict) everywhere                                                                                                                                                  |
| App            | **Vite + React 18** SPA, `react-router`                                                                                                                                         |
| 3D             | **three.js** via **@react-three/fiber** + **@react-three/drei** (lazy-loaded chunk; the landing page must not pull three.js)                                                    |
| State          | `zustand`                                                                                                                                                                       |
| Styling        | Tailwind CSS + CSS variables for design tokens; no component library                                                                                                            |
| Animation (UI) | `framer-motion` (respect `prefers-reduced-motion`)                                                                                                                              |
| Backend        | **Supabase**: Postgres + RLS, Storage, Realtime (Broadcast + Presence), Auth (magic link; optional Google)                                                                      |
| Frontend host  | **Cloudflare Pages** (static `dist/` + optional Pages Functions). Do **not** assume Vercel (free tier is non-commercial).                                                       |
| QR             | `qrcode` for encoding; own renderer for the heart style; `jsqr` for decode tests                                                                                                |
| Image pipeline | client-side: `heic2any` (HEIC→JPEG), canvas re-encode to **WebP ≤ 2048 px long edge, q≈0.82** (this also **strips EXIF/GPS** — mandatory)                                       |
| Tests          | `vitest` (unit), `@playwright/test` (e2e + screenshots; launch Chromium with `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` so WebGL works headless) |
| Lint/format    | ESLint + Prettier; `npm run verify` = typecheck + lint + unit + build + e2e smoke                                                                                               |
| Node           | 20 LTS                                                                                                                                                                          |

Create `DECISIONS.md` for anything you deviate on, with the reason.

---

## 4. Repository layout

```
/
  BUILD_PROMPT.md  reference/               (given)
  PROGRESS.md  DECISIONS.md  ASSETS.md  HANDOFF.md  README.md
  .env.example  .gitignore  package.json  vite.config.ts  tailwind.config.ts
  public/  _redirects  _headers  favicon.svg  og-default.png  robots.txt
  functions/            (Cloudflare Pages Functions; optional per-museum OG – see Stretch in §12)
  supabase/
    migrations/0001_init.sql
    seed.sql            (optional)
    config.toml
  docs/  DEPLOY.md  SHARE.md  PRIVACY_TERMS_TEMPLATES.md
  src/
    app/        routes, layout, providers
    design/     tokens.css, typography, components (Button, Pill, Input, Swatch, Sheet, Toast…)
    pages/      Landing, Create (wizard), Dashboard, Share, Museum (experience), Legal, NotFound
    features/
      qr/         heartQr.ts  renderSvg.ts  renderCanvas.ts  shareCard.ts  *.test.ts
      museum/     schema.ts (zod)  layout.ts (RoomPlan generator)  demoData.ts  placeholderArt.ts
      world/      Scene.tsx  Room.tsx  materials.ts  lights.tsx  colliders.ts  camera.ts  controls.ts  focusMode.ts  Hud.tsx
      avatar/     avatarConfig.ts  buildAvatar.ts  animations.ts  Customizer.tsx  DoorScene.tsx
      multiplayer/ channel.ts  presence.ts  interpolation.ts  hostNpc.ts  chat.ts
      uploads/    imagePipeline.ts  videoValidate.ts  uploader.ts
      data/       DataClient.ts (interface)  demoClient.ts  supabaseClient.ts
    lib/  env.ts  a11y.ts  device.ts  nanoid.ts  sanitize.ts
  e2e/  *.spec.ts  (+ e2e/__screenshots__)
  .github/workflows/ci.yml
```

---

## 5. Design system (derive everything from these tokens)

**Mood:** quiet, nocturnal, museum-grade; warm candle-gold accents on deep navy-black; the gallery interior is bright, white and architectural.

```css
:root {
  /* page + title screens */
  --bg-0: #07080f; /* near-black navy */
  --bg-1: #0b0d1f; /* plaque / panels */
  --glow: #3a3320; /* warm radial glow behind title (≈ 25% opacity) */
  --cream: #f3ead3; /* primary text on dark */
  --cream-dim: #b9b09a;
  --gold: #c8b98a; /* eyebrows, small caps */
  --sage: #b9b585; /* "Start" pill */
  --ink: #0e0e10; /* primary buttons on light panels */
  /* gallery interior */
  --wall: #edebe6;
  --floor: #f1efea;
  --ceiling: #0a0a0b;
  --feature-wall: #0b0b0d;
  --wood: #8a6a4a;
  --bench: #cbbfa6;
  /* heart QR + share card */
  --heart: #e4325b;
  --card: #f7f4ef;
  /* chat + presence */
  --bubble: #ffffff;
  --bubble-ink: #2b2f3a;
  --presence: #2bc6b4;
  --tag: #14161f;
  /* radii & motion */
  --r-pill: 999px;
  --r-card: 28px;
  --r-panel: 22px;
  --ease: cubic-bezier(0.22, 0.8, 0.2, 1);
  --dur-1: 180ms;
  --dur-2: 420ms;
  --dur-3: 900ms;
}
```

**Type:** Display = **Instrument Serif** (regular + _italic_) — tight tracking (−0.02em), used for "Our Museum", names, plaque title, "Viewing". UI = **Inter** (400/500/600). Eyebrows: 11–12 px, uppercase, letter-spacing 0.28em, `--gold`. Self-host both (woff2) from `@fontsource` packages — no runtime Google Fonts request. Title sizes: clamp(56px, 11vw, 120px) on the title screen.

**Components:** Pill button (h 44, fully rounded; variants `sage`, `ink`, `ghost`), glass panel (bg `rgba(255,255,255,.82)`, blur 18 px, 1 px border `rgba(0,0,0,.06)`, shadow `0 20px 60px rgba(0,0,0,.25)`), swatch (48 px tile, circle 28 px, label 11 px), name-tag pill (bg `--tag`, white 12 px/600, 6 px teal dot), speech bubble (white, radius 14, tail 8 px, 13 px text, max-width 220, soft shadow, fades out after ~5 s), key-cap chip (rounded-rect with 1 px border), "Viewing" pill (dark glass, italic serif 15 px, centered 16 px from top).

**Motion:** everything eases with `--ease`; screen changes cross-dissolve 600–900 ms; camera moves 700–1100 ms ease-in-out; honour `prefers-reduced-motion` by replacing fly-ins with 200 ms cuts.

---

## 6. Routes & pages

| Route                           | Purpose                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/`                             | Landing (marketing)                                                                                             |
| `/create`                       | Builder wizard (works logged-out; autosaves draft in IndexedDB; auth is requested only at _Publish_)            |
| `/dashboard`                    | Creator's museums: status, visits, replies, edit, unpublish, delete, "Enter as host", re-download share assets  |
| `/share/:id`                    | Post-publish share screen (heart QR card + link + downloads)                                                    |
| `/m/:slug`                      | **The experience** (recipient). `?as=host` for the owner to join as live host. `?preview=1` for builder preview |
| `/m/demo`                       | Built-in demo museum with procedural art (no backend)                                                           |
| `/privacy`, `/terms`, `/report` | Legal templates + abuse-report form                                                                             |
| `*`                             | Not-found page in brand style                                                                                   |

`/m/*` must send `X-Robots-Tag: noindex, nofollow` and `<meta name="robots" content="noindex">`.

---

## 7. The recipient experience — exact behaviour

### 7.1 Boot → Loading → Start

1. `/m/:slug` fetches the museum via RPC `get_museum(slug)` (see §11). Not found / unpublished / expired → elegant "This museum has closed." screen.
2. **Loading screen** (ref `03`): full-viewport `--bg-0` with radial warm glow; centred title `museum.title` (default "Our Museum"); under it `From <i>{from_name}</i> │ To <i>{to_name}</i>`; thin progress line + **"Loading" → "Ready"** label left and **real percentage** right, driven by actual asset progress (`THREE.LoadingManager`/fetch progress for textures, video poster, fonts). Set `document.title = "{from} to {to}"`.
3. At 100 % cross-fade the bar into the **Start** pill (ref `04`) + checkbox **"Open in full screen"** (default checked). Hide that checkbox where `document.fullscreenEnabled` is false (iOS Safari). Clicking Start: request fullscreen if checked (try/catch), resume `AudioContext`, begin cross-dissolve to §7.2. Also support Enter/Space.
4. Preload strategy: stream the lightweight 3D chunk during the title screen; textures load by distance priority; the video loads lazily when the visitor nears the cinema nook.

### 7.2 Character customizer at the museum door (ref `05`)

- **Scene:** a stylised neoclassical facade built from primitives (limestone box blocks with subtle bevel + procedural noise texture, two pilasters, entablature with the museum title carved as text mesh or texture, double wooden doors with ring pulls, 3 stone steps, glossy floor with cheap fake reflection). Warm golden-hour key light + cool fill; slight vignette. The avatar stands on the steps with idle breathing animation; drag horizontally to rotate (`OrbitControls` limited to azimuth only).
- **Controls on stage:** **‹ ›** round buttons cycle **outfit presets**; **"Close-up"** pill toggles a face/torso close-up camera (700 ms ease).
- **Right glass panel** (desktop: 360 px wide column, vertically centred; mobile: bottom sheet that can collapse):
  - small grey line **"No account needed"**
  - serif H2 **"Your character"**
  - icon tab row: **Hair · Skin · Outfit · Shoes · Extras**; each tab has a sub-row of chips (e.g. Hair → _Style_ / _Colour_)
  - **Skin tone** grid: first swatch **Original** (slashed circle = default tone), then ≥ 8 tones (e.g. _Porcelain, Sand, Honey, Sienna, Umber, Espresso…_); selected swatch has a 2 px `--ink` ring
  - hint **"Drag your character to rotate"**
  - label **"Your name"** + input, **pre-filled with `to_name`** (max 20 chars, trimmed, profanity-light filter, no HTML)
  - helper: _"Other visitors see this above your head."_
  - full-width black pill **"Enter the museum"**
- Persist the choice in `localStorage` (wrapped in try/catch; app must work without it).
- **Enter:** doors swing open (900 ms), camera dollies through, 400 ms white-warm fade, then the gallery.

### 7.3 The gallery world (ref `06`–`17`)

**Units:** 1 unit = 1 m. Avatar height ≈ 1.7 m. Eye-level for art centres ≈ 1.55 m.

**Architecture (generated by `layout.ts` from the artwork list — a deterministic pure function with unit tests):**

- One main **hall ≈ 16 × 26 m**, ceiling 5 m. Matte-black ceiling with a thin tile grid (line texture) and **instanced track lights** (small cylinders) every 2.4 m.
- **Floor:** near-white with a fine procedural micro-pattern (generate on canvas: herringbone or fine dots) + faint roughness variation. **Walls:** warm white with a subtle baseboard shadow line.
- **Feature walls:** 1–3 _freestanding_ black panels (6 m × 4.2 m, thin) standing on a **low white plinth (0.35 m)**. Each is washed by a **soft spotlight hot-spot** — implement as a cheap additive radial-gradient decal + one real SpotLight on the hero only.
- **Hero wall** (ref `06`/`17`): hero artwork (first photo, ~1.4 × 1.9 m) centred; in front a **white pedestal (1 × 1 × 0.9 m) with a black plaque tilted ~20°** carrying the plaque text.
- **Perimeter + partition walls** hold the remaining artworks at 2.4 m spacing, each as: **25 mm black frame + 90 mm white mat + image**, height-normalised ≈ 1.2 m keeping aspect ratio, a tiny museum **label card** beside each (title in serif, caption in sans 9 px).
- **Cinema nook** (far end): large **black-bezel screen** (3.2 × 1.8 m) on a white wall and a **two-seat low wooden bench** (≈ 1.8 m) facing it, 3.5 m away. If a video was uploaded it plays (muted until user taps; poster first); otherwise the screen cross-fades through the photos every 5 s.
- Capacity: support 1–24 photos + 0–1 video. If the artwork count is small, shrink the hall and drop partitions; never leave large empty halls.
- **Lighting/quality:** hemisphere + one directional light, ACES tone mapping, sRGB output; **max 2 shadow-casting lights** (hero spot, directional for avatars at 1024 map); contact-shadow blobs under other avatars; fake the rest. Optional very light SMAA/FXAA only.
- **Colliders:** 2-D AABB list (walls, plinths, pedestal, bench base); avatar = circle r 0.3 with slide-along-wall resolution.

**Camera:** third-person follow, 3.2 m behind / 1.9 m above, damped (critical-damping, ~0.12 s), look-at slightly above head; mouse-drag / touch-drag orbits ±70° yaw and −10…+35° pitch; wheel / pinch zoom 2–5 m; camera never clips through walls (raycast pull-in).

**Movement:**

- Desktop: **WASD / arrows**, **Shift** to run, **click floor** to walk there (straight line with sliding; cancel on key press).
- Mobile: **left virtual joystick**, right-side drag orbits, a context **Interact** button appears near things.
- Walk speed 1.6 m/s, run 3.2 m/s; turn smoothing; footstep sound (soft, optional).

**Interactions** (proximity radius 2.2 m, nearest wins): show chip **[🔍 | E]** (touch: round button with 🔍). Targets: plaque, each artwork, bench seats, video screen.

- **Focus/"Viewing" mode:** camera flies (800–1000 ms, FOV 55→38, slight ease-in-out overshoot) to ~1.3 m from the target; the **"Viewing"** pill appears; for the plaque, render the text block (`A PERMANENT COLLECTION` / `For {to_name}` / divider / body / `{signoff}`) as crisp HTML overlay or high-res canvas texture with the typography from ref `09`. **←/→ (swipe)** moves to neighbouring artworks, **Esc / tap outside / ✕** exits. Pinch-zoom inside viewing mode for photos on touch.
- **Bench:** interact → avatar walks to the nearest free seat and plays _sit_ (loops). If the host NPC/live host exists, they take the other seat. Sitting changes camera to the "behind-them" view of ref `16`; the screen starts playing.
- **Emotes** (HUD button + keys 1–4): `1 wave`, `2 dance` (loop), `3 clap`, `4 heart` (floats ♥ particles). Dancing emits a presence flag so others mirror it.

### 7.4 HUD (minimal, auto-hides after 4 s idle on desktop; compact always-visible on mobile)

Bottom-centre cluster: 💬 chat (opens "Say something…" pill input; Enter sends; ≤ 120 chars; plain text/emoji only) · 😊 emotes · 🔊 sound · ❔ help · ⋯ menu (Leave a message for {from} · Report · Make one for your partner · Exit). First-visit toast: _"WASD to walk · drag to look · E to interact"_ (4 s). No other persistent UI — the 3D scene is the star.

### 7.5 Chat & name-tags

- **Name-tag:** dark pill above head, teal presence dot, name. Visitors and host look identical except a tiny ♡ after the host's name.
- **Bubble:** white speech bubble above the tag; one at a time per avatar; fades after 5 s; sanitised text only (React text nodes, never `dangerouslySetInnerHTML`).
- `aria-live="polite"` region mirrors chat for screen readers.

### 7.6 Multiplayer & the Host (§10 has the protocol)

- If the **Creator is online as host** (`?as=host` from their dashboard, requires auth + ownership), the recipient sees them live.
- If not, a **Host NPC** (the creator's configured avatar + name, default from `from_name`) is spawned locally and behaves per §10.3. When a real host appears, the NPC fades out and the host fades in.
- Up to 8 simultaneous humans per museum; the 9th sees "The museum is full right now."

### 7.7 End-of-visit

Menu → **"Leave a message for {from}"** opens a small sheet (name prefilled, ≤ 500 chars) → stored via RPC `post_reply` (rate-limited) → shows in Creator's dashboard inbox.

### 7.8 Accessibility, resilience, fallback

- Everything operable by keyboard; visible focus rings; contrast ≥ 4.5:1 for UI text; `prefers-reduced-motion` honoured; alt text for artworks from captions.
- **Fallback 2-D gallery** (`/m/:slug?lite=1`, and auto-offered if WebGL is unavailable, context is lost, or median FPS < 20 for 5 s): a beautiful full-screen carousel with the same plaque, captions, chat-less, video player. The recipient must **never** hit a dead end.
- Pause rendering when the tab is hidden; stop network sends when idle > 60 s.

---

## 8. Avatars (procedural, original)

Build in code — **no external avatar service, no copied models**. Stylised, anime-leaning proportions (head ≈ 1/6.5 body), toon-ish shading (`MeshToonMaterial` or custom 3-step ramp) with a thin inverted-hull outline; soft rim light. Smooth forms (capsules, lathe, spheres, extruded hair-card shapes) — **no visible box limbs**.

```ts
type AvatarConfig = {
  preset: "a" | "b" | "c"; // 3 body silhouettes
  skin: string; // hex; 'original' = default tone
  hairStyle:
    | "long"
    | "bob"
    | "ponytail"
    | "bun"
    | "short"
    | "curly"
    | "wavy"
    | "buzz"
    | "none";
  hairColor: string;
  top: "tee" | "sweater" | "vest-shirt" | "turtleneck" | "hoodie" | "blouse";
  topColor: string;
  bottom: "trousers" | "jeans" | "skirt" | "shorts";
  bottomColor: string;
  shoes: "boots" | "sneakers" | "loafers";
  shoesColor: string;
  extras: Array<"glasses" | "beanie" | "earrings" | "scarf" | "belt">;
};
```

- **Default visitor** (≈ ref `05`): long dark-brown hair, charcoal fitted top + belt, cream trousers, dark-brown ankle boots.
- **Default host** (≈ ref `06`): short curly brown hair, black vest over light shirt, navy trousers, brown loafers.
- `validateAvatarConfig()` (zod) clamps unknown values — configs arrive from other clients over the network and are **untrusted**.
- **Rig:** simple hierarchical pivots (hips, spine, head, shoulders, elbows, hips, knees) driven procedurally. Animations: `idle` (breathing + weight shift), `walk`/`run` (phase tied to speed), `sit`, `wave`, `clap`, `dance` (2 looping styles: A and mirrored-B), `look-at-art`. Blend with 150 ms cross-fades.
- Share geometry/materials across avatars; ≤ 12 k tris per avatar; use `InstancedMesh` where sensible.
- Architecture must allow dropping in a CC0 rigged GLB later (`AvatarSource` interface) — but ship procedural.

---

## 9. Creator side

### 9.1 Landing (`/`)

Dark navy, same serif/cream/gold language. Sections: hero ("Turn your photos into a museum only they can walk through." + CTA **Make one for your partner**), a looping silent demo (live mini-scene or recorded loop of `/m/demo`), 3-step explainer (_Upload · Share the heart QR · They walk through your memories_), a 3-card feature row (Multiplayer · Plaque with your words · Works on phones), privacy promise (unlisted links, EXIF stripped, delete anytime), FAQ, footer (privacy/terms/report). Pricing section is a placeholder toggled by `VITE_PRICING=off`. LCP < 2.5 s on 4G; three.js not loaded here.

### 9.2 Builder wizard (`/create`) — 6 steps with a progress rail, autosave draft to IndexedDB

1. **Names:** From, To (+ optional museum title; default "Our Museum").
2. **Memories:** drag-drop / pick up to **24 photos** (+ optional **1 video ≤ 30 MB**, mp4/webm). Convert HEIC; resize/re-encode to WebP (strip EXIF); show thumbnails with upload progress; reorder (drag), set caption/title, choose the **hero** photo (first by default). Reject non-images, > 15 MB originals, corrupt files with friendly messages. Show total size.
3. **Plaque:** eyebrow (default _A permanent collection_), title (default _For {to}_), body (≤ 280, default _"Our whole winter, hung on the walls, just for you."_), sign-off (default _Love, {from}_). **Live plaque preview** in the exact §7.3 typography.
4. **Host:** host name (default `from_name`), avatar via the same customizer, up to 6 **host lines** (defaults: _"Welcome 🤍 I made this just for you."_ · _"Take your time — every frame is a memory."_ · _"Come sit with me?"_ · _"Dance with me?"_).
5. **Preview:** the real experience in an iframe at phone and desktop sizes (`?preview=1`, no data written).
6. **Publish:** requires sign-in (magic-link email; optional Google). On success → `/share/:id`.

### 9.3 Placeholder art (no copyrighted images)

`placeholderArt.ts` generates artworks on `<canvas>`: soft duotone gradients + subtle grain + big italic serif numeral and the words "Your photo here". Use for `/m/demo`, tests and empty builder state.

### 9.4 Share screen (`/share/:id`)

- Big **heart QR share card** (see §10 QR) with **Copy link**, **Share** (Web Share API), **WhatsApp / Telegram / Messenger / SMS** deep-link buttons, **Download**: Card PNG 1080², **Story PNG 1080×1920** (navy background, card centred, optional caption line like _"i made this for you 🥺"_), **SVG**, plain-QR PNG fallback.
- Toggle **"Classic QR instead of heart"** (higher scan reliability) and **"Show a preview image when the link is shared"** (default **OFF** — privacy).
- Copy tips: print ≥ 3 cm; test on 2 phones.

### 9.5 Dashboard (`/dashboard`)

Cards per museum: hero thumbnail, names, status chip, visit count, replies count, **Edit**, **Share**, **Enter as host**, **Unpublish/Publish**, **Delete** (typed-confirmation; removes DB rows + storage objects). Replies inbox (read-only list).

---

## 10. Heart QR + multiplayer protocol + Host NPC

### 10.1 Heart QR (`features/qr/heartQr.ts`) — must be **scannable**, verified by tests

- Encode a **short URL** (`https://{host}/m/{slug}`; slug = 10-char lowercase base-36 from `crypto.getRandomValues`) with `qrcode`, **error-correction H**.
- **Do not distort or clip the real QR.** Algorithm: render the genuine QR matrix (with its three standard finder patterns drawn as **rounded concentric squares**) centred in the heart's bounding area, scaled so its four corners lie _inside_ the heart silhouette; then **fill the rest of the heart with decorative modules** (same module size and colour, seeded PRNG from the slug, ~45 % density), leaving a **2-module empty margin** around the real QR so decoders lock onto the finders. Heart silhouette = implicit curve `(x²+y²−1)³ − x²y³ ≤ 0` scaled to the card; modules drawn only where their centre is inside.
- Module style: rounded dots/squares in `--heart`; card = `--card` rounded square (radius ≈ 8 %), heart ≈ 72 % of card width, then the pointing-hand glyph + **"Scan this"** in `--heart`, 600 weight.
- **Validated starting point:** `reference/heart_qr_prototype.cjs` (+ `heart_qr_prototype_output.png`) is a working prototype of exactly this algorithm. Measured on 60 random slugs with `jsqr`: real-QR width = **46–50 % of the heart width**, margin = **2 modules**, decoration density = **0.45**, EC `H` → **59–60 / 60 decoded at 512 px and 360 px, 60 / 60 at 1024 px**; shrinking the core to 40 % dropped 360 px decoding to 45 / 60 — so **never go below ~46 %**. Port it to TypeScript, add rounded modules/finders and the card, and keep the decode tests as a regression guard.
- Output: SVG string + canvas PNG at any size (default 2048).
- **Tests (vitest + jsqr):** for 50 random slugs, render PNG at 1024, 512 and 320 px, plus after applying 3 % blur/noise and 8° rotation → `jsqr` must decode the exact URL ≥ 98 % of the time at ≥ 512 px. If the heart variant fails this bar, increase margin/shrink decoration density until it passes. Also test the Classic QR (must be 100 %).

### 10.2 Realtime protocol (Supabase Realtime in prod, `BroadcastChannel` in Demo Mode)

- Channel name `museum:{slug}`. Presence key = per-tab random UUID; presence payload `{name, role:'visitor'|'host', avatar, joinedAt}` (validated on receipt).
- Broadcast events (JSON, ≤ 1 KB): `pos {id,x,z,ry,anim,t}` @ ≤ 10 Hz **only when changed**; `chat {id,text,t}`; `emote {id,kind,t}`; `sit {id,seat|null}`.
- Receiver: **interpolate** with a 100 ms buffer; clamp positions to room bounds; drop malformed or flooding peers (> 30 msgs/s). Sanitise text; strip control chars; cap 120.
- Cap 8 humans. Auto-reconnect with exponential backoff; stop sending when `document.hidden` or idle > 60 s. Stay well inside Supabase free-tier realtime quotas.

### 10.3 Host NPC (`hostNpc.ts`) — deterministic state machine

`Away → Greeting` (3 s after visitor spawns: NPC walks to ≤ 3 m of visitor, says `host_lines[0]`) → `Guiding` (loosely follows at ~2 m; when visitor lingers > 6 s near an artwork, says that artwork's caption or the next line, round-robin) → `Seated` (when visitor sits, NPC takes the other seat; says the "i love you" style line) → `Dancing` (when visitor dances, NPC mirrors; says the "dance with me" line if the visitor is idle near the hero wall > 20 s). Never blocks the visitor; collisions via the same collider system. Fully unit-tested as a pure reducer.

---

## 11. Backend (Supabase) — write `supabase/migrations/0001_init.sql`

Requirements (you write and test the SQL; adapt syntax as needed):

```sql
create extension if not exists pgcrypto;

create table public.museums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]{10,16}$'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title text not null default 'Our Museum' check (char_length(title) between 1 and 40),
  from_name text not null check (char_length(from_name) between 1 and 30),
  to_name   text not null check (char_length(to_name)   between 1 and 30),
  plaque_eyebrow text not null default 'A permanent collection' check (char_length(plaque_eyebrow) <= 40),
  plaque_title   text not null check (char_length(plaque_title) <= 60),
  plaque_body    text not null check (char_length(plaque_body)  <= 280),
  plaque_signoff text not null default '' check (char_length(plaque_signoff) <= 60),
  host_name text not null default 'Host' check (char_length(host_name) <= 20),
  host_avatar jsonb not null default '{}'::jsonb,
  host_lines text[] not null default '{}' check (cardinality(host_lines) <= 6),
  theme text not null default 'winter-gallery',
  share_preview boolean not null default false,
  expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  museum_id uuid not null references public.museums(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  storage_path text not null,
  poster_path text,
  title text check (char_length(title) <= 60),
  caption text check (char_length(caption) <= 200),
  taken_on text check (char_length(taken_on) <= 30),
  width int, height int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  museum_id uuid not null references public.museums(id) on delete cascade,
  visitor_name text not null check (char_length(visitor_name) <= 20),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null, reason text not null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
```

- **RLS ON for all tables.** Owners: full CRUD on their own `museums`/`artworks`; read own `replies`. **Anonymous users get no direct table access**; they use `SECURITY DEFINER` RPCs with `set search_path = public`:
  - `get_museum(p_slug text) returns jsonb` → only if `status='published'` and (`expires_at is null or > now()`); returns museum fields **without `owner_id`**, plus ordered artworks; includes a public image base URL helper or the storage paths.
  - `track_visit(p_slug text)` → increments `view_count` (cheap, no PII).
  - `post_reply(p_slug text, p_name text, p_message text)` → validates, **rate-limits** (≤ 3 per museum per minute), inserts.
  - `post_report(p_slug text, p_reason text)` → inserts, rate-limited.
  - `grant execute` to `anon, authenticated` for those four only.
- Triggers: enforce **≤ 24 photos + ≤ 1 video per museum**; keep `updated_at`.
- **Storage:** bucket `artworks` (public read — object names are `{museum_id}/{uuid}.webp|mp4`, i.e. unguessable); file-size limit 32 MB; allowed MIME `image/webp,image/jpeg,image/png,video/mp4,video/webm`. Policies: insert/update/delete only where the first path segment is a museum id owned by `auth.uid()`.
- Provide `supabase/config.toml` and a script `npm run db:types` that generates TS types if the Supabase CLI is present.
- **Integration tests** (skippable when no env): prove anon cannot `select * from museums`, cannot read other owners' rows, cannot upload to another owner's folder, can call the four RPCs, and that an unpublished museum returns null.

`DataClient` interface (implemented by `demoClient` and `supabaseClient`): `getMuseum, trackVisit, postReply, postReport, listMyMuseums, createMuseum, updateMuseum, publish/unpublish, deleteMuseum, uploadArtwork, deleteArtwork, signInWithEmail, signOut, onAuthChange, openChannel(slug)`.

---

## 12. Phases, with acceptance criteria

**P0 – Scaffold.** Vite+TS+Tailwind, ESLint/Prettier, vitest, Playwright, CI workflow, env handling (`lib/env.ts` validates `VITE_*`), Demo-Mode data layer, routing skeleton, `PROGRESS.md`. ✅ `npm run verify` green.

**P1 – Design system + Landing.** Tokens, fonts self-hosted, components, landing page responsive 360→1920 px. ✅ Lighthouse (mobile) Perf ≥ 90, A11y ≥ 95 on `/`; screenshot at 390×844 and 1440×900.

**P2 – Heart QR + share card exports.** §10.1 complete. ✅ decode tests pass; visual check against `reference/01` and `02` (same look: white rounded card, red heart, "Scan this").

**P3 – World core.** Room generator, materials, lighting, colliders, camera, controls (desktop + touch), placeholder art, framed artworks, hero wall + plaque mesh, cinema nook, bench. ✅ `/m/demo` renders at ≥ 55 fps desktop (headless swiftshader may be lower — report real numbers) and visually matches refs `06`, `10`, `15` in mood (black ceiling grid, white floor, black feature wall with hot-spot, framed art).

**P4 – Avatars + door/customizer.** §8 + §7.2. ✅ Customizer reachable, all swatches work, avatar rotates, defaults match refs `05`/`06`; config persists; e2e passes.

**P5 – Full experience flow.** Loading → Start → customizer → doors → gallery; interaction chips, **Viewing** mode for plaque and artworks (with arrows/swipe/Esc), bench sit, emotes, chat bubbles, name-tags, HUD, help toast, fullscreen option. ✅ e2e script walks the whole flow in Demo Mode and saves screenshots matching reference moments `03, 04, 05, 06, 07, 09, 12, 16, 17`.

**P6 – Multiplayer + Host NPC.** §10.2–10.3 with `BroadcastChannel` demo transport and Supabase transport. ✅ Two Playwright pages join the same demo room, see each other, chat, and emote; NPC reducer tests pass; NPC yields to a real host.

**P7 – Builder + uploads + dashboard.** §9.2, §9.5 against the Demo client. ✅ e2e: create museum with 6 generated images + plaque + host lines → publish → open `/m/{slug}` → correct names/plaque/captions; EXIF GPS provably stripped (unit test with a fixture that has GPS tags).

**P8 – Supabase adapter + SQL.** §11 + real auth, storage, RPCs, realtime. ✅ Migration applies cleanly on a fresh project; integration tests pass when `SUPABASE_*` env vars are present; otherwise they are skipped with a clear message.

**P9 – Hardening.** Performance budgets (initial landing JS ≤ 200 kB gz; experience chunk lazy; ≤ 150 draw calls; DPR cap 1.75 desktop / 1.25 mobile; textures ≤ 2048); fallback 2-D gallery; reduced-motion; CSP + security headers (`public/_headers`); `robots.txt`; legal templates; report flow; error boundaries with friendly screens; Sentry-free (no third-party tracking by default; optional cookieless analytics via env). ✅ Throttled-4G run documented; fallback tested with WebGL disabled.

**P10 – Docs & handoff.** `README.md` (what/why/run/test), `docs/DEPLOY.md` (Supabase + Cloudflare Pages + custom domain, exact click-paths/commands, env table, troubleshooting), `docs/SHARE.md` (how a creator shares: link, QR, print, DM, story), `HANDOFF.md` (the **manual steps only a human can do**, in order), CI green. ✅ A new developer can go from clone → running Demo Mode in < 5 minutes and → production in < 60 minutes using only the docs.

**Stretch (only after P10, behind feature flags):** passcode-protected museums with signed URLs; per-museum OG preview via `functions/m/[[slug]].ts` (HTMLRewriter) when `share_preview=true`; paid plans via Razorpay/Stripe (`VITE_PAYMENTS`); ambient music (original/CC0, off by default); more themes (warm-gallery, night-gallery); CC0 GLB avatar import; multi-language.

---

## 13. Quality checklist (run before declaring done)

- [ ] Every screen of the reel has an equivalent in the app (compare with `reference/` side by side; save your screenshots in `e2e/__screenshots__` and list them in your report).
- [ ] Works on iPhone Safari (no fullscreen API assumed), Android Chrome, desktop Chrome/Edge/Firefox/Safari.
- [ ] Landing → create → publish → share → open link → walk the museum, **end-to-end, in Demo Mode and (if credentials present) in Supabase mode**.
- [ ] QR scans from a laptop screen and from a print at 3 cm (tests cover the digital case; document the print test procedure).
- [ ] No console errors/warnings in the happy path; no `any` in public interfaces; no TODOs left without an entry in `PROGRESS.md`.
- [ ] Privacy: EXIF stripped, unlisted `noindex`, preview image off by default, delete removes storage objects.
- [ ] Licenses listed in `ASSETS.md`; no copied brand/copy/assets.

## 14. Final report format (your last message)

1. What was built (5 lines max). 2. How to run (3 commands). 3. What you verified (tests/screenshots, real numbers). 4. What you could **not** verify and why. 5. The exact manual steps left for the human (point to `HANDOFF.md`). 6. Known limitations and the top 3 next improvements.
