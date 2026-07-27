import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, Cpu, Database, Cloud, Activity, Shield, Globe, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface CloudConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloudConsole: React.FC<CloudConsoleProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<{ id: string; type: 'info' | 'warn' | 'error' | 'success'; message: string; timestamp: string }[]>([]);
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    latency: 0,
    uptime: '00:00:00'
  });

  useEffect(() => {
    if (!isOpen) return;

    // Simulate system stats
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 30) + 5,
        memory: Math.floor(Math.random() * 20) + 40,
        latency: Math.floor(Math.random() * 50) + 10,
        uptime: new Date().toLocaleTimeString()
      });

      // Add random logs
      const types: ('info' | 'warn' | 'error' | 'success')[] = ['info', 'warn', 'error', 'success'];
      const messages = [
        'Cloud synchronization active',
        'Database query optimized',
        'Security handshake successful',
        'WILDCLEINT core heartbeat detected',
        'Neural network weights updated',
        'API endpoint reached',
        'Session state persisted'
      ];

      if (Math.random() > 0.7) {
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          type: types[Math.floor(Math.random() * types.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="w-full max-w-5xl h-[80vh] bg-[#0b0b0c] border border-white/10 rounded-[32px] overflow-hidden flex flex-col relative z-10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Cloud className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">WILDSTAR Cloud Console</h2>
              <p className="text-xs text-white/40 font-mono">v3.1.0-stable // ACTIVE_SESSION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <div className="w-5 h-0.5 bg-white/60 rotate-45 absolute" />
            <div className="w-5 h-0.5 bg-white/60 -rotate-45 absolute" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar Stats */}
          <div className="w-full md:w-72 border-r border-white/5 p-6 space-y-6 bg-black/20">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">System Health</h3>
              
              <StatItem icon={<Cpu size={14} />} label="CPU Usage" value={`${systemStats.cpu}%`} color="text-blue-400" />
              <StatItem icon={<Activity size={14} />} label="Memory" value={`${systemStats.memory}%`} color="text-purple-400" />
              <StatItem icon={<Zap size={14} />} label="Latency" value={`${systemStats.latency}ms`} color="text-yellow-400" />
              <StatItem icon={<Shield size={14} />} label="Security" value="ENCRYPTED" color="text-green-400" />
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Cloud Infrastructure</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Database size={18} className="text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white">Firestore</p>
                  <p className="text-[10px] text-green-400">CONNECTED</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Globe size={18} className="text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-white">Edge Network</p>
                  <p className="text-[10px] text-green-400">OPTIMIZED</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal / Logs */}
          <div className="flex-1 flex flex-col bg-black/40">
            <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/20">
              <Terminal size={14} className="text-white/40" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">System Logs</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar">
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-white/20">
                  <p>Initializing cloud stream...</p>
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                  <span className={cn(
                    "font-bold shrink-0 w-16",
                    log.type === 'info' && "text-blue-400",
                    log.type === 'warn' && "text-yellow-400",
                    log.type === 'error' && "text-red-400",
                    log.type === 'success' && "text-green-400"
                  )}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-white/70">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 uppercase">Cloud Sync: Active</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-[10px] font-mono text-white/40 uppercase">Uptime: {systemStats.uptime}</span>
          </div>
          <span className="text-[10px] font-mono text-white/20">WILDSTAR_OS // BUILD_2026.03.25</span>
        </div>
      </div>
    </motion.div>
  );
};

const StatItem = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-white/60">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className={cn("text-xs font-bold font-mono", color)}>{value}</span>
  </div>
);

export default CloudConsole;
