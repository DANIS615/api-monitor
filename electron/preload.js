const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electron', {
  // APIs que necesitemos exponer desde el proceso principal
  platform: process.platform
});

console.log('Preload script loaded');

