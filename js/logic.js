// Pure gradient logic for Gradient Studio BD — no DOM, unit-testable in Node.
// Works in the browser (window.GradientLogic) and in Node (module.exports).
(function () {
  'use strict';
  function isHex(h) { return typeof h === 'string' && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(h); }
  function hexToRgb(hex) {
    if (!isHex(hex)) return null;
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgbToHex(r, g, b) {
    function p(n) { const s = Math.round(n).toString(16); return s.length === 1 ? '0' + s : s; }
    return '#' + p(r) + p(g) + p(b);
  }
  function mixHex(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    if (!A || !B) return a;
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }
  function clampPos(p) { if (typeof p !== 'number' || isNaN(p)) return 0; return Math.max(0, Math.min(100, Math.round(p))); }
  function sortStops(stops) {
    return stops.slice().sort(function (x, y) { return x.pos - y.pos; });
  }
  // stops: [{color:'#rrggbb', pos:0..100}] — caller must supply >=2 valid stops.
  function buildGradient(g) {
    const stops = sortStops(g.stops).map(function (s) { return s.color + ' ' + clampPos(s.pos) + '%'; }).join(', ');
    if (g.type === 'radial') return 'radial-gradient(circle at ' + (g.radialPos || 'center') + ', ' + stops + ')';
    if (g.type === 'conic') return 'conic-gradient(from ' + Math.round(g.angle || 0) + 'deg, ' + stops + ')';
    return 'linear-gradient(' + Math.round(g.angle || 0) + 'deg, ' + stops + ')';
  }
  function channelLum(c) { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }
  function luminance(rgb) { return 0.2126 * channelLum(rgb.r) + 0.7152 * channelLum(rgb.g) + 0.0722 * channelLum(rgb.b); }
  function contrastRatio(hexA, hexB) {
    const A = hexToRgb(hexA), B = hexToRgb(hexB);
    if (!A || !B) return null;
    const l1 = luminance(A), l2 = luminance(B);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  }
  function contrastSummary(gradient, textHex) {
    const ratios = gradient.stops.map(function (s) { return contrastRatio(s.color, textHex); }).filter(function (r) { return r !== null; });
    if (!ratios.length) return null;
    const min = Math.min.apply(null, ratios), max = Math.max.apply(null, ratios);
    return { min: min, max: max, verdict: min >= 4.5 ? 'AA' : (min >= 3 ? 'AA-large' : 'fail') };
  }
  function validGradient(g) {
    if (!g || ['linear', 'radial', 'conic'].indexOf(g.type) === -1) return false;
    if (!Array.isArray(g.stops) || g.stops.length < 2 || g.stops.length > 5) return false;
    return g.stops.every(function (s) { return isHex(s.color) && typeof s.pos === 'number' && s.pos >= 0 && s.pos <= 100; });
  }
  function validateImport(obj) {
    if (!obj || obj.app !== 'gradient-studio-bd' || obj.version !== 1 || !Array.isArray(obj.favorites)) return false;
    return obj.favorites.every(function (f) { return typeof f.name === 'string' && f.name.trim() && validGradient(f.gradient); });
  }
  function toBnDigits(s) {
    const map = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return String(s).replace(/[0-9]/g, function (d) { return map[d]; });
  }
  var PRESETS = [
    { name: 'Sunset', gradient: { type: 'linear', angle: 90, stops: [{ color: '#f97316', pos: 0 }, { color: '#ec4899', pos: 100 }] } },
    { name: 'Ocean', gradient: { type: 'linear', angle: 135, stops: [{ color: '#06b6d4', pos: 0 }, { color: '#2563eb', pos: 100 }] } },
    { name: 'Forest', gradient: { type: 'linear', angle: 90, stops: [{ color: '#22c55e', pos: 0 }, { color: '#14532d', pos: 100 }] } },
    { name: 'Royal', gradient: { type: 'linear', angle: 90, stops: [{ color: '#7c3aed', pos: 0 }, { color: '#db2777', pos: 100 }] } },
    { name: 'Sunrise', gradient: { type: 'linear', angle: 90, stops: [{ color: '#facc15', pos: 0 }, { color: '#f97316', pos: 50 }, { color: '#ef4444', pos: 100 }] } },
    { name: 'Midnight', gradient: { type: 'linear', angle: 180, stops: [{ color: '#0f172a', pos: 0 }, { color: '#334155', pos: 100 }] } },
    { name: 'Rose', gradient: { type: 'radial', angle: 0, radialPos: 'center', stops: [{ color: '#fda4af', pos: 0 }, { color: '#be123c', pos: 100 }] } },
    { name: 'Sky', gradient: { type: 'linear', angle: 180, stops: [{ color: '#bae6fd', pos: 0 }, { color: '#0284c7', pos: 100 }] } },
    { name: 'Citrus', gradient: { type: 'linear', angle: 90, stops: [{ color: '#a3e635', pos: 0 }, { color: '#facc15', pos: 100 }] } },
    { name: 'Berry', gradient: { type: 'linear', angle: 135, stops: [{ color: '#a855f7', pos: 0 }, { color: '#ec4899', pos: 50 }, { color: '#f97316', pos: 100 }] } },
    { name: 'Teal Dusk', gradient: { type: 'linear', angle: 90, stops: [{ color: '#0d9488', pos: 0 }, { color: '#0f172a', pos: 100 }] } },
    { name: 'Peach', gradient: { type: 'linear', angle: 90, stops: [{ color: '#fdba74', pos: 0 }, { color: '#f472b6', pos: 100 }] } }
  ];
  var api = { isHex: isHex, hexToRgb: hexToRgb, rgbToHex: rgbToHex, mixHex: mixHex, clampPos: clampPos, sortStops: sortStops, buildGradient: buildGradient, luminance: luminance, contrastRatio: contrastRatio, contrastSummary: contrastSummary, validGradient: validGradient, validateImport: validateImport, toBnDigits: toBnDigits, PRESETS: PRESETS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (typeof window !== 'undefined') window.GradientLogic = api;
})();
