function obtenerValor() {
    const monedas = {
        "ADA-USD": document.querySelector('p[data-testid="watchlist_value_ADA-USD"]'),
        "LTC-USD": document.querySelector('p[data-testid="watchlist_value_LTC-USD"]'),
        "UNI-USD": document.querySelector('p[data-testid="watchlist_value_UNI-USD"]'),
        "ETH-USD": document.querySelector('p[data-testid="watchlist_value_ETH-USD"]'),
        "LINK-USD": document.querySelector('p[data-testid="watchlist_value_LINK-USD"]'),
        "SOL-USD": document.querySelector('p[data-testid="watchlist_value_SOL-USD"]'),
        "BTC-USD": document.querySelector('p[data-testid="watchlist_value_BTC-USD"]')
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