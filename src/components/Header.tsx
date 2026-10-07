import React from 'react';
import { Radio, Wifi, WifiOff, Code2, QrCode, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  roomId: string | null;
  isConnected: boolean;
  connectedPeerCount: number;
  autoAccept: boolean;
  onToggleAutoAccept: () => void;
  onOpenQR?: () => void;
  onOpenCodeViewer: () => void;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  isConnected,
  connectedPeerCount,
  autoAccept,
  onToggleAutoAccept,
  onOpenQR,
  onOpenCodeViewer,
  onLeaveRoom,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                BeamDrop
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                P2P Direct
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Temporary room for devices next to each other
            </p>
          </div>
        </div>

        {/* Room & Status Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          {roomId && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">Room:</span>
              <span className="font-mono font-bold text-sm tracking-wider text-cyan-400">
                {roomId}
              </span>
              {onOpenQR && (
                <button
                  onClick={onOpenQR}
                  title="Show Room QR Code"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Connection Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium hidden md:inline">Online</span>
                {roomId && (
                  <span className="text-slate-400 font-mono pl-1 border-l border-slate-800">
                    {connectedPeerCount} {connectedPeerCount === 1 ? 'peer' : 'peers'}
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-medium">Connecting...</span>
              </>
            )}
          </div>

          {/* Auto-accept Toggle */}
          <button
            onClick={onToggleAutoAccept}
            title={autoAccept ? 'Auto-accepting incoming files' : 'Prompt before accepting files'}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              autoAccept
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${autoAccept ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>Auto-Accept: {autoAccept ? 'ON' : 'OFF'}</span>
          </button>

          {/* Code Architecture Viewer Button */}
          <button
            onClick={onOpenCodeViewer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Structured Code</span>
          </button>

          {/* Leave Room Button */}
          {roomId && onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
