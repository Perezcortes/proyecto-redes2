# Cyber-Operación: Protocolo de Infiltración Cooperativa

> **Proyecto Ordinario - Redes de Computadoras II** \> **Universidad
> Tecnológica de la Mixteca**

## Descripción del Proyecto

**Cyber-Operación** es un videojuego multiusuario asimétrico en tiempo
real. Dos jugadores deben colaborar desde interfaces completamente
distintas para superar niveles de seguridad:

1.  **El Hacker (Backend/Logic):** Opera desde una terminal simulada
    (estilo Arch Linux https://gist.github.com/1UPNuke/ac6f6b2f6d7815927adf9484b3fb53d5). Su objetivo es resolver acertijos lógicos y
    matemáticos para desencriptar nodos de seguridad.
2.  **El Espía (Frontend/Visual):** Opera desde una interfaz gráfica
    táctica. Su objetivo es visualizar la estructura de archivos,
    solicitar desbloqueos y extraer datos confidenciales.

El sistema utiliza una arquitectura **Cliente-Servidor** persistente
mediante **WebSockets**, garantizando que las acciones de un jugador
afecten instantáneamente la pantalla del otro.

## Stack Tecnológico

-   **Backend:** Python 3.11+, FastAPI, Uvicorn.
-   **Frontend:** Next.js (React), TypeScript, Tailwind CSS.
-   **Comunicación:** WebSockets (Protocolo `ws://`).
-   **Diseño UI:** Lucide React (Iconografía), Componentes
    personalizados (Terminal ZSH simulada).

## Arquitectura y Funcionamiento Técnico

### 1. El Modelo Cliente-Servidor (GameManager)

El núcleo del juego reside en `backend/main.py`. La clase `GameManager`
actúa como la **Fuente de Verdad**.

-   **Estado Global:** El servidor almacena en memoria el progreso
    actual (`current_node`), la puntuación y las conexiones activas.
-   **Validación:** Toda la lógica (respuestas correctas, cambio de
    nivel) ocurre en Python. El cliente (Next.js) es "tonto"; solo
    renderiza lo que el servidor le dicta.

### 2. Sincronización vía WebSockets

**Flujo de Datos:**

1.  **Evento:** El Hacker envía un comando (ej: `clear` o una respuesta
    `10`).
2.  **Procesamiento:** El Servidor recibe el JSON, valida la respuesta
    contra el puzzle actual.
3.  **Broadcast (Difusión):**
    -   Si es correcto: El Servidor envía `success` al Hacker y
        `state_update` al Espía.
    -   Ambas pantallas reaccionan simultáneamente.

### 3. Estructura de Datos (Nodos)

El juego utiliza una estructura tipo lista (`GAME_MAP`), donde cada
carpeta requiere llaves (puzzles) para desbloquearse.

## Guía de Instalación y Ejecución

### Prerrequisitos

-   Python 3.x
-   Node.js y NPM

### Backend

``` bash
cd backend
python -m venv venv
# Activar entorno Windows
.\venv\Scripts\activate
pip install fastapi uvicorn websockets
uvicorn main:app --reload
```

### Frontend

``` bash
cd frontend
npm install lucide-react
npm run dev
```

## 🎮 Cómo Jugar

1.  Hacker: http://localhost:3000/hacker\
2.  Espía: http://localhost:3000/spy

## Estructura del Proyecto

    cyber-operacion/
    ├── backend/
    │   ├── main.py
    │   └── venv/
    ├── frontend/
    │   ├── app/
    │   │   ├── hacker/
    │   │   ├── spy/
    │   │   └── page.tsx
    │   └── public/
    └── README.md

## Créditos

Desarrollado por **Equipo Pro** para Redes de Computadoras II.
