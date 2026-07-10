'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import io, { Socket } from 'socket.io-client';
import { Activity, ShieldAlert, Globe, Radio } from 'lucide-react';

import GlobeViz from "@/components/GlobeViz";

export interface AttackType {
  id: string;
  timestamp: number;
  isReal: boolean;
  type: string;
  color: string;
  value: number;
  src: { lat: number; lng: number; country: string };
  dst: { lat: number; lng: number; country: string };
}

const ATTACK_TYPES_LEGEND = [
  { type: "UDP Flood ", color: "#ef4444" },      // Red
  { type: "SYN Flood ", color: "#06b6d4" },      // Cyan
  { type: "SQL Injection ", color: "#eab308" },  // Yellow
  { type: "Malware Beacon ", color: "#d946ef" }, // Fuchsia
  { type: "Brute Force", color: "#22c55e" },     // Green
  { type: "Unclassified", color: "#9ca3af" }     // Grey
];

export default function Home() {
  const [attacks, setAttacks] = useState<AttackType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, maxIntensity: 0 });
  const [mounted, setMounted] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);
  const [apiError, setApiError] = useState<{ isError: boolean, countdown: number }>({ isError: false, countdown: 0 });

  const attackBuffer = useRef<AttackType[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (apiError.isError && apiError.countdown > 0) {
      timer = setInterval(() => {
        setApiError(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [apiError.isError, apiError.countdown]);

  const handleToggleMode = () => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_mode');
    }
  };

  useEffect(() => {
    setMounted(true);
    socketRef.current = io('http://localhost:3001');
    const socket = socketRef.current;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('mode_state', (mode: boolean) => setSimulationMode(mode));

    socket.on('api_status', (data: { status: string, nextRetryIn?: number }) => {
      if (data.status === 'error' && data.nextRetryIn) {
        setApiError({ isError: true, countdown: data.nextRetryIn });
      } else if (data.status === 'success') {
        setApiError({ isError: false, countdown: 0 });
      }
    });

    socket.on('attack', (data: AttackType) => {
      attackBuffer.current.push(data);
    });

    const interval = setInterval(() => {
      if (attackBuffer.current.length > 0) {
        const newBatch = [...attackBuffer.current];
        attackBuffer.current = [];

        setAttacks((prev) => {
          const combined = [...prev, ...newBatch];
          return combined.slice(-20);
        });

        setStats(prev => {
          const batchMax = Math.max(...newBatch.map(a => a.value));
          return {
            total: prev.total + newBatch.length,
            maxIntensity: Math.max(prev.maxIntensity, batchMax)
          };
        });
      }
    }, 500);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative w-full h-screen bg-black text-white overflow-hidden font-mono">

      <GlobeViz attacks={attacks} />

      {/* Header / Status */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pb-32">
        <div>
          <h1 className="text-3xl font-bold tracking-[0.2em] uppercase text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center gap-3">
            <Globe className="w-8 h-8 animate-pulse" />
            Cyber Overwatch
          </h1>
          <p className="text-sm text-cyan-800 uppercase tracking-widest mt-1 ml-11">Global Threat Intelligence Platform</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded border border-gray-800 pointer-events-auto">
            <span className={`text-xs font-bold ${!simulationMode ? 'text-cyan-400' : 'text-gray-500'}`}>REAL DATA</span>
            <button
              onClick={handleToggleMode}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${simulationMode ? 'bg-purple-600' : 'bg-cyan-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${simulationMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-bold ${simulationMode ? 'text-purple-400' : 'text-gray-500'}`}>SIMULATED</span>
          </div>

          {/* API Error Warning */}
          {!simulationMode && apiError.isError && (
            <div className="text-[10px] text-red-500 font-bold animate-pulse bg-black/60 px-2 py-1 rounded border border-red-900/50 pointer-events-auto">
              API Fetch Failed. Retrying in {apiError.countdown}s...
            </div>
          )}

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded border border-cyan-900/50 pointer-events-auto">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
            <span className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'FEED LIVE' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="text-xs text-gray-500" suppressHydrationWarning>
            {mounted ? new Date().toLocaleTimeString() : '00:00:00'}
          </div>
        </div>
      </div>

      {/* Stats Panel (LEFT-CENTER) */}
      <div className="absolute top-1/3 left-6 z-10 w-64 pointer-events-none flex flex-col gap-4">
        <div className="bg-black/40 backdrop-blur-md border-l-2 border-cyan-500 p-4">
          <h3 className="text-xs text-cyan-600 uppercase mb-1">Total Threats Detected</h3>
          <p className="text-3xl font-bold text-cyan-100">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md border-l-2 border-purple-500 p-4">
          <h3 className="text-xs text-purple-600 uppercase mb-1">Peak Intensity</h3>
          <p className="text-3xl font-bold text-purple-100">{stats.maxIntensity} <span className="text-sm font-normal text-purple-300">Gbps</span></p>
        </div>
      </div>

      {/* Legend & Logs Stacked (Bottom Right) - FORCED POSITIONING */}
      <div
        className="z-50 pointer-events-none flex flex-col gap-4 items-end"
        style={{ position: 'absolute', bottom: '2rem', right: '2rem', top: 'auto', left: 'auto' }}
      >

        {/* Log / Killfeed */}
        <div className="w-[480px] text-right bg-black/60 backdrop-blur-md p-4 rounded-lg border border-gray-800 shadow-xl">
          <div className={`flex items-center justify-end gap-2 mb-2 border-b border-gray-700 pb-2 ${!simulationMode ? 'text-cyan-400' : 'text-purple-400'}`}>
            <span className="text-xs font-bold uppercase tracking-wider">
              {!simulationMode ? 'Live Threat Feed' : 'Simulated Feed'}
            </span>
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="h-52 overflow-hidden flex flex-col-reverse relative">
            {/* Gradient mask for fade out at top */}
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none"></div>

            {attacks.slice(-8).reverse().map((attack) => (
              <div key={attack.id} className="text-[11px] font-mono mb-2 flex flex-col items-end gap-0.5">
                <div className="text-right">
                  <span className="text-gray-500 mr-2">[{new Date(attack.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded mr-2 ${attack.isReal ? 'bg-cyan-900/50 text-cyan-400' : 'bg-purple-900/50 text-purple-400'}`}>
                    {attack.isReal ? 'REAL' : 'SIM'}
                  </span>
                  <span style={{ color: attack.color }} className="font-bold drop-shadow-[0_0_3px_currentColor]">{attack.type.toUpperCase()}</span>
                </div>
                <span className="text-gray-400 text-[10px]">{attack.src.country} → {attack.dst.country}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-black/60 backdrop-blur-md border border-gray-800 p-3 rounded-lg shadow-xl w-56">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-right tracking-wider">Signatures</h4>
          <div className="flex flex-wrap justify-end gap-x-8 gap-y-1">
            {ATTACK_TYPES_LEGEND.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <span
                  className="text-[10px] uppercase font-bold tracking-wider"
                  style={{ color: item.color, textShadow: `0 0 8px ${item.color}` }}
                >
                  {item.type}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}></span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
