const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:3001/login');
  await page.evaluate(() => localStorage.setItem('showrunners.access_token', 'local-demo-token:1'));

  console.log('\n=== A8 Browser Verification ===\n');
  let passed = 0, failed = 0;
  function check(label, result) {
    console.log((result ? 'PASS' : 'FAIL') + ': ' + label);
    if (result) passed++; else failed++;
  }

  async function clickTabByText(targetText) {
    const allTabs = await page.$$('[role="tab"]');
    for (const tab of allTabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.trim() === targetText) {
        let box = await tab.boundingBox();
        if (!box || isNaN(box.x)) {
          await tab.evaluate(el => el.scrollIntoView({ block: 'center' }));
          await new Promise(r => setTimeout(r, 300));
          box = await tab.boundingBox();
        }
        if (box && !isNaN(box.x)) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          return true;
        }
      }
    }
    return false;
  }

  // ── SECTION 1: Global accounts, Overview tab (financial baseline) ──
  await page.goto('http://localhost:3001/dashboard/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const ovText = await page.evaluate(() => document.body.innerText);
  check('1. Committed baseline ₹238.5 Cr', ovText.includes('238.5 Cr'));
  check('2. PO Commitment ₹2.3 Cr', ovText.includes('2.3 Cr'));
  check('3. Paid baseline ~₹118.5 Cr', ovText.includes('118.5 Cr'));

  // ── SECTION 2: Global accounts, Insurance tab ──
  const insClicked = await clickTabByText('Insurance');
  check('4. Insurance tab clicked', insClicked);
  await new Promise(r => setTimeout(r, 3000));

  const insText = await page.evaluate(() => document.body.innerText);
  check('5. Insurance Register title', insText.includes('Insurance Register'));
  check('6. TOTAL POLICIES card', insText.includes('TOTAL POLICIES'));
  check('7. ACTIVE card', insText.includes('ACTIVE'));
  check('8. TOTAL COVERAGE card', insText.includes('TOTAL COVERAGE'));
  check('9. PREMIUMS PAID card', insText.includes('PREMIUMS PAID'));
  check('10. CLAIMS FILED card', insText.includes('CLAIMS FILED'));
  check('11. OPEN CLAIMS card', insText.includes('OPEN CLAIMS'));
  check('12. All Policies sub-tab', insText.includes('All Policies'));
  check('13. Claims sub-tab', insText.includes('Claims'));
  check('14. Coverage by Type sub-tab', insText.includes('Coverage by Type'));
  check('15. POLICY # column', insText.includes('POLICY #'));
  check('16. New Policy button', insText.includes('New Policy'));

  // Policy count
  const rows = await page.$$('table tbody tr');
  check('17. Policy rows (' + rows.length + ', expect >=15)', rows.length >= 15);

  // Search
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.type('Pushpa');
    await new Promise(r => setTimeout(r, 800));
    const filtered = await page.$$('table tbody tr');
    check('18. Search "Pushpa" (' + filtered.length + '/' + rows.length + ')', filtered.length > 0 && filtered.length < rows.length);
    await searchInput.click({ clickCount: 3 });
    await searchInput.press('Backspace');
    await new Promise(r => setTimeout(r, 500));
  } else {
    check('18. Search input', false);
  }

  // Detail sheet
  const firstRow = await page.$('table tbody tr');
  if (firstRow) {
    await firstRow.click();
    await new Promise(r => setTimeout(r, 1500));
    const detail = await page.evaluate(() => document.body.innerText);
    check('19. Detail sheet opens', detail.includes('Coverage Amount') || detail.includes('Financial Summary') || detail.includes('Provider'));
    check('20. Provider in detail', detail.includes('New India') || detail.includes('ICICI') || detail.includes('Bajaj') || detail.includes('Oriental') || detail.includes('HDFC') || detail.includes('National'));
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  } else {
    check('19. Detail sheet', false);
    check('20. Provider', false);
  }

  // ── SECTION 3: Project-scoped insurance ──
  await page.goto('http://localhost:3001/dashboard/projects/p1/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // On the project page, scroll page to top, then find and click the Insurance tab
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  const projInsClicked = await clickTabByText('Insurance');
  check('21. Project Insurance tab clicked', projInsClicked);
  await new Promise(r => setTimeout(r, 3000));

  const projText = await page.evaluate(() => document.body.innerText);
  check('22. Project Insurance Register loads', projText.includes('Insurance Register'));
  const projRows = await page.$$('table tbody tr');
  check('23. Project-scoped p1 (' + projRows.length + ' policies, expect ~5)', projRows.length >= 4 && projRows.length <= 6);

  // Console errors
  const relevantErrors = consoleErrors.filter(e => !e.includes('404'));
  check('24. No JS console errors (' + relevantErrors.length + ')', relevantErrors.length === 0);

  await browser.close();
  console.log('\n=== Browser Verification Summary: ' + passed + ' PASS, ' + failed + ' FAIL ===\n');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
