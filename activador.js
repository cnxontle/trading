const WebSocket = require('ws');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config();

// Configurar la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB2_USER,
    host: process.env.DB2_HOST,
    database: process.env.DB2_NAME,
    password: process.env.DB2_PASSWORD,
    port: process.env.DB2_PORT,
});

const ws = new WebSocket('ws://localhost:55555');
let isWsOpen = false; 
let soluciones; 
let estrategiasActivas;
let pool_stop_loss;
let pool_take_profit;
let pool_caducidad;
let bloqueado = false;

// Funcion de Microclima
function obtenerMclima(promedio) {
    let mclima;
    if (promedio > 2) {
        mclima = 'b';
    } else if (promedio > 0.5) {
        mclima = 'd';
    } else if (promedio > -0.5) {
        mclima = 'o';
    } else if (promedio > -2) {
        mclima = 'q';
    } else if (promedio <= -2) {
        mclima = 'p';
    } else {
        mclima = 'x';
    }
    return mclima;
}

// Función para leer la consulta SQL
async function leerConsultaSQL() {
    try {
        const sql = await fs.readFile(path.join(__dirname, 'consulta.sql'), 'utf8');
        return sql;  
    } catch (error) {
        console.error('Error al leer el archivo SQL:', error.message);
        throw error; 
    }
}

// Función para ejecutar la consulta SQL y enviar mensajes al WebSocket
async function ejecutarSQL(sql) {
    if (bloqueado) {
        console.log('Esperando...');
        return;
    }
    bloqueado = true;
    if (soluciones) {
        try {
            const results = await pool.query(sql);
            if (results && results.rows.length === 3) {  // Se esperan 3 filas
                const primeraFila = results.rows[0];
                const segundaFila = results.rows[1];
                const terceraFila = results.rows[2];
                const id = primeraFila.id;
                const tiempo = primeraFila.tiempo;
                const columnas = Object.keys(primeraFila);

                let PendienteBTC = 0;
                let PendienteSP500 = 0;
                let sumaPendientesEner = 0, totalColumnasEner = 0;
                let PendienteETH = 0;
                let climaActual;
                let mensaje;
                let pendientes = [];
                let tendencias = [];
                pendientes.push(id, tiempo);
                tendencias.push(id, tiempo);

                // Iterar sobre todas las columnas
                for (let i = 2; i < columnas.length; i++) {
                    const valorPrimeraFila = primeraFila[columnas[i]];
                    const valorSegundaFila = segundaFila[columnas[i]];
                    const valorTerceraFila = terceraFila[columnas[i]];
                    const pendiente = ((valorPrimeraFila - valorSegundaFila) / valorSegundaFila) * 100;
                    const tendencia = ((valorPrimeraFila - valorTerceraFila) / valorTerceraFila) * 100;
                    pendientes.push(pendiente);
                    tendencias.push(tendencia);
                    if (i === 9) {
                        PendienteBTC = pendiente;
                    } else if (i === 74) {
                        PendienteSP500 = pendiente;
                    } else if (62 <= i && i <= 66) {
                        sumaPendientesEner += pendiente;
                        totalColumnasEner++;
                    } else if (i === 13) {
                        PendienteETH = pendiente;
                    }
                }

                // Calcular clima actual
                const promedioBTC = PendienteBTC;
                const promedioSP = PendienteSP500;
                const promedioEner = sumaPendientesEner / totalColumnasEner;
                const promedioETH = PendienteETH;
                const mclimaBTC = obtenerMclima(promedioBTC);
                const mclimaSP = obtenerMclima(promedioSP);
                const mclimaEner = obtenerMclima(promedioEner);
                const mclimaETH = obtenerMclima(promedioETH);
                climaActual = mclimaBTC +  mclimaETH + mclimaEner + mclimaSP ;

                // Iterar sobre estrategias activas y procesar apertura y cierre
                for (let i = 0; i < soluciones.length; i++) {
                    const indice = soluciones[i].activo;
                    let precioActivo = primeraFila[columnas[indice]];
                    let rangoMinimo, rangoMaximo;
                    const operacion = soluciones[i].operacion;

                    // Cierre de estrategias
                    if (!estrategiasActivas[i]) {
                        pool_caducidad[i] -= 1;
                        const stop_loss = pool_stop_loss[i];
                        const take_profit = pool_take_profit[i];

                        const condicionCaducidad = (pool_caducidad[i] === 0);
                        const condicionCompra = (precioActivo <= stop_loss || precioActivo >= take_profit) && operacion === 'comprar';
                        const condicionVenta = (precioActivo >= stop_loss || precioActivo <= take_profit) && operacion === 'vender';

                        if (condicionCaducidad || condicionCompra || condicionVenta) {
                            mensaje = {
                                "id": soluciones[i].id,
                                "accion": "cerrar",
                                "precio": precioActivo
                            };
                            if (isWsOpen) {
                                await enviarMensajeWs(mensaje, i);
                                console.log('Mensaje enviado:', mensaje, 'Stop Loss:', stop_loss, 'Take Profit:', take_profit, 'Condiciones:', condicionCaducidad, condicionCompra, condicionVenta);
                                break;
                            }
                        }
                    }
                    // Apertura de estrategias
                    if (estrategiasActivas[i]) {
                        if (soluciones[i].direccion_pendiente === "positiva") {
                            rangoMinimo = soluciones[i].pendiente;
                            rangoMaximo = soluciones[i].pendiente + soluciones[i].rango_pendiente;
                        } else {
                            rangoMaximo = soluciones[i].pendiente;
                            rangoMinimo = soluciones[i].pendiente - soluciones[i].rango_pendiente;
                        }
                        // evaluar tendencia para abrir
                        let rango1_tendencia = soluciones[i].inicio_tendencia;
                        let rango2_tendencia = rango1_tendencia + soluciones[i].rango_tendencia;
                        let inicio_tendencia = Math.min(rango1_tendencia, rango2_tendencia);
                        let fin_tendencia = Math.max(rango1_tendencia, rango2_tendencia);

                        if (climaActual === soluciones[i].clima &&
                            rangoMinimo <= pendientes[indice] && pendientes[indice] <= rangoMaximo
                            && tendencias[indice] >= inicio_tendencia && tendencias[indice] <= fin_tendencia) {
                            
                            estrategiasActivas[i] = false;
                            const precioActivoNum = parseFloat(precioActivo);
                            const stopLossNum = parseFloat(soluciones[i].stop_loss);
                            const takeProfitNum = parseFloat(soluciones[i].take_profit);
                            
                            if (operacion === 'comprar') {
                                pool_stop_loss[i] = precioActivoNum - (precioActivoNum * (stopLossNum / 100));
                                pool_take_profit[i] = precioActivoNum + (precioActivoNum * (takeProfitNum / 100));
                            } else if (operacion === 'vender') {
                                pool_stop_loss[i] = precioActivoNum + (precioActivoNum * (stopLossNum / 100));
                                pool_take_profit[i] = precioActivoNum - (precioActivoNum * (takeProfitNum / 100));
                            }
                            
                            pool_caducidad[i] = soluciones[i].caducidad;
                            mensaje = {
                                "id": soluciones[i].id,
                                "accion": "abrir",
                                "operacion": soluciones[i].operacion,
                                "stop_loss": pool_stop_loss[i],
                                "take_profit": pool_take_profit[i],
                                "precio": precioActivo
                            };
                            if (isWsOpen) {
                                await enviarMensajeWs(mensaje, i);
                                bloqueado = false;
                                console.log('Mensaje enviado:', mensaje);
                                break;
                            }
                        }
                    }
                }
            } else {
                console.log("Se esperaban exactamente 3 filas, pero se obtuvieron:", results.rows.length);
                bloqueado = false;
            }
        } catch (error) {
            console.error("Error al ejecutar SQL:", error);
        } finally {
            bloqueado = false;
        }
    } else {
        console.log('Soluciones no está disponible aún');
        bloqueado = false;
    }
}

