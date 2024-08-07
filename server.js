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

     
    // Descomponer el objeto de valores 
    const { ADA_USD, LTC_USD, UNI_USD, ETH_USD, LINK_USD, SOL_USD, BTC_USD } = JSON.parse(valores);
    const ada_usd = parseFloat(ADA_USD.replace('$', '').replace(',', ''));
    const ltc_usd = parseFloat(LTC_USD.replace('$', '').replace(',', ''));
    const uni_usd = parseFloat(UNI_USD.replace('$', '').replace(',', ''));
    const eth_usd = parseFloat(ETH_USD.replace('$', '').replace(',', ''));
    const link_usd = parseFloat(LINK_USD.replace('$', '').replace(',', ''));
    const sol_usd = parseFloat(SOL_USD.replace('$', '').replace(',', ''));
    const btc_usd = parseFloat(BTC_USD.replace('$', '').replace(',', ''));

    

    console.log("Valores originales:", valores);
    console.log("Valores convertidos:", { ada_usd, ltc_usd, uni_usd, eth_usd, link_usd, sol_usd, btc_usd });

    try {
        const query = `
            INSERT INTO valores_cripto (tiempo, ADA_USD, LTC_USD, UNI_USD, ETH_USD, LINK_USD, SOL_USD, BTC_USD)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const result = await pool.query(query, [tiempo, ada_usd, ltc_usd, uni_usd, eth_usd, link_usd, sol_usd, btc_usd]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error guardando los valores' });
    }
});



app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});