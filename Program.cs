using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Playwright;
using Npgsql;

class Program
{
    // Función para crear la tabla
    static void CrearTabla(string nombreTabla)
    {
        string connectionString = "Host=localhost;Username=postgres;Password=mcfly2015;Database=datos_precios";
        using var conn = new NpgsqlConnection(connectionString);
        conn.Open();
        using var cmd = new NpgsqlCommand();
        cmd.Connection = conn;
        cmd.CommandText = $@"
            CREATE TABLE IF NOT EXISTS {nombreTabla} (
                timestamp TEXT,
                precio TEXT,
                error TEXT,
                EMAP1hr TEXT,
                EMAC1hr TEXT
            )";
        cmd.ExecuteNonQuery();
    }

    // Función scraper
    static async Task Scraper(string activo, string tabla)
    {
        string connectionString = "Host=localhost;Username=postgres;Password=mcfly2015;Database=datos_precios";
        var datosAcumulados = new List<Tuple<string, string, string, string, string>>();
        int contador = 0;
        int guardarIntervalo = 60; // Guardar datos cada 60 segundos aproximadamente

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        var page = await browser.NewPageAsync();
        await page.GotoAsync($"https://pyth.network/price-feeds/{activo}");
        using var conn = new NpgsqlConnection(connectionString);
        conn.Open();
        Console.WriteLine("Iniciando scraper...");
        
        while (true)
        {
            try
            {
                var result = await page.EvaluateAsync<string[]>(@"
                    () => {
                        const selectors = [
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(5) > span:nth-child(2)',
                            '#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(6) > span:nth-child(2)'
                        ];
                        return selectors.map(selector => {
                            const element = document.querySelector(selector);
                            return element ? element.textContent : 'Elemento no encontrado';
                        });
                    }
                ");
                // solo hasta que se encuentren todos los elementos, se guardan
                if (result[0] == "Elemento no encontrado" || result[1] == "Elemento no encontrado" || result[2] == "Elemento no encontrado" || result[3] == "Elemento no encontrado")
                {
                    await Task.Delay(1000);
                }
                else
                {
                    string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                    datosAcumulados.Add(Tuple.Create(timestamp, result[0], result[1], result[2], result[3]));
                    contador++;

                    if (contador >= guardarIntervalo)
                    {
                        using var cmd = new NpgsqlCommand();
                        cmd.Connection = conn;
                        cmd.CommandText = $@"
                            INSERT INTO {tabla} (timestamp, precio, error, EMAP1hr, EMAC1hr)
                            VALUES (@timestamp, @precio, @error, @EMAP1hr, @EMAC1hr)";

                        foreach (var datos in datosAcumulados)
                        {
                            cmd.Parameters.Clear();
                            cmd.Parameters.AddWithValue("timestamp", datos.Item1);
                            cmd.Parameters.AddWithValue("precio", datos.Item2);
                            cmd.Parameters.AddWithValue("error", datos.Item3);
                            cmd.Parameters.AddWithValue("EMAP1hr", datos.Item4);
                            cmd.Parameters.AddWithValue("EMAC1hr", datos.Item5);
                            cmd.ExecuteNonQuery();
                        }
                        datosAcumulados.Clear();
                        contador = 0;
                    }
                    await Task.Delay(1000);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                await Task.Delay(1000);
            }
        }
    }

    static async Task Main(string[] args)
    {
        // Crear tablas
        CrearTabla("chainlink");

        // Ejecutar el bucle principal
        await Scraper("crypto-link-usd", "chainlink");
    }
}