// Función para enviar mensajes al WebSocket
async function enviarMensajeWs(mensaje, indice) {
    return new Promise((resolve, reject) => {
        ws.send(JSON.stringify(mensaje));
        ws.once('message', (message) => {  
            const respuesta = JSON.parse(message);
            if (respuesta.status === 400) {
                console.log('Error al cerrar la posición');
                pool_caducidad[indice] = parseInt(respuesta.segundos_restantes, 10);
                resolve();
            } else if (respuesta.status === 200) {
                estrategiasActivas[indice] = true;
                pool_stop_loss[indice] = 0;
                pool_take_profit[indice] = 0;
                resolve();
            } else if (respuesta.status === 401) {
                console.log('Error al cerrar la posición, intentando nuevamente...');
                resolve();
            } else if (respuesta.status === 300) {
                resolve();
            } else if (respuesta.status === 301) {
                estrategiasActivas[indice] = true;
                resolve();
            }
        });
    });
}

// Función para escuchar notificaciones desde PostgreSQL
async function escucharNotificaciones() {
    const client = await pool.connect();
    const sql = await leerConsultaSQL();
    try {
        // Escuchar notificaciones en el canal 'nueva_fila'
        await client.query('LISTEN nueva_fila');
        client.on('notification', async (msg) => {
            await ejecutarSQL(sql);  
        });
        console.log('Escuchando inserciones en la base de datos...');
    } catch (error) {
        console.error('Error al escuchar notificaciones:', error.message);
    }
}

// Función para cargar el archivo JSON
async function cargarSoluciones() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'soluciones.json'), 'utf8');
        soluciones = JSON.parse(data);
        estrategiasActivas = Array(soluciones.length).fill(true);
        pool_stop_loss = Array(soluciones.length).fill(0);
        pool_take_profit = Array(soluciones.length).fill(0);
        pool_caducidad = Array(soluciones.length).fill(0);
    } catch (error) {
        console.error('Error al cargar el archivo JSON:', error);
    }
}

// Manejar eventos del WebSocket
ws.on('open', function open() {
    console.log('Conexión WebSocket establecida');
    isWsOpen = true; 
});
ws.on('error', function error(err) {
    console.error('Error en la conexión:', err);
});
ws.on('close', function close() {
    console.log('Conexión WebSocket cerrada');
    isWsOpen = false;
    pool.end(() => {
        console.log('Conexión a PostgreSQL cerrada');
    });
});

// Llamar a la función para escuchar notificaciones
cargarSoluciones();
escucharNotificaciones()
    .then(() => {
        console.log('Notificaciones activadas con éxito.');
    })
    .catch(error => {
        console.error('Error al activar la escucha de notificaciones:', error.message);
    });