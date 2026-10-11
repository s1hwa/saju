const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePdf: (suggestedName: string) => ipcRenderer.invoke('export:pdf', suggestedName),
  print: () => ipcRenderer.invoke('export:print'),
  savePng: (dataUrl: string, suggestedName: string) =>
    ipcRenderer.invoke('export:png', { dataUrl, suggestedName }),
});
