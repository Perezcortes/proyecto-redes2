'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, FolderOpen, Lock, Terminal, Radio, AlertTriangle, Clock, Activity, Heart, Skull } from 'lucide-react';

type GameLog = { text: string; type: 'success' | 'info' | 'error' };
type Node = { id: number; name: string; required_hacks: number };

export default function SpyPage() {
  const [messages, setMessages] = useState<GameLog[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentNode, setCurrentNode] = useState(0);
  const [nodeProgress, setNodeProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('DESCONECTADO');
  const [currentIntel, setCurrentIntel] = useState<string>('Esperando enlace...');
  
  const [timeLeft, setTimeLeft] = useState(300);
  // Nuevo estado para las vidas
  const [lives, setLives] = useState(3);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (ws.current !== null) return;
    // LOCALHOST (Para desarrollo local):
    ws.current = new WebSocket('ws://localhost:8000/ws/spy');
    
    // AHORA (Pon la IP real ):
    //ws.current = new WebSocket('ws://192.168.1.50:8000/ws/spy');
    
    ws.current.onopen = () => {
        setStatus('EN LÍNEA');
        setMessages(p => [{ text: "Enlace C&C establecido.", type: 'info' }, ...p]);
    };
    
    ws.current.onclose = () => setStatus('DESCONECTADO');

    ws.current.onmessage = (event) => {
      try {
          const data = JSON.parse(event.data);

          if (data.type === 'state') {
            setNodes(data.map);
            setNodeProgress(data.nodeProgress);
            setScore(data.score);
            setGameOver(data.gameOver);
            if (data.currentIntel) setCurrentIntel(data.currentIntel);
            setCurrentNode(data.currentNode);
            if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
            // Actualizar vidas
            if (data.lives !== undefined) setLives(data.lives);
          
          } else if (data.type === 'timer') {
             setTimeLeft(data.time);

          } else {
            setMessages(prev => [{ text: data.message, type: data.type }, ...prev].slice(0, 50));
          }
      } catch (e) {
          console.error(e);
      }
    };
    
    return () => { ws.current?.close(); ws.current = null; };
  }, []);

  const restartGame = () => {
    ws.current?.send(JSON.stringify({ type: 'restart' }));
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-500 font-mono p-4 flex flex-col gap-4 relative max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-4 rounded border border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-cyan-400 w-8 h-8" /> 
            <div>
                <h1 className="font-bold tracking-widest text-xl text-white">OPERACIÓN: FINAL COUNTDOWN</h1>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'EN LÍNEA' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {status}
                </div>
            </div>
          </div>

          {/* CRONÓMETRO Y VIDAS */}
          <div className="flex items-center gap-6">
              {/* Vidas */}
              <div className="flex gap-1 items-center bg-slate-950 px-4 py-2 rounded border border-red-900/30">
                  <span className="text-xs text-red-400 mr-2 font-bold tracking-wider">VIDAS</span>
                  {[...Array(3)].map((_, i) => (
                      <Heart 
                          key={i} 
                          size={24} 
                          className={`transition-all duration-300 ${i < lives ? 'fill-red-600 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'fill-none text-slate-800'}`}
                      />
                  ))}
              </div>

              {/* Reloj */}
              <div className={`text-4xl md:text-5xl font-black font-mono px-6 py-2 rounded border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-4
                ${timeLeft < 60 ? 'text-red-500 border-red-600 bg-red-950/30 animate-pulse' : 'text-cyan-400 border-cyan-800 bg-slate-950'}
              `}>
                 <Clock size={32} className={timeLeft < 60 ? 'animate-spin' : ''} />
                 {formatTime(timeLeft)}
              </div>
          </div>

          <div className="text-right">
             <div className="text-xs text-slate-400 uppercase tracking-widest">Puntaje</div>
             <div className="text-yellow-400 font-bold text-3xl drop-shadow-md">
               {score.toString().padStart(5, '0')}
             </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: PISTA Y MAPA */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            
            <div className="bg-amber-950/20 border-l-4 border-amber-500 rounded p-5 relative shadow-lg animate-in slide-in-from-left">
                <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold uppercase tracking-widest text-sm">
                    <Radio size={18} className="animate-pulse"/> Transmisión de Inteligencia
                </div>
                <div className="text-xl md:text-2xl text-amber-100 font-bold leading-snug drop-shadow-sm">
                    {currentIntel}
                </div>
                 <p className="text-amber-500/60 text-xs mt-3 flex items-center gap-1">
                    <AlertTriangle size={12}/> Comunique esta información al agente de campo inmediatamente.
                 </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
                {nodes.map((node, index) => {
                    const isActive = index === currentNode && !gameOver;
                    const isCompleted = index < currentNode || gameOver;
                    return (
                    <div key={node.id} className={`p-4 rounded border transition-all flex items-center gap-4
                        ${isActive ? 'bg-cyan-950/40 border-cyan-500/50 scale-[1.02] shadow-lg' : 'border-transparent bg-slate-950/50'}
                        ${isCompleted ? 'opacity-50 grayscale' : ''}
                    `}>
                        <div className="shrink-0">
                            {isCompleted ? <FolderOpen className="text-green-500"/> : 
                             isActive ? <Activity className="text-cyan-400 animate-pulse"/> : <Lock className="text-slate-600"/>}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{node.name}</span>
                                {isActive && <span className="text-[10px] bg-cyan-900 text-cyan-200 px-2 rounded">EN PROGRESO</span>}
                            </div>
                            {isActive && (
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-cyan-400 h-full transition-all duration-500" 
                                         style={{ width: `${(nodeProgress / node.required_hacks) * 100}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>

        {/* COLUMNA DERECHA: LOGS */}
        <div className="w-full md:w-80 bg-black border border-slate-800 rounded flex flex-col font-mono text-xs h-64 md:h-auto shadow-2xl">
            <div className="bg-slate-900 p-2 border-b border-slate-800 text-slate-400 flex gap-2 items-center">
                <Terminal size={14}/> REGISTRO DEL SISTEMA
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col-reverse custom-scrollbar">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-2 border-l-2 rounded bg-white/5 
                        ${msg.type === 'error' ? 'border-red-500 text-red-400' : 
                          msg.type === 'success' ? 'border-green-500 text-green-400' : 'border-cyan-500 text-cyan-300'}
                    `}>
                        <span className="opacity-50 text-[10px] block mb-1">{new Date().toLocaleTimeString()}</span>
                        {msg.text}
                    </div>
                ))}
            </div>
        </div>
      </div>

       {/* PANTALLA DE GAME OVER / VICTORIA */}
       {gameOver && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 flex-col animate-in zoom-in duration-300 backdrop-blur-sm">
            
            {/* LÓGICA DE DERROTA (CALAVERA) O VICTORIA */}
            {(lives <= 0 || timeLeft <= 0) ? (
                // PANTALLA DE DERROTA
                <div className="flex flex-col items-center">
                    <Skull size={120} className="text-red-600 mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(220,38,38,0.6)]" />
                    <h2 className="text-6xl font-black mb-2 tracking-tighter text-red-600 border-b-4 border-red-800 pb-2">
                        MISIÓN PERDIDA
                    </h2>
                    <p className="text-red-400 text-xl font-mono mb-8 uppercase tracking-widest">
                        {lives <= 0 ? "AGENTE ELIMINADO EN COMBATE" : "TIEMPO LÍMITE EXCEDIDO"}
                    </p>
                </div>
            ) : (
                // PANTALLA DE VICTORIA
                <div className="flex flex-col items-center">
                    <Shield size={120} className="text-green-500 mb-6 drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]" />
                    <h2 className="text-6xl font-black mb-2 tracking-tighter text-green-500 border-b-4 border-green-800 pb-2">
                        MISIÓN CUMPLIDA
                    </h2>
                    <p className="text-green-400 text-xl font-mono mb-8 uppercase tracking-widest">
                        SISTEMA VULNERADO EXITOSAMENTE
                    </p>
                </div>
            )}

            <div className="text-2xl text-white mb-8 font-mono bg-white/10 px-6 py-2 rounded">
                PUNTAJE FINAL: <span className="text-yellow-400 font-bold">{score}</span>
            </div>
            
            <button onClick={restartGame} className="bg-white hover:bg-slate-200 text-black px-10 py-4 rounded font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              REINICIAR OPERACIÓN
            </button>
          </div>
        )}
    </div>
  );
}