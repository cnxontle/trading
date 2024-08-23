using Npgsql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace trading
{
    public class Monedas
    {
        public string[] ObtenerMonedas()
        {

            var monedas = new List<string>();
            var conexionDB = new ConexionPostgreSQL();
            var connectionString = conexionDB.connectionString;
            using var conn = new NpgsqlConnection(connectionString);
            conn.Open();

            using var cmd = new NpgsqlCommand("SELECT nombre_moneda FROM monedas WHERE activo = true", conn);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                monedas.Add(reader.GetString(0));
            }

            return monedas.ToArray();
        }
    }
}
