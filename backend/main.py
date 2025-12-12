from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import asyncio
import json

app = FastAPI()

# --- CONFIGURACIÓN DE NIVELES ---
GAME_MAP = [
    {
        "id": 0,
        "name": "/GATEWAY_PERIMETRAL",
        "required_hacks": 2,
        "puzzles": [
            {
                "hacker_prompt": "ERROR 401. Se requiere CÓDIGO DE ACCESO temporal.",
                "spy_intel": "Interceptación de Radio: El código es el año 2025 invertido.",
                "a": "5202"
            },
            {
                "hacker_prompt": "BIO-SCAN SOLICITADO. Ingrese secuencia de colores.",
                "spy_intel": "Biometría: La secuencia válida es rgb (rva).",
                "a": "rojo-verde-azul"
            }
        ]
    },
    {
        "id": 1,
        "name": "/FIREWALL_LOGIC",
        "required_hacks": 2,
        "puzzles": [
            {
                "hacker_prompt": "CÁLCULO DE PUERTO: Resuelve para obtener el puerto: 8 ÷ 2(2 + 2)",
                "spy_intel": "Alerta de Sintaxis: Cuidado con la jerarquía. 1) Paréntesis . 2) División . 3) Multiplicación .",
                "a": "16"
            },
             {
                "hacker_prompt": "COMPLETE LA SECUENCIA: 2, 3, 5, 7, 11, __, 17",
                "spy_intel": "Análisis Numérico: Son números PRIMOS. El primo entre 11 y 17 es...",
                "a": "13"
            }
        ]
    },
    {
        "id": 2,
        "name": "/NODE_TRAFFIC_ANALYSIS",
        "required_hacks": 2, 
        "puzzles": [
            {
                "hacker_prompt": "CRITICAL: Identificar nodo corrupto en la red malla. Opciones: [ALPHA, BRAVO, CHARLIE, DELTA]",
                "spy_intel": "Mapa de Calor: El nodo CHARLIE está enviando 500% más paquetes que el resto. Es un ataque DDoS.",
                "a": "charlie"
            },
            {
                "hacker_prompt": "OVERRIDE PROTOCOL. Ingrese la máscara de subred para /24.",
                "spy_intel": "Hoja de Trucos de Red: /24 siempre equivale a tres 255 seguidos y un 0 (formato x.x.x.x).",
                "a": "255.255.255.0"
            }
        ]
    },
    {
        "id": 3,
        "name": "/CORE_ENCRYPTION_LAYER",
        "required_hacks": 3,
        "puzzles": [
            {
                "hacker_prompt": "DECRYPT MESSAGE: 'VQR ugetgv'",
                "spy_intel": "Cifrado César: ROT-2 (Mueve cada letra 2 espacios atrás). V->T, Q->O, R->P.",
                "a": "top secret"
            },
            {
                "hacker_prompt": "HEX DUMP ANALYSIS. ¿Cuál es el byte de la muerte? 0xDEAD, 0xBEEF, 0xCAFE",
                "spy_intel": "Informe Forense: El malware se firma siempre con una referencia a comida.",
                "a": "0xcafe"
            },
            {
                # MODIFICADO: Lógica Booleana (Respuesta fija pero desafiante)
                "hacker_prompt": "SISTEMA DE AUTODESTRUCCIÓN. Resuelve: (1 AND 0) OR 1. ¿Cortar cable AZUL (0) o ROJO (1)?",
                "spy_intel": "Esquema Lógico: El resultado de la operación matemática indica qué cable es seguro cortar. (Recuerda: AND multiplica, OR suma. 0=Azul, 1=Rojo).",
                "a": "rojo" 
                # Explicación: 
                # (1 AND 0) es 0. 
                # (0 OR 1) es 1. 
                # La respuesta es 1, que corresponde al ROJO según el prompt.
            }
        ]
    }
]

# Configuración Global
INITIAL_TIME = 90 #  Minutos
INITIAL_LIVES = 3  # 3 Vidas

class GameState:
    # CORREGIDO: __init__ con doble guion bajo
    def __init__(self):
        self.current_node_index = 0
        self.current_hack_progress = 0
        self.score = 0
        self.game_over = False
        self.time_left = INITIAL_TIME
        self.lives = INITIAL_LIVES # Nueva variable
        self.timer_task = None
        self.status_message = "SISTEMA EN ESPERA"

    def get_current_puzzle_data(self) -> Optional[Dict[str, str]]:
        if self.current_node_index >= len(GAME_MAP):
             return None
        node = GAME_MAP[self.current_node_index]
        if self.current_hack_progress < len(node["puzzles"]):
            return node["puzzles"][self.current_hack_progress]
        return None

    def reset(self):
        self.current_node_index = 0
        self.current_hack_progress = 0
        self.score = 0
        self.game_over = False
        self.time_left = INITIAL_TIME
        self.lives = INITIAL_LIVES
        self.status_message = "SISTEMA REINICIADO"

