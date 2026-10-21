import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('agy:selectDirectory'),
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke('agy:getBackendUrl'),
});
