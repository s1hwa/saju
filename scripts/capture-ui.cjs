const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'artifacts');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(main).catch((error) => {
  console.error(error);
  app.exit(1);
});

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#ede4cf',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 숨김 창에서도 그래프 애니메이션이 끝까지 진행되어야 실제 화면과 같은 캡처가 된다.
      backgroundThrottling: false,
    },
  });

  const consoleErrors = [];
  window.webContents.on('console-message', (details) => {
    if (details.level === 'error') consoleErrors.push(details.message);
    if (process.env.CAPTURE_DEBUG) console.log('[renderer]', details.level, details.message);
  });

  const capture = async (name) => {
    if (process.env.CAPTURE_DEBUG) console.log('capture', name);
    await fs.writeFile(path.join(outputDir, `${name}.png`), (await window.capturePage()).toPNG());
  };
  const run = async (script) => {
    const result = await window.webContents.executeJavaScript(`(() => {
      try {
        ${script}
      } catch (error) {
        return { __captureError: String(error), stack: error?.stack };
      }
    })()`);
    if (result?.__captureError) {
      throw new Error(`Renderer check failed: ${result.__captureError}\n${result.stack ?? ''}\nScript:\n${script}`);
    }
    return result;
  };
  const clickButton = (text) =>
    run(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes(${JSON.stringify(text)}) || b.getAttribute('aria-label') === ${JSON.stringify(text)}).click();`);

  // 숨김 창은 캡처할 때만 프레임을 그리므로 애니메이션을 끄고 최종 상태를 촬영한다.
  const indexPath = path.join(root, 'dist', 'index.html');
  await window.loadFile(indexPath);
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await window.loadFile(indexPath);
  await delay(500);

  const entryLayout = await run(`
    const form = document.querySelector('.intake-form').getBoundingClientRect();
    const column = document.querySelector('.entry-column');
    return {
      horizontalOffset: (form.left + form.width / 2) - window.innerWidth / 2,
      verticalOffset: (form.top + form.height / 2) - window.innerHeight / 2,
      formTop: form.top,
      formBottom: form.bottom,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      columnTop: getComputedStyle(column).top,
    };
  `);
  if (Math.abs(entryLayout.horizontalOffset) > 2 || Math.abs(entryLayout.verticalOffset) > 24) {
    throw new Error(`Entry form is not centered: ${JSON.stringify(entryLayout)}`);
  }
  await capture('input-screen');

  await run(`document.querySelector('form').requestSubmit();`);
  await delay(300);
  const inputError = await run(`return document.querySelector('#form-error').textContent.trim();`);
  if (inputError !== '이름을 입력해 주세요.') {
    throw new Error(`Unexpected empty-form error: ${inputError}`);
  }
  await capture('input-error');

  await run(`
    const setValue = (selector, value) => {
      const input = document.querySelector(selector);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setValue('#client-name', '홍길동');
    setValue('#start-year', '1975');
    setValue('#spring-age', '-16');
    document.querySelector('form').requestSubmit();
  `);
  await delay(1300);
  await capture('result-psychology');

  const initialChecked = await run(
    `return [...document.querySelectorAll('.flow-toggle input')].map((input) => input.checked);`,
  );
  if (JSON.stringify(initialChecked) !== JSON.stringify([true, false, false, false])) {
    throw new Error(`Unexpected initial series selection: ${initialChecked}`);
  }

  const initialRangeMode = await run(`return document.querySelector('.range-mode').textContent.trim();`);
  if (initialRangeMode !== '전체 보기') {
    throw new Error(`Unexpected initial range mode: ${initialRangeMode}`);
  }

  await clickButton('전체 보기');
  await delay(300);
  const fullRangeMode = await run(`return document.querySelector('.range-mode').textContent.trim();`);
  if (fullRangeMode !== '화면 맞춤') {
    throw new Error(`Full range did not activate: ${fullRangeMode}`);
  }

  await clickButton('화면 맞춤');
  await delay(300);
  const fittedRangeMode = await run(`return document.querySelector('.range-mode').textContent.trim();`);
  if (fittedRangeMode !== '전체 보기') {
    throw new Error(`Fit-to-screen did not restore the initial range: ${fittedRangeMode}`);
  }

  await run(`document.querySelectorAll('.flow-toggle input').forEach((input) => { if (!input.checked) input.click(); });`);
  await delay(1000);
  await capture('result-all');

  // 인쇄 버튼으로 그래프 이미지를 준비시킨 뒤 A4 가로 PDF를 만든다.
  await run(`window.print = () => {};`);
  await clickButton('인쇄');
  await delay(1500);
  const pdf = await window.webContents.printToPDF({
    landscape: true,
    pageSize: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  const reportPath = path.join(outputDir, 'report.pdf');
  await fs.writeFile(reportPath, pdf);

  const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  if (pageCount !== 1) throw new Error(`Print report must fit on one page, got ${pageCount}.`);

  const pdfWindow = new BrowserWindow({ width: 1400, height: 1000, show: false });
  await pdfWindow.loadFile(reportPath);
  await delay(1500);
  await fs.writeFile(path.join(outputDir, 'report-preview.png'), (await pdfWindow.capturePage()).toPNG());
  pdfWindow.destroy();

  await clickButton('정보 수정');
  await delay(500);
  const preserved = await run(
    `return ['#client-name', '#start-year', '#spring-age'].map((s) => document.querySelector(s).value);`,
  );
  if (preserved.join('|') !== '홍길동|1975|-16') {
    throw new Error(`Edit did not preserve input: ${preserved}`);
  }
  await capture('input-edit-small');

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join('\n')}`);
  }

  window.destroy();
  app.quit();
}
