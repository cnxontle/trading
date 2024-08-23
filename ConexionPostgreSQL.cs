using Npgsql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace trading
{
    public class ConexionPostgreSQL
    {
        //Variable para la cadena de conexion
        public readonly string connectionString;

        public ConexionPostgreSQL()
        {
            connectionString = $"Host=localhost;Username=postgres;Password=postrading123;Database=datos_precios";
        }

        public void CrearTabla(string query)
        {
            using var conn = new NpgsqlConnection(connectionString);
            conn.Open();
            using var cmd = new NpgsqlCommand();
            cmd.Connection = conn;
            cmd.CommandText = query;
            try
            {
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }
            //$@"
            //CREATE TABLE IF NOT EXISTS {nombreTabla} (
            //    timestamp TEXT,
            //    precio TEXT,
            //    error TEXT,
            //    EMAP1hr TEXT,
            //    EMAC1hr TEXT
            //)";
        }

        public void EjecutarInsert(string query, params NpgsqlParameter[] parametros)
        {
            using var conn = new NpgsqlConnection(connectionString);
            conn.Open();
            using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddRange(parametros);
            try
            {
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }
        }

        public void InsertarDatos(string tabla, List<Tuple<string, string, string, string, string, string>> datosAcumulados)
        {
            using var conn = new NpgsqlConnection(connectionString);
            conn.Open();
            using var cmd = new NpgsqlCommand();
            cmd.Connection = conn;

            foreach (var datos in datosAcumulados)
            {
                cmd.Parameters.Clear();
                cmd.CommandText = $@"
                    INSERT INTO {tabla} (timestamp, precio, error, EMAP1hr, EMAC1hr)
                    VALUES (@timestamp, @precio, @error, @EMAP1hr, @EMAC1hr)";
                cmd.Parameters.AddWithValue("timestamp", datos.Item1);
                cmd.Parameters.AddWithValue("precio", datos.Item2);
                cmd.Parameters.AddWithValue("error", datos.Item3);
                cmd.Parameters.AddWithValue("EMAP1hr", datos.Item4);
                cmd.Parameters.AddWithValue("EMAC1hr", datos.Item5);
                cmd.ExecuteNonQuery();
            }
        }


    }
}
