// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      // Щоб рендерер (наш index.html) міг спокійно працювати з Alpine/Tailwind
      nodeIntegration: true,
      contextIsolation: false,

      // Дозволяємо file:// + CDN у дев-режимі (спрощуємо CSP для навчальної задачі)
      webSecurity: false
    }
  });

  // Підлаштовуємо заголовок CSP, щоб не блокувати CDN-скрипти
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = "default-src 'self' data:; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; " +
                "style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://matrix.org;";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  win.loadFile('index.html');

  // Для налагодження за потреби:
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
