import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('agy:selectDirectory'),
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke('agy:getBackendUrl'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('agy:openExternal', url),
  openPath: (path: string): Promise<void> => ipcRenderer.invoke('agy:openPath', path),
  getLocale: (): Promise<string> => ipcRenderer.invoke('agy:getLocale'),
});
