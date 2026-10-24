# From zero to a live, shareable "Museum of Us" — complete guide

Read top to bottom. Steps marked **YOU** can only be done by a human (creating accounts, pasting keys). Everything else, the CLI does.

Time: ~30 min to start the build, then the build runs on its own (expect a few hours of agent time), then ~45 min to go live.

---

## Part 1 — Run the build prompt in Antigravity CLI (`agy`)

### 1.1 Install the CLI (YOU)

Prerequisites: **Node.js 20+** (`node -v`), **Git** (`git --version`), a **Google account** (the CLI signs in with it).

| OS                   | Command                                                        |
| -------------------- | -------------------------------------------------------------- |
| macOS / Linux        | `curl -fsSL https://antigravity.google/cli/install.sh \| bash` |
| Windows (PowerShell) | `irm https://antigravity.google/cli/install.ps1 \| iex`        |

Then check: `agy --version`. If the command isn't found on macOS/Linux, add it to your path: `export PATH="$HOME/.local/bin:$PATH"`.
The first time you run `agy` it opens a browser to sign you in (there is no separate `login` command).

> The installer details above come from third-party write-ups of the CLI; if something differs, the official Antigravity docs win.

### 1.2 Prepare the project folder (YOU)

Unzip `museum-kit.zip`. You will have `BUILD_PROMPT.md`, `DEPLOY_GUIDE.md` (this file) and a `reference/` folder of 17 numbered frames from your reel.

```bash
mkdir museum-app && cd museum-app
# copy BUILD_PROMPT.md and the reference/ folder into this empty folder
git init
```

### 1.3 Start the build

**Recommended (interactive, so you can steer):**

```bash
agy
```

Then paste this one message:

```
Read ./BUILD_PROMPT.md completely. Then open and study every image in ./reference/ (they are numbered in viewing order). Then execute the build exactly as specified, phase by phase (P0 → P10). Verify each phase with `npm run verify`, commit after each phase, and keep PROGRESS.md updated. Do not stop for questions unless you are blocked on a credential — use Demo Mode (no accounts needed) until Phase 8. Start now with P0–P2 and report back.
```

When it reports, reply `Continue with P3–P5`, then `P6–P8`, then `P9–P10`. Chunking keeps the agent focused and within context limits.

**One-shot alternative** (non-interactive print mode; only in this _empty_ folder, because the flag below auto-approves file and shell actions):

```bash
agy --add-dir . --dangerously-skip-permissions -p "Read ./BUILD_PROMPT.md completely, study every image in ./reference/, and execute the build exactly as specified through all phases P0–P10. Commit after each phase and keep PROGRESS.md updated."
```

A single print-mode run on a build this large may stop early; if it does, re-run with "Resume from the first unchecked phase in PROGRESS.md".

### 1.4 Check the result locally (YOU)

```bash
npm install
npm run dev            # opens http://localhost:5173
```

