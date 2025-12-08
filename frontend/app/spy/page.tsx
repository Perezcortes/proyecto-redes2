'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Folder, FolderOpen, Lock, FileCode, CheckCircle, AlertTriangle, Terminal } from 'lucide-react';

type GameLog = { text: string; type: 'success' | 'info' | 'error' };

type Node = {
  id: number;
  name: string;
  required_hacks: number;
};

export default function SpyPage() {
  const [messages, setMessages] = useState<GameLog[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentNode, setCurrentNode] = useState(0);
  const [nodeProgress, setNodeProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws/spy');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'state') {
        setNodes(data.map);
        setCurrentNode(data.currentNode);
        setNodeProgress(data.nodeProgress);
        setScore(data.score);
        setGameOver(data.gameOver);
      } else {
        setMessages(prev => [{ text: data.message, type: data.type }, ...prev]);
      }
    };
    return () => ws.current?.close();
  }, []);

  const restartGame = () => ws.current?.send(JSON.stringify({ type: 'restart' }));

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-500 font-mono p-4 flex flex-col md:flex-row gap-4">
      
      {/* COLUMNA IZQUIERDA: ÁRBOL DE DIRECTORIOS */}
      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-cyan-400" /> FILE_SYSTEM_ROOT
          </h2>
          <div className="text-yellow-400 font-bold">PTS: {score}</div>
        </div>

        <div className="space-y-4 relative z-10">
          {nodes.map((node, index) => {
            const isActive = index === currentNode && !gameOver;
            const isCompleted = index < currentNode || gameOver;
            const isLocked = index > currentNode && !gameOver;

            return (
              <div 
                key={node.id}
                className={`p-4 rounded-lg border transition-all duration-500 flex items-center gap-4
                  ${isActive ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] translate-x-4' : ''}
                  ${isCompleted ? 'bg-green-950/20 border-green-800 opacity-60' : ''}
                  ${isLocked ? 'bg-slate-950 border-slate-800 opacity-40' : ''}
                `}
              >
                {/* Icono de Estado */}
                <div className="shrink-0">
                  {isCompleted ? <FolderOpen className="text-green-500" size={32} /> : 
                   isActive ? <FolderOpen className="text-cyan-400 animate-pulse" size={32} /> :
                   <Lock className="text-slate-500" size={32} />}
                </div>

                {/* Información de la Carpeta */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {node.name}
                    </span>
                    {isActive && (
                      <span className="text-xs bg-cyan-900 px-2 py-1 rounded text-cyan-200 border border-cyan-700">
                        HACKEANDO...
                      </span>
                    )}
                  </div>

                  {/* Barra de Progreso Interna (Capas de Seguridad) */}
                  {isActive && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Desencriptando capas...</span>
                        <span>{nodeProgress} / {node.required_hacks}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full transition-all duration-500"
                          style={{ width: `${(nodeProgress / node.required_hacks) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && <div className="text-xs text-green-500 mt-1">✓ ACCESO TOTAL</div>}
                  {isLocked && <div className="text-xs text-slate-600 mt-1">ENCRIPTADO AES-256</div>}
                </div>
              </div>
            );
          })}
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 flex-col">
            <h2 className="text-4xl font-bold text-green-500 mb-4 animate-bounce">SISTEMA VULNERADO</h2>
            <button onClick={restartGame} className="bg-green-700 text-white px-6 py-3 rounded hover:bg-green-600">
              REINICIAR OPERACIÓN
            </button>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: LOGS DE COMUNICACIÓN */}
      <div className="w-full md:w-1/3 bg-black border border-slate-800 rounded-lg p-4 flex flex-col h-96 md:h-auto">
        <h3 className="text-slate-400 text-sm border-b border-slate-800 pb-2 mb-2 flex items-center gap-2">
          <Terminal size={14} /> LIVE_LOGS
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-2">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`p-2 border-l-2 ${
                msg.type === 'success' ? 'border-green-500 text-green-400 bg-green-900/10' :
                msg.type === 'error' ? 'border-red-500 text-red-400 bg-red-900/10' :
                'border-cyan-500 text-slate-300'
              }`}
            >
              <span className="font-bold mr-2">[{new Date().toLocaleTimeString()}]</span>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}