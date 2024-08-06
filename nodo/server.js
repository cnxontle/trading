const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json());

// Configura la conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'datos_precios',
    password: 'mcfly2015',
    port: 5432,
});

// Endpoint para recibir y guardar los datos
app.post('/guardar-valores', async (req, res) => {
    const { tiempo, valores } = req.body;
    try {
        const query = `
            INSERT INTO valores_cripto (tiempo, valores) 
            VALUES($1, $2) RETURNING *;
        `;
        const result = await pool.query(query, [tiempo, valores]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error guardando los valores' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});