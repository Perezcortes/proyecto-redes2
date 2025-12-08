# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict

app = FastAPI()

# Gestor de conexiones para manejar los roles
class GameManager:
    def __init__(self):
        # Guardamos las conexiones activas: 'spy' o 'hacker'
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        # Verificar si el rol ya está ocupado
        if role in self.active_connections:
            await websocket.send_json({"type": "error", "message": f"El rol {role} ya esta ocupado."})
            await websocket.close()
            return False
        
        self.active_connections[role] = websocket
        print(f"Jugador conectado: {role}")
        return True

    def disconnect(self, role: str):
        if role in self.active_connections:
            del self.active_connections[role]
            print(f"Jugador desconectado: {role}")

    # Función para enviar mensaje al OTRO jugador
    async def send_to_partner(self, sender_role: str, message: dict):
        target_role = "hacker" if sender_role == "spy" else "spy"
        
        if target_role in self.active_connections:
            target_socket = self.active_connections[target_role]
            await target_socket.send_json(message)
        else:
            print(f"El compañero ({target_role}) no está conectado aún.")

game_manager = GameManager()

@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    # Validar rol
    if role not in ["spy", "hacker"]:
        await websocket.close()
        return

    # Intentar conectar
    success = await game_manager.connect(websocket, role)
    if not success:
        return

    try:
        # Avisar que se conectó correctamente
        await websocket.send_json({"type": "system", "message": f"Conectado como {role}"})
        
        # Bucle principal de comunicación
        while True:
            # Esperar mensajes del cliente (Next.js)
            data = await websocket.receive_json()
            
            # Procesar lógica del juego simple (Ejemplo Nivel 1)
            print(f"Recibido de {role}: {data}")
            
            # Reenviar la acción al compañero
            await game_manager.send_to_partner(role, data)

    except WebSocketDisconnect:
        game_manager.disconnect(role)
        # Avisar al otro jugador que su compañero se fue
        await game_manager.send_to_partner(role, {"type": "system", "message": "Tu compañero se ha desconectado."})