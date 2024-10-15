const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config();  

// Configurar la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, 
    idleTimeoutMillis: 30000, // Tiempo de espera para una conexión inactiva
    connectionTimeoutMillis: 2000, // Tiempo de espera para una conexión nueva
});


// Función para leer la consulta SQL
async function leerConsultaSQL() {
    try {
        const sql = await fs.readFile(path.join(__dirname, 'consulta.sql'), 'utf8');
        return sql;  
    } catch (error) {
        console.error('Error al leer el archivo SQL:', error.message);
        throw error; 
    }
}

// Función para ejecutar la consulta SQL
async function ejecutarSQL(sql) {
    try {
        const results = await pool.query(sql);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error.message);
    }
}

// Función para escuchar notificaciones desde PostgreSQL
async function escucharNotificaciones() {
    const client = await pool.connect();
    const sql = await leerConsultaSQL();
    try {
        await client.query('LISTEN nueva_fila');
        client.on('notification', async (msg) => {
            await ejecutarSQL(sql);  
        });
    } catch (error) {
        console.error('Error al escuchar notificaciones:', error.message);
    } finally {
        client.release(); // Libera la conexión 
    }
}

// Crear una ventana de navegador Electron 
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
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(
            require('fs').readFileSync(path.join(__dirname, 'quant.js'), 'utf8')); // Inyectar código JavaScript en la página

        // Escuchar notificaciones de la base de datos
        escucharNotificaciones().catch((error) => {
            console.error('Error en la ejecución de escucha:', error);
            
        });
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