// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const PORT = 9346;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}
(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/gradient-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') pageErrors.push(JSON.stringify(msg.params.args));
    if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result ? r.result.result.value : undefined;
  };
  await send('Page.enable', {});
  await send('Runtime.enable', {});
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('document.querySelectorAll(".preset").length')) === 12, 10000);

  check('title contains Gradient Studio', (await ev('document.title')).includes('Gradient Studio'));
  check('12 presets render', (await ev('document.querySelectorAll(".preset").length')) === 12);
  check('default CSS output exact', (await ev('document.getElementById("cssOut").textContent')) === 'background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%);');
  check('preview background set', await (async () => { const bg = await ev('getComputedStyle(document.getElementById("preview")).backgroundImage'); return bg.includes('gradient'); })());
  check('preset click changes CSS', await (async () => {
    await ev('document.querySelector(".preset").click()'); await wait(300);
    return (await ev('document.getElementById("cssOut").textContent')).includes('#f97316');
  })());
  check('angle change updates CSS', await (async () => {
    await ev('(()=>{const a=document.getElementById("angle");a.value=45;a.dispatchEvent(new Event("input",{bubbles:true}));})()'); await wait(300);
    return (await ev('document.getElementById("cssOut").textContent')).includes('45deg');
  })());
  check('add stop gives 3 stops', await (async () => {
    await ev('document.getElementById("addStop").click()'); await wait(300);
    return (await ev('document.querySelectorAll(".stop-row").length')) === 3;
  })());
  check('type radial changes CSS + shows radial row', await (async () => {
    await ev('(()=>{const s=document.getElementById("typeSel");s.value="radial";s.dispatchEvent(new Event("change",{bubbles:true}));})()'); await wait(300);
    const css = await ev('document.getElementById("cssOut").textContent');
    const vis = await ev('document.getElementById("radialRow").style.display');
    return css.includes('radial-gradient') && vis === 'block';
  })());
  check('contrast output renders with verdict', await (async () => {
    const t = await ev('document.getElementById("contrastOut").textContent');
    return t.includes('Worst stop:') && t.includes('Best stop:');
  })());
  check('lang toggle switches tagline to Bengali', await (async () => {
    await ev('document.getElementById("langBtn").click()'); await wait(300);
    return (await ev('document.getElementById("tagline").textContent')).includes('গ্রেডিয়েন্ট');
  })());
  check('lang toggle back to English', await (async () => {
    await ev('document.getElementById("langBtn").click()'); await wait(300);
    return (await ev('document.getElementById("tagline").textContent')).includes('Build beautiful');
  })());
  check('save favorite + reload persistence', await (async () => {
    await ev('(()=>{const f=document.getElementById("favName");f.focus();document.execCommand("selectAll",false,null);document.execCommand("insertText",false,"My Sunset");f.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await ev('document.getElementById("saveFav").click()'); await wait(300);
    await send('Page.navigate', { url: FILE });
    await poll(async () => (await ev('document.querySelectorAll(".preset").length')) === 12, 10000);
    const stored = await ev('localStorage.getItem("gradient-studio-favs")');
    return stored && stored.includes('My Sunset');
  })());
  check('saved favorite loads on click', await (async () => {
    await ev('document.querySelector(".fav-item button").click()'); await wait(300);
    return !!(await ev('document.getElementById("cssOut").textContent.trim()'));
  })());
  check('390px mobile: no horizontal overflow', await (async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: FILE });
    await poll(async () => (await ev('document.querySelectorAll(".preset").length')) === 12, 10000);
    return (await ev('document.documentElement.scrollWidth <= window.innerWidth'));
  })());
  check('zero console/page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 500));

  ws.close();
  chrome.kill();
  console.log(failures ? ('\n' + failures + ' smoke checks FAILED') : '\nAll smoke checks passed.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
