using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Playwright;
using Npgsql;

class Program
{
    // Función para crear la base de datos y la tabla
    static void CrearTabla(string nombreTabla)
    {
        string connectionString = "Host=localhost;Username=usuario;Password=contraseña;Database=datos_precios";
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
        string connectionString = "Host=localhost;Username=usuario;Password=contraseña;Database=datos_precios";
        var datosAcumulados = new List<Tuple<string, string, string, string, string>>();
        int contador = 0;
        int guardarIntervalo = 60; // Guardar datos cada 60 segundos aproximadamente

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        var page = await browser.NewPageAsync();
        await page.GotoAsync($"https://pyth.network/price-feeds/{activo}");

        using var conn = new NpgsqlConnection(connectionString);
        conn.Open();

        while (true)
        {
            try
            {
                var data = await page.EvaluateAsync<Dictionary<string, string>>(@"
                    () => {
                        return {
                            precio: document.querySelector('#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(1) > span:nth-child(2)').textContent,
                            error: document.querySelector('#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(2) > span:nth-child(2)').textContent,
                            EMAP1hr: document.querySelector('#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(5) > span:nth-child(2)').textContent,
                            EMAC1hr: document.querySelector('#__next > div > main > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > div:nth-child(6) > span:nth-child(2)').textContent
                        };
                    }
                ");

                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                datosAcumulados.Add(Tuple.Create(timestamp, data["precio"], data["error"], data["EMAP1hr"], data["EMAC1hr"]));
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
            catch
            {
                Console.WriteLine("Inicializando");
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
