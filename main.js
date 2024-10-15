const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config();  // Cargar variables de entorno

// Configurar la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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
        if (results && results.rows.length > 0) {
            const primeraFila = results.rows[0];
            console.log('Marca:', primeraFila.tiempo);
        } else {
            console.log('No se encontraron filas en el resultado.');
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error.message);
    }
}

// Función para escuchar notificaciones desde PostgreSQL
async function escucharNotificaciones() {
    const client = await pool.connect();
    const sql = await leerConsultaSQL();
    try {
        // Escuchar notificaciones en el canal 'nueva_fila'
        await client.query('LISTEN nueva_fila');
        client.on('notification', async (msg) => {
            
            await ejecutarSQL(sql);  // Ejecutar consulta cuando se recibe la notificación
        });
        console.log('Escuchando inserciones en la base de datos...');
    } catch (error) {
        console.error('Error al escuchar notificaciones:', error.message);
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

