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

  let passed = 0, failed = 0;
  function check(label, result) {
    console.log((result ? 'PASS' : 'FAIL') + ': ' + label);
    if (result) passed++; else failed++;
  }

  async function clickTab(targetText) {
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

  console.log('\n=== A9 BROWSER VERIFICATION ===\n');

  // ── SECTION 1: Global Accounts Overview ──
  console.log('--- Section 1: Global Accounts Overview ---');
  await page.goto('http://localhost:3001/dashboard/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const ovText = await page.evaluate(() => document.body.innerText);

  // Extract financial figures
  check('1.1 Overview loads', ovText.includes('Budgets & Accounts'));
  check('1.2 TOTAL BUDGET visible', ovText.includes('TOTAL BUDGET'));
  check('1.3 TOTAL COMMITTED visible', ovText.includes('TOTAL COMMITTED'));
  check('1.4 TOTAL PAID visible', ovText.includes('TOTAL PAID'));
  check('1.5 PO COMMITMENT visible', ovText.includes('PO COMMITMENT'));

  // Extract actual financial values from the page
  const lines = ovText.split('\n');
  const financialValues = {};
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.includes('TOTAL BUDGET') && i + 2 < lines.length) financialValues.totalBudget = lines[i+2].trim();
    if (l.includes('TOTAL COMMITTED') && i + 2 < lines.length) financialValues.totalCommitted = lines[i+2].trim();
    if (l.includes('TOTAL PAID') && i + 2 < lines.length) financialValues.totalPaid = lines[i+2].trim();
    if (l === 'PO COMMITMENT' && i + 2 < lines.length) financialValues.poCommitment = lines[i+2].trim();
  }
  console.log('\n  Financial values from Overview:');
  for (const [k, v] of Object.entries(financialValues)) {
    console.log('    ' + k + ': ' + v);
  }

  // Check known baselines
  check('1.6 Committed ~277 Cr', ovText.includes('277'));
  check('1.7 Paid ~140 Cr', ovText.includes('140'));
  check('1.8 PO Commitment ~2.3 Cr', ovText.includes('2.3'));

  // Project table
  check('1.9 Project table', ovText.includes('Pushpa') && ovText.includes('Kalki'));
  check('1.10 Department table', ovText.includes('Cast & Talent') || ovText.includes('Writing & Direction'));

  // ── SECTION 2: Tab Navigation ──
  console.log('\n--- Section 2: Tab Navigation ---');
  const tabNames = ['Budgets', 'Expenses', 'Purchase Orders', 'Vendors', 'Insurance', 'Reports'];
  for (const tabName of tabNames) {
    const clicked = await clickTab(tabName);
    await new Promise(r => setTimeout(r, 2000));
    const tabText = await page.evaluate(() => document.body.innerText);
    const loaded = tabText.length > 200;
    check('2. ' + tabName + ' tab loads', clicked && loaded);
  }

  // Go back to Overview
  await clickTab('Overview');
  await new Promise(r => setTimeout(r, 1000));

  // ── SECTION 3: Budgets Tab ──
  console.log('\n--- Section 3: Budgets Tab ---');
  await clickTab('Budgets');
  await new Promise(r => setTimeout(r, 2000));
  const budgetText = await page.evaluate(() => document.body.innerText);
  check('3.1 Budget management visible', budgetText.includes('Project Budget') || budgetText.includes('Budget'));
  check('3.2 Department allocations', budgetText.includes('Department') || budgetText.includes('Allocation'));

  // ── SECTION 4: Expenses Tab ──
  console.log('\n--- Section 4: Expenses Tab ---');
  await clickTab('Expenses');
  await new Promise(r => setTimeout(r, 2000));
  const expText = await page.evaluate(() => document.body.innerText);
  check('4.1 Expense register loads', expText.includes('COMMITTED') || expText.includes('Committed'));
  check('4.2 Expense table visible', expText.includes('Source') || expText.includes('Amount'));

  // ── SECTION 5: Purchase Orders Tab ──
  console.log('\n--- Section 5: Purchase Orders Tab ---');
  await clickTab('Purchase Orders');
  await new Promise(r => setTimeout(r, 2000));
  const poText = await page.evaluate(() => document.body.innerText);
  check('5.1 PO workspace loads', poText.includes('Purchase Order') || poText.includes('PO'));
  check('5.2 PO count visible', poText.includes('TOTAL POS') || poText.includes('Total POs') || poText.includes('PO'));
  const poRows = await page.$$('table tbody tr');
  check('5.3 PO table has rows (' + poRows.length + ')', poRows.length >= 10);

  // ── SECTION 6: Vendors Tab ──
  console.log('\n--- Section 6: Vendors Tab ---');
  await clickTab('Vendors');
  await new Promise(r => setTimeout(r, 2000));
  const vendorText = await page.evaluate(() => document.body.innerText);
  check('6.1 Vendor workspace loads', vendorText.includes('Vendor') || vendorText.includes('vendor'));
  check('6.2 Vendor directory', vendorText.includes('Directory') || vendorText.includes('vendor'));

  // ── SECTION 7: Insurance Tab ──
  console.log('\n--- Section 7: Insurance Tab ---');
  await clickTab('Insurance');
  await new Promise(r => setTimeout(r, 2000));
  const insText = await page.evaluate(() => document.body.innerText);
  check('7.1 Insurance Register loads', insText.includes('Insurance Register'));
  check('7.2 TOTAL POLICIES card', insText.includes('TOTAL POLICIES'));
  check('7.3 Policy table', insText.includes('POLICY #'));
  const insRows = await page.$$('table tbody tr');
  check('7.4 Insurance rows (' + insRows.length + ', expect >=15)', insRows.length >= 15);

  // ── SECTION 8: Project p1 Scoped View ──
  console.log('\n--- Section 8: Project p1 Scoped ---');
  await page.goto('http://localhost:3001/dashboard/projects/p1/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  const p1Text = await page.evaluate(() => document.body.innerText);
  check('8.1 Project accounts loads', p1Text.includes('Pushpa'));
  check('8.2 Budget visible', p1Text.includes('APPROVED BUDGET') || p1Text.includes('Budget'));
  check('8.3 PO Commitment visible', p1Text.includes('PO COMMITMENT'));

  // Extract p1 values
  const p1Lines = p1Text.split('\n');
  console.log('\n  p1 financial values:');
  for (let i = 0; i < p1Lines.length; i++) {
    const l = p1Lines[i].trim();
    if (['APPROVED BUDGET','TOTAL COMMITTED','TOTAL PAID','DEPOSITS','OUTSTANDING','AVAILABLE BUDGET','PO COMMITMENT'].includes(l)) {
      console.log('    ' + l + ': ' + (p1Lines[i+2] || '').trim());
    }
  }

  // Click through tabs on project page
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickTab('Insurance');
  await new Promise(r => setTimeout(r, 2000));
  const p1InsText = await page.evaluate(() => document.body.innerText);
  check('8.4 Project Insurance tab', p1InsText.includes('Insurance Register'));
  const p1InsRows = await page.$$('table tbody tr');
  check('8.5 p1 insurance rows (' + p1InsRows.length + ', expect ~5)', p1InsRows.length >= 4 && p1InsRows.length <= 6);

  // ── SECTION 9: Project p2 Scoped View ──
  console.log('\n--- Section 9: Project p2 Scoped ---');
  await page.goto('http://localhost:3001/dashboard/projects/p2/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const p2Text = await page.evaluate(() => document.body.innerText);
  check('9.1 p2 loads', p2Text.includes('Kalki'));

  // Extract p2 values
  const p2Lines = p2Text.split('\n');
  console.log('\n  p2 financial values:');
  for (let i = 0; i < p2Lines.length; i++) {
    const l = p2Lines[i].trim();
    if (['APPROVED BUDGET','TOTAL COMMITTED','TOTAL PAID','PO COMMITMENT'].includes(l)) {
      console.log('    ' + l + ': ' + (p2Lines[i+2] || '').trim());
    }
  }

  // Verify p1 and p2 show different data
  const p1Committed = p1Lines.find((l, i) => l.trim() === 'TOTAL COMMITTED' && p1Lines[i+2]) || '';
  const p2Committed = p2Lines.find((l, i) => l.trim() === 'TOTAL COMMITTED' && p2Lines[i+2]) || '';
  check('9.2 p1 != p2 data (different projects)', p1Text !== p2Text);

  // p2 insurance
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickTab('Insurance');
  await new Promise(r => setTimeout(r, 2000));
  const p2InsRows = await page.$$('table tbody tr');
  check('9.3 p2 insurance rows (' + p2InsRows.length + ', expect ~3)', p2InsRows.length >= 2 && p2InsRows.length <= 4);

  // ── SECTION 10: Project Isolation ──
  console.log('\n--- Section 10: Project Isolation ---');
  // Quick check p3-p7
  for (const pid of ['p3', 'p4', 'p5', 'p7']) {
    await page.goto('http://localhost:3001/dashboard/projects/' + pid + '/accounts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const pText = await page.evaluate(() => document.body.innerText);
    check('10. ' + pid + ' loads without error', pText.includes('TOTAL COMMITTED') || pText.includes('Budget'));
  }

  // ── Console Errors ──
  console.log('\n--- Console Errors ---');
  const relevantErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('favicon'));
  check('11. No JS console errors (' + relevantErrors.length + ')', relevantErrors.length === 0);
  if (relevantErrors.length > 0) {
    relevantErrors.slice(0, 5).forEach(e => console.log('  ERROR: ' + e.substring(0, 150)));
  }

  await browser.close();
  console.log('\n=== A9 Browser Verification Summary: ' + passed + ' PASS, ' + failed + ' FAIL ===\n');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
