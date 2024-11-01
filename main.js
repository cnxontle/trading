const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');
require('dotenv').config();

// Iniciar el script de PowerShell
const sender = process.env.SO === 'windows' ? 'pwsh/windows.ps1' : 'pwsh/linux.ps1';
const shell = spawn('pwsh', ['-File', sender]);
sendKeys(""); // Enviar un texto vacío para que el script de PowerShell se inicie

let taskQueue = Promise.resolve();
let mainWindow;
let numericValue;

// Función para enviar texto
async function sendKeys(text) {
    return new Promise((resolve, reject) => {
        shell.stdin.write('\n'+ text + '\n', (error) => {
            if (error) {
                reject('Error al enviar texto:', error);
            } else {
                resolve();
            }
        });
    });
}

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
            //verificar la cantidad disponible en la cartera
            numericValue = await mainWindow.webContents.executeJavaScript(`
                (() => {
                    const span = document.querySelector('span[data-testid="default_margin_ballance"]');
                    const rawValue = span ? span.textContent.trim() : '';
                    const numericValue = rawValue.replace(/[^0-9.]/g, '');
                    return numericValue;
                })();
            `);
            numericValue = 10;  // SOLO PARA PRUEBAS (QUITAR ESTA LINEA CUANDO SE TERMINE DE PROBAR)
            if (numericValue >= 10) {
                await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_${activo}"]').click();`);
                await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="${boton_id}"]').click();`)
                await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').focus();`);
                await sendKeys(numericValue.toString().split('.')[0]);
                await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
            }
        }catch (error) { console.error('error en apertura...'); }     

        // Código para intentar cerrar una posición
    } else if (data.accion === 'cerrar') {      
        console.log(`Intentando cerrar una posicion en ${activo}`);
        let mercado_cerrado = false;
        
        try{
            console.log('Cambiando a la pestana posiciones...');
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="positions_tab"]').click();`);
            
            console.log('Cerrando posicion...');
            // verificar si cambiamos a la ventana pocisiones (la posicion abierta tiene un + o - para indicar gananca o perdida)
            //si no encontramos ese simbolo entonces no hay ninguna posicion abierta, podemos terminar el try (no se si un return termina el try y se manda o no el mensaje al nodo activador)
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="cross_${activo}"]').click();`);
                    
            console.log('Confirmando cierre...');
            // aqui se debe verificar si el mercado esta cerrado, si el boton de comfirmar cierre no esta disponible entonces el mercado estaba cerrado
            // Si el mercado esta cerrado establecer la variable mercado_cerrado = True. tambien hay que regresar a watchlist, no nos pedemos quedar aqui
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]').click();`);
            
            console.log('Cambiando a la pestana watchlist...');
            await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="watchlist_tab"]').click();`);
            
            console.log('posicion cerrada...');
        } catch (error) { console.error('error en cierre...'); }

        // Enviar respuesta al nodo activador
        if (!mercado_cerrado) {             
            ws.send(JSON.stringify({
                status: 200,
            }));
        }  else if (mercado_cerrado) {      
            let segundos = await mainWindow.webContents.executeJavaScript(`
               (() => {
                    const span = document.querySelector('span[data-testid="market_schedule_value"]');
                    if (span) {
                        const timeText = span.textContent;
                        const timeMatch = timeText.match(/(\\d+)d\\s+(\\d+)h\\s+(\\d+)m/);
                        if (timeMatch) {
                            const days = parseInt(timeMatch[1], 10);
                            const hours = parseInt(timeMatch[2], 10);
                            const minutes = parseInt(timeMatch[3], 10);
                            const totalSeconds = (days * 86400) + (hours * 3600) + (minutes * 60) + 60;
                            return totalSeconds;
                        }
                    }
                    return null;
                })();
            `);               
            ws.send(JSON.stringify({
            status: 400,
            segundos_restantes: segundos,         
            }));
        } 
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});