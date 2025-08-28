# North East England Dashboard

A lightweight, single-page HTML dashboard showcasing North East England data with a radar chart, stacked visuals, and optional autoplay.

## Repository Contents
- `north_east_england_dashboard_with_radar_stacked_autoplay.html` – Original single-file dashboard.
- `src/` – Source files (extracted JS/CSS and HTML template)
  - `index.html`
  - `main.js`
  - `styles.css`
- `build.mjs` – Build script (Node + esbuild)
- `dist/` – Build outputs
  - `separate/` – Separate assets variant
  - `inline/` – Single HTML with inlined assets
  - `inline-min/` – Single HTML, inlined and minified

## Quick Start (dev)
- Open `src/index.html` directly in a browser, or serve locally:
  - Python 3: `python3 -m http.server 8000`
  - Visit `http://localhost:8000/src/index.html`

## Build
Requires Node 18+.

1) Install deps
```bash
npm install
```

2) Build targets
```bash
# 1. Separate assets (HTML + JS + CSS)
npm run build:separate
# Output: dist/separate/{index.html, main.js, styles.css}

# 2. Single-file (all assets inlined)
npm run build:inline
# Output: dist/inline/index.html

# 3. Single-file minified (optimized)
npm run build:inline:min
# Output: dist/inline-min/index.html
```

Notes:
- Single-file builds inline Tailwind CDN, Google Fonts CSS, Leaflet CSS/JS, Chart.js, and lucide, so you can host one file.
- The minified build conservatively minifies the HTML shell; JS/CSS are already minified during bundling.

## Features
- Radar map (Leaflet + RainViewer tiles) and weather chart (Chart.js)
- Reddit Hot and BBC Latest sections
- Autoplay radar animation
- Modern UI with Tailwind CDN

## Customization
- Edit `src/main.js` for data behavior and timings
- Edit `src/styles.css` for styles
- Edit `src/index.html` for structure

## Deployment
- Separate assets: upload `dist/separate` as-is
- Single-file: upload the single `index.html` from `dist/inline` or `dist/inline-min`

## License
Specify your preferred license here (e.g., MIT). If omitted, all rights reserved by default.
