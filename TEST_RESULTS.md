# TEST RESULTS — gradient-studio-bd (2026-10-28, 12:00 slot)

## Unit tests — 30/30 passed (`node tests/test_logic.js`)

Hand-verified values asserted exactly:
- Linear default: `linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)`
- Stops sort by position before rendering; radial: `radial-gradient(circle at center, #fda4af 0%, #be123c 100%)`;
  conic: `conic-gradient(from 45deg, #ff0000 0%, #0000ff 100%)`; 3-stop linear exact.
- WCAG ratios: black vs white = 21.00; same color = 1; white vs #777777 ≈ 4.48
  (asserted within 0.02); bad hex returns null.
- Contrast summary: black+white stops vs white text → min 1, max 21, verdict fail;
  dark stops vs white text → verdict AA with min ≥ 4.5.
- Validation: validGradient rejects 1 stop, 6 stops, bad type; validateImport rejects
  wrong app, wrong version, empty-name/invalid favorite, non-array favorites.
- Presets: exactly 12, all valid, all unique names, all build non-empty CSS.
- Bengali digits: `toBnDigits('90')` = `৯০`.

## Headless-Chrome smoke — 15/15 passed, 0 console/page errors (`node tests/smoke.js`, raw CDP)

Desktop + 390px mobile, `file://` load:
- Title, 12 presets, default CSS output byte-exact, preview computed background is a gradient.
- Preset click → CSS contains preset color; angle slider → `45deg` in CSS; Add stop → 3 stop rows.
- Radial type → `radial-gradient` CSS + radial-position row visible.
- Contrast output renders worst/best stops; EN→বাংলা toggle switches tagline to Bengali
  text and back to English.
- Save favorite "My Sunset" → persists in localStorage across reload → Load restores it.
- 390px: no horizontal overflow (`scrollWidth <= innerWidth`).
- Zero console errors and zero page exceptions on the final two consecutive green runs.

## Repairs (1 real app bug, fixed and re-verified)

- `applyLang` referenced `$('samplePara')`, but the element's id is `sampleText`. The
  throw aborted `renderAll` on first load, so the preview/favorites never rendered until
  a preset click called `renderAll` directly. Fixed to `$('sampleText')`; smoke then
  passed fully on two consecutive runs. The preview smoke check was also changed from
  `style.background` (empty for shorthand gradients) to computed `backgroundImage`.

## Coverage notes

- Clipboard write is not asserted (headless `file://` clipboard is restricted); the
  copy button reports "Copied!" either way and the CSS text itself is asserted exact.
- Random-gradient output is intentionally not asserted (non-deterministic); its hue→hex
  conversion reuses the unit-tested `rgbToHex`.
