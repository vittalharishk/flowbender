// Checks per-account project visibility and that every module page renders without runtime errors.
const puppeteer = require('puppeteer');
const BASE = process.env.FB_BASE || 'http://localhost:3000';
const TITLES = ['Pushpa 2: The Rule', 'Kalki 2898 AD', 'Devara: Part 1', 'Game Changer', 'They Call Him OG', 'HIT: The Third Case', 'The Raja Saab', 'Mahanagaram'];
const DEMO = TITLES.slice(0, 7);
const EXPECT = { 1: DEMO, 2: DEMO.slice(0, 3), 3: DEMO.slice(3), 4: ['Mahanagaram'] };
const PROJECT_PAGES = ['', '/accounts', '/attendance', '/call-sheets', '/cast', '/crew', '/distribution', '/equipment', '/finance', '/locations', '/media', '/post-production', '/pre-production', '/production', '/scenes', '/schedule', '/script', '/subtitles', '/vfx'];
const GLOBAL_PAGES = ['', '/accounts', '/attendance', '/bgm', '/business', '/call-sheets', '/cast', '/crew', '/distribution', '/dubbing', '/editing', '/equipment', '/finance', '/invoices', '/locations', '/marketing', '/media', '/post-production', '/production', '/publicity', '/receivables', '/release', '/reports', '/schedule', '/script', '/settings', '/subtitles', '/teams', '/trailers', '/vfx'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
  let failed = 0;
  for (const [id, expected] of Object.entries(EXPECT)) {
    const ctx = await b.createBrowserContext();
    const p = await ctx.newPage();
    await p.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 180000 });
    await p.evaluate((uid) => localStorage.setItem('showrunners.access_token', 'local-demo-token:' + uid), id);
    await p.goto(BASE + '/dashboard/projects', { waitUntil: 'networkidle2', timeout: 180000 });
    await wait(4000);
    const text = await p.evaluate(() => document.body.innerText);
    const seen = TITLES.filter((t) => text.includes(t));
    const ok = seen.length === expected.length && expected.every((t) => seen.includes(t));
    if (!ok) failed++;
    console.log(`user ${id}: ${ok ? 'OK' : 'FAIL'} sees ${seen.length} -> ${seen.join(' | ')}`);
    if (id === '1' && process.env.FB_PAGES !== '0') {
      const errors = [];
      p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
      const pages = [...PROJECT_PAGES.map((s) => '/dashboard/projects/' + (process.env.FB_PROJECT || 'p4') + s), ...GLOBAL_PAGES.map((s) => '/dashboard' + s)];
      for (const path of pages) {
        errors.length = 0;
        const res = await p.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => ({ status: () => 'ERR ' + e.message.slice(0, 60) }));
        await wait(1200);
        const body = await p.evaluate(() => document.body.innerText);
        const crash = /Application error|Unhandled Runtime Error|something went wrong/i.test(body);
        const bad = crash || errors.length || res.status() !== 200;
        if (bad) failed++;
        console.log(`${bad ? 'FAIL' : 'ok  '} ${path} [${res.status()}] ${body.length} chars ${errors[0] || ''}`);
      }
    }
    await ctx.close();
  }
  await b.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
