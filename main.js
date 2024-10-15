

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

//Crear una ventana de navegador Electron 
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        show: true,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: false,  
            //preload: path.join(__dirname, 'preload.js')  
        }
    });

    // Cargar la página de quantfury
    mainWindow.loadURL('https://trading.quantfury.com/');

    // Inyectar código JavaScript en la página
    mainWindow.webContents.on('dom-ready', () => {
        
        // Inyectar la función de clics
        const clickHandler = fs.readFileSync(path.join(__dirname, 'clickHandler.js'), 'utf8');
        mainWindow.webContents.executeJavaScript(clickHandler);
        
        // Llamar a la función handleButtonClicks definida en clickHandler.js
        mainWindow.webContents.executeJavaScript('handleButtonClicks();');
        
        // Inyectar el código de quant.js
        mainWindow.webContents.executeJavaScript(
            require('fs').readFileSync(path.join(__dirname, 'quant.js'), 'utf8')
        );
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