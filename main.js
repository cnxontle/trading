const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');
require('dotenv').config();

// Obtener el argumento de modo desde la línea de comandos
const args = process.argv.slice(2);
const mode = args.includes('r') ? 1 : 2;
let mainWindow;
const apalancamiento = parseFloat(process.env.APALANCAMIENTO);
const soluciones = parseFloat(process.env.SOLUCIONES);

//Crear una ventana de navegador Electron 
function createWindow() {
    const options = {
        width: 1024,
        height: 768,
        show: mode === 2,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    };
    if (mode === 1) {
        options.webPreferences.preload = path.join(__dirname, 'preload.js');
    }
    mainWindow = new BrowserWindow(options);
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

if (mode !== 1) {
    // Iniciar el script de PowerShell
    const sender = process.env.SO === 'windows' ? 'pwsh/windows.ps1' : 'pwsh/linux.ps1';
    const shell = spawn('pwsh', ['-File', sender]);
    let numericValue;

    // Ejecutar promesa con tiempo de espera
    async function withTimeout(promise) {
        return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))]);
    }
    
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

    // Establecer el servidor WebSocket
    let taskQueue = Promise.resolve();
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
        let stop_loss = parseFloat(data.stop_loss);
        stop_loss += (operacion === 'comprar' ? -1 : 1) * stop_loss * 0.002;
        let take_profit = parseFloat(data.take_profit);  
        take_profit += (operacion === 'comprar' ? 1 : -1) * take_profit * 0.002;
        const boton_id = {comprar: 'buy',vender: 'sell'}[operacion];

        // Código para intentar abrir una nueva posición..
        if (data.accion === 'abrir') {
            console.log(`Intentando abrir una posicion en ${activo} de ${operacion}`);
            
            try{
                // Verificar la cantidad disponible en la cartera
                numericValue = await mainWindow.webContents.executeJavaScript(`
                    (() => {
                        const span = document.querySelector('span[data-testid="default_margin_ballance"]');
                        const rawValue = span ? span.textContent.trim() : '';
                        const numericValue = rawValue.replace(/[^0-9.]/g, '');
                        return numericValue;
                    })();
                `);

                numericValue = parseFloat(numericValue);
                numericValue *= (apalancamiento/soluciones); 
                if (numericValue >= 10) {
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="watchlist_tab"]').click();`);
                    
                    // Esperar a que se cargue la pestaña de watchlist
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_WHR"]') === null`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));  
                    }

                    // Abrir la ventana de información del activo e ingresar monto
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_${activo}"]').click();`);
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="${boton_id}"]').click();`)
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').focus();`);
                    await sendKeys(numericValue.toString());

                    // Esperar a que se actualice el valor de input para abrir la posición
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
                    
                    // Esperar a que se termine de abrir la posicion
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_WHR"]') !== null`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    console.log('posicion abierta...');

                    // Definir Orden Take Profit
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="target_order"]').click();`);
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').focus();`);
                    await sendKeys(numericValue.toString());
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').focus();`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await sendKeys(take_profit.toString());
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="reduce_order_submit_button"]').click();`);
                    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 2000));   // definir tiempo de espera
                                      
                    // Definir Orden Stop Loss
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="stop_order"]').click();`);
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').focus();`);
                    await sendKeys(numericValue.toString());
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').focus();`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await sendKeys(stop_loss.toString());
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="reduce_order_submit_button"]').click();`);
                    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 2000));   // definir tiempo de espera
                    
                    ws.send(JSON.stringify({status: 300}));
                }
            }catch (error) { 
                ws.send(JSON.stringify({status: 300}));
                console.error('error en apertura...'); }     

            // Código para intentar cerrar una posición
        } else if (data.accion === 'cerrar') {      
            console.log(`Intentando cerrar una posicion en ${activo}`);
            let mercado_cerrado = false;
            
            try{
                await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="positions_tab"]').click();`);
                
                // Comprobar que nos encontramos en la pestaña de posiciones
                let iterations = 0;
                while (await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_WHR"]') !== null`)) {
                    if (iterations >= 50) {
                        
                        // Si no se encuentra la posición, enviar respuesta al nodo activador
                        ws.send(JSON.stringify({status: 200}));
                        return;  
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));  
                    iterations++;  
                }
                
                // Click en el botón de cerrar posición
                await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="cross_${activo}"]').click();`);

                // Verificar si el botón de confirmación está disponible
                let confirmButtonAvailable = await mainWindow.webContents.executeJavaScript(`
                    (() => {
                        const confirmButton = document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]');
                        return confirmButton ? !confirmButton.disabled : false;
                    })();
                `);
                
                // Si el botón de confirmación no está disponible, el mercado está cerrado
                if (!confirmButtonAvailable) {
                    mercado_cerrado = true;
                } else {
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]').click();`);
                }
                
                // Esperar a que la posición se cierre
                let startTime = Date.now();
                const max_time = 20000;
                while (await mainWindow.webContents.executeJavaScript(`document.evaluate('//*[@id="root"]/div/div[1]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null`)) {
                    
                    // Si el modal no cierra recargar la página y enviar un mensaje 401
                    if (Date.now() - startTime > max_time) {
                        await mainWindow.webContents.executeJavaScript(`location.reload();`); 
                        ws.send(JSON.stringify({status: 401}));
                        return; 
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));  
                }
                console.log('posicion cerrada...');
            } catch (error) { console.error('error en cierre...'); }

            // Enviar respuesta al nodo activador
            if (!mercado_cerrado) {             
                ws.send(JSON.stringify({
                    status: 200,
                }));
            }  else if (mercado_cerrado) {      
                
                // Cuando el mercado está cerrado, enviar el tiempo restante al nodo activador
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
}