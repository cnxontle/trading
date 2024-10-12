const { app, BrowserWindow } = require('electron');
const path = require('path');

//Crear una ventana de navegador Electron 
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        show: false,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true,  
            }
    });

    // Cargar la página de quantfury
    mainWindow.loadURL('https://trading.quantfury.com/');

    // Inyectar código JavaScript en la página
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(
            require('fs').readFileSync(path.join(__dirname, 'quant.js'), 'utf8'));
    });
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