function obtenerValor() {
    const monedas = {
        "AAVE_USD": document.querySelector('p[data-testid="watchlist_value_AAVE-USD"]'),
        "ADA_USD": document.querySelector('p[data-testid="watchlist_value_ADA-USD"]'),
        "APT_USDT": document.querySelector('p[data-testid="watchlist_value_APT/USDT"]'),
        "ARB_USDT": document.querySelector('p[data-testid="watchlist_value_ARB/USDT"]'),
        "ATOM_USD": document.querySelector('p[data-testid="watchlist_value_ATOM-USD"]'),
        "AVAX_USD": document.querySelector('p[data-testid="watchlist_value_AVAX-USD"]'),
        "BCH_USD": document.querySelector('p[data-testid="watchlist_value_BCH-USD"]'),
        "BTC_USD": document.querySelector('p[data-testid="watchlist_value_BTC-USD"]'),
        "DOGE_USD": document.querySelector('p[data-testid="watchlist_value_DOGE/USD"]'),
        "DOT_USD": document.querySelector('p[data-testid="watchlist_value_DOT-USD"]'),
        "ETC_USD": document.querySelector('p[data-testid="watchlist_value_ETC-USD"]'),
        "ETH_USD": document.querySelector('p[data-testid="watchlist_value_ETH-USD"]'),
        "FIL_USD": document.querySelector('p[data-testid="watchlist_value_FIL/USD"]'),
        "HBAR_USD": document.querySelector('p[data-testid="watchlist_value_HBAR-USD"]'),
        "INJ_USDT": document.querySelector('p[data-testid="watchlist_value_INJ/USDT"]'),
        "LINK_USD": document.querySelector('p[data-testid="watchlist_value_LINK-USD"]'),
        "LTC_USD": document.querySelector('p[data-testid="watchlist_value_LTC-USD"]'),
        "MANA_USDT": document.querySelector('p[data-testid="watchlist_value_MANA/USDT"]'),
        "MATIC_USD": document.querySelector('p[data-testid="watchlist_value_MATIC-USD"]'),
        "NEAR_USDT": document.querySelector('p[data-testid="watchlist_value_NEAR/USDT"]'),
        "NEO_USDT": document.querySelector('p[data-testid="watchlist_value_NEO/USDT"]'),
        "OP_USDT": document.querySelector('p[data-testid="watchlist_value_OP/USDT"]'),
        "RENDER_USDT": document.querySelector('p[data-testid="watchlist_value_RNDR/USDT"]'),
        "RUNE_USDT": document.querySelector('p[data-testid="watchlist_value_RUNE/USDT"]'),
        "SAND_USDT": document.querySelector('p[data-testid="watchlist_value_SAND/USDT"]'),
        "SNX_USDT": document.querySelector('p[data-testid="watchlist_value_SNX/USDT"]'),
        "SOL_USD": document.querySelector('p[data-testid="watchlist_value_SOL-USD"]'),
        "STX_USDT": document.querySelector('p[data-testid="watchlist_value_STX/USDT"]'),
        "THETA_USDT": document.querySelector('p[data-testid="watchlist_value_THETA/USDT"]'),
        "XRP_USD": document.querySelector('p[data-testid="watchlist_value_XRP/USD"]'),
        "UNI_USD": document.querySelector('p[data-testid="watchlist_value_UNI-USD"]')

    };

    let tiempoActual = new Date().toISOString();
    let valores = {};

    for (let [moneda, elemento] of Object.entries(monedas)) {
        if (elemento) {
            valores[moneda] = elemento.innerText;
        } else {
            valores[moneda] = 'N/A';
        }
    }

    // Convertir el objeto valores a una cadena JSON
    const valoresJson = JSON.stringify(valores);

    // Enviar los valores al servidor
    fetch('http://localhost:3000/guardar-valores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tiempo: tiempoActual,
            valores: valoresJson
        })
    })
    .then(response => response.json())
    .then(data => console.log('Datos guardados:', data))
    .catch(error => console.error('Error:', error));
}

let intervalo = setInterval(obtenerValor, 1000);