import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const base = process.env.GUIDE_BASE_URL || 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});

try {
  // A fresh browser profile keeps example data separate from user records.
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto(`${base}/crm/leads/stage-tasks`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[aria-label="How to create lead stage tasks"]');
  const capture = async (step, target) => {
    await page.evaluate(() => document.fonts.ready);
    await target.screenshot({ path: fileURLToPath(new URL(`../public/guide/stage-${step}.png`, import.meta.url)) });
  };
  const main = await page.$('main');
  if (!main) throw new Error('Lead Stage Tasks main content was not found');
  await capture(1, main);
  await page.locator('::-p-xpath(//button[normalize-space(.)="Add Task"])').click();
  await page.waitForSelector('form input[placeholder="Enter Task Name"]');
  const form = await page.$('form');
  await capture(2, form);
  for (const [step, name, description] of [
    [3, 'Call', 'Initial call to understand requirement and qualify the lead.'],
    [4, 'Send email', 'Share brochure, confirm collected details, and plan the next step.'],
    [5, 'Send quotation', 'Share the proposal and confirm a date for follow-up.'],
  ]) {
    await page.locator('input[placeholder="Enter Task Name"]').fill(name);
    await page.locator('textarea[placeholder="Enter Description"]').fill(description);
    await capture(step, form);
  }
  await page.locator('[aria-label="Close task form"]').click();
  await page.locator('[aria-label="How to create lead stage tasks"]').click();
  await page.waitForSelector('[role="dialog"] img');
  const images = await page.evaluate(async () => {
    const images = [...document.querySelectorAll('[role="dialog"] img')];
    await Promise.all(images.map((image) => image.decode()));
    return images.map((image) => ({ src: image.src, width: image.naturalWidth, height: image.naturalHeight }));
  });
  if (images.length !== 5) throw new Error(`Expected 5 guide images, found ${images.length}`);
  console.log('Verified guide images:', images);
} finally {
  await browser.close();
}
