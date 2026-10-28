# Gradient Studio BD

An offline, bilingual (EN/বাংলা) CSS gradient builder. Design linear, radial, and conic
gradients with a live preview, check text contrast against every stop, and save your
favorites — all in your browser, with no server and no network requests.

## Features

- **Gradient editor** — linear / radial / conic types, angle slider (0–360°), radial
  position picker, and 2–5 color stops. Each stop has a color picker, an editable hex
  field (validated inline), and a position slider.
- **Live preview** — the gradient renders instantly on a large preview panel and on
  sample card, button, and gradient-text samples.
- **12 curated presets** — Sunset, Ocean, Forest, Royal, Sunrise, Midnight, Rose, Sky,
  Citrus, Berry, Teal Dusk, Peach. One click loads any preset into the editor.
- **Copy-ready CSS** — the exact `background: …;` declaration, with a copy button.
- **Text contrast check** — pick a text color; the app reports the worst-stop and
  best-stop WCAG contrast ratios and a verdict (AA / large-text-only / fail).
- **Saved gradients** — name and save gradients to localStorage, load or delete them,
  export them as JSON, and import a JSON file back (strict validation: wrong app,
  wrong version, or any invalid gradient rejects the whole file). Typed-DELETE erase.
- **Random gradient** — generates a two-stop linear gradient from random hues.
- **EN/বাংলা toggle** — persisted in localStorage, with Bengali digits for numbers.

## Stack

Vanilla HTML + CSS + JavaScript. No frameworks, no build step, no dependencies.
Pure gradient math lives in `js/logic.js` (usable from Node for tests); DOM wiring
lives in `js/app.js`.

## Run locally

Open `index.html` in any modern browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Testing

```bash
node tests/test_logic.js   # 30 unit checks (gradient strings, WCAG ratios, validation)
node tests/smoke.js        # 15 headless-Chrome checks (raw CDP, no puppeteer needed)
```

## Deployment

Static site — deploy the folder as-is to GitHub Pages, Netlify, or any static host.

## Limitations

- Contrast is measured against each gradient stop, not against the blended gradient
  at a specific pixel; the worst stop is the honest conservative verdict.
- The copy button uses the Clipboard API where available and otherwise reports copied
  without writing (some `file://` contexts restrict clipboard access).
- Saved gradients live in this browser's localStorage only; they do not sync.

## Status

Complete MVP, tested (see `TEST_RESULTS.md`). Offline personal design tool — gradient
colors are design choices, not data claims.
