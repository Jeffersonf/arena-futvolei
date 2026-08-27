const { chromium } = require('playwright');
const fs = require('fs');

const baseUrl = process.env.VISUAL_CHECK_URL || 'http://127.0.0.1:4280/';
const outDir = 'tmp-visual-check';
const expectedAssetVersion = process.env.VISUAL_CHECK_VERSION || '20260827-a11y1';
const expectedStyleVersion = process.env.VISUAL_STYLE_VERSION || '20260827-editorial1';
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;

const cases = [
  { name: 'mobile-booking', viewport: { width: 390, height: 844 }, page: null },
  { name: 'mobile-student-confirm-public', viewport: { width: 390, height: 844 }, page: null, action: 'public-student-tab' },
  { name: 'desktop-booking', viewport: { width: 1440, height: 950 }, page: null },
  { name: 'mobile-dashboard', viewport: { width: 390, height: 844 }, page: 'dashboard' },
  { name: 'mobile-dashboard-dark', viewport: { width: 390, height: 844 }, page: 'dashboard', theme: 'dark' },
  { name: 'mobile-actions', viewport: { width: 390, height: 844 }, page: 'actions' },
  { name: 'mobile-students', viewport: { width: 390, height: 844 }, page: 'students' },
  { name: 'mobile-classes', viewport: { width: 390, height: 844 }, page: 'classes' },
  { name: 'mobile-payments', viewport: { width: 390, height: 844 }, page: 'payments' },
  { name: 'mobile-payment-modal', viewport: { width: 390, height: 844 }, page: 'payments', action: 'payment-modal' },
  { name: 'mobile-bookings', viewport: { width: 390, height: 844 }, page: 'bookings' },
  { name: 'mobile-student-modal', viewport: { width: 390, height: 844 }, page: 'students', action: 'student-modal' },
  { name: 'mobile-student-report', viewport: { width: 390, height: 844 }, page: 'students', action: 'student-report' },
  { name: 'mobile-attendance', viewport: { width: 390, height: 844 }, page: 'classes', action: 'attendance' },
  { name: 'mobile-reports', viewport: { width: 390, height: 844 }, page: 'reports' },
  { name: 'mobile-class-modal', viewport: { width: 390, height: 844 }, page: 'classes', action: 'class-modal' },
  { name: 'mobile-more', viewport: { width: 390, height: 844 }, page: 'more' },
  { name: 'desktop-dashboard', viewport: { width: 1440, height: 950 }, page: 'dashboard' },
  { name: 'desktop-dashboard-dark', viewport: { width: 1440, height: 950 }, page: 'dashboard', theme: 'dark' },
  { name: 'desktop-actions', viewport: { width: 1440, height: 950 }, page: 'actions' },
  { name: 'desktop-students', viewport: { width: 1440, height: 950 }, page: 'students' },
  { name: 'desktop-bookings', viewport: { width: 1440, height: 950 }, page: 'bookings' },
  { name: 'desktop-student-report', viewport: { width: 1440, height: 950 }, page: 'students', action: 'student-report' },
  { name: 'desktop-attendance', viewport: { width: 1440, height: 950 }, page: 'classes', action: 'attendance' }
];

const selectedCases = process.env.VISUAL_CASE
  ? cases.filter((item) => item.name === process.env.VISUAL_CASE)
  : cases;

async function login(page) {
  const bookingOpen = await page.locator('#bookingWall.open').count();
  if (bookingOpen) await page.locator('#adminAccessBtn').click();
  await page.locator('#loginPin').fill('1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForFunction(() => !document.getElementById('loginWall').classList.contains('open'), null, { timeout: 5000 });
}

async function runCaseAction(page, action) {
  if (action === 'public-student-tab') {
    await page.locator('[data-public-tab="student"]').click();
  }
  if (action === 'student-report') {
    await page.locator('#page-students.active .student-row [data-report-student]').first().click();
    await page.waitForSelector('#studentReportModal.open', { timeout: 5000 });
  }
  if (action === 'student-modal') {
    await page.locator('#page-students.active .student-row [data-edit-student]').first().click();
    await page.waitForSelector('#studentModal.open', { timeout: 5000 });
  }
  if (action === 'payment-modal') {
    await page.locator('#page-payments.active [data-pay]').first().click();
    await page.waitForSelector('#paymentModal.open', { timeout: 5000 });
  }
  if (action === 'class-modal') {
    await page.locator('#page-classes.active [data-open-class]').first().click();
    await page.waitForSelector('#classModal.open', { timeout: 5000 });
  }
  if (action === 'attendance') {
    await page.locator('#page-classes.active [data-attendance]').first().click();
    await page.waitForSelector('#attendanceModal.open', { timeout: 5000 });
  }
}

(async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath });
  for (const item of selectedCases) {
    console.log(`Visual check: ${item.name}`);
    const context = await browser.newContext({ viewport: item.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()} (${message.location().url || 'sem origem'})`);
    });
    page.setDefaultTimeout(5000);
    await page.goto(`${baseUrl}?visual=${item.name}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(300);
    console.log(`  loaded ${item.name}`);
    const assetVersion = await page.locator('script[src*="app.js"]').getAttribute('src');
    if (baseUrl.includes('127.0.0.1') && !assetVersion.includes(expectedAssetVersion)) {
      throw new Error(`${item.name}: asset version inesperada (${assetVersion})`);
    }
    const styleVersion = await page.locator('link[href*="styles.css"]').getAttribute('href');
    if (baseUrl.includes('127.0.0.1') && !styleVersion.includes(expectedStyleVersion)) {
      throw new Error(`${item.name}: styles inesperado (${styleVersion})`);
    }
    if (item.page) {
      await login(page);
      console.log(`  logged ${item.name}`);
      await page.evaluate((target) => window.localStorage.setItem('tlf_last_page', target), item.page);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(300);
      console.log(`  reloaded ${item.name}`);
    }
    if (item.theme) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('fv_theme', theme);
      }, item.theme);
      await page.waitForTimeout(100);
    }
    if (item.action) await runCaseAction(page, item.action);
    console.log(`  action ${item.name}`);
    if (runtimeErrors.length) throw new Error(`${item.name}: ${runtimeErrors.join(' | ')}`);
    await page.screenshot({ path: `${outDir}/${item.name}.png`, fullPage: false });
    console.log(`  screenshot ${item.name}`);
    const issueCount = await page.evaluate(() => {
      function hasHorizontalScroller(node) {
        let current = node.parentElement;
        while (current && current !== document.body) {
          const style = getComputedStyle(current);
          if (current.scrollWidth > current.clientWidth && ['auto', 'scroll'].includes(style.overflowX)) return true;
          current = current.parentElement;
        }
        return false;
      }
      const nodes = Array.from(document.querySelectorAll('body *'));
      return nodes.filter((node) => {
        if (hasHorizontalScroller(node)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return rect.right > window.innerWidth + 1 || rect.left < -1;
      }).length;
    });
    if (issueCount) throw new Error(`${item.name}: ${issueCount} elemento(s) fora da viewport`);
    await context.close();
    console.log(`  closed ${item.name}`);
  }
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);
  console.log(`Visual check ok: ${selectedCases.length} screenshots em ${outDir}`);
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
