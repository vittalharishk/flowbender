const puppeteer = require('puppeteer');
const BASE = process.env.FB_BASE || 'http://localhost:3000';
const TITLE = 'UI DB Test Film ' + Date.now();

(async () => {
  const b = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 900 });
  p.on('response', (r) => { if (r.url().includes('demo-data') && r.request().method() === 'PUT') console.log('NET PUT:', r.status()); });

  await p.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await p.evaluate(() => localStorage.setItem('showrunners.access_token', 'local-demo-token:1'));
  await p.goto(BASE + '/dashboard/projects/new', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));

  // text inputs
  await p.evaluate((title) => {
    const set = (id, v) => {
      const el = document.getElementById(id); if (!el) return;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('project-title', title); set('production-house', 'Test House');
    set('director', 'Test D'); set('producer', 'Test P');
    set('start-date', '2027-03-01'); set('expected-release-date', '2027-09-01');
    set('estimated-shoot-days', '10'); set('estimated-budget-inr', '1000000');
    set('project-description', 'test project');
  }, TITLE);

  // radix selects: click trigger, then click first visible option
  for (const id of ['primary-language', 'genre']) {
    await p.click('#' + id);
    await new Promise((r) => setTimeout(r, 600));
    const picked = await p.evaluate(() => {
      const opt = document.querySelector('[role="option"]');
      if (!opt) return null;
      opt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      opt.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      opt.click();
      return opt.textContent;
    });
    console.log('Selected', id, '->', picked);
    await new Promise((r) => setTimeout(r, 400));
  }

  await p.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((x) => /create project/i.test(x.textContent || ''));
    btn && btn.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  console.log('URL after submit:', p.url());

  const res = await fetch(BASE + '/api/demo-data', { cache: 'no-store' });
  const payload = await res.json();
  const inDb = (payload.data.projects || []).find((x) => x.title === TITLE);
  console.log('Project in PostgreSQL:', inDb ? 'YES' : 'NO', '| source:', payload.source, '| count:', payload.data.projects.length);

  if (inDb) {
    payload.data.projects = payload.data.projects.filter((x) => x.title !== TITLE);
    const c = await fetch(BASE + '/api/demo-data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: payload.data }) });
    console.log('Cleanup:', c.ok ? 'OK' : 'FAILED');
  }
  await b.close();
  process.exit(inDb ? 0 : 1);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
