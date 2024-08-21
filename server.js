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

     
    // Descomponer el objeto de valores de acuerdo a las claves que se esperan del script quant.js
    const { 
        AAVE_USD, ADA_USD, APT_USDT, ARB_USDT, ATOM_USD, AVAX_USD, BCH_USD, BTC_USD, DOGE_USD, DOT_USD,
        ETC_USD, ETH_USD, FIL_USD, HBAR_USD, INJ_USDT, LINK_USD, LTC_USD, MANA_USDT, MATIC_USD, NEAR_USDT, NEO_USDT,
        OP_USDT, RENDER_USDT, RUNE_USDT, SAND_USDT, SNX_USDT, SOL_USD, STX_USDT, THETA_USDT, XRP_USD, UNI_USD,
        ISHARES_EMERGING_MARKETS, ISHARES_AUSTRALIA, ISHARES_GERMANY, ISHARES_HONG_KONG, ISHARES_JAPAN, ISHARES_SPAIN,
        ISHARES_FRANCE, ISHARES_TAIWAN, ISHARES_UNITED_KINGDOM, ISHARES_MEXICO, ISHARES_SOUTH_KOREA, ISHARES_BRAZIL,
        ISHARES_SOUTH_AFRICA, ISHARES_CHINA_LARGE_C, ISHARES_CHINA, ISHARES_INDIA, ISHARES_TURKEY,ISHARES_LATIN_AME,
        ISHARES_GLOBAL_TECH, ISHARES_US_TECHNOLOGY, ISHARES_FORESTRY, ISHARES_TREASURY_BOND_1_3, ISHARES_TREASURY_BOND_7_10,
        ISHARES_TREASURY_BOND_20, COMMOD_SOYBEAN, COMMOD_CORN, COMMOD_WHEAT, COMMOD_SUGAR, COMMOD_COFFE, COMMOD_HEATING_OIL,
        COMMOD_CRUDE_OIL, COMMOD_BRENT_CRUDE, COMMOD_NATURAL_GAS, COMMOD_GASOLINE, OMMOD_SILVER, COMMOD_COPPER, COMMOD_GOLD,
        COMMOD_PLATINUM, INDEX_VIX, INDEX_RUSSELL_2000, INDEX_NASDAQ_100, INDEX_SP_500, INDEX_DOW_J, INDEX_VT, INDEX_VBR,
        INDEX_US_DOLLAR, INDEX_NIKKEI_YEN, FOREX_USD_MXN, FOREX_EURO_USD, FOREX_USD_TRY, FOREX_USD_KRW, FOREX_USD_JPY,
        FOREX_USD_CNY, FOREX_USD_CHF, FOREX_USD_BRL, NASDAQ_AAPL, NASDAQ_AMZN, NASDAQ_GOOGL, NASDAQ_MSFT, NASDAQ_META,
        NASDAQ_ADBE, CBOE_ASML, CBOE_BESI, NASDAQ_INTC, NASDAQ_NVDA, NASDAQ_AMAT, NYSE_TSM, NASDAQ_AMD, NASDAQ_PI,
        NASDAQ_SYNA, NASDAQ_AVGO, NASDAQ_QCOM, NASDAQ_TSLA, CBOE_VOW3, NYSE_TM, NASDAQ_SBUX, NYSE_WMT, NASDAQ_COST,
        NASDAQ_PEP, NYSE_KO, NYSE_DPZ, NYSE_HD, NYSE_MCD, ASDAQ_NFLX, NYSE_DIS, NASDAQ_CMCSA, NYSE_PLTR, NYSE_PATH,
        NYSE_AMG, NYSE_BLK, NYSE_STT, NYSE_JPM, NASDAQ_NVAX, NYSE_TMO, NYSE_HEI, NASDAQ_WOOF, NYSE_CAG, NYSE_WM,
        CBOE_NEOEN, CBOE_ENR, NYSE_TX, NYSE_MA, NYSE_V, NYSE_BABA, NYSE_SHOP, NASDAQ_MELI, BMV_AGUA, BMV_AC
     } = JSON.parse(valores);
    const aave_usd = parseFloat(AAVE_USD.replace('$', '').replace(',', '').replace("'", '').replace('X', ''));
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
            INSERT INTO valores (tiempo, ADA_USD, LTC_USD, UNI_USD, ETH_USD, LINK_USD, SOL_USD, BTC_USD)
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