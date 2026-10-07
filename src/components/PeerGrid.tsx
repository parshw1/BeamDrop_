import React from 'react';
import { PeerInfo } from '../types';
import { Laptop, Smartphone, Tablet, Monitor, CheckCircle, Wifi, Users, Shield } from 'lucide-react';

interface PeerGridProps {
  myPeerId: string;
  myPeerName: string;
  peers: PeerInfo[];
  selectedPeerIds: string[];
  onTogglePeerSelect: (peerId: string) => void;
  onSelectAllPeers: () => void;
  isSender: boolean;
  onOpenQR: () => void;
}

export const PeerGrid: React.FC<PeerGridProps> = ({
  myPeerId,
  myPeerName,
  peers,
  selectedPeerIds,
  onTogglePeerSelect,
  onSelectAllPeers,
  isSender: _isSender,
  onOpenQR,
}) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Laptop className="w-5 h-5" />;
    }
  };

  const otherPeers = peers.filter((p) => p.id !== myPeerId);
  const allSelected = otherPeers.length > 0 && otherPeers.every((p) => selectedPeerIds.includes(p.id));

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Nearby Devices in Room</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                {otherPeers.length + 1} connected
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              WebRTC direct mesh — transfer directly to 1 or up to 10 devices at once
            </p>
          </div>
        </div>

        {otherPeers.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAllPeers}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
            >
              {allSelected ? 'Deselect All' : `Select All (${otherPeers.length})`}
            </button>
            <button
              onClick={onOpenQR}
              className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors font-medium"
            >
              + Invite Device
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Current Device (You) */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            You
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-12">
            <div className="text-sm font-semibold text-white truncate">
              {myPeerName}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Host / Active Node</span>
            </div>
          </div>
        </div>

        {/* Other Connected Devices */}
        {otherPeers.map((peer) => {
          const isSelected = selectedPeerIds.includes(peer.id);
          const isConnected = peer.connectionState === 'connected';

          return (
            <div
              key={peer.id}
              onClick={() => onTogglePeerSelect(peer.id)}
              className={`border rounded-xl p-3.5 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden select-none ${
                isSelected
                  ? 'bg-slate-950 border-cyan-500/50 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Checkbox indicator */}
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
              </div>

              {/* Device Icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center shrink-0 border border-slate-800">
                {getDeviceIcon(peer.deviceType)}
              </div>

              {/* Device Details */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {peer.name}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {isConnected ? (peer.isDirectP2P ? 'Direct LAN P2P' : 'WebRTC Connected') : 'Connecting...'}
                  </span>
                </div>
              </div>

              {/* Direct LAN badge */}
              {peer.isDirectP2P && (
                <div
                  title="Direct peer-to-peer data channel on same local network"
                  className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
                >
                  <Wifi className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state prompt to scan/invite */}
        {otherPeers.length === 0 && (
          <div
            onClick={onOpenQR}
            className="sm:col-span-2 border border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex items-center justify-between gap-3 cursor-pointer bg-slate-950/30 hover:bg-slate-950/60 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 group-hover:bg-cyan-500/10 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                  Waiting for people sitting next to you...
                </div>
                <div className="text-xs text-slate-400">
                  Have them scan your QR code or open room link to start transferring
                </div>
              </div>
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 group-hover:bg-cyan-400 transition-colors shrink-0">
              Show QR Code
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>All transfers are encrypted end-to-end via WebRTC DTLS/SCTP</span>
        </div>
        <div>
          {otherPeers.length > 0 ? (
            <span className="text-cyan-400 font-medium">
              {selectedPeerIds.length} of {otherPeers.length} target devices selected
            </span>
          ) : (
            <span>Room ready for 5–10 devices simultaneously</span>
          )}
        </div>
      </div>
    </div>
  );
};
