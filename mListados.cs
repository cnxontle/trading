using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static Program;
using System.Xml.Linq;

namespace trading
{
    public class mListados
    {
        public class Moneda
        {
            public int Numero { get; set; }
            public string NombreMoneda { get; set; }
            public bool Activo { get; set; }
        }
        public List<Moneda> LeerJsonDeArchivo()
        {
            //Para cargar el arvhivo JSON con la lista de monedas // Ruta del archivo JSON
            string rutaArchivo = Path.Combine("data", "listamoneda.json");
            try
            {
                // Leer todo el contenido del archivo JSON
                string jsonString = File.ReadAllText(rutaArchivo);

                // Deserializar el contenido JSON a una lista de objetos Moneda
                return JsonSerializer.Deserialize<List<Moneda>>(jsonString);
            }
            catch (Exception ex)
            {
                    Console.WriteLine("Error al leer el archivo: " + ex.Message);
                    return null;
            }
        }
    }
}
