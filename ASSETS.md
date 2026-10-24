# Open-Source & Procedural Assets (ASSETS.md)

All third-party code, fonts, and assets used in "Museum of Us" are open-licensed (MIT / OFL / Apache-2.0 / CC0). No proprietary commercial assets, trademarks, or copyrighted personal materials are included.

## Fonts
- **Instrument Serif** (Display / Serif): Designed by Rodrigo Fuenzalida & Jordan Bell for Instrument. SIL Open Font License, Version 1.1. Self-hosted via `@fontsource/instrument-serif`.
- **Inter** (Sans-serif UI): Designed by Rasmus Andersson. SIL Open Font License, Version 1.1. Self-hosted via `@fontsource/inter`.

## Procedural Textures & Shaders
- Floor micro-pattern and limestone block noise: Generated purely in code via HTML Canvas API and Three.js procedural DataTextures.
- Vignette and radial spotlight hot-spots: Additive canvas-based procedural gradient textures.
- Artworks: Procedural duotone gradient canvas artwork generator with grain and typographic numerals (`placeholderArt.ts`).
- Avatars: Procedurally constructed meshes (capsules, spheres, lathed meshes, toon shading, custom procedural animations).

## Libraries
- React, React Router, Vite, Tailwind CSS, Lucide React (MIT)
- Three.js, @react-three/fiber, @react-three/drei (MIT)
- qrcode, jsqr, pngjs (MIT / Apache-2.0)
- Zustand, Zod (MIT)
- PGlite (Apache-2.0)
