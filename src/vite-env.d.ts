/// <reference types="vite/client" />

import type { ElectronApi } from './types/consultation';

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}

export {};

