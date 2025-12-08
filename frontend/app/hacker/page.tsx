// frontend/app/hacker/page.tsx
'use client'; // Importante para usar WebSockets en el cliente

import { useState, useEffect, useRef } from 'react';

export default function HackerPage() {
  const [logs, setLogs] = useState<string[]>(['> Inicializando conexión segura...']);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('DESCONECTADO');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Conectar al Websocket del backend
    ws.current = new WebSocket('ws://localhost:8000/ws/hacker');

    ws.current.onopen = () => {
      setStatus('CONECTADO');
      addLog('> Enlace con servidor establecido.');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Aquí recibimos mensajes del sistema o del Espía
      addLog(`[ENTRANTE]: ${data.message || JSON.stringify(data)}`);
    };

    ws.current.onclose = () => {
      setStatus('DESCONECTADO');
      addLog('> Conexión perdida.');
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;

    // Enviar comando al servidor
    // Por ahora enviamos un mensaje genérico al espía
    const payload = { type: 'chat', message: input };
    ws.current.send(JSON.stringify(payload));
    
    addLog(`> ${input}`);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col">
      <div className="border-b border-green-800 pb-2 mb-4 flex justify-between">
        <span>TERMINAL DE ACCESO REMOTO v1.0</span>
        <span className={status === 'CONECTADO' ? 'text-green-400' : 'text-red-500'}>
          ESTADO: {status}
        </span>
      </div>

      {/* Área de Logs */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="break-words">{log}</div>
        ))}
      </div>

      {/* Input de Comandos */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-green-900 pt-4">
        <span>root@system:~#</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0"
          placeholder="Escriba un comando..."
          autoFocus
        />
      </form>
    </div>
  );
}