- Open `/m/demo` — you should see the loading screen → Start → door customizer → gallery.
- Open `/m/demo` in a **second browser tab**: you should see the other avatar (that's multiplayer in Demo Mode).
- Test on your phone (same Wi-Fi): `npm run dev -- --host` and open the "Network" URL it prints.
- Run `npm run verify` — it must finish green.

If something looks different from the reel, tell the CLI _with a reference number_: "Compare `/m/demo` with `reference/06_…` and match the lighting and wall colours."

---

## Part 2 — Create the backend (Supabase) (YOU)

Demo Mode works with no accounts. Do Part 2 only when you want real users and real sharing.

1. Go to **supabase.com** → sign up → **New project**. Pick the region nearest your users (for India: **Mumbai, ap-south-1**). Save the database password.
2. **Project Settings → API**: copy the **Project URL** and the **anon / public key**. _Never_ use or share the `service_role` key.
3. **SQL Editor → New query** → paste the contents of `supabase/migrations/0001_init.sql` (made by the CLI) → **Run**. This creates the tables, security rules, the `artworks` storage bucket and the four public functions.
4. **Authentication → Providers**: make sure **Email** is on (magic link). Optional: enable Google.
5. **Authentication → URL Configuration**: set **Site URL** to your final address (e.g. `https://yourdomain.com`; use `http://localhost:5173` while testing) and add **Redirect URLs**: `http://localhost:5173/**` and `https://yourdomain.com/**`.
6. **Authentication → Emails / SMTP**: Supabase's built-in email sender is heavily rate-limited — before real users, plug in your own SMTP (Resend, Brevo, Postmark…) or the sign-in emails will stop arriving.
7. **Realtime**: leave public channels enabled (default) — avatars are synced through them.
8. Create `.env.local` in the project:

```
VITE_DEMO_MODE=0
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

9. Tell the CLI: _"Credentials are in .env.local. Run the Supabase integration tests and fix any failures."_

**Free-tier gotchas (verify current numbers on supabase.com/pricing):** free projects are **paused after a period of inactivity** (wake them from the dashboard); storage, bandwidth and realtime connections are limited. Your image pipeline already shrinks photos to WebP (~300 KB each), so a 24-photo museum is roughly 5–8 MB. Upgrade the plan before you promote widely.

---

## Part 3 — Put the code on GitHub (YOU)

```bash
git add -A && git commit -m "Museum of Us"
# create an empty repo on github.com (private is fine), then:
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

Check that `.env.local` is **not** in the repo (`git ls-files | grep env` should only show `.env.example`).

---

## Part 4 — Deploy the website (Cloudflare Pages) (YOU)

Why Cloudflare Pages: static hosting with no commercial-use restriction on the free tier and generous bandwidth. (Vercel's free _Hobby_ plan is **non-commercial only** — fine for a personal gift, not for a business. Netlify also works; check its current terms.)

1. **dash.cloudflare.com** → sign up → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick your repo.
   _(Cloudflare is merging Pages into Workers; if the dashboard steers you to "Workers with static assets", use the same build settings below.)_
2. **Build settings:**
   - Framework preset: **Vite** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables (Production **and** Preview):
     `NODE_VERSION=20`, `VITE_DEMO_MODE=0`, `VITE_SUPABASE_URL=…`, `VITE_SUPABASE_ANON_KEY=…`, `VITE_PUBLIC_SITE_URL=https://<your-pages-domain or custom domain>`
3. **Save and Deploy.** You get `https://<project>.pages.dev`.
4. Make sure single-page routing works: `public/_redirects` contains `/* /index.html 200` (the CLI generates it). Open `https://<project>.pages.dev/m/demo` directly — it must load, not 404.
5. Go back to Supabase → **Authentication → URL Configuration** and add the `pages.dev` URL (and later your domain) to Site URL / Redirect URLs.

### Custom domain (strongly recommended — short domains make better QR codes)

1. Buy a short domain (Cloudflare Registrar, Namecheap, GoDaddy…).
2. Pages project → **Custom domains** → **Set up a domain** → follow the DNS prompts (automatic if the domain is on Cloudflare).
3. Update `VITE_PUBLIC_SITE_URL` in Cloudflare env vars → **Retry deployment**; update Supabase Site URL + Redirect URLs.
   Shorter link ⇒ simpler QR ⇒ more reliable scanning.

---

## Part 5 — How a creator shares a museum (this is the product's core loop)

1. Open your site → **Make one for your partner** → follow the 6 steps → **Publish** (sign in by email link).
2. On the **Share screen** you get the heart QR card, the link, and downloads (card PNG, Story PNG, SVG, classic QR).
3. Send it:
   - **In a chat / DM** (like the reel): download the **Card PNG**, send as an image with a message like _"i made this for you 🥺"_ — then _"scan it ❤️"_. The recipient scans it with the phone camera from your screen, or just taps the link below it.
   - **Story / status:** use the **Story PNG** (1080×1920).
   - **Print:** card ≥ 3 cm wide, matte paper, high contrast, don't fold across the QR. Test with two different phones first.
   - **Plain link:** the **Copy link** / **Share** / **WhatsApp** buttons.
4. **Go live as host (optional):** Dashboard → **Enter as host** while your partner is exploring — they will see your avatar walk beside them in real time. If you're offline, your scripted "host" avatar welcomes them instead.
5. Your partner can leave a message at the end; you read it in the Dashboard inbox.

**Before you send, always:** open the link on a phone in mobile data (not Wi-Fi), scan the QR from another screen, click through to the plaque and one photo.

---

## Part 6 — Launch checklist (if you're turning this into a product)

- [ ] Legal: replace the **Privacy / Terms templates** (`docs/PRIVACY_TERMS_TEMPLATES.md`) with reviewed text. The templates are not legal advice. If you have users in India, look at the DPDP Act 2023 requirements; in the EU/UK, GDPR. Add a contact email for takedowns.
- [ ] Content rules in your Terms: no photos of other people without consent, no minors, no explicit content; a visible **Report** link (the app includes one) and someone who reads reports.
- [ ] Custom SMTP in Supabase (Part 2 step 6) and a real support email.
- [ ] Analytics: cookieless only (e.g. Cloudflare Web Analytics or Plausible) so you don't need a cookie banner.
- [ ] Backups: Supabase paid plans include daily backups; on free, export the DB periodically (`supabase db dump`).
- [ ] Cost watch: Supabase storage/egress and realtime connections are the first limits you hit. Set a calendar reminder weekly in the first month.
- [ ] Payments (optional, stretch phase): **Razorpay** (UPI-friendly, India) or **Stripe** (global). Gate extras such as more photos, video, longer expiry, removing the "Make yours" chip.
- [ ] Brand: pick your own product name and logo — don't reuse the reel's brand or "Link in bio" wording from another company. Change `VITE_BRAND_NAME`.
- [ ] Marketing (the reel's playbook): screen-record a _real_ reaction or a clean walkthrough → caption such as "he made me cry with this gift" only if it's genuinely yours → put your landing URL in the bio. Never post a customer's museum or photos without their permission.

---

## Part 7 — Troubleshooting

| Symptom                                              | Likely cause → fix                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `agy: command not found`                             | Add `~/.local/bin` to PATH (macOS/Linux) or reopen PowerShell (Windows).                                               |
| CLI stops mid-build                                  | Tell it: _"Resume from the first unchecked phase in PROGRESS.md."_                                                     |
| Black screen on `/m/...`                             | WebGL blocked/disabled. Open `?lite=1` (2-D fallback); enable hardware acceleration in the browser.                    |
| `/m/slug` gives 404 on Cloudflare                    | Missing SPA redirect: `public/_redirects` must contain `/* /index.html 200`. Redeploy.                                 |
| Sign-in email never arrives                          | Supabase default email limit — configure custom SMTP; check spam; check Redirect URLs.                                 |
| "Invalid redirect URL" after clicking the magic link | Add the exact site URL to Supabase → Auth → URL Configuration.                                                         |
| Images don't load in a published museum              | Bucket `artworks` not public or the migration wasn't run; check Storage policies.                                      |
| Avatars don't see each other in production           | Realtime disabled or different `slug`; open the browser console for channel errors; confirm only the anon key is used. |
| Site suddenly stops working after days idle          | Free Supabase project paused → **Restore** in dashboard.                                                               |
| QR won't scan                                        | Use **Classic QR** toggle; make it bigger; avoid glare/low contrast; shorten the domain.                               |
| Fullscreen box missing on iPhone                     | Expected — iOS Safari doesn't support the Fullscreen API for pages.                                                    |
| Build fails on Cloudflare                            | Set `NODE_VERSION=20`; check the env vars are set for _Production_ and _Preview_.                                      |

---

## Appendix — What the build prompt already decided for you

- **Stack:** Vite + React + TypeScript · three.js (react-three-fiber) · Supabase (Postgres, Storage, Realtime, Auth) · Cloudflare Pages.
- **Why no avatar service:** Ready Player Me shut down in January 2026, so avatars are generated in code and fully customisable.
- **Privacy defaults:** unguessable links, EXIF/GPS stripped from every photo, `noindex`, link-preview images off, delete removes files.
- **Works without internet accounts:** Demo Mode (`VITE_DEMO_MODE=1`) lets you try everything locally, including two-tab multiplayer.
