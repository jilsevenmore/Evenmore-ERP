import puppeteer from 'puppeteer-core';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/guide');
const guides = JSON.parse(await readFile(path.join(root, 'src/features/administration/administrationGuides.json'), 'utf8'));
const base = process.env.GUIDE_BASE_URL || 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
try {
  await mkdir(output, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  // A fresh browser context keeps demo records separate from the user's data.
  const button = (text) => page.locator(`::-p-xpath(//button[normalize-space(.)='${text}'])`);
  const fill = (placeholder, value) => page.locator(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`).fill(value);
  async function shot(entity, step, label, form = false) {
    await page.evaluate((label) => {
      document.querySelectorAll('[data-guide-highlight]').forEach((el) => { el.style.outline = ''; el.removeAttribute('data-guide-highlight'); });
      const el = [...document.querySelectorAll('button, label')].find((el) => el.textContent.trim() === label);
      if (el) { el.style.outline = '3px solid #f59e0b'; el.style.outlineOffset = '3px'; el.dataset.guideHighlight = 'true'; el.scrollIntoView({ block: 'center' }); }
    }, label);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const target = form ? await page.$('form') : null;
    const card = target ? await target.evaluateHandle((el) => el.parentElement) : null;
    await (card?.asElement() || page).screenshot({ path: path.join(output, `admin-${entity}-${step}.png`) });
  }
  for (const [entity, route, create] of [['user', 'users', 'Create User'], ['role', 'roles', 'Create New Role'], ['client', 'clients', 'Create New Client']]) {
    await page.goto(`${base}/administration/${route}`, { waitUntil: 'networkidle2' });
    await shot(entity, 1, create);
    await button(create).click();
    if (entity === 'user') {
      await fill('e.g. Ramesh Sharma', 'Asha Shah');
      await fill('ramesh@imtendoscopy.com', 'asha@example.com');
      await fill('+91 98765 43210', '+91 90000 00001');
      await shot(entity, 2, 'Full Name *', true);
      await page.select('form select', 'Employee');
      await fill('Mumbai, India', 'Ahmedabad, India');
      await fill('Mahesh Kubawat', 'Demo Manager');
      await shot(entity, 3, 'Role', true);
      await shot(entity, 4, 'Save & Create User', true);
    } else if (entity === 'role') {
      await fill('e.g. Regional Sales Lead', 'Sales Assistant');
      await fill('Describe access boundaries...', 'View leads and create follow-up tasks.');
      await shot(entity, 2, 'Create Role', true);
      await button('Create Role').click();
      await page.waitForSelector('input[type="checkbox"]');
      await page.locator('::-p-xpath(//label[normalize-space(.)="View Lead"]//input)').click();
      await shot(entity, 3, 'View Lead');
      await shot(entity, 4, 'Update Role');
    } else {
      await fill('Enter client name', 'Ravi Patel');
      await fill('Enter client email', 'ravi@example.com');
      await fill('Enter phone number', '9000000002');
      await shot(entity, 2, 'Create Client', true);
      await fill('Enter company name', 'Example Industries');
      await fill('Enter location (e.g. Surat, India)', 'Surat, India');
      await fill('Select or type tags (comma separated, e.g. VIP, Regular)', 'Regular');
      await shot(entity, 3, 'Company (Optional)', true);
      const login = await page.$('form input[type="checkbox"]');
      if (login && !(await login.evaluate((el) => el.checked))) await login.click();
      await fill('Set login password', 'DemoPassword123!');
      await fill('Confirm password', 'DemoPassword123!');
      await shot(entity, 4, 'Create Client', true);
    }
    console.log(`Captured ${entity} screenshots`);
  }
  for (const [entity, translations] of Object.entries(guides)) {
    for (const [language, guide] of Object.entries(translations)) {
      const sections = await Promise.all(guide.steps.map(async (step, index) => {
        const png = await readFile(path.join(output, `admin-${entity}-${index + 1}.png`));
        return `<section><h1>${escapeHtml(guide.title)}</h1><p class="brand">Evenmore ERP · ${index + 1} / ${guide.steps.length}</p><p class="step"><b>${index + 1}.</b> ${escapeHtml(step)}</p><img src="data:image/png;base64,${png.toString('base64')}" /><p class="example">${{ en: 'Screenshot example with demo data', gu: 'નમૂનાના ડેટા સાથે સ્ક્રીનશૉટ ઉદાહરણ', hi: 'नमूना डेटा के साथ स्क्रीनशॉट उदाहरण' }[language]}</p></section>`;
      }));
      await page.setContent(`<!doctype html><html lang="${language}"><meta charset="utf-8"><style>@page{size:A4;margin:16mm}body{font-family:Arial,'Nirmala UI',sans-serif;color:#172033;margin:0}section{break-after:page}section:last-child{break-after:auto}h1{font-size:23px;margin:0 0 8px}.brand,.example{font-size:12px;color:#64748b}.step{font-size:16px;line-height:1.8;margin:22px 0}img{display:block;max-width:100%;max-height:210mm;margin:auto;object-fit:contain;border:1px solid #cbd5e1;border-radius:8px}</style>${sections.join('')}</html>`);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((img) => img.decode())); });
      await page.pdf({ path: path.join(output, `admin-${entity}-${language}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
      console.log(`Generated ${entity} PDF (${language})`);
    }
  }
} finally {
  await browser.close();
}
