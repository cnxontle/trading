const { app, BrowserWindow, ipcMain } = require('electron');
const { stat } = require('fs');
const path = require('path');
const WebSocket = require('ws');

let taskQueue = Promise.resolve();
let mainWindow;
const keySender = require('node-key-sender');

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

    // Verificar si es abrir o cerrar
    if (data.accion === 'abrir') 
    {
        console.log(`Intentando abrir una posicion en ${activo} de ${operacion}`);
        // Código para intentar abrir una nueva posición..
        try{

            //verificar la cantidad disponible en la cartera
            mainWindow.webContents.executeJavaScript(`
                (() => {
                    // Seleccionar el span por su atributo data-testid
                    const span = document.querySelector('span[data-testid="default_margin_ballance"]');
                    
                    // Obtener el texto del span, eliminar espacios y símbolos que no sean números ni puntos decimales
                    const rawValue = span ? span.textContent.trim() : '';
                    
                    // Usar una expresión regular para eliminar cualquier cosa que no sea un número o un punto
                    const numericValue = rawValue.replace(/[^0-9.]/g, '');
                    
                    // Devolver el valor numérico limpio
                    return numericValue;
                })();
            `).then(numericValue => {
                console.log('Valor numérico:', numericValue);
                numericValue = "10";               
                numericValue = numericValue.toString().split('.')[0]; // Parte entera como cadena

                // Si el valor disponible es diferente a 10, abrir posicion (10Dlls es lo minimo)
                if(numericValue >= 10){
                    
                    
                    //Click en el ticket correspondiente                                                            ----Ojo****
                    // mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_${activo}"]').click();`)
                    if(mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="instrument_info_USD/MXN"]').click();`))
                    {
                            //Verificar si la operacion es comprar o vender
                        if(operacion=="comprar")
                        {
                            // Click en el botón de "buy"
                           mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="buy"]').click();`)
                           .then(() => {
                               // Focar el campo de texto antes de enviar los eventos del teclado
                               return mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').focus();`);
                           })
                           .then(() => {
                                //insertar la cantidad y esperar a que se cargue
                                const insertDigits = async (numericValue) => {
                                   await keySender.sendText(numericValue);
                               };
                               insertDigits(numericValue)
    
                               .then(() => {
                                   console.log('Valor insertado:', numericValue);
                                   // Ahora que los dígitos han sido insertados, hacer clic en el botón de "buy"
                                   return mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
                               })
                               .then(() => {
                                   console.log(`Posicion abierta "compra" en ${activo}`);
                                   return new Promise((resolve) => setTimeout(resolve, 1000));
                               });
                               
                           })
                        }
                        else if(operacion=="vender")
                        {
                            //Click en el boton "Sell"
                            mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="sell"]').click();`)
                            .then(() => {
                                // Focar el campo de texto antes de enviar los eventos del teclado
                                return mainWindow.webContents.executeJavaScript(`document.querySelector('input[id="open_value_number_input"]').focus();`);
                            })
                            .then(() => {
                                const insertDigits = async (numericValue) => {
                                    await keySender.sendText(numericValue);
                                };
                                insertDigits(numericValue)
                                .then(() => {
                                    console.log('Valor numérico insertado:', numericValue);
                                    // Ahora que los dígitos han sido insertados, hacer clic en el botón de "sell"
                                    return mainWindow.webContents.executeJavaScript(`document.querySelector('button[id="open_position"]').click();`);
                                })
                                .then(() => {
                                    console.log(`Posicion abierta "vender" en ${activo}`);
                                });
                                
                            })
                            
                        }

                    }
                }
            })
            .catch((error) => { console.error("Error en la ejecución de la acción en la página:", error); });
        }catch (error) { console.error('Error al procesar el mensaje:', error); }     

    } else if (data.accion === 'cerrar') {
        let mercado_cerrado = false;
        // Código para intentar cerrar una posición
        try{
            console.log(`Intentando cerrar una posicion en ${activo}`);
            if(mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="positions_tab"]').click();`))
                {
                    mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="cross_USD/MXN"]').click();`).then(()=>{
                        mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]').click();`);
                        return new Promise((resolve) => setTimeout(resolve, 3000));

                    })
                }
    
            // .then(()=>{
            //     try{
                    
            //         mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="watchlist_tab"]').click();`);
            //     } 
            //     catch{

            //     }
            // })

        }catch (error) { console.error('Error al procesar el mensaje:', error); }   

       
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