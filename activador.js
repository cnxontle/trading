const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config();  // Cargar variables de entorno
const ws = new WebSocket('ws://localhost:55555');

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





// Escuchar cuando la conexión esté abierta
ws.on('open', function open() {
    console.log('Conectado al proceso principal');
    
    // Enviar el mensaje "hola"
    ws.send('hola');
});

// Manejar errores en la conexión
ws.on('error', function error(err) {
    console.error('Error en la conexion:', err);
});

// Manejar cierre de la conexión
ws.on('close', function close() {
    console.log('Conexion cerrada');
});
