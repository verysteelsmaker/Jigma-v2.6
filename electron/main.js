const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#171717',
    icon: path.join(__dirname, '../jigma_logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple apps; consider enabling for security in larger apps
    },
  });

  // Remove the default menu bar
  win.setMenu(null);

  // Load the built index.html
  win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Open the DevTools.
  // win.webContents.openDevTools();
}

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