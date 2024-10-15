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

let ultimaSuma = 0;
let contadorRepeticiones = 1;

app.post('/guardar-valores', async (req, res) => {
    const { tiempo, valores } = req.body;
    let sumaActual = 0;
    
    try {
        const parsedValores = JSON.parse(valores);
        const keys = Object.keys(parsedValores);
        const parsedValues = {};

        // Parsear y sumar los valores
        keys.forEach(key => {
            const cleanedValue = parsedValores[key].replace(/[^0-9.-]/g, '');
            const parsedFloat = parseFloat(cleanedValue);
            parsedValues[key.toLowerCase()] = !isNaN(parsedFloat) ? parsedFloat : 0;
            sumaActual += parsedValues[key.toLowerCase()];
        });
        console.log(`tiempo: ${tiempo}, Suma: ${sumaActual}`);

        if (sumaActual === ultimaSuma) {
            contadorRepeticiones++;
            if (contadorRepeticiones > 5) {
                console.log(`Repeticiones excedidas: ${contadorRepeticiones}`);
                return res.status(500).end();
            }
        } else {
            contadorRepeticiones = 1; // Reiniciar si la suma es diferente
        }

        // convertir los valores 0 a null
        keys.forEach(key => {
            if (parsedValues[key.toLowerCase()] === 0) {
                parsedValues[key.toLowerCase()] = null;
            }
        });

        // Construir y ejecutar consulta dinámica
        const columns = keys.join(', ');
        const placeholders = keys.map((_, index) => `$${index + 2}`).join(', ');
        const query = `INSERT INTO valores (tiempo, ${columns}) VALUES ($1, ${placeholders}) RETURNING *;`;
        await pool.query(query, [tiempo, ...keys.map(key => parsedValues[key.toLowerCase()])]);
        ultimaSuma = sumaActual;
        res.status(200).end();

    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});