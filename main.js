const { app, BrowserWindow, ipcMain } = require('electron');
const { stat } = require('fs');
const path = require('path');
const WebSocket = require('ws');

let taskQueue = Promise.resolve();
let mainWindow;
const keySender = require('node-key-sender');
let numericValue = 10;


//Crear una ventana de navegador Electron 
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        show: true,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') 
            }
    });
    mainWindow.loadURL('https://trading.quantfury.com/');
}
//
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
    const operacion = data.operacion;
    const boton_id = {comprar: 'buy',vender: 'sell'}[operacion];

    // Código para intentar abrir una nueva posición..
    if (data.accion === 'abrir') {
        console.log(`Intentando abrir una posicion en ${activo} de ${operacion}`);
        
        try{
            const boton_watchlist = await mainWindow.webContents.executeJavaScript(`
                (() => {
                  const button = document.querySelector('button[data-testid="instrument_info_${activo}"]');
                  return button ? (button.click(), 'Button clicked') : 'Button not found';
                })();
              `);
            if (boton_watchlist === 'Button not found') return; // Si no se encuentra el botón del activo, ya no se hace nada
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="${boton_id}"]').click();`)
            await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').focus();`);
            await keySender.sendText(numericValue.toString());
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
        }catch (error) { console.error('algo salio mal'); }     

        // Código para intentar cerrar una posición
    } else if (data.accion === 'cerrar') {     //cerraru
        console.log(`Intentando cerrar una posicion en ${activo}`);
        let mercado_cerrado = false;
        
        try{
            // Cambiamos de pestaña a Positions
            const positions_tab = await mainWindow.webContents.executeJavaScript(`
                (() => {
                  const button = document.querySelector('button[data-testid="positions_tab"]');
                  return button ? (button.click(), 'Button clicked') : 'Button not found';
                })();
              `);
            if (positions_tab === 'Button not found') return; // Si no se puede cambiar de pestaña, ya no se hace nada
            
            // Para que no se quede esperando si no se encuentra el botón de cerrar la posición
            const boton_cerrar = await mainWindow.webContents.executeJavaScript(`
                (() => {
                  const button = document.querySelector('button[data-testid="cross_${activo}"]');
                  return button ? (button.click(), 'Button clicked') : 'Button not found';
                })();
              `);
            if (boton_cerrar === 'Button not found') return;

            const boton_confirmar = await mainWindow.webContents.executeJavaScript(`
                (() => {
                    const button = document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]');
                    return button ? (button.click(), 'Button clicked') : 'Button not found';
                    }
                })();
                `);
            if (boton_confirmar === 'Button not found') {
                mercado_cerrado = true;
                return;
            }  
            // Regresar a la pestaña de Watchlist
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="watchlist_tab"]').click();`);
        } catch (error) { console.error('Lo intentamos pero no pudo funcionar, yo hice las cosas mal...'); }

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