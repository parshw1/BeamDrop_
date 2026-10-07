import React, { useState } from 'react';
import {
  Radio,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Smartphone,
  Laptop,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface RoomCreateJoinProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onOpenScanner: () => void;
  onOpenCodeViewer: () => void;
}

export const RoomCreateJoin: React.FC<RoomCreateJoinProps> = ({
  onCreateRoom,
  onJoinRoom,
  onOpenScanner,
  onOpenCodeViewer,
}) => {
  const [inputRoomId, setInputRoomId] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      onJoinRoom(inputRoomId.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
      {/* Hero Badge */}
      <div className="flex flex-col items-center text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-5 shadow-inner">
          <Flame className="w-3.5 h-3.5 text-cyan-400" />
          <span>Zero Cloud Upload • 100% Peer-to-Peer WebRTC</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          The fastest temporary file-sharing room for people{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            sitting next to each other.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Create an instant room, scan the QR code from your phone or laptop, and beam 20+
          files directly between devices over local WebRTC at full Wi-Fi speeds.
        </p>

        {/* Quick flow steps preview */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Create Room
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Scan QR
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Select 20 Files
          </span>
          <span className="text-slate-600">→</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Direct Transfer
          </span>
        </div>
      </div>

      {/* Main Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Create Room (Sender) */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>

            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Sender Flow
            </span>
            <h2 className="text-xl font-bold text-white mt-1 mb-2">
              Create a Temporary Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Generate an instant QR code. Anyone sitting around you can point their camera to
              connect and receive files.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={onCreateRoom}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-cyan-500/30"
            >
              <span>Create Room & Get QR Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Join Room (Receiver) */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
              <QrCode className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Receiver Flow
            </span>
            <h2 className="text-xl font-bold text-white mt-1 mb-2">
              Join an Existing Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Scan the sender's QR code with your camera or enter the 6-character room code.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char code (e.g. 7K4MZP)"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm font-mono tracking-wider text-white uppercase placeholder:text-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputRoomId.trim()}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onOpenScanner}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR with Camera</span>
            </button>

            <button
              onClick={onOpenCodeViewer}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Inspect Protocol Code
            </button>
          </div>
        </div>
      </div>

      {/* Feature pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Direct Local Speeds</div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              Local ICE host candidates connect peer-to-peer at full Wi-Fi speeds without cloud upload bottlenecks.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Multi-Device Transfer</div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              One sender can broadcast batches of 20+ files to 5–10 devices simultaneously in parallel data channels.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Zero Cloud Storage</div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
              No server holds your data. Encrypted end-to-end via WebRTC DTLS and held only in browser memory.
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Device Compatibility Pill */}
      <div className="mt-8 text-center flex items-center justify-center gap-3 text-xs text-slate-400">
        <Laptop className="w-4 h-4 text-slate-400" />
        <span>Works seamlessly across Mac, Windows, iPhone, Android, and Linux</span>
        <Smartphone className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
};
