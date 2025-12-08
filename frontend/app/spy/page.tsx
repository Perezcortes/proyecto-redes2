'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Folder, FolderOpen, Lock, Terminal, Download, Database, FileText } from 'lucide-react';

type GameLog = { text: string; type: 'success' | 'info' | 'error' };
type Node = { id: number; name: string; required_hacks: number };

// Datos ficticios para simular la extracción
const DUMMY_FILES = [
  "extracting_users.db...",
  "bypassing_firewall_rules.conf...",
  "downloading_financial_records.xlsx...",
  "decrypting_admin_keys.pem...",
  "copying_surveillance_footage.mp4..."
];

export default function SpyPage() {
  const [messages, setMessages] = useState<GameLog[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentNode, setCurrentNode] = useState(0);
  const [nodeProgress, setNodeProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('DESCONECTADO');
  
  // Estado para la animación de descarga
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFile, setDownloadFile] = useState('');
  
  // Referencia para saber si cambiamos de nivel
  const prevNodeRef = useRef(0);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws/spy');
    ws.current.onopen = () => setStatus('EN LÍNEA');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'state') {
        setNodes(data.map);
        setNodeProgress(data.nodeProgress);
        setScore(data.score);
        setGameOver(data.gameOver);
        
        // Lógica para detectar que completamos una carpeta
        if (data.currentNode > prevNodeRef.current) {
          triggerDownloadAnimation();
        }
        setCurrentNode(data.currentNode);
        prevNodeRef.current = data.currentNode;

      } else {
        setMessages(prev => [{ text: data.message, type: data.type }, ...prev]);
      }
    };
    return () => ws.current?.close();
  }, []);

  const triggerDownloadAnimation = () => {
    setIsDownloading(true);
    let counter = 0;
    
    // Simular archivos pasando rápido
    const interval = setInterval(() => {
      setDownloadFile(DUMMY_FILES[counter % DUMMY_FILES.length]);
      counter++;
    }, 400);

    // Terminar animación después de 3 segundos
    setTimeout(() => {
      clearInterval(interval);
      setIsDownloading(false);
    }, 3000);
  };

  const restartGame = () => {
    prevNodeRef.current = 0; // Reset ref
    ws.current?.send(JSON.stringify({ type: 'restart' }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-500 font-mono p-4 flex flex-col md:flex-row gap-4 relative">
      
      {/* --- OVERLAY DE DESCARGA (SIMULACIÓN) --- */}
      {isDownloading && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-md p-6 border border-green-500 bg-green-950/20 rounded-lg text-center">
              <Database className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2 blink">EXTRAYENDO DATOS...</h2>
              <div className="font-mono text-green-400 text-sm mb-4 h-6">
                {`> ${downloadFile}`}
              </div>
              
              {/* Barra de progreso falsa */}
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden relative">
                 <div className="absolute top-0 left-0 h-full bg-green-500 animate-[progress_2s_ease-in-out_infinite] w-full origin-left"></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">No apague el sistema.</p>
           </div>
        </div>
      )}

      {/* COLUMNA IZQUIERDA: ÁRBOL DE DIRECTORIOS */}
      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-6 relative overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-cyan-400" /> FILE_SYSTEM_ROOT
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400">
                {status}
             </div>
             <div className="text-yellow-400 font-bold text-xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
               PTS: {score}
             </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10 flex-1 overflow-y-auto">
          {nodes.map((node, index) => {
            const isActive = index === currentNode && !gameOver;
            const isCompleted = index < currentNode || gameOver;
            const isLocked = index > currentNode && !gameOver;

            return (
              <div 
                key={node.id}
                className={`p-4 rounded-lg border transition-all duration-500 flex items-center gap-4 relative overflow-hidden
                  ${isActive ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105' : ''}
                  ${isCompleted ? 'bg-green-950/20 border-green-900 opacity-70' : ''}
                  ${isLocked ? 'bg-slate-950 border-slate-800 opacity-40 grayscale' : ''}
                `}
              >
                {/* Icono */}
                <div className="shrink-0 relative z-10">
                  {isCompleted ? <FolderOpen className="text-green-500" size={32} /> : 
                   isActive ? <Download className="text-cyan-400 animate-pulse" size={32} /> :
                   <Lock className="text-slate-500" size={32} />}
                </div>

                {/* Info */}
                <div className="flex-1 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {node.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] bg-cyan-900 px-2 py-1 rounded text-cyan-200 border border-cyan-700 animate-pulse">
                        DECRIPTANDO...
                      </span>
                    )}
                  </div>

                  {/* Barra de Progreso del Nivel */}
                  {isActive && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Fuerza Bruta en proceso...</span>
                        <span>{nodeProgress}/{node.required_hacks} Llaves</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                          style={{ width: `${(nodeProgress / node.required_hacks) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {isCompleted && <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1"><FileText size={10}/> DATOS EXFILTRADOS</div>}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pantalla de Victoria */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 flex-col animate-in fade-in duration-1000">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-4 tracking-tighter">SISTEMA VULNERADO</h2>
            <p className="text-slate-400 mb-8">Todos los datos han sido transferidos al servidor remoto.</p>
            <button onClick={restartGame} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all font-bold tracking-wide">
              INICIAR NUEVA OPERACIÓN
            </button>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: LOGS */}
      <div className="w-full md:w-80 bg-black border border-slate-800 rounded-lg p-4 flex flex-col h-64 md:h-auto font-mono text-xs shadow-xl">
        <h3 className="text-slate-500 text-[10px] border-b border-slate-800 pb-2 mb-2 flex items-center gap-2 uppercase tracking-widest">
          <Terminal size={12} /> Network_Logs
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`p-2 border-l-2 rounded bg-opacity-10 ${
                msg.type === 'success' ? 'border-green-500 text-green-400 bg-green-900' :
                msg.type === 'error' ? 'border-red-500 text-red-400 bg-red-900' :
                'border-cyan-500 text-cyan-300 bg-cyan-900'
              }`}
            >
              <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}