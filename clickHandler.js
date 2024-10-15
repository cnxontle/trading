function handleButtonClicks() {
    // Esperar 50 segundos antes de hacer clic
    setTimeout(() => {
        // Seleccionar el botón usando el atributo data-testid
        let selecMoneda = document.querySelector('button[data-testid="instrument_info_RUNE/USDT"]');

        if (selecMoneda) {
            console.log("Botón encontrado:", selecMoneda);
            selecMoneda.click();  // Hacer clic en el primer botón
            console.log("Botón 'instrument_info_RUNE/USDT' clicado con éxito.");

            // Hacer clic en el botón de "comprar" después
            setTimeout(() => {
                let botonComprar = document.querySelector('button[id="buy"]'); 
                if (botonComprar) {
                    console.log("Botón de comprar encontrado:", botonComprar);
                    botonComprar.click(); // Hacer clic en el botón de comprar
                    console.log("Botón 'comprar' clicado con éxito.");

                    // Función para ingresar valor en el input
                    const enterValueInInput = (selector, value) => {
                        const inpValue = document.querySelector(selector);
                        if (inpValue) {
                            inpValue.value = value; // Asignar el valor deseado
                            inpValue.dispatchEvent(new Event('input', { bubbles: true })); // Disparar evento
                            console.log("Valor ingresado en el input:", value);
                            
                            if(inpValue.value != "")
                            {
                                let btnOpenPosition = document.querySelector('button[id="open_position"]'); 
                                if (btnOpenPosition) {
                                    console.log("Botón de btnOpenPosition encontrado:", btnOpenPosition);
                                    btnOpenPosition.click(); // Hacer clic en el botón de comprar
                                    console.log("Botón 'btnOpenPosition' clicado con éxito.");
                                }
                                else {
                                    console.log("No se encontró el botón de 'btnOpenPosition'.");
                                }
                            }
                        } else {
                            console.log("No se encontró el input. Reintentando...");
                            setTimeout(() => enterValueInInput(selector, value), 1000); // Reintentar cada segundo
                        }
                    };

                    // Llamar a la función para ingresar el valor en el input después de un pequeño retraso
                    setTimeout(() => {
                        enterValueInInput('input[id="open_value_number_input"]', "10.00");
                    }, 1000); // Esperar 1 segundos antes de intentar ingresar el valor
                } else {
                    console.log("No se encontró el botón de 'comprar'.");
                }
            }, 3000); // Esperar 5 segundos después de hacer clic en el primer botón
        } else {
            console.log("No se encontró el botón 'instrument_info_RUNE/USDT'.");
        }
    }, 7000);  // Esperar 5 segundos
}
