const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron') as typeof import('electron');
const path = require('node:path') as typeof import('node:path');
const fs = require('node:fs/promises') as typeof import('node:fs/promises');

let mainWindow: import('electron').BrowserWindow | null = null;

function safeFileName(value: string): string {
  const normalized = value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-');
  return normalized || '상담-결과';
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#ede4cf',
    show: false,
    title: '선행원 · 인생 흐름 주기',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const developmentUrl = process.env.VITE_DEV_SERVER_URL;
    const isAllowed = developmentUrl ? url.startsWith(developmentUrl) : url.startsWith('file://');
    if (!isAllowed) {
      event.preventDefault();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('export:pdf', async (_event, suggestedName: string) => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: '상담 결과 PDF 저장',
    defaultPath: `${safeFileName(suggestedName)}.pdf`,
    filters: [{ name: 'PDF 문서', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) return { canceled: true };

  const pdf = await mainWindow.webContents.printToPDF({
    landscape: true,
    pageSize: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  await fs.writeFile(result.filePath, pdf);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('export:print', async () => {
  if (!mainWindow) return { success: false, error: '인쇄 창을 찾을 수 없습니다.' };

  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    mainWindow?.webContents.print(
      { silent: false, printBackground: true, landscape: true },
      (success, failureReason) => {
        resolve(success ? { success: true } : { success: false, error: failureReason });
      },
    );
  });
});

ipcMain.handle(
  'export:png',
  async (_event, payload: { dataUrl: string; suggestedName: string }) => {
    if (!mainWindow || !payload.dataUrl.startsWith('data:image/png;base64,')) {
      return { canceled: true };
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '상담 그래프 이미지 저장',
      defaultPath: `${safeFileName(payload.suggestedName)}.png`,
      filters: [{ name: 'PNG 이미지', extensions: ['png'] }],
    });

    if (result.canceled || !result.filePath) return { canceled: true };

    const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, '');
    await fs.writeFile(result.filePath, Buffer.from(base64, 'base64'));
    return { canceled: false, filePath: result.filePath };
  },
);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
