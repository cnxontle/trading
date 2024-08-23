using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Playwright;
using Npgsql;
using trading;
using static trading.mListados;

class Program
{
    //private static String[] nMoneda;
    //private static string[] nPaths;


    #region Scrap
    static async Task Scraper()
    {
        var datosAcumulados = new List<Tuple<string, string, string, string, string, string>>();
        int guardarIntervalo = 60; // Guardar datos cada 60 segundos aproximadamente
        var lmonedas = new Monedas();
        string[] lMonedas = lmonedas.ObtenerMonedas();
        var url = "https://pyth.network/price-feeds/";
        var conexionDB = new ConexionPostgreSQL();

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });

        var context = await browser.NewContextAsync();

        // Lista para almacenar las páginas
        var pages = new List<IPage>();

        // Crear tantas páginas como elementos en lMonedas y navegar a las URLs correspondientes
        for (int i = 0; i < lMonedas.Length; i++)
        {
            var page = await context.NewPageAsync();
            await page.GotoAsync($"{url}{lMonedas[i]}");
            pages.Add(page);
        }

        // Lista de tareas para manejar scraping simultáneo
        var scrapingTasks = pages.Select((page, index) => Task.Run(async () =>
        {
            int contador = 0; // Contador individual para cada página
            while (true)
            {
                try
                {
                    //body > div > div > main > div:nth - child(1) > div:nth - child(1) > div:nth - child(1) > h1 > div > div > span:nth - child(1)
                    //body > div > div > main > div:nth - child(1) > div:nth - child(1) > div:nth - child(1) > h1 > div > div:nth - child(2) > span:nth - child(1)
                    //body > div > div > main > div:nth - child(1) > div:nth - child(1) > div:nth - child(1) > h1 > div > div > span:nth - child(1)
                    var result = await page.EvaluateAsync<string[]>(@"
                        () => {
                            const selectors = [
                                '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1) > span:nth-child(2)',
                                '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > span:nth-child(2)',
                                '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(5) > span:nth-child(2)',
                                '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(6) > span:nth-child(2)',
                                // Lista de selectores alternativos para el último elemento
                                'body > div > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h1 > div > div > span:nth-child(1)',
                                'body > div > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h1 > div > div:nth-child(2) > span:nth-child(1)'
                            ];

                            // Función para obtener el contenido del primer selector válido
                            function getElementText(selectors) {
                                for (const selector of selectors) {
                                    const element = document.querySelector(selector);
                                    if (element) {
                                        return element.textContent;
                                    }
                                }
                                return 'Elemento no encontrado';
                            }

                            return selectors.map((selector, index) => {
                                if (index < selectors.length - 1) {
                                    // Selecciona para los primeros 4 selectores fijos
                                    const element = document.querySelector(selector);
                                    return element ? element.textContent : 'Elemento no encontrado';
                                } else {
                                    // Selección dinámica para el último elemento
                                    return getElementText(selectors.slice(selectors.length - 2));
                                }
                            });
                        }
                    ");

                    // Solo hasta que se encuentren todos los elementos, se guardan
                    if (result.All(r => r != "Elemento no encontrado"))
                    {
                        lock (datosAcumulados)
                        {
                            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                            datosAcumulados.Add(Tuple.Create(timestamp, result[0], result[1], result[2], result[3], result[4]));
                            contador++;

                            MostrarBarraProgreso(contador, guardarIntervalo); // Mostrar la barra de progreso
                        }

                        if (contador >= guardarIntervalo)
                        {
                            lock (datosAcumulados)
                            {
                                conexionDB.InsertarDatos(lMonedas[index], datosAcumulados);
                                datosAcumulados.Clear();
                            }
                            contador = 0;

                            Console.WriteLine(); // Nueva línea después de guardar los datos
                        }
                    }

                    await Task.Delay(1000);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                    await Task.Delay(1000);
                }
            }
        })).ToList();

        // Esperar que todas las tareas de scraping finalicen
        await Task.WhenAll(scrapingTasks);
    }
    // Función para mostrar la barra de progreso
    static void MostrarBarraProgreso(int actual, int total)
    {
        int barraAncho = 50; // Ancho de la barra en caracteres
        double progreso = (double)actual / total;
        int progresoActual = (int)(progreso * barraAncho);

        Console.CursorLeft = 0;
        Console.Write("[");
        Console.Write(new string('=', progresoActual));
        Console.Write(new string(' ', barraAncho - progresoActual));
        Console.Write($"] {actual}/{total} ({progreso:P0})");
        Console.CursorLeft = 0;
    }


    /*static async Task Scraper()
    {
        string abMoneda = "";
        var datosAcumulados = new List<Tuple<string, string, string, string, string, string>>();
        int contador = 0;
        int guardarIntervalo = 60; // Guardar datos cada 60 segundos aproximadamente
        
        //Playwright e ir  multiples paginas
        using var playwright = await Playwright.CreateAsync();

        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });

        //Poner aqui el arreglo de la lista de monedas, esto para hacer un for que conjugue la cantidada de paginas que se crearán
        //var page = await browser.NewPageAsync();

        var lmonedas = new Monedas();
        string[] lMonedas = lmonedas.ObtenerMonedas();
        var url = "https://pyth.network/price-feeds/";

        // Crear un contexto de navegador
        var context = await browser.NewContextAsync();

        // Lista para almacenar las páginas
        var pages = new List<IPage>();

        // Crear tantas páginas como elementos en lMonedas
        for (int i = 0; i < lMonedas.Length; i++)
        {
            var page = await context.NewPageAsync();
            pages.Add(page);
        }

        // Navegar a las URLs correspondientes
        for (int i = 0; i < lMonedas.Length; i++)
        {
            await pages[i].GotoAsync($"{url}{lMonedas[i]}");
        }

        var conexionDB = new ConexionPostgreSQL();
        //Inicia el scrap
        var scrapingTasks = new List<Task>();

        for (int i = 0; i < pages.Count; i++)
        {
            var pageIndex = i; // Capture the index for closure
            scrapingTasks.Add(Task.Run(async () =>
            {
                while (true)
                {
                    try
                    {
                        var result = await pages[pageIndex].EvaluateAsync<string[]>(@"
                        () => {
                        const selectors = [
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(5) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(6) > span:nth-child(2)',
                            'body > div > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h1 > div > div:nth-child(2) > span:nth-child(1)'
                        ];
                        return selectors.map(selector => {
                            const element = document.querySelector(selector);
                            return element ? element.textContent : 'Elemento no encontrado';
                        });
                        }
                        ");

                        // Solo hasta que se encuentren todos los elementos, se guardan
                        if (result[0] == "Elemento no encontrado" || result[1] == "Elemento no encontrado" || result[2] == "Elemento no encontrado" || result[3] == "Elemento no encontrado" || result[4] == "Elemento no encontrado")
                        {
                            await Task.Delay(500);
                        }
                        else
                        {
                            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                            datosAcumulados.Add(Tuple.Create(timestamp, result[0], result[1], result[2], result[3], result[4]));
                            contador++;

                            // Mostrar la barra de progreso
                            MostrarBarraProgreso(contador, guardarIntervalo);

                            if (contador >= guardarIntervalo)
                            {
                                conexionDB.InsertarDatos(abMoneda, datosAcumulados);
                                datosAcumulados.Clear();
                                contador = 0;

                                Console.WriteLine(); // Nueva línea después de guardar los datos
                            }
                            await Task.Delay(500);
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.Message);
                        await Task.Delay(1000);
                    }
                }
            }));
        }

        // Await all scraping tasks to complete
        await Task.WhenAll(scrapingTasks);
    }*/
    //static async Task Scraper(string activo)
    //{
    //    string tabla = "";
    //    var datosAcumulados = new List<Tuple<string, string, string, string, string>>();
    //    int contador = 0;
    //    int guardarIntervalo = 60; // Guardar datos cada 60 segundos aproximadamente

    //    using var playwright = await Playwright.CreateAsync();
    //    await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
    //    var page = await browser.NewPageAsync();
    //    await page.GotoAsync($"https://pyth.network/price-feeds/{activo}");
    //    var tMoneda = "";

    //    // Esperar explícitamente a que el elemento esté presente en el DOM
    //    string xpath = "/html/body/div/div/main/div[1]/div[1]/div[1]/h1/div/div[2]/span[1]";

    //    try
    //    {
    //        // Esperar a que el elemento esté visible usando una estrategia basada en XPath
    //        await page.WaitForSelectorAsync("xpath=" + xpath, new PageWaitForSelectorOptions { State = WaitForSelectorState.Visible });

    //        // Evaluar el XPath en Playwright
    //        var result = await page.EvaluateAsync<string>(@$"
    //            () => {{
    //                const element = document.evaluate('{xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    //                return element ? element.textContent.trim() : 'Elemento no encontrado';
    //            }}
    //        ");

    //        // Mostrar el resultado en consola
    //        tMoneda = result;
    //        Console.WriteLine(tMoneda);
    //    }
    //    catch (Exception ex)
    //    {
    //        Console.WriteLine($"Error en el scraping: {ex.Message}");
    //    }

    //    var conexionDB = new ConexionPostgreSQL();

    //    Console.WriteLine("Iniciando scraper a " + tMoneda + "..." + activo);

    //    tabla = RemoveSlash(tMoneda);

    //    static string RemoveSlash(string element)
    //    {
    //        return element.Replace("/", "");
    //    }

    //    while (true)
    //    {
    //        try
    //        {

    //            var result = await page.EvaluateAsync<string[]>(@"
    //                () => {
    //                    const selectors = [
    //                        '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1) > span:nth-child(2)',
    //                        '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > span:nth-child(2)',
    //                        '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(5) > span:nth-child(2)',
    //                        '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(6) > span:nth-child(2)'

    //                    ];
    //                    return selectors.map(selector => {
    //                        const element = document.querySelector(selector);
    //                        return element ? element.textContent : 'Elemento no encontrado';
    //                    });
    //                }
    //            ");
    //            // solo hasta que se encuentren todos los elementos, se guardan
    //            if (result[0] == "Elemento no encontrado" || result[1] == "Elemento no encontrado" || result[2] == "Elemento no encontrado" || result[3] == "Elemento no encontrado")
    //            {
    //                await Task.Delay(500);
    //            }
    //            else
    //            {
    //                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    //                datosAcumulados.Add(Tuple.Create(timestamp, result[0], result[1], result[2], result[3]));
    //                contador++;


    //                // Mostrar la barra de progreso
    //                MostrarBarraProgreso(contador, guardarIntervalo);


    //                if (contador >= guardarIntervalo)
    //                {
    //                    conexionDB.InsertarDatos(tabla, datosAcumulados);
    //                    datosAcumulados.Clear();
    //                    contador = 0;

    //                    Console.WriteLine(); // Nueva línea después de guardar los datos
    //                }
    //                await Task.Delay(500);
    //            }
    //        }
    //        catch (Exception e)
    //        {
    //            Console.WriteLine(e.Message);
    //            await Task.Delay(1000);
    //        }
    //    }
    //}
    /*static void MostrarBarraProgreso(int progresoActual, int progresoTotal)
    {
        int barraLongitud = 50; // Longitud de la barra de progreso
        int progreso = (int)((double)progresoActual / progresoTotal * barraLongitud);
        string barra = new string('#', progreso).PadRight(barraLongitud, '-');

        Console.Write($"\r[{barra}] {progresoActual}/{progresoTotal}");
    } */
    #endregion

    static void Inicializar()
    {
        //Cadena de conexion
        var conexionDB = new ConexionPostgreSQL();
        //Crear tabla "monedas" si no existe
        var query = $@"
            CREATE TABLE IF NOT EXISTS monedas(
                numero SERIAL PRIMARY KEY,
                nombre_moneda VARCHAR(50) NOT NULL,
                activo BOOLEAN NOT NULL
            )";
        conexionDB.CrearTabla(query);

        bool validInput = false;
        int numero = 0;

        var mlistado = new mListados();
        // Leer y deserializar el archivo JSON
        var monedas = mlistado.LeerJsonDeArchivo();
        
            if (monedas != null)
            {
                var queryBuilder = new StringBuilder();
                queryBuilder.Append("INSERT INTO monedas (numero, nombre_moneda, activo) VALUES ");
                var parametros = new List<NpgsqlParameter>();
                for (int i = 0; i < monedas.Count; i++)
                {
                    var moneda = monedas[i];
                    queryBuilder.Append($"(@numero{i}, @nombre_moneda{i}, @activo{i})");

                    if (i < monedas.Count - 1)
                    {
                        queryBuilder.Append(", ");
                    }

                    parametros.Add(new NpgsqlParameter($"numero{i}", moneda.Numero));
                    parametros.Add(new NpgsqlParameter($"nombre_moneda{i}", moneda.NombreMoneda));
                    parametros.Add(new NpgsqlParameter($"activo{i}", moneda.Activo));
            }
                // Terminar la consulta
                queryBuilder.Append(";");

            // Ejecutar la consulta
            conexionDB.EjecutarInsert(queryBuilder.ToString(), parametros.ToArray());
            }
            else
            {
                Console.WriteLine("No se pudieron leer los datos del archivo JSON.");
            }
       /* while (!validInput)
        {
            
            //Console.WriteLine("¿Desea ver la lista de monedas? (S/n)");
            //var keyInfo = Console.ReadKey(true);  // 'true' para no mostrar la tecla presionada

            // Verificar si la tecla presionada es 'S', 's' o 'N', 'n'
                //if (keyInfo.Key == ConsoleKey.S)
                //{
                //    validInput = true;
                //}
                //else if (keyInfo.Key == ConsoleKey.N)
                //{
                //     validInput = true;
                //}
                //else
                //{
                //      Console.WriteLine("Opción no válida. Por favor, presione 'S' para sí o 'N' para no.");
                }
        }*/

    }

    static async Task Main(string[] args)
    {
  
        Console.WriteLine("Inicializando...");
        //Inicializar();

        //creamos una instacia del modulo Monedas
        //var moneds = new Monedas();
        
        ////Guardamos en un arreglo las monedas obtenidas 
        //nMoneda = moneds.ObtenerMonedas();
        //Console.WriteLine(nMoneda[1]);

        // Ejecutar el bucle principal
        await Scraper();

        //var lMonedas = new Monedas();
        //Console.WriteLine("Tabla creada exitosamente.");

    }


}