# Sharing & Gift Presentation Guide — Museum of Us

**Museum of Us** is designed as an intimate, high-emotion gift. This document details the export formats, sharing channels, and recipient experience.

---

## 1. Export Formats

On the `/share/:id` screen, creators can export their museum invitation in three formats:

| Format              | Dimensions        | Best For                                           | Description                                                                                                                     |
| ------------------- | ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Square Card PNG** | 1080 × 1080 px    | iMessage, WhatsApp, Telegram, physical prints      | Crisp white rounded-square card (8% border radius) featuring exhibition title, names, pointing hand, and scannable heart QR.    |
| **Story Card PNG**  | 1080 × 1920 px    | Instagram Stories, TikTok, Snapchat                | Vertical 9:16 format with a nocturnal dark navy backdrop (`#07080F`), warm radial spotlight glow, and centered white gift card. |
| **Vector QR SVG**   | Infinite (Vector) | Letterpress, card printing, vinyl cutting, posters | Pure SVG vector export of the heart or classic QR code with lossless scalability.                                               |

---

## 2. QR Code Scannability & Tips

### Heart QR Design

- The heart QR utilizes **Error Correction Level H** (up to 30% data recovery).
- Standard scannable QR modules reside in the central 46% core width.
- Decorative modules populate the outer heart lobes with a deterministic density (0.45).
- Scannable by standard iPhone Camera, Android Camera / Google Lens, and third-party QR scanners at angles up to ±15° and under warm room lighting.

### Classic QR Toggle

- For creators who prefer a traditional monochrome square QR or need scanning at greater distances (> 1.5 meters), click the **Classic QR** toggle on the share screen.

---

## 3. The Recipient Journey

When the recipient scans the card or opens the link:

1. **Cinematic Loading:** Tab title updates to `Ethan to Maya`. Atmospheric nocturnal dark page with warm glow. A 2px cream progress bar reaches 100% and resolves to a sage **Start** pill with optional fullscreen toggle.
2. **Door Customizer:** The recipient arrives at the grand neoclassical wooden doors. A glass panel allows them to select skin tone, hair, outfit, and confirm their name before entering.
3. **The 3D Gallery:**
   - Walking third-person view with WASD / Arrow keys or virtual joystick on mobile.
   - **Dedication Plaque:** Walking to the white pedestal reveals a `🔍 + [E]` interaction chip. Triggering it dollies the camera into the tilted black plaque engraved with the creator's personal note.
   - **Exhibition Walls:** Strolling past black-framed photographs under museum track lighting.
   - **Cinema Nook & Bench:** Avatars can sit side-by-side on the wooden bench to view memory projections.
   - **Emotes & Chat:** Send floating hearts (❤️), wave (👋), clap (👏), or trigger a synchronized couple dance (💃).
4. **Host Companion vs Live Creator:**
   - If the creator is not currently online, an AI Host NPC accompanies the recipient, walking with them and delivering dialogue lines.
   - If the creator enters the museum via `?as=host`, they seamlessly take control of the host avatar in real time!

---

## 4. URL Parameters & Power Features

- `/m/:slug` — Standard full 3D interactive museum.
- `/m/:slug?as=host` — Creator host mode: overrides the automated NPC host avatar.
- `/m/:slug?lite=1` — 2D Lite Mode carousel: optimal for low-power mobile devices, screen readers, or unstable connections.
- `/m/:slug?preview=1` — Creator draft preview mode: suppresses analytics view count tracking.