class GameManager:
    # CORREGIDO: __init__ con doble guion bajo
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.state = GameState()

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self.active_connections[role] = websocket
        
        if role == "spy":
             await self.update_game_state()

        if "hacker" in self.active_connections and "spy" in self.active_connections:
            if not self.state.timer_task:
                 self.state.reset()
                 self.state.timer_task = asyncio.create_task(self.game_loop())
            
            await self.broadcast({"type": "info", "message": "CONEXIÓN ESTABLECIDA. INICIANDO OPERACIÓN."})
            await self.send_puzzle_to_hacker()
            await self.update_game_state()

    async def disconnect(self, role: str):
        if role in self.active_connections:
            del self.active_connections[role]
        await self.broadcast({"type": "error", "message": f"ALERTA: {role.upper()} SE HA DESCONECTADO."})

    async def game_loop(self):
        try:
            while self.state.time_left > 0 and not self.state.game_over:
                await asyncio.sleep(1)
                self.state.time_left -= 1
                
                # Enviar actualización ligera del tiempo
                await self.broadcast({
                    "type": "timer", 
                    "time": self.state.time_left
                })

                if self.state.time_left <= 0:
                    self.state.game_over = True
                    self.state.status_message = "TIEMPO AGOTADO"
                    await self.broadcast({"type": "error", "message": "¡TIEMPO AGOTADO! MISIÓN FALLIDA."})
                    await self.update_game_state()
        except asyncio.CancelledError:
            pass
        finally:
            self.state.timer_task = None

    async def broadcast(self, message: dict):
        current_sockets = list(self.active_connections.values())
        for ws in current_sockets:
            try:
                await ws.send_json(message)
            except Exception:
                pass 

    async def send_puzzle_to_hacker(self):
        if "hacker" in self.active_connections and not self.state.game_over:
            puzzle_data = self.state.get_current_puzzle_data()
            if puzzle_data:
                node = GAME_MAP[self.state.current_node_index]
                progress_txt = f"[{self.state.current_hack_progress + 1}/{node['required_hacks']}]"
                
                await self.active_connections["hacker"].send_json({
                    "type": "puzzle",
                    "message": f"[TARGET: {node['name']}] {progress_txt}:\n> {puzzle_data['hacker_prompt']}"
                })

    async def update_game_state(self):
        if "spy" in self.active_connections:
            current_intel = "Esperando al Hacker..."
            if not self.state.game_over and "hacker" in self.active_connections:
                 puzzle_data = self.state.get_current_puzzle_data()
                 current_intel = puzzle_data["spy_intel"] if puzzle_data else "Sincronizando..."
            elif self.state.game_over:
                current_intel = self.state.status_message

            await self.active_connections["spy"].send_json({
                "type": "state",
                "map": GAME_MAP,
                "currentNode": self.state.current_node_index,
                "nodeProgress": self.state.current_hack_progress,
                "score": self.state.score,
                "gameOver": self.state.game_over,
                "currentIntel": current_intel,
                "timeLeft": self.state.time_left,
                "lives": self.state.lives # Enviamos vidas al frontend
            })

    async def process_hacker_command(self, answer: str):
        if self.state.game_over: return

        puzzle_data = self.state.get_current_puzzle_data()
        if not puzzle_data: return

        normalized_answer = answer.strip().lower()
        correct_answer = puzzle_data["a"].lower()
        
        is_correct = normalized_answer == correct_answer
        if len(correct_answer) == 1 and correct_answer in normalized_answer: is_correct = True

        if is_correct:
            self.state.current_hack_progress += 1
            self.state.score += 100 
            # Bonus de tiempo
            self.state.time_left += 10
            await self.broadcast({"type": "success", "message": "COMANDO CORRECTO. +10s."})

            node = GAME_MAP[self.state.current_node_index]
            if self.state.current_hack_progress >= node["required_hacks"]:
                self.state.current_node_index += 1
                self.state.current_hack_progress = 0
                self.state.score += 300
                
                if self.state.current_node_index >= len(GAME_MAP):
                    self.state.game_over = True
                    self.state.status_message = "VICTORIA"
                    await self.broadcast({"type": "success", "message": "¡SISTEMA VULNERADO CON ÉXITO!"})
                else:
                    await self.broadcast({"type": "info", "message": f"Accediendo a {GAME_MAP[self.state.current_node_index]['name']}..."})
            
            await self.update_game_state()
            if not self.state.game_over:
                await asyncio.sleep(1)
                await self.send_puzzle_to_hacker()

        else:
            # ERROR: Restar vida y tiempo
            self.state.lives -= 1
            self.state.time_left = max(0, self.state.time_left - 15)
            self.state.score = max(0, self.state.score - 50)
            
            error_msg = f"ERROR DE COMANDO. VIDAS RESTANTES: {self.state.lives}"
            await self.broadcast({"type": "error", "message": error_msg})

            # Check de Game Over por vidas
            if self.state.lives <= 0:
                self.state.game_over = True
                self.state.status_message = "AGENTE CAÍDO EN COMBATE"
                await self.broadcast({"type": "error", "message": "¡SISTEMA BLOQUEADO! DEMASIADOS INTENTOS FALLIDOS."})
            else:
                # Reiniciar progreso del nodo actual (castigo adicional)
                if self.state.current_hack_progress > 0:
                    self.state.current_hack_progress = 0
                    await self.broadcast({"type": "error", "message": "PROGRESO DEL NODO PERDIDO."})

            await self.update_game_state()
            # Reenviar puzzle
            if not self.state.game_over:
                await self.send_puzzle_to_hacker()

    async def restart_game(self):
        if self.state.timer_task:
            self.state.timer_task.cancel()
        
        self.state.reset()
        self.state.timer_task = asyncio.create_task(self.game_loop())
        
        await self.broadcast({"type": "info", "message": "REINICIANDO SIMULACIÓN..."})
        await self.update_game_state()
        if "hacker" in self.active_connections:
             await self.send_puzzle_to_hacker()

game_manager = GameManager()

@app.websocket("/ws/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    await game_manager.connect(websocket, role)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "restart":
                await game_manager.restart_game()
            elif role == "hacker" and data.get("type") == "command":
                await game_manager.process_hacker_command(str(data.get("message", "")))
    except WebSocketDisconnect:
        await game_manager.disconnect(role)
    except Exception:
        await game_manager.disconnect(role)