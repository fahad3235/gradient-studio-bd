// Node unit tests for js/logic.js — run: node tests/test_logic.js
const L = require('../js/logic.js');
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('ok - ' + name); }
  else { fail++; console.log('FAIL - ' + name + (extra !== undefined ? ' :: ' + extra : '')); }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// hex parsing
check('hexToRgb #7c3aed', eq(L.hexToRgb('#7c3aed'), { r: 124, g: 58, b: 237 }), JSON.stringify(L.hexToRgb('#7c3aed')));
check('hexToRgb 3-digit #fff', eq(L.hexToRgb('#fff'), { r: 255, g: 255, b: 255 }));
check('hexToRgb rejects bad', L.hexToRgb('red') === null && L.hexToRgb('#zzzzzz') === null);
check('rgbToHex round-trip', L.rgbToHex(124, 58, 237) === '#7c3aed');
check('mixHex midpoint black/white', L.mixHex('#000000', '#ffffff', 0.5) === '#808080', L.mixHex('#000000', '#ffffff', 0.5));
check('clampPos bounds', L.clampPos(-5) === 0 && L.clampPos(150) === 100 && L.clampPos(42.6) === 43);

// gradient strings — exact, hand-verified
check('linear default', L.buildGradient({ type: 'linear', angle: 90, stops: [{ color: '#7c3aed', pos: 0 }, { color: '#06b6d4', pos: 100 }] }) === 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)');
check('stops sorted by pos', L.buildGradient({ type: 'linear', angle: 0, stops: [{ color: '#0000ff', pos: 100 }, { color: '#ff0000', pos: 0 }] }) === 'linear-gradient(0deg, #ff0000 0%, #0000ff 100%)');
check('radial center', L.buildGradient({ type: 'radial', radialPos: 'center', stops: [{ color: '#fda4af', pos: 0 }, { color: '#be123c', pos: 100 }] }) === 'radial-gradient(circle at center, #fda4af 0%, #be123c 100%)');
check('conic from angle', L.buildGradient({ type: 'conic', angle: 45, stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] }) === 'conic-gradient(from 45deg, #ff0000 0%, #0000ff 100%)');
check('3-stop linear', L.buildGradient({ type: 'linear', angle: 90, stops: [{ color: '#facc15', pos: 0 }, { color: '#f97316', pos: 50 }, { color: '#ef4444', pos: 100 }] }) === 'linear-gradient(90deg, #facc15 0%, #f97316 50%, #ef4444 100%)');

// contrast — WCAG reference values
check('black vs white = 21', L.contrastRatio('#000000', '#ffffff') === 21);
check('same color = 1', L.contrastRatio('#ff0000', '#ff0000') === 1);
check('white vs #777777 ~4.48', Math.abs(L.contrastRatio('#ffffff', '#777777') - 4.48) < 0.02, String(L.contrastRatio('#ffffff', '#777777')));
check('contrast bad hex null', L.contrastRatio('#ffffff', 'red') === null);
var sum = L.contrastSummary({ stops: [{ color: '#000000', pos: 0 }, { color: '#ffffff', pos: 100 }] }, '#ffffff');
check('summary worst 1 best 21', sum.min === 1 && sum.max === 21 && sum.verdict === 'fail', JSON.stringify(sum));
var sum2 = L.contrastSummary({ stops: [{ color: '#000000', pos: 0 }, { color: '#111111', pos: 100 }] }, '#ffffff');
check('summary dark stops pass AA', sum2.verdict === 'AA' && sum2.min >= 4.5, JSON.stringify(sum2));

// validation
check('validGradient ok', L.validGradient({ type: 'linear', angle: 90, stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] }));
check('validGradient rejects 1 stop', !L.validGradient({ type: 'linear', stops: [{ color: '#ff0000', pos: 0 }] }));
check('validGradient rejects 6 stops', !L.validGradient({ type: 'linear', stops: [0, 1, 2, 3, 4, 5].map(function (i) { return { color: '#ff0000', pos: i * 20 }; }) }));
check('validGradient rejects bad type', !L.validGradient({ type: 'swirl', stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] }));
check('validateImport ok', L.validateImport({ app: 'gradient-studio-bd', version: 1, favorites: [{ name: 'X', gradient: { type: 'linear', angle: 90, stops: [{ color: '#ff0000', pos: 0 }, { color: '#0000ff', pos: 100 }] } }] }));
check('validateImport rejects wrong app', !L.validateImport({ app: 'other', version: 1, favorites: [] }));
check('validateImport rejects bad fav', !L.validateImport({ app: 'gradient-studio-bd', version: 1, favorites: [{ name: '', gradient: { type: 'linear', stops: [] } }] }));
check('validateImport rejects non-array', !L.validateImport({ app: 'gradient-studio-bd', version: 1, favorites: 'x' }));

// presets
check('12 presets', L.PRESETS.length === 12, String(L.PRESETS.length));
check('all presets valid + unique names', L.PRESETS.every(function (p) { return L.validGradient(p.gradient); }) && new Set(L.PRESETS.map(function (p) { return p.name; })).size === 12);
check('all presets build non-empty CSS', L.PRESETS.every(function (p) { return L.buildGradient(p.gradient).length > 20; }));

// Bengali digits
check('toBnDigits 90 -> ৯০', L.toBnDigits('90') === '৯০');
check('toBnDigits mixed', L.toBnDigits('a1b2') === 'a১b২');

console.log(fail ? ('\n' + fail + ' unit checks FAILED') : ('\nAll ' + pass + ' unit checks passed.'));
process.exit(fail ? 1 : 0);
