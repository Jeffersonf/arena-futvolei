const { chromium } = require('playwright');
const fs = require('fs');

const baseUrl = process.env.VISUAL_CHECK_URL || 'http://127.0.0.1:4280/';
const outDir = 'tmp-visual-check';
const expectedAssetVersion = process.env.VISUAL_CHECK_VERSION || '20260603-booking1';
const expectedPolishVersion = process.env.VISUAL_POLISH_VERSION || '20260603-visual2';

const cases = [
  { name: 'mobile-booking', viewport: { width: 390, height: 844 }, page: null },
  { name: 'mobile-dashboard', viewport: { width: 390, height: 844 }, page: 'dashboard' },
  { name: 'mobile-classes', viewport: { width: 390, height: 844 }, page: 'classes' },
  { name: 'mobile-payments', viewport: { width: 390, height: 844 }, page: 'payments' },
  { name: 'desktop-dashboard', viewport: { width: 1440, height: 950 }, page: 'dashboard' },
  { name: 'desktop-students', viewport: { width: 1440, height: 950 }, page: 'students' }
];

async function login(page) {
  const bookingOpen = await page.locator('#bookingWall.open').count();
  if (bookingOpen) await page.locator('#adminAccessBtn').click();
  await page.locator('#loginPin').fill('1234');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForFunction(() => !document.getElementById('loginWall').classList.contains('open'), null, { timeout: 5000 });
}

(async () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const item of cases) {
    const context = await browser.newContext({ viewport: item.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(`${baseUrl}?visual=${item.name}`, { waitUntil: 'networkidle' });
    const assetVersion = await page.locator('script[src*="app.js"]').getAttribute('src');
    if (baseUrl.includes('127.0.0.1') && !assetVersion.includes(expectedAssetVersion)) {
      throw new Error(`${item.name}: asset version inesperada (${assetVersion})`);
    }
    const polishVersion = await page.locator('link[href*="visual-polish.css"]').getAttribute('href');
    if (baseUrl.includes('127.0.0.1') && !polishVersion.includes(expectedPolishVersion)) {
      throw new Error(`${item.name}: visual polish inesperado (${polishVersion})`);
    }
    if (item.page) {
      await login(page);
      await page.evaluate((target) => window.localStorage.setItem('tlf_last_page', target), item.page);
      await page.reload({ waitUntil: 'networkidle' });
    }
    await page.screenshot({ path: `${outDir}/${item.name}.png`, fullPage: false });
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
  }
  await browser.close();
  console.log(`Visual check ok: ${cases.length} screenshots em ${outDir}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
