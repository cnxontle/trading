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
    const TIMEOUT = 10000;
    const POLLING_INTERVAL = 100;

    // Manejar mensajes recibidos
    async function handleMessage(ws, message) {  
        const data = JSON.parse(message);
        const activo = data.id;
        const operacion = data.operacion;
        let stop_loss = calculateAdjustedPrice(data.stop_loss, operacion, -0.002);
        let take_profit = calculateAdjustedPrice(data.take_profit, operacion, 0.002);
        const boton_id = {comprar: 'buy', vender: 'sell'}[operacion];
        
        try {
            if (data.accion === 'abrir') {
                await handleOpenPosition(ws, activo, operacion, boton_id, take_profit, stop_loss);
            } else if (data.accion === 'cerrar') {
                await handleClosePosition(ws, activo);
            }
        } catch (error) { 
            ws.send(JSON.stringify({status: 300}));
            console.error('Error en operación:', error);
        }
    }

    // Abrir posición
    async function handleOpenPosition(ws, activo, operacion, boton_id, take_profit, stop_loss) {
        console.log(`Intentando abrir una posición en ${activo} de ${operacion}`);
        const balance = await getNumericValue('span[data-testid="default_margin_ballance"]');
        if (balance < 10) {
            console.log('Balance insuficiente');
            return;
        }
        await withTimeout(openPosition(balance, activo, boton_id), TIMEOUT);
        await withTimeout(defineOrder('takeProfit', balance, take_profit), TIMEOUT / 2);
        await withTimeout(defineOrder('stopLoss', balance, stop_loss), TIMEOUT / 2);
        ws.send(JSON.stringify({ status: 300 }));
    }

    // Cerrar posición
    async function handleClosePosition(ws, activo) {
        console.log(`Intentando cerrar una posición en ${activo}`);
        await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="positions_tab"]').click();`);
        await waitForSelectorAndExecute('button[data-testid="instrument_info_WHR"]', null, 50);
        await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="cross_${activo}"]').click();`);
        const mercadoCerrado = !(await isConfirmButtonAvailable());

        if (mercadoCerrado) {
            const segundos = await getMarketClosedTime();
            ws.send(JSON.stringify({ status: 400, segundos_restantes: segundos }));
            return;
        }

        await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]').click();`);
        await waitForSelectorAndExecute(`//*[@id="root"]/div/div[1]/div`, async () => {
            await mainWindow.webContents.executeJavaScript(`location.reload();`);
            ws.send(JSON.stringify({ status: 401 }));
        }, TIMEOUT);

        ws.send(JSON.stringify({ status: 200 }));
    }

    // Función para obtener el balance en formato numérico
    async function getNumericValue(selector) {
        const value = await mainWindow.webContents.executeJavaScript(`
            (() => {
                const span = document.querySelector('${selector}');
                return span ? parseFloat(span.textContent.replace(/[^0-9.]/g, '')) : 0;
            })();
        `);
        return value * (apalancamiento / soluciones) || 0;
    }

    // Calcular precio ajustado
    function calculateAdjustedPrice(price, operacion, adjustmentRate) {
        let adjustedPrice = parseFloat(price);
        adjustedPrice += (operacion === 'comprar' ? 1 : -1) * adjustedPrice * adjustmentRate;
        return adjustedPrice;
    }

    // Función de espera y ejecución
    async function waitForSelectorAndExecute(selector, action = null, maxIterations = Infinity) {
        let iterations = 0;
        while (await mainWindow.webContents.executeJavaScript(`document.querySelector('${selector}') === null`)) {
            if (++iterations >= maxIterations) break;
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        }
        if (action) await mainWindow.webContents.executeJavaScript(action);
    }

    // Función para verificar si el botón de confirmación está disponible
    async function isConfirmButtonAvailable() {
        return await mainWindow.webContents.executeJavaScript(`
            (() => {
                const button = document.querySelector('button[data-testid="close_by_cross_modal_modal_confirm_button"]');
                return button ? !button.disabled : false;
            })();
        `);
    }

    // Obtener tiempo restante si el mercado está cerrado
    async function getMarketClosedTime() {
        return await mainWindow.webContents.executeJavaScript(`
            (() => {
                const span = document.querySelector('span[data-testid="market_schedule_value"]');
                if (span) {
                    const match = span.textContent.match(/(\\d+)d\\s+(\\d+)h\\s+(\\d+)m/);
                    if (match) {
                        const [_, days, hours, minutes] = match.map(Number);
                        return (days * 86400) + (hours * 3600) + (minutes * 60) + 60;
                    }
                }
                return null;
            })();
        `);
    }

    // Función para abrir posición
    async function openPosition(numericValue, activo, boton_id) {
        await mainWindow.webContents.executeJavaScript(`document.querySelector('button[data-testid="watchlist_tab"]').click();`);
        await waitForSelectorAndExecute(`button[data-testid="instrument_info_${activo}"]`, `document.querySelector('button[data-testid="instrument_info_${activo}"]').click();`);
        await waitForSelectorAndExecute(`button[id="${boton_id}"]`, `document.querySelector('button[id="${boton_id}"]').click();`);
        await sendKeysToInput('input[id="open_value_number_input"]', numericValue);
        await waitForSelectorAndExecute(`button[id="open_position"]`, `document.querySelector('button[id="open_position"]').click();`);
        console.log('Posición abierta...');
    }

    // Definir orden de salida (Take Profit o Stop Loss)
    async function defineOrder(type, numericValue, price) {
        const orderSelector = type === 'takeProfit' ? 'target_order' : 'stop_order';
        await waitForSelectorAndExecute(`span[id="${orderSelector}"]`, `document.querySelector('span[id="${orderSelector}"]').click();`);
        await sendKeysToInput('input[id="reduce_order_size_number_input"]', numericValue);
        await sendKeysToInput('input[id="reduce_order_price_number_input"]', price);
        await waitForSelectorAndExecute(`button[data-testid="reduce_order_submit_button"]`, `document.querySelector('button[data-testid="reduce_order_submit_button"]').click();`);
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 2000));
    }

    // Ejecutar promesa con tiempo de espera
    async function withTimeout(promise, timeout) {
        return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))]);
    }

    // Función para enviar teclas a un campo de entrada
    async function sendKeysToInput(selector, value) {
        await waitForSelectorAndExecute(selector, `document.querySelector('${selector}').focus();`);
        await sendKeys(value.toString());
        await waitForSelectorAndExecute(selector, `document.querySelector('${selector}').value !== ''`);
    }
}