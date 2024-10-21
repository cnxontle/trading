const { app, BrowserWindow, ipcMain } = require('electron');
const { stat } = require('fs');
const path = require('path');
const WebSocket = require('ws');
let taskQueue = Promise.resolve();

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
            taskQueue = taskQueue.then(() => handleMessage(ws, message));
        });
        ws.on('close', () => {
            console.log('Conexion cerrada');
        });
    });

// Función para manejar los mensajes
async function handleMessage(ws, message) {  
    const data = JSON.parse(message);
    const activo = data.id;
    if (data.accion === 'abrir') {
        const operacion = data.operacion;
        console.log(`Intentando abrir una posicion en ${activo} de ${operacion}`);
        // Código para intentar abrir una nueva posición..





    } else if (data.accion === 'cerrar') {
        let mercado_cerrado = false;
        console.log(`Intentando cerrar una posicion en ${activo}`);
        // Código para intentar cerrar una posición
        
       

       
            // Enviar respuesta al nodo activador
            if (!mercado_cerrado) {              // si la posición cierra correctamente, o no cierra por que nunca abrio
                ws.send(JSON.stringify({
                    status: 200,
                }));
            }  else if (mercado_cerrado) {      // si la posición esta abierta y no cierra por que el mercado esta cerrado
            ws.send(JSON.stringify({
                status: 400,
                segundos_restantes: 15,         // Calcular cuantos segundos faltan a partir de la hora actual para la hora de apertura del mercado
            }));
        } 
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});