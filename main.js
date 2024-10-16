const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');

//Crear una ventana de navegador Electron 
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        show: false,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') 
            }
    });
    mainWindow.loadURL('https://trading.quantfury.com/');
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Establecer el servidor WebSocket
const wss = new WebSocket.Server({ port: 55555 }); 
    wss.on('connection', (ws) => {
        console.log('Nodo activador conectado');
        ws.on('message', (message) => {
            console.log('Mensaje recibido:', message);
            
            // no responder
        });
        ws.on('close', () => {
            console.log('Conexion cerrada');
        });
    });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});