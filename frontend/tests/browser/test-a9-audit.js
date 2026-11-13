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

  console.log('\n=== A9 FULL AUDIT — Browser Verification ===\n');
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

  // ══ SECTION 1: GLOBAL OVERVIEW ══
  await page.goto('http://localhost:3001/dashboard/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  let text = await page.evaluate(() => document.body.innerText);

  check('1.1 Overview loads', text.includes('Approved Budget') || text.includes('Overview'));
  check('1.2 Committed value shown', /TOTAL COMMITTED[\s\S]*?₹[\d,.]+\s*(Cr|L|K)/i.test(text));
  check('1.3 PO Commitment shown', /PO COMMITMENT[\s\S]*?₹[\d,.]+\s*(Cr|L|K)/i.test(text));
  check('1.4 Paid value shown', /TOTAL PAID[\s\S]*?₹[\d,.]+\s*(Cr|L|K)/i.test(text));
  check('1.5 Available Budget card', text.includes('Available Budget') || text.includes('AVAILABLE BUDGET'));
  check('1.6 Deposits card', text.includes('Deposits'));
  check('1.7 Outstanding card', text.includes('Outstanding'));
  check('1.8 Project data visible', text.includes('Pushpa') || text.includes('RRR') || text.includes('Baahubali'));

  // ══ SECTION 2: BUDGETS TAB ══
  const budgetsClicked = await clickTabByText('Budgets');
  check('2.1 Budgets tab clicked', budgetsClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('2.2 Project Budgets sub-tab', text.includes('Project Budgets'));
  check('2.3 Budget amounts visible', text.includes('Approved') || text.includes('Budget'));
  check('2.4 Dept Allocations available', text.includes('Dept Allocations'));

  // ══ SECTION 3: EXPENSES TAB ══
  const expensesClicked = await clickTabByText('Expenses');
  check('3.1 Expenses tab clicked', expensesClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('3.2 Expense register loads', text.includes('Total Committed') || text.includes('Expense'));
  const expRows = await page.$$('table tbody tr');
  check('3.3 Expense rows (' + expRows.length + ', expect >20)', expRows.length > 20);

  // ══ SECTION 4: PURCHASE ORDERS TAB ══
  const poClicked = await clickTabByText('Purchase Orders');
  check('4.1 PO tab clicked', poClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('4.2 PO workspace loads', text.includes('Purchase Order') || text.includes('PO'));
  const poRows = await page.$$('table tbody tr');
  check('4.3 PO rows (' + poRows.length + ', expect >=10)', poRows.length >= 10);
  check('4.4 Create PO button', text.includes('Create PO') || text.includes('New PO'));

  // ══ SECTION 5: VENDORS TAB ══
  const vendorsClicked = await clickTabByText('Vendors');
  check('5.1 Vendors tab clicked', vendorsClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('5.2 Vendors workspace loads', text.includes('Vendor') || text.includes('vendor'));
  check('5.3 Vendor cards', text.includes('Total Vendors') || text.includes('TOTAL VENDORS'));

  // ══ SECTION 6: INSURANCE TAB ══
  const insClicked = await clickTabByText('Insurance');
  check('6.1 Insurance tab clicked', insClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('6.2 Insurance Register', text.includes('Insurance Register'));
  const insRows = await page.$$('table tbody tr');
  check('6.3 Policy rows (' + insRows.length + ', expect >=15)', insRows.length >= 15);

  // ══ SECTION 7: REPORTS TAB ══
  const reportsClicked = await clickTabByText('Reports');
  check('7.1 Reports tab clicked', reportsClicked);
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('7.2 Reports content', text.includes('Report') || text.includes('Budget') || text.includes('Financial'));

  // ══ SECTION 8: PROJECT p1 SCOPED ══
  await page.goto('http://localhost:3001/dashboard/projects/p1/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('8.1 P1 accounts loads', text.includes('Approved Budget') || text.includes('Committed'));

  await clickTabByText('Expenses');
  await new Promise(r => setTimeout(r, 2000));
  const p1ExpRows = await page.$$('table tbody tr');
  check('8.2 P1 expenses scoped (' + p1ExpRows.length + ')', p1ExpRows.length > 0);

  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickTabByText('Insurance');
  await new Promise(r => setTimeout(r, 2000));
  const p1InsRows = await page.$$('table tbody tr');
  check('8.3 P1 insurance scoped (' + p1InsRows.length + ', expect 4-6)', p1InsRows.length >= 4 && p1InsRows.length <= 6);

  // ══ SECTION 9: PROJECT p2 SCOPED ══
  await page.goto('http://localhost:3001/dashboard/projects/p2/accounts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  text = await page.evaluate(() => document.body.innerText);
  check('9.1 P2 accounts loads', text.includes('Approved Budget') || text.includes('Committed'));

  // ══ SECTION 10: NAVIGATION ══
  await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  text = await page.evaluate(() => document.body.innerText);
  check('10.1 Sidebar has Budgets & Accounts', text.includes('Budgets & Accounts'));

  // ══ SECTION 11: CONSOLE ERRORS ══
  const relevantErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('hydrat'));
  check('11.1 No JS console errors (' + relevantErrors.length + ')', relevantErrors.length === 0);

  await browser.close();
  console.log('\n=== A9 Full Audit: ' + passed + ' PASS, ' + failed + ' FAIL ===\n');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
