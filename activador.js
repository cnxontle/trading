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

// Función para ejecutar la consulta SQL
async function ejecutarSQL(sql) {
    if (soluciones) {
        try {
            const results = await pool.query(sql);
            if (results && results.rows.length === 2) {  // Se esperan 2 filas
                
                // Se accede a las soluciones y a las filas de resultados
                const primeraSolucion = soluciones[0];
                const segundaSolucion = soluciones[1];
                const tercerSolucion = soluciones[2];
                const cuartaSolucion = soluciones[3];
                const quintaSolucion = soluciones[4];
                const primeraFila = results.rows[0];
                const segundaFila = results.rows[1];
                const id = primeraFila.id;
                const tiempo = primeraFila.tiempo;
    
                // se crea un objeto para almacenar los resultados
                let resultadoFinal = {id: id, tiempo: tiempo};
                let sumaResultadosCripto = 0;
                let totalColumnasCripto = 0;
                let ResultadoSP = 0;
                let ResultadoEner = 0;
                let totalColumnasEner = 0;
                let ResultadoComm = 0;
                let totalColumnasComm = 0;
    
                // Iteramos sobre todas las columnas (incluyendo más allá de la 32)
                const columnas = Object.keys(primeraFila);
                let resultados = {}; // Objeto para almacenar los resultados ya calculados
                for (let i = 2; i < columnas.length; i++) {
                    const columna = columnas[i];
                    const valorPrimeraFila = primeraFila[columna];
                    const valorSegundaFila = segundaFila[columna];
                    const pendiente = ((valorPrimeraFila - valorSegundaFila) / valorSegundaFila) * 100;
                    resultadoFinal[columna] = pendiente;
    
                    // Acumular sumas de pendientes
                    if (i <= 32) {
                        sumaResultadosCripto += pendiente;
                        totalColumnasCripto++;
                    }
                    if (i == 74) {
                        ResultadoSP = pendiente;
                    }
                    if (62 >= i <= 66){
                        ResultadoEner += pendiente;
                        totalColumnasEner++;
                    }
                    if (57 >= i <= 61){
                        ResultadoComm += pendiente;
                        totalColumnasComm++;
                    }
    
                }
    
                // Calcular el promedio de los resultados
                const promedioCripto = sumaResultadosCripto / totalColumnasCripto;
                const promedioEner = ResultadoEner / totalColumnasEner;
                const promedioComm = ResultadoComm / totalColumnasComm;
                const promedioSP = ResultadoSP;
    
                // Obtener microclimas
                let mclimaCripto = obtenerMclima(promedioCripto);
                let mclimaSP = obtenerMclima(promedioSP);
                let mclimaEner = obtenerMclima(promedioEner);
                let mclimaComm = obtenerMclima(promedioComm);
                
                // Añadir la columna 'clima' al resultado final
                resultadoFinal.clima = mclimaCripto + mclimaSP + mclimaEner + mclimaComm;
    
                // Imprimimos el resultado final
                console.log("clima:", resultadoFinal.clima, primeraSolucion);
                
                // Enviamos el resultado final al servidor WebSocket
                //if (isWsOpen) {
                //    ws.send(JSON.stringify(resultadoFinal));
                //} else {
                //    console.error('No se puede enviar el mensaje porque el WebSocket no está abierto.');
                //}
    
            } else {
                console.log("Se esperaban exactamente 2 filas, pero se obtuvieron:", results.rows.length);
            }
        } catch (error) {
            console.error("Error al ejecutar SQL:", error);
        }
    } else {
        console.log('Soluciones no está disponible aún');
    }
    
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