const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware de CORS
app.use(cors({
    origin: '*', // Permitir todas las solicitudes
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    preflightContinue: true,
}));

// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para agregar la cabecera Access-Control-Allow-Private-Network
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});

// Manejo de solicitudes OPTIONS para preflight requests
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.sendStatus(204);
});

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
            const cleanedValue = parsedValores[key].replace(/[^0-9.,]/g, '');
            parsedValues[key.toLowerCase()] = parseFloat(cleanedValue.replace(',', '.'));
        });

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

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});