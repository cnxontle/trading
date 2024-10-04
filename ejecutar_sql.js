require('dotenv').config();  // Cargar variables de entorno
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Configurar la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function ejecutarSQL() {
    try {
        // Leer el archivo SQL
        const sql = fs.readFileSync(path.join(__dirname, 'limpiar_datos.sql'), 'utf8');

        // Ejecutar la consulta
        const results = await pool.query(sql);

        if (results && results.rows.length > 0) {
            console.log('Resultado de la ejecución:', results.rows);
        } else {
            console.log('No se encontraron filas en el resultado.');
        }
    } catch (error) {
        console.error('Error al ejecutar el archivo SQL:', error);
    } finally {
        // Cerrar la conexión
        await pool.end();
    }
}

ejecutarSQL();
