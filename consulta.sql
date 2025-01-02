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
        SELECT tiempo - INTERVAL '3600 seconds' 
        FROM ultima_fila
    )
    AND tiempo < (
        SELECT tiempo - INTERVAL '3595 seconds' 
        FROM ultima_fila
    )
    ORDER BY tiempo DESC 
    LIMIT 1
)
UNION ALL
(
    SELECT * 
    FROM valores 
    WHERE tiempo >= (
        SELECT tiempo - INTERVAL '86400 seconds' 
        FROM ultima_fila
    )
    AND tiempo < (
        SELECT tiempo - INTERVAL '86395 seconds' 
        FROM ultima_fila
    )
    ORDER BY tiempo DESC 
    LIMIT 1
);