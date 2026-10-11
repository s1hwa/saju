// 실행 아이콘(build/icon.ico, build/icon.png)을 src/constants/logo.ts의 로고 도형으로 다시 그린다.
// 실행: node scripts/run-electron.cjs scripts/render-icon.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');
const { transformSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');

// 크기별 세부 단계와 테두리 두께(100 단위). 작을수록 선을 두껍게 하고 얼굴을 덜어낸다.
const SIZES = [
  { size: 256, detail: 'full', border: 2.4 },
  { size: 128, detail: 'full', border: 3 },
  { size: 64, detail: 'simple', border: 3.2 },
  { size: 48, detail: 'simple', border: 3.2 },
  { size: 32, detail: 'small', border: 4.7 },
  { size: 24, detail: 'small', border: 5.5 },
  { size: 16, detail: 'tiny', border: 6.25 },
];

app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.disableHardwareAcceleration();

app.whenReady().then(main).catch((error) => {
  console.error(error);
  app.exit(1);
});

async function loadLogoModule() {
  const source = await fs.readFile(path.join(root, 'src', 'constants', 'logo.ts'), 'utf8');
  const { code } = transformSync(source, { loader: 'ts', format: 'cjs' });
  const logoModule = new Module('logo');
  logoModule._compile(code, 'logo.cjs');
  return logoModule.exports;
}

async function main() {
  const { logoSvg } = await loadLogoModule();

  const width = SIZES.reduce((sum, { size }) => sum + size + 8, 0);
  const cells = [];
  let x = 0;
  for (const entry of SIZES) {
    cells.push({ ...entry, x });
    x += entry.size + 8;
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:transparent;overflow:hidden}
    div{position:absolute;top:0}
  </style></head><body>${cells
    .map(({ size, detail, border, x: left }) =>
      `<div style="left:${left}px;width:${size}px;height:${size}px">${logoSvg(detail, border)}</div>`,
    )
    .join('')}</body></html>`;

  const window = new BrowserWindow({
    width,
    height: 256,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { offscreen: true },
  });
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const images = [];
  for (const { size, x: left } of cells) {
    const image = await window.webContents.capturePage({ x: left, y: 0, width: size, height: size });
    const png = image.resize({ width: size, height: size, quality: 'best' }).toPNG();
    images.push({ size, png });
  }

  // 창을 먼저 닫으면 앱이 바로 종료되어 파일 쓰기가 끊기므로 쓰기를 마친 뒤 닫는다.
  await fs.writeFile(path.join(buildDir, 'icon.png'), images[0].png);
  await fs.writeFile(path.join(buildDir, 'icon.ico'), buildIco(images));
  console.log(`icon.ico: ${images.map(({ size }) => size).join(', ')}`);
  window.destroy();
  app.exit(0);
}

/** PNG를 그대로 담는 ICO(Windows Vista 이상). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}
