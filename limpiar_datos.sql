--En este qury muestra ya los datos filtraddos (Delas crypto)
--tambien inserta una fila con valores a 0 para identificar el salto de tiempo de 5 segundos

--Eliminar tabla si existe
DROP TABLE IF EXISTS temp_ultimos_registros;

-- Crear la tabla temporal y eliminar duplicados
CREATE TEMP TABLE temp_ultimos_registros AS
SELECT 
    id,
    tiempo::TIMESTAMP AS tiempo,  -- Asegúrate de que el campo tiempo esté en formato TIMESTAMP

	--Valores de las cryptomoneda por columnas
	COALESCE(NULLIF(AAVE_USD::TEXT, 'NaN')::NUMERIC, 0) AS AAVE_USD,
    COALESCE(NULLIF(ADA_USD::TEXT, 'NaN')::NUMERIC, 0) AS ADA_USD,
    COALESCE(NULLIF(APT_USDT::TEXT, 'NaN')::NUMERIC, 0) AS APT_USDT,
    COALESCE(NULLIF(ARB_USDT::TEXT, 'NaN')::NUMERIC, 0) AS ARB_USDT,
    COALESCE(NULLIF(ATOM_USD::TEXT, 'NaN')::NUMERIC, 0) AS ATOM_USD,
    COALESCE(NULLIF(AVAX_USD::TEXT, 'NaN')::NUMERIC, 0) AS AVAX_USD,
    COALESCE(NULLIF(BCH_USD::TEXT, 'NaN')::NUMERIC, 0) AS BCH_USD,
    COALESCE(NULLIF(BTC_USD::TEXT, 'NaN')::NUMERIC, 0) AS BTC_USD,
    COALESCE(NULLIF(DOGE_USD::TEXT, 'NaN')::NUMERIC, 0) AS DOGE_USD,
    COALESCE(NULLIF(DOT_USD::TEXT, 'NaN')::NUMERIC, 0) AS DOT_USD,
    COALESCE(NULLIF(ETC_USD::TEXT, 'NaN')::NUMERIC, 0) AS ETC_USD,
    COALESCE(NULLIF(ETH_USD::TEXT, 'NaN')::NUMERIC, 0) AS ETH_USD,
    COALESCE(NULLIF(FIL_USD::TEXT, 'NaN')::NUMERIC, 0) AS FIL_USD,
    COALESCE(NULLIF(HBAR_USD::TEXT, 'NaN')::NUMERIC, 0) AS HBAR_USD,
    COALESCE(NULLIF(INJ_USDT::TEXT, 'NaN')::NUMERIC, 0) AS INJ_USDT,
    COALESCE(NULLIF(LINK_USD::TEXT, 'NaN')::NUMERIC, 0) AS LINK_USD,
    COALESCE(NULLIF(LTC_USD::TEXT, 'NaN')::NUMERIC, 0) AS LTC_USD,
    COALESCE(NULLIF(MANA_USDT::TEXT, 'NaN')::NUMERIC, 0) AS MANA_USDT,
    COALESCE(NULLIF(MATIC_USD::TEXT, 'NaN')::NUMERIC, 0) AS MATIC_USD,
    COALESCE(NULLIF(NEAR_USDT::TEXT, 'NaN')::NUMERIC, 0) AS NEAR_USDT,
    COALESCE(NULLIF(NEO_USDT::TEXT, 'NaN')::NUMERIC, 0) AS NEO_USDT,
    COALESCE(NULLIF(OP_USDT::TEXT, 'NaN')::NUMERIC, 0) AS OP_USDT,
    COALESCE(NULLIF(RENDER_USDT::TEXT, 'NaN')::NUMERIC, 0) AS RENDER_USDT,
    COALESCE(NULLIF(RUNE_USDT::TEXT, 'NaN')::NUMERIC, 0) AS RUNE_USDT,
    COALESCE(NULLIF(SAND_USDT::TEXT, 'NaN')::NUMERIC, 0) AS SAND_USDT,
    COALESCE(NULLIF(SNX_USDT::TEXT, 'NaN')::NUMERIC, 0) AS SNX_USDT,
    COALESCE(NULLIF(SOL_USD::TEXT, 'NaN')::NUMERIC, 0) AS SOL_USD,
    COALESCE(NULLIF(STX_USDT::TEXT, 'NaN')::NUMERIC, 0) AS STX_USDT,
    COALESCE(NULLIF(THETA_USDT::TEXT, 'NaN')::NUMERIC, 0) AS THETA_USDT,
    COALESCE(NULLIF(XRP_USD::TEXT, 'NaN')::NUMERIC, 0) AS XRP_USD,
    COALESCE(NULLIF(UNI_USD::TEXT, 'NaN')::NUMERIC, 0) AS UNI_USD,
	
	COALESCE(NULLIF(AAVE_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(ADA_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(APT_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(ARB_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(ATOM_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(AVAX_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(BCH_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(BTC_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(DOGE_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(DOT_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(ETC_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(ETH_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(FIL_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(HBAR_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(INJ_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(LINK_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(LTC_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(MANA_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(MATIC_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(NEAR_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(NEO_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(OP_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(RENDER_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(RUNE_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(SAND_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(SNX_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(SOL_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(STX_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(THETA_USDT::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(XRP_USD::TEXT, 'NaN')::NUMERIC, 0) + 
    COALESCE(NULLIF(UNI_USD::TEXT, 'NaN')::NUMERIC, 0) AS total_suma
FROM (
    SELECT * 
    FROM valores 
    ORDER BY tiempo DESC 
    --LIMIT 150
) AS subquery
ORDER BY tiempo ASC;

-- Eliminar duplicados
DELETE FROM temp_ultimos_registros
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM temp_ultimos_registros
    GROUP BY total_suma
);

WITH diferencias AS (
    SELECT 
        id,
        tiempo,
        total_suma,
        LAG(tiempo) OVER (ORDER BY tiempo) AS tiempo_anterior,
        LAG(total_suma) OVER (ORDER BY tiempo) AS total_suma_anterior,
        EXTRACT(EPOCH FROM (tiempo - LAG(tiempo) OVER (ORDER BY tiempo))) AS diferencia
    FROM temp_ultimos_registros
)
-- Insertar fila con valor 0 donde la diferencia es mayor o igual a 5 segundos y el total_suma anterior no es 0
INSERT INTO temp_ultimos_registros (tiempo, total_suma)
SELECT 
    CASE 
        WHEN total_suma <> 0 THEN tiempo + INTERVAL '0.001 second'  -- Insertar por debajo (aumentar 1 segundo)
        ELSE tiempo - INTERVAL '0.001 second'  -- Insertar por encima (restar 0.001 segundo)
    END AS tiempo_modificado,
    0  -- Establecer total_suma a 0 en los nuevos registros
FROM diferencias
WHERE diferencia IS NOT NULL 
  AND diferencia >= 5  -- Solo insertar si la diferencia es mayor o igual a 5 segundos
  AND total_suma_anterior <> 0  -- El valor anterior de total_suma no puede ser 0
  AND total_suma <> 0;  -- El valor actual de total_suma no debe ser 0


SELECT 
   
	COALESCE(NULLIF(AAVE_USD::TEXT, 'NaN')::NUMERIC, 0) AS AAVE_USD,
    COALESCE(NULLIF(ADA_USD::TEXT, 'NaN')::NUMERIC, 0) AS ADA_USD,
    COALESCE(NULLIF(APT_USDT::TEXT, 'NaN')::NUMERIC, 0) AS APT_USDT,
    COALESCE(NULLIF(ARB_USDT::TEXT, 'NaN')::NUMERIC, 0) AS ARB_USDT,
    COALESCE(NULLIF(ATOM_USD::TEXT, 'NaN')::NUMERIC, 0) AS ATOM_USD,
    COALESCE(NULLIF(AVAX_USD::TEXT, 'NaN')::NUMERIC, 0) AS AVAX_USD,
    COALESCE(NULLIF(BCH_USD::TEXT, 'NaN')::NUMERIC, 0) AS BCH_USD,
    COALESCE(NULLIF(BTC_USD::TEXT, 'NaN')::NUMERIC, 0) AS BTC_USD,
    COALESCE(NULLIF(DOGE_USD::TEXT, 'NaN')::NUMERIC, 0) AS DOGE_USD,
    COALESCE(NULLIF(DOT_USD::TEXT, 'NaN')::NUMERIC, 0) AS DOT_USD,
    COALESCE(NULLIF(ETC_USD::TEXT, 'NaN')::NUMERIC, 0) AS ETC_USD,
    COALESCE(NULLIF(ETH_USD::TEXT, 'NaN')::NUMERIC, 0) AS ETH_USD,
    COALESCE(NULLIF(FIL_USD::TEXT, 'NaN')::NUMERIC, 0) AS FIL_USD,
    COALESCE(NULLIF(HBAR_USD::TEXT, 'NaN')::NUMERIC, 0) AS HBAR_USD,
    COALESCE(NULLIF(INJ_USDT::TEXT, 'NaN')::NUMERIC, 0) AS INJ_USDT,
    COALESCE(NULLIF(LINK_USD::TEXT, 'NaN')::NUMERIC, 0) AS LINK_USD,
    COALESCE(NULLIF(LTC_USD::TEXT, 'NaN')::NUMERIC, 0) AS LTC_USD,
    COALESCE(NULLIF(MANA_USDT::TEXT, 'NaN')::NUMERIC, 0) AS MANA_USDT,
    COALESCE(NULLIF(MATIC_USD::TEXT, 'NaN')::NUMERIC, 0) AS MATIC_USD,
    COALESCE(NULLIF(NEAR_USDT::TEXT, 'NaN')::NUMERIC, 0) AS NEAR_USDT,
    COALESCE(NULLIF(NEO_USDT::TEXT, 'NaN')::NUMERIC, 0) AS NEO_USDT,
    COALESCE(NULLIF(OP_USDT::TEXT, 'NaN')::NUMERIC, 0) AS OP_USDT,
    COALESCE(NULLIF(RENDER_USDT::TEXT, 'NaN')::NUMERIC, 0) AS RENDER_USDT,
    COALESCE(NULLIF(RUNE_USDT::TEXT, 'NaN')::NUMERIC, 0) AS RUNE_USDT,
    COALESCE(NULLIF(SAND_USDT::TEXT, 'NaN')::NUMERIC, 0) AS SAND_USDT,
    COALESCE(NULLIF(SNX_USDT::TEXT, 'NaN')::NUMERIC, 0) AS SNX_USDT,
    COALESCE(NULLIF(SOL_USD::TEXT, 'NaN')::NUMERIC, 0) AS SOL_USD,
    COALESCE(NULLIF(STX_USDT::TEXT, 'NaN')::NUMERIC, 0) AS STX_USDT,
    COALESCE(NULLIF(THETA_USDT::TEXT, 'NaN')::NUMERIC, 0) AS THETA_USDT,
    COALESCE(NULLIF(XRP_USD::TEXT, 'NaN')::NUMERIC, 0) AS XRP_USD,
    COALESCE(NULLIF(UNI_USD::TEXT, 'NaN')::NUMERIC, 0) AS UNI_USD,

	
FROM valores
ORDER BY tiempo desc;
