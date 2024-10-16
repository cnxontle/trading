import asyncio
import websockets

async def connect_to_server():
    uri = "ws://localhost:55555"
    async with websockets.connect(uri) as websocket:
        # Enviar un mensaje al servidor WebSocket
        await websocket.send("hola Python")
        
        while True:
            pass
            # Recibir un mensaje del servidor WebSocket
            

# Ejecutar el evento async
asyncio.run(connect_to_server())
