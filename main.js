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
            
            results.rows.forEach(row => {
                console.log('Marca de tiempo:', row.tiempo); // Accediendo a la propiedad 'tiempo'
            });
            // Aquí puedes hacer algo con los resultados, por ejemplo:
            // mainWindow.webContents.executeJavaScript(`alert(${JSON.stringify(results.rows)});`);
        } else {
            console.log('No se encontraron filas en el resultado.');
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error.message);
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

    // Inyectar código JavaScript en la página
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.executeJavaScript(
            require('fs').readFileSync(path.join(__dirname, 'quant.js'), 'utf8'));

        // Llamar a la función principal de ejecución de SQL
        const ejecutarConsulta = async () => {
            const sql = await leerConsultaSQL();
            setInterval(() => {
                ejecutarSQL(sql).then((results) => {
                    // Aquí puedes hacer algo con los resultados en el contexto de Electron
                    if (results && results.rows.length > 0) {
                        // Acciones basadas en los resultados
                        // Por ejemplo, si quieres enviar un mensaje al front-end:
                        mainWindow.webContents.executeJavaScript(`alert(${JSON.stringify(results.rows)});`);
                    }
                });
            }, 1000);  
        };
        ejecutarConsulta().catch((error) => {
            console.error('Error en la ejecución principal:', error);
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
