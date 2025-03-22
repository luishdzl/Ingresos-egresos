// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Iniciar el servidor Express (backend)
require('./backend/index');

function createWindow() {
  const win = new BrowserWindow({
"width": 1280,
"height": 720,
"resizable": true,
"maximized": true,
    webPreferences: {
      // No se habilita la integración de Node en el render para mayor seguridad
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Cargar la app React (producción) desde el build
  win.loadFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // En Windows y Linux se cierra la app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
