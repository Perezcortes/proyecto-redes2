from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

app = FastAPI()

# Definimos la estructura del "Sistema de Archivos"
GAME_MAP = [
    {
        "id": 0,
        "name": "/ROOT_GATEWAY",
        "required_hacks": 1,
        "puzzles": [
            {"q": "Binario a Decimal: 101", "a": "5"}
        ]
    },
    {
        "id": 1,
        "name": "/SYSTEM32_SECURE",
        "required_hacks": 2, # Requiere 2 aciertos para pasar
        "puzzles": [
            {"q": "Hexadecimal 'A' a Decimal", "a": "10"},
            {"q": "Resuelve: 2 + 2 * 2", "a": "6"} # Ojo con la jerarquía
        ]
    },
    {
        "id": 2,
        "name": "/CONFIDENTIAL_DB",
        "required_hacks": 3, # Nivel difícil, 3 aciertos
        "puzzles": [
            {"q": "¿Raíz de 81?", "a": "9"},
            {"q": "Siguiente primo después de 7", "a": "11"},
            {"q": "Bits en un Byte", "a": "8"}
        ]
    }
]

class GameState:
    def __init__(self):
        self.current_node_index = 0
        self.current_hack_progress = 0 # Cuántos puzzles lleva resueltos en el nodo actual
        self.score = 0
        self.game_over = False

    def get_current_puzzle(self):
        node = GAME_MAP[self.current_node_index]
        # Obtenemos el puzzle correspondiente al progreso actual
        if self.current_hack_progress < len(node["puzzles"]):
            return node["puzzles"][self.current_hack_progress]
        return None

    def reset(self):
        self.current_node_index = 0
        self.current_hack_progress = 0
        self.score = 0
        self.game_over = False

class GameManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.state = GameState()

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self.active_connections[role] = websocket
        
        # Si ambos están, sincronizamos
        if "hacker" in self.active_connections and "spy" in self.active_connections:
            await self.broadcast_game_status("CONEXIÓN ESTABLECIDA. INICIANDO INFILTRACIÓN...")
            await self.send_puzzle()
            await self.update_spy_view()

    async def disconnect(self, role: str):
        if role in self.active_connections:
            del self.active_connections[role]

    async def broadcast_game_status(self, message: str, msg_type="info"):
        for ws in self.active_connections.values():
            await ws.send_json({"type": msg_type, "message": message})

    async def send_puzzle(self):
        if "hacker" in self.active_connections and not self.state.game_over:
            puzzle = self.state.get_current_puzzle()
            if puzzle:
                await self.active_connections["hacker"].send_json({
                    "type": "puzzle",
                    "message": f"NODO {GAME_MAP[self.state.current_node_index]['name']} [{self.state.current_hack_progress + 1}/{GAME_MAP[self.state.current_node_index]['required_hacks']}]: {puzzle['q']}"
                })

    async def update_spy_view(self):
        if "spy" in self.active_connections:
            # Enviamos el mapa completo y dónde está el usuario
            await self.active_connections["spy"].send_json({
                "type": "state",
                "map": GAME_MAP,
                "currentNode": self.state.current_node_index,
                "nodeProgress": self.state.current_hack_progress,
                "score": self.state.score,
                "gameOver": self.state.game_over
            })

    async def process_hacker_command(self, answer: str):
        puzzle = self.state.get_current_puzzle()
        if not puzzle: return

        if answer.strip() == puzzle["a"]:
            # RESPUESTA CORRECTA
            self.state.current_hack_progress += 1
            self.state.score += 50
            await self.broadcast_game_status("¡CÓDIGO ACEPTADO! PROTOCOLO AVANZANDO...", "success")

            # Verificar si completó el nodo (carpeta)
            current_node = GAME_MAP[self.state.current_node_index]
            if self.state.current_hack_progress >= current_node["required_hacks"]:
                # Nodo completado, pasamos al siguiente
                self.state.current_node_index += 1
                self.state.current_hack_progress = 0 # Reset progreso para el nuevo nodo
                
                if self.state.current_node_index >= len(GAME_MAP):
                    self.state.game_over = True
                    await self.broadcast_game_status("¡ACCESO ROOT CONCEDIDO! SISTEMA VULNERADO.", "success")
                else:
                    await self.broadcast_game_status(f"ACCEDIENDO A {GAME_MAP[self.state.current_node_index]['name']}...", "info")
            
            await self.update_spy_view()
            if not self.state.game_over:
                await self.send_puzzle()

        else:
            # RESPUESTA INCORRECTA (PENALIZACIÓN)
            await self.broadcast_game_status("¡ERROR DE SINTAXIS! ALERTA DE SEGURIDAD.", "error")
            
            # Lógica de castigo: Si fallas, pierdes el progreso de la carpeta actual
            if self.state.current_hack_progress > 0:
                self.state.current_hack_progress = 0
                await self.broadcast_game_status("PROGRESO DEL NODO REINICIADO POR SEGURIDAD.", "error")
            
            # Castigo severo: Si fallas al inicio, podrías retroceder de nodo (opcional)
            # elif self.state.current_node_index > 0:
            #     self.state.current_node_index -= 1
            
            await self.update_spy_view()
            await self.send_puzzle() # Reenvía el puzzle (o el anterior si se reinició)

    async def restart_game(self):
        self.state.reset()
        await self.broadcast_game_status("REINICIANDO SISTEMA...")
        await self.update_spy_view()
        await self.send_puzzle()

game_manager = GameManager()

@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    await game_manager.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "restart":
                await game_manager.restart_game()
            elif role == "hacker":
                await game_manager.process_hacker_command(str(data.get("message", "")))
    except WebSocketDisconnect:
        await game_manager.disconnect(role)