import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage();
  const base = process.env.GUIDE_BASE_URL || 'http://127.0.0.1:5173';
  for (const [entity, route] of [['user', 'users'], ['role', 'roles'], ['client', 'clients']]) {
    await page.goto(`${base}/administration/${route}`, { waitUntil: 'networkidle2' });
    await page.locator('button[aria-haspopup="dialog"]').click();
    for (const language of ['en', 'gu', 'hi']) {
      await page.click(`dialog button[lang="${language}"]`);
      await page.waitForFunction((language) => document.querySelector('dialog[open]')?.lang === language, {}, language);
      await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('dialog img')].map((img) => img.decode())); });
      assert.equal(await page.$$eval('dialog li', (items) => items.length), 4);
      const href = await page.$eval('dialog a[download]', (el) => el.href);
      assert.ok(href.endsWith(`admin-${entity}-${language}.pdf`));
      const response = await fetch(href);
      assert.equal(response.status, 200);
      const pdf = Buffer.from(await response.arrayBuffer()).toString('latin1');
      assert.ok(pdf.startsWith('%PDF-'));
      assert.equal((pdf.match(/\/Type\s*\/Page\b/g) || []).length, 4);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.$('dialog[open]'), null);
    await page.setViewport({ width: 390, height: 844 });
    await page.locator('button[aria-haspopup="dialog"]').click();
    assert.ok(await page.$eval('dialog', (el) => el.scrollWidth <= el.clientWidth));
    await page.keyboard.press('Escape');
    await page.setViewport({ width: 1440, height: 1100 });
    console.log(`${entity}: all languages, screenshots, four-page PDFs, Escape and mobile layout passed`);
  }
} finally {
  await browser.close();
}
