'use client';

import { useState, useEffect, useRef } from 'react';

// Arte ASCII tipo "Neofetch"
const NEOFETCH_ART = [
  "                   -`                    root@arch-cyber-deck",
  "                  .o+`                   --------------------",
  "                 `ooo/                   OS: Arch Linux x86_64",
  "                `+oooo:                  Host: HackBook Pro",
  "               `+oooooo:                 Kernel: 5.15.0-ARCH",
  "               -+oooooo+:                Uptime: 42 mins",
  "             `/:-:++oooo+:               Shell: zsh 5.9",
  "            `/++++/+++++++:              Resolution: 1920x1080",
  "           `/++++++++++++++:             DE: Hyperland",
  "          `/+++ooooooooooooo/`           Terminal: Websocket-TTY",
  "         ./ooosssso++osssssso+`          CPU: Intel i9-9900K (16) @ 5.0GHz",
  "        .oossssso-````/ossssss+`         GPU: NVIDIA GeForce RTX 3080",
  "       -osssssso.      :ssssssso.        Memory: 1024MiB / 32GiB",
  "      :osssssss/        osssso+++.       ",
  "     /ossssssss/        +ssssooo/-       ",
  "   `/ossssso+/:-        -:/+osssso+-     ",
  "  `+sso+:-`                 `.-/+oso:    ",
  " `++:.                           `.-/++/   ",
  " .`                                 `/   "
];

const INITIAL_LOGS = [
    ...NEOFETCH_ART, 
    '', 
    'Initializing connection to mainframe...', 
    'Established. Waiting for encryption keys...'
];

export default function HackerPage() {
  // Iniciamos directamente con el arte
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('OFFLINE');
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Función para limpiar pantalla respetando el arte
  const resetTerminal = () => {
      setHistory([...NEOFETCH_ART, '', '>>> SYSTEM REBOOT SEQUENCE INITIATED...', '>>> MEMORY CLEARED.', '']);
  };

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws/hacker');

    ws.current.onopen = () => {
      setStatus('ONLINE');
      // Al conectar cargamos el Neofetch inicial
      setHistory(INITIAL_LOGS);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // LOGICA DE AUTO-LIMPIEZA AL REINICIAR
      // Si el mensaje dice "REINICIANDO", limpiamos la terminal
      if (data.message && typeof data.message === 'string' && data.message.includes('REINICIANDO SISTEMA')) {
          resetTerminal();
          return; // No imprimimos el mensaje viejo, ya pusimos el de reboot
      }

      const prefix = data.type === 'puzzle' ? '>>> [TARGET_SYSTEM]: ' : '[KERNEL]: ';
      addLog(`${prefix}${data.message}`);
    };

    ws.current.onclose = () => {
      setStatus('OFFLINE');
      addLog('[ERROR]: Connection reset by peer.');
    };

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addLog = (msg: string) => {
    setHistory((prev) => [...prev, msg]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;

    // COMANDO CLEAR MANUAL
    if (input.trim() === 'clear') {
        // Mantenemos el Neofetch limpio
        setHistory([...NEOFETCH_ART, '', 'Console cleared.', '']);
        setInput('');
        return; // No enviamos 'clear' al servidor, es un comando local
    }

    setHistory(prev => [...prev, `[root@arch-cyber-deck ~]# ${input}`]);
    
    const payload = { type: 'chat', message: input };
    ws.current.send(JSON.stringify(payload));
    
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a9b1d6] font-mono p-4 text-sm md:text-base selection:bg-[#f7768e] selection:text-white">
      {/* Barra superior */}
      <div className="fixed top-0 left-0 w-full bg-[#1a1b26] border-b border-[#24283b] p-2 flex justify-between items-center z-10 px-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f5f]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="text-xs text-[#565f89]">root@arch-cyber-deck: ~ (zsh)</div>
        <div className={`text-xs font-bold ${status === 'ONLINE' ? 'text-[#9ece6a]' : 'text-[#f7768e]'}`}>
          {status}
        </div>
      </div>

      {/* Terminal */}
      <div className="mt-12 mb-16 space-y-1">
        {history.map((line, i) => (
          <div key={i} className="break-words whitespace-pre-wrap leading-tight">
            {line.includes('root@') ? (
               <span className="text-[#7aa2f7]">{line}</span>
            ) : line.includes('TARGET_SYSTEM') ? (
               <span className="text-[#e0af68] font-bold">{line}</span>
            ) : line.includes('ERROR') ? (
               <span className="text-[#f7768e]">{line}</span>
            ) : (
               <span>{line}</span>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 w-full bg-[#0f0f0f]/90 backdrop-blur p-4 border-t border-[#24283b] flex gap-2 items-center">
        <span className="text-[#7aa2f7] font-bold">[root@arch-cyber-deck ~]#</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#c0caf5] placeholder-slate-600 focus:ring-0"
          placeholder="./execute_hack.sh (Type 'clear' to clean)"
          autoFocus
          autoComplete="off"
        />
      </form>
    </div>
  );
}