// Preload seguro: expoe apenas flags de ambiente para o renderer.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('monelyDesktop', {
  isDesktop: true,
  platform: process.platform,
});
