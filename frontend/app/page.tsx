// frontend/app/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Terminal, Info, Users, X } from 'lucide-react';

export default function Home() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-24 text-white relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      </div>

      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          CYBER-OPERACIÓN
        </h1>
        <p className="text-center mb-12 text-slate-400 text-lg">
          Simulador de Infiltración Cooperativa v1.0
        </p>

        {/* Botones de Selección de Rol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link href="/hacker" className="group">
            <div className="border border-green-500/30 bg-green-950/10 p-10 rounded-xl hover:bg-green-900/20 hover:border-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] transition-all cursor-pointer h-full flex flex-col items-center">
              <Terminal className="w-16 h-16 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold text-green-400 mb-2">OPERADOR HACKER</h2>
              <p className="text-center text-slate-400">
                Interfaz de terminal. Desencriptación y soporte remoto.
              </p>
            </div>
          </Link>

          <Link href="/spy" className="group">
            <div className="border border-cyan-500/30 bg-cyan-950/10 p-10 rounded-xl hover:bg-cyan-900/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all cursor-pointer h-full flex flex-col items-center">
              <Shield className="w-16 h-16 text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">AGENTE DE CAMPO</h2>
              <p className="text-center text-slate-400">
                Interfaz visual. Infiltración y ejecución física.
              </p>
            </div>
          </Link>
        </div>

        {/* Botones de Menú Inferior (Requisito PDF) */}
        <div className="flex justify-center gap-6">
          <button 
            onClick={() => setShowInstructions(true)}
            className="flex items-center gap-2 px-6 py-2 border border-slate-600 rounded hover:bg-slate-800 transition-colors"
          >
            <Info size={18} /> Instrucciones
          </button>
          <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 px-6 py-2 border border-slate-600 rounded hover:bg-slate-800 transition-colors"
          >
            <Users size={18} /> Acerca de
          </button>
        </div>
      </div>

      {/* Modal: Instrucciones */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-600 p-8 rounded-lg max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setShowInstructions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-4 text-cyan-400">Misión: Protocolo Cooperativo</h3>
            <ul className="space-y-3 text-slate-300 list-disc pl-5">
              <li>El juego requiere <strong className="text-white">2 jugadores</strong> conectados simultáneamente.</li>
              <li><strong className="text-green-400">Hacker:</strong> Resuelve acertijos matemáticos y lógicos en su terminal para desbloquear la seguridad.</li>
              <li><strong className="text-cyan-400">Agente:</strong> Solicita códigos de acceso y avanza físicamente por los niveles.</li>
              <li>Trabajen en equipo. La comunicación es vital.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Acerca de (Requisito PDF) */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-600 p-8 rounded-lg max-w-md w-full relative shadow-2xl text-center">
            <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-2 text-white">Cyber-Operación</h3>
            <p className="text-slate-400 text-sm mb-6">Versión 1.0.0 (Build 2025)</p>
            <div className="border-t border-slate-700 pt-4">
              <p className="text-slate-300 font-bold mb-1">Desarrollado por:</p>
              <p className="text-cyan-400 text-lg">Team Pro</p>
              <p className="text-slate-500 text-xs mt-4">Proyecto Ordinario - Redes de Computadoras II</p>
              <p className="text-slate-500 text-xs">Universidad Tecnológica de la Mixteca</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}