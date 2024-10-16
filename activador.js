const WebSocket = require('ws');
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
});

const ws = new WebSocket('ws://localhost:55555');
let isWsOpen = false;  

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
            const mensaje = `Marca: ${primeraFila.tiempo}`;
            console.log(mensaje);
            
            //logica para enviar mensaje




            //if (isWsOpen) {
            //    ws.send(mensaje);  
            //}
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
            await ejecutarSQL(sql);  
        });
        console.log('Escuchando inserciones en la base de datos...');
    } catch (error) {
        console.error('Error al escuchar notificaciones:', error.message);
    }
}

// Manejar eventos del WebSocket
ws.on('open', function open() {
    console.log('Conexión WebSocket establecida');
    isWsOpen = true;  // Cambiar el estado de la conexión
});

ws.on('error', function error(err) {
    console.error('Error en la conexión:', err);
});

ws.on('close', function close() {
    console.log('Conexión WebSocket cerrada');
    isWsOpen = false;  // Cambiar el estado de la conexión
    pool.end(() => {
        console.log('Conexión a PostgreSQL cerrada');
    });
});

// Llamar a la función para escuchar notificaciones
escucharNotificaciones()
    .then(() => {
        console.log('Notificaciones activadas con éxito.');
    })
    .catch(error => {
        console.error('Error al activar la escucha de notificaciones:', error.message);
    });