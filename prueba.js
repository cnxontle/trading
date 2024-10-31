const { spawn } = require('child_process');
require('dotenv').config();

// Iniciar el script de PowerShell
const ubicacion = process.env.SO === 'windows' ? 'pwsh/windows.ps1' : 'pwsh/linux.ps1';
const shell = spawn('pwsh', ['-File', ubicacion]);

// Función para enviar texto al script de PowerShell
function sendKeys(text) {
    return new Promise((resolve, reject) => {
        shell.stdin.write(text + '\n', (error) => {
            if (error) {
                reject('Error al enviar texto a PowerShell:', error);
            } else {
                resolve();
            }
        });
    });
}

(async () => {
    let valor = 10;
    let valor2 = 20;
    // Espera 1 segundo antes de enviar el valor
    await new Promise(resolve => setTimeout(resolve, 500));
    sendKeys(valor2.toString());
    await sendKeys(valor.toString());

    console.log(`Valor ${valor} enviado a PowerShell`);
})();
