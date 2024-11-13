const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');
require('dotenv').config();

// Obtener el argumento de modo desde la línea de comandos
const args = process.argv.slice(2);
const mode = args.includes('r') ? 1 : 2;
let mainWindow;

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
                numericValue = 10;  // SOLO PARA PRUEBAS (QUITAR ESTA LINEA CUANDO SE TERMINE DE PROBAR)
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
                    await sendKeys(numericValue.toString().split('.')[0]);

                    // Esperar a que se actualice el valor de input para abrir la posición
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
                    
                    // Esperar a que se termine de abrir la posicion
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_WHR"]') !== null`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    // Click en el botón de targer order
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="target_order"]').click();`);
                    //focus en el input de take profit
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').focus();`);
                    //ingresar el valor de la posición
                    await sendKeys(numericValue.toString().split('.')[0]);
                    // Esperar a que se actualice el valor de input para take profit
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    //focus en el imput precio
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').focus();`);
                    //ingresar el valor de take profit

                    if ((take_profit && take_profit.toString().split('.')[1] || '').length > 11) {
                        take_profit = take_profit.toFixed(11);
                    }
                    await sendKeys(take_profit);
                    // Esperar a que se actualice el valor de input para stop loss
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    //click en el boton de confirmar
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="reduce_order_submit_button"]').click();`);
                    
                    // esperar a que aparesca el span de stop loss para hacer click
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="stop_order"]').textContent === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    //click en el span de stop loss
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="stop_order"]').click();`);
                    //focus en el input de stop loss
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').focus();`);
                    //ingresar el valor de la posición
                    await sendKeys(numericValue.toString().split('.')[0]);
                    // Esperar a que se actualice el valor de input para stop loss
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_size_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    //focus en el imput precio
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').focus();`);
                    //ingresar el valor de stop loss
                    // Convertir el número a una cadena
                    if ((stop_loss && stop_loss.toString().split('.')[1] || '').length > 11) {
                        stop_loss = stop_loss.toFixed(11);
                    }
                    // Redondea a 7 decimales y lo convierte en cadena
                    await sendKeys(stop_loss);
                    // Esperar a que se actualice el valor de input para stop loss
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="reduce_order_price_number_input"]').value === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    //click en el boton de confirmar
                    await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="reduce_order_submit_button"]').click();`);
                    // esperar a que aparesca el span de stop loss para hacer click
                    while (await mainWindow.webContents.executeJavaScript(`document.querySelector('span[id="stop_loss"]').textContent === ''`)) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    ws.send(JSON.stringify({
                        status: 300,
                    }));
                    console.log('posicion abierta...');
                }
            }catch (error) { 
                ws.send(JSON.stringify({
                    status: 300,
                }));
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
                        ws.send(JSON.stringify({
                            status: 200,
                        }));
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
                        ws.send(JSON.stringify({
                            status: 401,
                        }));
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