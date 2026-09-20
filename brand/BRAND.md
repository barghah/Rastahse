# Rastahse (RASTAH से) — brand kit

Extracted from `RASTAH.pdf` (18 pages, Canva, 40 MB). Use THIS folder instead of the PDF: everything the build needs is here as small files. Don't open the original PDF in an agent — it is too heavy and crashes extraction.

## Concept
Rastah = "path". Stacked stones (a cairn / trail marker) with a berry on top. Motifs: River, Mountain, Waves, Path. Earthy, calm, handmade: kraft paper, stone, berry. Sub-labels on some pages: "Attire", "Atelier".

## Assets
| File | What it is | PDF page |
|---|---|---|
| logos/logo-primary.png | Primary logo: stone with river cut-out + berry + RASTAH से (faded lockup) | 4 |
| logos/logo-primary-white.png | Same, single-colour white, for dark or berry backgrounds | 4 |
| logos/wordmark.png | RASTAH से wordmark, full strength (grey lettering, brick-red से) | 1 |
| logos/wordmark-white.png | Wordmark in white | 1 |
| logos/wordmark-stacked.png | "ras / tah / se" stacked serif type with berry | 17 |
| logos/mark-large.png | Two-stone cairn with small berry | 6 |
| logos/logo-stone-berry.png, logo-arch.png, logo-notch.png | Alternative logo lockups | 15, 16, 18 |
| icons/apparel.png, jewelry.png, ceramic.png, home-decor.png | Category icons: charcoal silhouette + coloured berry | 5 |
| motifs/fruit.png | The berry on its own | 3 |
| motifs/river.svg, mountain.svg, waves.svg, path.svg | Brush shapes, clean single-colour SVG (`currentColor`), for dividers and backgrounds | 3 |
| reference/page-01..18.jpg, contact-sheet.jpg | Light page renders, for mood (mockups on pages 7-14) | all |
| tokens/brand-tokens.css, brand-tokens.json | Colour tokens | — |

All PNGs are transparent with true colours (they work on white, kraft, or dark). Source artwork is raster: logos are about 600 px wide, so use them at up to about 300 px displayed width on retina screens. Ask the client for the vector master of the logo when available.

## Colours (measured from the PDF)
See `tokens/brand-tokens.css`. Roles:
- Ink `#313130` — text, stones, logo body.
- Berry `#6c0222` — the one primary accent (buttons, tags, active states, links).
- Category fruit colours: Apparel `#48010d`, Jewelry `#57253e`, Ceramic `#0f1b37`, Home Decor `#4e5332`. New categories should take one of these four, not a new colour.
- Brick `#ad3d3d` — only the "से". Sparingly.
- Kraft `#c2a18d` / kraft-deep `#90735b` / mauve `#823e55` — from the packaging and card mockups. Secondary neutrals and occasional feature sections.
- Paper is white in the PDF. `--surface #f8f4f1` is derived (kraft at 12% on white) for soft sections; it is not in the PDF.
- Contrast: ink and berry on white both pass WCAG AA for body text.

## Typography
- Six Hands Marker is the only real text font in the PDF: captions ("River", "Mountain"), titles ("Attire", "Atelier"), founder names. It is a casual, hand-drawn monoline face. It is NOT on Google Fonts and only a subset is embedded in the PDF, so get the font file from the client or Canva if it is licensed for web use. Until then use Patrick Hand as a fallback behind a single CSS variable.
- The category labels (APPAREL, JEWELRY, CERAMIC, HOME DECORE) are a light geometric sans, all caps, very wide tracking. Poppins Light (300) with about 0.3em letter-spacing is a close match. Use it for nav, buttons, tags, prices.
- Space Mono only appears on stray page numbers in the PDF. Do not use it.
- Longer text (product descriptions): any clean readable sans, for example Inter.

## Rules of thumb
- Logo on light backgrounds: use the coloured PNGs. On dark, kraft-dark or berry backgrounds: use the `-white` versions.
- Don't recolour, stretch, or add shadows to logos or icons.
- Icons: charcoal body plus one coloured berry on top. Any new icon (Bags, Footwear, Souvenirs) must follow that exactly: flat charcoal silhouette, small dotted berry on top, no outline, no gradient.
- Keep it quiet: generous whitespace, soft stone-like rounded shapes, no gradients or heavy shadows.
