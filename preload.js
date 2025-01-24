window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.textContent = `
    function obtenerValor() {
    // Seleccionar los elementos del DOM correspondientes a los tickers  
    const tickers = {
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
        "MATIC_USD": document.querySelector('p[data-testid="watchlist_value_POL/USDT"]'),
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
        "UNI_USD": document.querySelector('p[data-testid="watchlist_value_UNI-USD"]'),
        "ISHARES_EMERGING_MARKETS": document.querySelector('p[data-testid="watchlist_value_EEM"]'),
        "ISHARES_AUSTRALIA": document.querySelector('p[data-testid="watchlist_value_EWA"]'),
        "ISHARES_GERMANY": document.querySelector('p[data-testid="watchlist_value_EWG"]'),
        "ISHARES_HONG_KONG": document.querySelector('p[data-testid="watchlist_value_EWH"]'),
        "ISHARES_JAPAN": document.querySelector('p[data-testid="watchlist_value_EWJ"]'),
        "ISHARES_SPAIN": document.querySelector('p[data-testid="watchlist_value_EWP"]'),
        "ISHARES_FRANCE": document.querySelector('p[data-testid="watchlist_value_EWQ"]'),
        "ISHARES_TAIWAN": document.querySelector('p[data-testid="watchlist_value_EWT"]'),
        "ISHARES_UNITED_KINGDOM": document.querySelector('p[data-testid="watchlist_value_EWU"]'),
        "ISHARES_MEXICO": document.querySelector('p[data-testid="watchlist_value_EWW"]'),
        "ISHARES_SOUTH_KOREA": document.querySelector('p[data-testid="watchlist_value_EWY"]'),
        "ISHARES_BRAZIL": document.querySelector('p[data-testid="watchlist_value_EWZ"]'),
        "ISHARES_SOUTH_AFRICA": document.querySelector('p[data-testid="watchlist_value_EZA"]'),
        "ISHARES_CHINA_LARGE_C": document.querySelector('p[data-testid="watchlist_value_FXI"]'),
        "ISHARES_CHINA": document.querySelector('p[data-testid="watchlist_value_MCHI"]'),
        "ISHARES_INDIA": document.querySelector('p[data-testid="watchlist_value_INDA"]'),
        "ISHARES_TURKEY": document.querySelector('p[data-testid="watchlist_value_TUR"]'),
        "ISHARES_LATIN_AME": document.querySelector('p[data-testid="watchlist_value_ILF"]'),
        "ISHARES_GLOBAL_TECH": document.querySelector('p[data-testid="watchlist_value_IXN"]'),
        "ISHARES_US_TECHNOLOGY": document.querySelector('p[data-testid="watchlist_value_IYW"]'),
        "ISHARES_FORESTRY": document.querySelector('p[data-testid="watchlist_value_WOOD"]'),
        "ISHARES_TREASURY_BOND_1_3": document.querySelector('p[data-testid="watchlist_value_SHY.OQ"]'),
        "ISHARES_TREASURY_BOND_7_10": document.querySelector('p[data-testid="watchlist_value_IEF.OQ"]'),
        "ISHARES_TREASURY_BOND_20": document.querySelector('p[data-testid="watchlist_value_TLT.OQ"]'),
        "COMMOD_SOYBEAN": document.querySelector('p[data-testid="watchlist_value_ZSH5"]'),
        "COMMOD_CORN": document.querySelector('p[data-testid="watchlist_value_ZCH5"]'),
        "COMMOD_WHEAT": document.querySelector('p[data-testid="watchlist_value_ZWH5"]'),
        "COMMOD_SUGAR": document.querySelector('p[data-testid="watchlist_value_SBH5"]'),
        "COMMOD_COFFE": document.querySelector('p[data-testid="watchlist_value_KCH5"]'),
        "COMMOD_HEATING_OIL": document.querySelector('p[data-testid="watchlist_value_HOH5"]'),
        "COMMOD_CRUDE_OIL": document.querySelector('p[data-testid="watchlist_value_CLH5"]'),
        "COMMOD_BRENT_CRUDE": document.querySelector('p[data-testid="watchlist_value_BRNJ5"]'),
        "COMMOD_NATURAL_GAS": document.querySelector('p[data-testid="watchlist_value_NGH25"]'),
        "COMMOD_GASOLINE": document.querySelector('p[data-testid="watchlist_value_RBH5"]'),
        "COMMOD_SILVER": document.querySelector('p[data-testid="watchlist_value_SIH25"]'),
        "COMMOD_COPPER": document.querySelector('p[data-testid="watchlist_value_HGH5"]'),
        "COMMOD_GOLD": document.querySelector('p[data-testid="watchlist_value_GCJ5"]'),
        "COMMOD_PLATINUM": document.querySelector('p[data-testid="watchlist_value_PLJ5"]'),
        "INDEX_VIX": document.querySelector('p[data-testid="watchlist_value_VXX4"]'),
        "INDEX_RUSSELL_2000": document.querySelector('p[data-testid="watchlist_value_IWM"]'),
        "INDEX_NASDAQ_100": document.querySelector('p[data-testid="watchlist_value_NQH5"]'),
        "INDEX_SP_500": document.querySelector('p[data-testid="watchlist_value_ESH5"]'),
        "INDEX_DOW_J": document.querySelector('p[data-testid="watchlist_value_DIA"]'),
        "INDEX_VT": document.querySelector('p[data-testid="watchlist_value_VT"]'),
        "INDEX_VBR": document.querySelector('p[data-testid="watchlist_value_VBR"]'),
        "INDEX_US_DOLLAR": document.querySelector('p[data-testid="watchlist_value_DXH5"]'),
        "INDEX_NIKKEI_YEN": document.querySelector('p[data-testid="watchlist_value_EWJ"]'),
        "FOREX_USD_MXN": document.querySelector('p[data-testid="watchlist_value_USD/MXN"]'),
        "FOREX_EURO_USD": document.querySelector('p[data-testid="watchlist_value_EUR/USD"]'),
        "FOREX_USD_TRY": document.querySelector('p[data-testid="watchlist_value_USD/TRY"]'),
        "FOREX_USD_KRW": document.querySelector('p[data-testid="watchlist_value_USD/KRW"]'),
        "FOREX_USD_JPY": document.querySelector('p[data-testid="watchlist_value_USD/JPY"]'),
        "FOREX_USD_CNY": document.querySelector('p[data-testid="watchlist_value_USD/CNY"]'),
        "FOREX_USD_CHF": document.querySelector('p[data-testid="watchlist_value_USD/CHF"]'),
        "FOREX_USD_BRL": document.querySelector('p[data-testid="watchlist_value_USD/BRL"]'),
        "NASDAQ_AAPL": document.querySelector('p[data-testid="watchlist_value_AAPL.OQ"]'),
        "NASDAQ_AMZN": document.querySelector('p[data-testid="watchlist_value_AMZN.OQ"]'),
        "NASDAQ_GOOGL": document.querySelector('p[data-testid="watchlist_value_GOOGL.OQ"]'),
        "NASDAQ_MSFT": document.querySelector('p[data-testid="watchlist_value_MSFT.OQ"]'),
        "NASDAQ_META": document.querySelector('p[data-testid="watchlist_value_FB.OQ"]'),
        "NASDAQ_ADBE": document.querySelector('p[data-testid="watchlist_value_ADBE.OQ"]'),
        "CBOE_ASML": document.querySelector('p[data-testid="watchlist_value_ASMLa.CHI"]'),
        "CBOE_BESI": document.querySelector('p[data-testid="watchlist_value_BESI"]'),
        "NASDAQ_INTC": document.querySelector('p[data-testid="watchlist_value_INTC.OQ"]'),
        "NASDAQ_NVDA": document.querySelector('p[data-testid="watchlist_value_NVDA.OQ"]'),
        "NASDAQ_AMAT": document.querySelector('p[data-testid="watchlist_value_AMAT.OQ"]'),
        "NYSE_TSM": document.querySelector('p[data-testid="watchlist_value_TSM"]'),
        "NASDAQ_AMD": document.querySelector('p[data-testid="watchlist_value_AMD.OQ"]'),
        "NASDAQ_PI": document.querySelector('p[data-testid="watchlist_value_PI"]'),
        "NASDAQ_SYNA": document.querySelector('p[data-testid="watchlist_value_SYNA"]'),
        "NASDAQ_AVGO": document.querySelector('p[data-testid="watchlist_value_AVGO.OQ"]'),
        "NASDAQ_QCOM": document.querySelector('p[data-testid="watchlist_value_QCOM.OQ"]'),
        "NASDAQ_TSLA": document.querySelector('p[data-testid="watchlist_value_TSLA.OQ"]'),
        "CBOE_VOW3": document.querySelector('p[data-testid="watchlist_value_VOW3d.CHI"]'),
        "NYSE_TM": document.querySelector('p[data-testid="watchlist_value_TM"]'),
        "NASDAQ_SBUX": document.querySelector('p[data-testid="watchlist_value_SBUX.OQ"]'),
        "NYSE_WMT": document.querySelector('p[data-testid="watchlist_value_WMT"]'),
        "NASDAQ_COST": document.querySelector('p[data-testid="watchlist_value_COST.OQ"]'),
        "NASDAQ_PEP": document.querySelector('p[data-testid="watchlist_value_PEP.OQ"]'),
        "NYSE_KO": document.querySelector('p[data-testid="watchlist_value_KO"]'),
        "NYSE_DPZ": document.querySelector('p[data-testid="watchlist_value_DPZ"]'),
        "NYSE_HD": document.querySelector('p[data-testid="watchlist_value_HD"]'),
        "NYSE_MCD": document.querySelector('p[data-testid="watchlist_value_MCD"]'),
        "NASDAQ_NFLX": document.querySelector('p[data-testid="watchlist_value_NFLX.OQ"]'),
        "NYSE_DIS": document.querySelector('p[data-testid="watchlist_value_DIS"]'),
        "NASDAQ_CMCSA": document.querySelector('p[data-testid="watchlist_value_CMCSA.OQ"]'),
        "NYSE_PLTR": document.querySelector('p[data-testid="watchlist_value_PLTR.N"]'),
        "NYSE_PATH": document.querySelector('p[data-testid="watchlist_value_PATH"]'),
        "NYSE_AMG": document.querySelector('p[data-testid="watchlist_value_AMG"]'),
        "NYSE_BLK": document.querySelector('p[data-testid="watchlist_value_BLK"]'),
        "NYSE_STT": document.querySelector('p[data-testid="watchlist_value_STT"]'),
        "NYSE_JPM": document.querySelector('p[data-testid="watchlist_value_JPM"]'),
        "NASDAQ_NVAX": document.querySelector('p[data-testid="watchlist_value_NVAX.OQ"]'),
        "NYSE_TMO": document.querySelector('p[data-testid="watchlist_value_TMO"]'),
        "NYSE_HEI": document.querySelector('p[data-testid="watchlist_value_HEI"]'),
        "NASDAQ_WOOF": document.querySelector('p[data-testid="watchlist_value_WOOF.OQ"]'),
        "NYSE_CAG": document.querySelector('p[data-testid="watchlist_value_CAG"]'),
        "NYSE_WM": document.querySelector('p[data-testid="watchlist_value_WM"]'),
        "CBOE_NEOEN": document.querySelector('p[data-testid="watchlist_value_NEOEN"]'),
        "CBOE_ENR": document.querySelector('p[data-testid="watchlist_value_ENR"]'),
        "NYSE_TX": document.querySelector('p[data-testid="watchlist_value_TX"]'),
        "NYSE_MA": document.querySelector('p[data-testid="watchlist_value_MA"]'),
        "NYSE_V": document.querySelector('p[data-testid="watchlist_value_V"]'),
        "NYSE_BABA": document.querySelector('p[data-testid="watchlist_value_BABA.K"]'),
        "NYSE_SHOP": document.querySelector('p[data-testid="watchlist_value_SHOP.K"]'),
        "NASDAQ_MELI": document.querySelector('p[data-testid="watchlist_value_MELI.O"]'),
        "BMV_AGUA": document.querySelector('p[data-testid="watchlist_value_AGUA"]'),
        "BMV_AC": document.querySelector('p[data-testid="watchlist_value_AC"]'),
    };
   
    let tiempoActual = new Date();
    tiempoActual.setHours(tiempoActual.getHours() - 6);
    let tiempoGMTMinus6 = tiempoActual.toISOString();
    let valores = {};

    for (let [ticker, elemento] of Object.entries(tickers)) {
        if (elemento) {
            valores[ticker] = elemento.innerText;
        } else {
            valores[ticker] = 'N/A';
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
            tiempo: tiempoGMTMinus6,
            valores: valoresJson
        })
    })
    .then(response => {if (response.status !== 200) {}})
    .catch(() => {});
    Object.keys(tickers).forEach(ticker => {
        tickers[ticker] = null;
    });
    setTimeout(obtenerValor, 1000);
    }
    obtenerValor();
    `;
    document.head.appendChild(script);
});
