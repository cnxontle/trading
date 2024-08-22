const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors()); 
app.use(bodyParser.json());

// Configura la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Endpoint para recibir y guardar los datos
app.post('/guardar-valores', async (req, res) => {
    const { tiempo, valores } = req.body;
    let parsedValues = {};
    try {
        // Parsear y convertir valores
        const parsedValores = JSON.parse(valores);
        const keys = Object.keys(parsedValores);
        keys.forEach(key => {
            parsedValues[key.toLowerCase()] = parseFloat(parsedValores[key].replace(',', '').replace('X', '').replace("'", ".").replace('ύ', '').replace('Ϊ', ''));
        });
        console.log("Valores convertidos:", parsedValores);

        // Construir consulta dinámica
        const columns = keys.join(', ');
        const placeholders = keys.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            INSERT INTO valores (tiempo, ${columns})
            VALUES ($1, ${placeholders})
            RETURNING *;
        `;
        const result = await pool.query(query, [tiempo, ...keys.map(key => parsedValues[key.toLowerCase()])]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error guardando los valores' });
    }
});

// Endpoint para obtener los valores
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});