// Gradient Studio BD — UI wiring. Pure math lives in js/logic.js.
(function () {
  'use strict';
  var L = window.GradientLogic;
  var LS_FAVS = 'gradient-studio-favs';
  var LS_LANG = 'gradient-studio-lang';
  var state = {
    lang: localStorage.getItem(LS_LANG) || 'en',
    gradient: { type: 'linear', angle: 90, stops: [{ color: '#7c3aed', pos: 0 }, { color: '#06b6d4', pos: 100 }] },
    textColor: '#ffffff',
    favorites: []
  };
  try { state.favorites = JSON.parse(localStorage.getItem(LS_FAVS) || '[]'); } catch (e) { state.favorites = []; }
  if (!Array.isArray(state.favorites)) state.favorites = [];
  var STR = {
    en: { tagline: 'Build beautiful CSS gradients — 12 presets, live preview, contrast check.', preview: 'Live preview', editor: 'Gradient editor', presets: 'Presets', samples: 'Use it on', css: 'CSS code', contrast: 'Text contrast check', favs: 'My saved gradients', data: 'Data', copy: 'Copy CSS', copied: 'Copied!', addStop: 'Add stop', random: 'Random gradient', saveFav: 'Save gradient', export: 'Export JSON', erase: 'Erase all saved', angleLbl: 'Angle', typeLbl: 'Type', posLbl: 'Position', favNamePh: 'Name for this gradient', importLbl: 'Import JSON file', eraseHint: 'Type DELETE to erase all saved gradients.', saved: 'Saved.', deleted: 'Deleted.', imported: 'Imported.', badImport: 'Invalid file — nothing changed.', erased: 'All saved gradients erased.', emptyFavs: 'No saved gradients yet.', cardText: 'Sample card', btnText: 'Sample button', samplePara: 'Sample text on your gradient.' },
    bn: { tagline: 'সুন্দর CSS গ্রেডিয়েন্ট বানান — ১২টি প্রিসেট, লাইভ প্রিভিউ, কনট্রাস্ট চেক।', preview: 'লাইভ প্রিভিউ', editor: 'গ্রেডিয়েন্ট এডিটর', presets: 'প্রিসেট', samples: 'ব্যবহার দেখুন', css: 'CSS কোড', contrast: 'টেক্সট কনট্রাস্ট চেক', favs: 'আমার সংরক্ষিত গ্রেডিয়েন্ট', data: 'ডেটা', copy: 'CSS কপি করুন', copied: 'কপি হয়েছে!', addStop: 'স্টপ যোগ করুন', random: 'এলোমেলো গ্রেডিয়েন্ট', saveFav: 'গ্রেডিয়েন্ট সংরক্ষণ করুন', export: 'JSON এক্সপোর্ট', erase: 'সব মুছুন', angleLbl: 'কোণ', typeLbl: 'ধরন', posLbl: 'অবস্থান', favNamePh: 'এই গ্রেডিয়েন্টের নাম', importLbl: 'JSON ফাইল ইমপোর্ট', eraseHint: 'সব সংরক্ষিত গ্রেডিয়েন্ট মুছতে DELETE লিখুন।', saved: 'সংরক্ষিত হয়েছে।', deleted: 'মুছে ফেলা হয়েছে।', imported: 'ইমপোর্ট হয়েছে।', badImport: 'অবৈধ ফাইল — কিছুই বদলায়নি।', erased: 'সব সংরক্ষিত গ্রেডিয়েন্ট মোছা হয়েছে।', emptyFavs: 'এখনো কোনো গ্রেডিয়েন্ট সংরক্ষিত হয়নি।', cardText: 'নমুনা কার্ড', btnText: 'নমুনা বোতাম', samplePara: 'আপনার গ্রেডিয়েন্টের উপর নমুনা লেখা।' }
  };
  function $(id) { return document.getElementById(id); }
  function num(n) { return state.lang === 'bn' ? L.toBnDigits(n) : String(n); }
  function saveFavs() { localStorage.setItem(LS_FAVS, JSON.stringify(state.favorites)); }
  function css() { return L.buildGradient(state.gradient); }
  function renderAll() {
    var c = css();
    $('preview').style.background = c;
    $('sampleCard').style.background = c;
    $('sampleBtn').style.background = c;
    $('sampleText').style.background = c;
    $('sampleText').style.webkitBackgroundClip = 'text';
    $('sampleText').style.backgroundClip = 'text';
    $('sampleText').style.color = 'transparent';
    $('cssOut').textContent = 'background: ' + c + ';';
    var angleRow = $('angleRow');
    angleRow.style.display = state.gradient.type === 'linear' ? 'block' : 'none';
    var radialRow = $('radialRow');
    radialRow.style.display = state.gradient.type === 'radial' ? 'block' : 'none';
    $('angleVal').textContent = num(state.gradient.angle) + '°';
    renderStops();
    renderContrast();
    renderFavs();
  }
  function renderStops() {
    var wrap = $('stops'); wrap.innerHTML = '';
    state.gradient.stops.forEach(function (s, i) {
      var row = document.createElement('div'); row.className = 'stop-row';
      row.innerHTML = '<input type="color" class="stop-color" value="' + s.color + '" aria-label="Stop ' + (i + 1) + ' color">' +
        '<input type="text" class="stop-hex" value="' + s.color + '" aria-label="Stop ' + (i + 1) + ' hex">' +
        '<input type="range" class="stop-pos" min="0" max="100" value="' + s.pos + '" aria-label="Stop ' + (i + 1) + ' position">' +
        '<span class="stop-pos-val">' + num(s.pos) + '%</span>' +
        '<button type="button" class="stop-del" ' + (state.gradient.stops.length <= 2 ? 'disabled' : '') + '>×</button>';
      row.querySelector('.stop-color').addEventListener('input', function (e) { s.color = e.target.value; row.querySelector('.stop-hex').value = s.color; renderAll(); });
      row.querySelector('.stop-hex').addEventListener('change', function (e) {
        var v = e.target.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (L.isHex(v)) { s.color = v.toLowerCase(); row.querySelector('.stop-color').value = s.color; } else { e.target.value = s.color; }
        renderAll();
      });
      row.querySelector('.stop-pos').addEventListener('input', function (e) { s.pos = L.clampPos(parseInt(e.target.value, 10)); renderAll(); });
      row.querySelector('.stop-del').addEventListener('click', function () { if (state.gradient.stops.length > 2) { state.gradient.stops.splice(i, 1); renderAll(); } });
      wrap.appendChild(row);
    });
  }
  function renderContrast() {
    var sum = L.contrastSummary(state.gradient, state.textColor);
    if (!sum) { $('contrastOut').textContent = ''; return; }
    var verdict = sum.verdict === 'AA' ? 'PASS (WCAG AA, worst stop ≥ 4.5)' : (sum.verdict === 'AA-large' ? 'Large text only (worst stop 3–4.5)' : 'FAIL (worst stop < 3)');
    $('contrastOut').textContent = 'Worst stop: ' + sum.min.toFixed(2) + ' · Best stop: ' + sum.max.toFixed(2) + ' · ' + verdict;
  }
  function renderFavs() {
    var list = $('favList'); list.innerHTML = '';
    if (!state.favorites.length) { list.innerHTML = '<p class="muted">' + STR[state.lang].emptyFavs + '</p>'; return; }
    state.favorites.forEach(function (f, i) {
      var item = document.createElement('div'); item.className = 'fav-item';
      var sw = document.createElement('span'); sw.className = 'fav-sw'; sw.style.background = L.buildGradient(f.gradient); sw.title = f.name;
      var nm = document.createElement('span'); nm.textContent = f.name;
      var load = document.createElement('button'); load.type = 'button'; load.textContent = 'Load'; load.className = 'small';
      load.addEventListener('click', function () { state.gradient = JSON.parse(JSON.stringify(f.gradient)); $('typeSel').value = state.gradient.type; $('angle').value = state.gradient.angle; $('radialPos').value = state.gradient.radialPos || 'center'; renderAll(); });
      var del = document.createElement('button'); del.type = 'button'; del.textContent = 'Delete'; del.className = 'small danger';
      del.addEventListener('click', function () { state.favorites.splice(i, 1); saveFavs(); $('msg').textContent = STR[state.lang].deleted; renderFavs(); });
      item.appendChild(sw); item.appendChild(nm); item.appendChild(load); item.appendChild(del);
      list.appendChild(item);
    });
  }
  function applyLang() {
    var t = STR[state.lang];
    $('langBtn').textContent = state.lang === 'en' ? 'বাংলা' : 'English';
    $('tagline').textContent = t.tagline;
    $('hPreview').textContent = t.preview; $('hEditor').textContent = t.editor; $('hPresets').textContent = t.presets;
    $('hSamples').textContent = t.samples; $('hCss').textContent = t.css; $('hContrast').textContent = t.contrast;
    $('hFavs').textContent = t.favs; $('hData').textContent = t.data;
    $('copyBtn').textContent = t.copy; $('addStop').textContent = t.addStop; $('randomBtn').textContent = t.random;
    $('saveFav').textContent = t.saveFav; $('exportBtn').textContent = t.export; $('eraseBtn').textContent = t.erase;
    $('angleLbl').textContent = t.angleLbl; $('typeLbl').textContent = t.typeLbl; $('favName').placeholder = t.favNamePh;
    $('importLbl').textContent = t.importLbl; $('eraseHint').textContent = t.eraseHint;
    $('cardText').textContent = t.cardText; $('sampleBtn').textContent = t.btnText; $('sampleText').textContent = t.samplePara;
    document.querySelectorAll('#typeSel option').forEach(function (o) { o.textContent = state.lang === 'bn' ? { linear: 'লিনিয়ার', radial: 'রেডিয়াল', conic: 'কনিক' }[o.value] : o.value.charAt(0).toUpperCase() + o.value.slice(1); });
    localStorage.setItem(LS_LANG, state.lang);
    renderAll();
  }
  function init() {
    var presetWrap = $('presets');
    L.PRESETS.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'preset'; b.textContent = p.name;
      b.style.background = L.buildGradient(p.gradient); b.title = p.name;
      b.addEventListener('click', function () {
        state.gradient = JSON.parse(JSON.stringify(p.gradient));
        $('typeSel').value = state.gradient.type; $('angle').value = state.gradient.angle || 0;
        $('radialPos').value = state.gradient.radialPos || 'center'; renderAll();
      });
      presetWrap.appendChild(b);
    });
    $('langBtn').addEventListener('click', function () { state.lang = state.lang === 'en' ? 'bn' : 'en'; applyLang(); });
    $('typeSel').addEventListener('change', function (e) { state.gradient.type = e.target.value; renderAll(); });
    $('angle').addEventListener('input', function (e) { state.gradient.angle = parseInt(e.target.value, 10) || 0; renderAll(); });
    $('radialPos').addEventListener('change', function (e) { state.gradient.radialPos = e.target.value; renderAll(); });
    $('addStop').addEventListener('click', function () {
      if (state.gradient.stops.length >= 5) return;
      var sorted = L.sortStops(state.gradient.stops);
      var mid = Math.round((sorted[0].pos + sorted[sorted.length - 1].pos) / 2);
      var col = L.mixHex(sorted[0].color, sorted[sorted.length - 1].color, 0.5);
      state.gradient.stops.push({ color: col, pos: mid }); renderAll();
    });
    $('randomBtn').addEventListener('click', function () {
      var h1 = Math.floor(Math.random() * 360), h2 = (h1 + 60 + Math.floor(Math.random() * 180)) % 360;
      function hsl(h) { // deterministic hsl->hex for the random button only
        var s = 0.85, l = 0.55, c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return L.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
      }
      state.gradient = { type: 'linear', angle: Math.floor(Math.random() * 360), stops: [{ color: hsl(h1), pos: 0 }, { color: hsl(h2), pos: 100 }] };
      $('typeSel').value = 'linear'; $('angle').value = state.gradient.angle; renderAll();
    });
    $('copyBtn').addEventListener('click', function () {
      var text = $('cssOut').textContent;
      function done() { $('msg').textContent = STR[state.lang].copied; }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done).catch(done); } else { done(); }
    });
    $('textColor').addEventListener('input', function (e) { state.textColor = e.target.value; renderContrast(); });
    $('saveFav').addEventListener('click', function () {
      var name = $('favName').value.trim();
      if (!name) { $('favName').focus(); return; }
      state.favorites.push({ name: name, gradient: JSON.parse(JSON.stringify(state.gradient)) });
      saveFavs(); $('favName').value = ''; $('msg').textContent = STR[state.lang].saved; renderFavs();
    });
    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ app: 'gradient-studio-bd', version: 1, favorites: state.favorites }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gradient-studio-favorites.json'; a.click(); URL.revokeObjectURL(a.href);
    });
    $('importFile').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var obj = JSON.parse(reader.result);
          if (L.validateImport(obj)) { state.favorites = obj.favorites; saveFavs(); $('msg').textContent = STR[state.lang].imported; renderFavs(); }
          else { $('msg').textContent = STR[state.lang].badImport; }
        } catch (err) { $('msg').textContent = STR[state.lang].badImport; }
      };
      reader.readAsText(file);
    });
    $('eraseBtn').addEventListener('click', function () {
      if ($('eraseInput').value.trim() === 'DELETE') { state.favorites = []; saveFavs(); $('eraseInput').value = ''; $('msg').textContent = STR[state.lang].erased; renderFavs(); }
    });
    $('typeSel').value = state.gradient.type; $('angle').value = state.gradient.angle;
    applyLang();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
