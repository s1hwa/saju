const { app, BrowserWindow, nativeImage } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts', 'checklist');
const results = [];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let window;

async function run(script) {
  return window.webContents.executeJavaScript(`(async () => { ${script} })()`);
}

async function check(name, task) {
  await task();
  results.push({ name, status: 'passed' });
  console.log(`PASS ${name}`);
}

async function click(selector) {
  await run(`document.querySelector(${JSON.stringify(selector)}).click();`);
  await delay(300);
}

async function fill(name, year, age) {
  await run(`
    const values = ${JSON.stringify([name, String(year), String(age)])};
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ['#client-name', '#start-year', '#spring-age'].forEach((selector, i) => {
      const input = document.querySelector(selector);
      setter.call(input, values[i]);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  `);
  await run(`document.querySelector('form').requestSubmit();`);
  await delay(700);
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  window = new BrowserWindow({
    width: 1440, height: 900, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  const errors = [];
  window.webContents.on('console-message', (details) => {
    if (details.level === 'error') errors.push(details.message);
  });
  // This exercises the local build without a dev server or external requests.
  window.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: /^https?:/.test(details.url) });
  });
  await window.loadFile(path.join(root, 'dist', 'index.html'));
  await delay(500);

  await check('U01 empty input reports an error', async () => {
    await run(`document.querySelector('form').requestSubmit();`);
    await delay(100);
    assert.equal(await run(`return document.querySelector('#client-name').getAttribute('aria-invalid');`), 'true');
  });

  await check('U01 missing year and fractional age are rejected', async () => {
    await fill('Checklist client', '', 9);
    assert.equal(await run(`return document.querySelector('#start-year').getAttribute('aria-invalid');`), 'true');
    await fill('Checklist client', 2003, 1.5);
    assert.equal(await run(`return document.querySelector('#spring-age').getAttribute('aria-invalid');`), 'true');
  });

  await fill('  Checklist client  ', 2003, 9);
  await check('U02 psychology is selected by default and graph is rendered', async () => {
    assert.deepEqual(await run(`return [...document.querySelectorAll('.flow-toggle input')].map(i => i.checked);`), [true, false, false, false]);
    assert.ok(await run(`return document.querySelectorAll('.flow-chart svg path').length > 10;`));
  });

  await check('U03-U04 hidden negative point and range navigation', async () => {
    assert.ok((await run(`return document.querySelector('.range-label').textContent;`)).includes('2003년 1세'));
    await click('.range-mode');
    const full = await run(`return document.querySelector('.range-label').textContent;`);
    assert.ok(full.includes('2101년 99세'), full);
    await click('.range-mode');
    await click('[aria-label="다음 구간"]');
    assert.notEqual(await run(`return document.querySelector('.range-label').textContent;`), full);
    await click('.range-mode');
    assert.equal(await run(`return document.querySelector('.range-label').textContent;`), full);
  });

  await check('U02 all flows and empty selection states', async () => {
    await run(`document.querySelectorAll('.flow-toggle input').forEach(i => { if (!i.checked) i.click(); });`);
    await delay(300);
    assert.deepEqual(await run(`return [...document.querySelectorAll('.flow-toggle input')].map(i => i.checked);`), [true, true, true, true]);
    await run(`document.querySelectorAll('.flow-toggle input').forEach(i => i.click());`);
    await delay(300);
    assert.ok(await run(`return !!document.querySelector('.empty-chart-state');`));
    await run(`document.querySelector('.flow-toggle input').click();`);
    await delay(300);
  });

  await check('U05 generated PNG and report metadata agree with input', async () => {
    await run(`window.print = () => {};`);
    await run(`document.querySelector('.app-bar-nav button:last-child').click();`);
    let image;
    for (let i = 0; i < 50; i += 1) {
      image = await run(`return document.querySelector('.print-chart-frame img')?.src;`);
      if (image) break;
      await delay(100);
    }
    assert.ok(image?.startsWith('data:image/png;base64,'), 'Print preparation must generate PNG');
    const png = nativeImage.createFromDataURL(image);
    assert.deepEqual(png.getSize(), { width: 4200, height: 1980 });
    const pixels = png.toBitmap();
    let dark = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 120 && pixels[i + 1] < 120 && pixels[i + 2] < 120) dark += 1;
    }
    assert.ok(dark > 1000, 'Generated chart must not be blank');
    await fs.writeFile(path.join(output, 'chart.png'), png.toPNG());
    const text = await run(`return document.querySelector('.print-title').textContent;`);
    assert.ok(text.includes('Checklist client') && text.includes('2003') && text.includes('9'));
    assert.equal(await run(`return document.querySelectorAll('.print-legend-item').length;`), 1);
  });

  await check('U06 A4 landscape PDF contains one page', async () => {
    const pdf = await window.webContents.printToPDF({ landscape: true, pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
    assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length, 1);
    assert.ok(pdf.length > 10000);
    await fs.writeFile(path.join(output, 'report.pdf'), pdf);
  });

  await check('U01 edit preserves trimmed input', async () => {
    for (let i = 0; i < 50; i += 1) {
      if (await run(`return !document.querySelector('.app-bar-nav button:first-child').disabled;`)) break;
      await delay(100);
    }
    await click('.app-bar-nav button:first-child');
    assert.deepEqual(await run(`return ['#client-name', '#start-year', '#spring-age'].map(s => document.querySelector(s)?.value);`), ['Checklist client', '2003', '9']);
  });

  await check('U03 negative-age examples start at the expected visible age', async () => {
    for (const [age, year, visibleAge] of [[-3, 2004, 2], [-16, 2003, 1], [7, 2002, 0]]) {
      await fill('Checklist client', 2003, age);
      assert.ok((await run(`return document.querySelector('.range-label').textContent;`)).includes(`${year}년 ${visibleAge}세`));
      await click('.app-bar-nav button:first-child');
    }
  });
  assert.deepEqual(errors, []);
  results.push({ name: 'U07 physical printer', status: 'manual-required' });
  results.push({ name: 'U08 customer PC installation', status: 'manual-required' });
}

app.whenReady().then(main).then(async () => {
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  window?.destroy();
  app.quit();
}).catch(async (error) => {
  console.error(error);
  results.push({ status: 'failed', error: String(error) });
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ results }, null, 2));
  window?.destroy();
  app.exit(1);
});
