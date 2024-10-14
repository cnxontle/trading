WITH ultima_fila AS (
    SELECT * 
    FROM valores 
    ORDER BY tiempo DESC 
    LIMIT 1
)
SELECT * FROM ultima_fila
UNION ALL
(
    SELECT * 
    FROM valores 
    WHERE tiempo >= (
        SELECT tiempo - INTERVAL '6 seconds' 
        FROM ultima_fila
    )
    AND tiempo < (
        SELECT tiempo - INTERVAL '5 seconds' 
        FROM ultima_fila
    )
    ORDER BY tiempo DESC 
    LIMIT 1
);