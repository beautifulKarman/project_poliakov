<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
<<<<<<< Updated upstream
    width: 800,
    height: 600
  });
  win.loadFile('index.html');
};
=======
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,  
      contextIsolation: false,
      webSecurity: false      
    }
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp =
      "default-src 'self' data:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "connect-src 'self' https://matrix.org;";
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [csp] } });
  });

  win.loadFile('index.html');
}
>>>>>>> Stashed changes

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
