const { spawn } = require('child_process');
require('dotenv').config();

const sender = process.env.SO === 'windows' ? 'pwsh/windows.ps1' : 'pwsh/linux.ps1';
const shell = spawn('pwsh', ['-File', sender]);
let numericValue = 5432;

async function sendKeys(text) {
    return new Promise((resolve, reject) => {
        shell.stdin.write('\n' + text + '\n', (error) => {
            if (error) {
                reject('Error al enviar texto:', error);
            } else {
                resolve();
            }
        });
    });
}

// Función para enviar las keys indefinidamente cada 2 segundos
function startSendingKeys() {
    setInterval(() => {
        (async () => {
            try {
                await sendKeys(numericValue); // Enviar el valor numérico como string
            } catch (error) {
                console.error(error);
            }
        })();
    }, 2000); // Intervalo de 2000 ms (2 segundos)
}

// Iniciar el envío de keys
startSendingKeys();
