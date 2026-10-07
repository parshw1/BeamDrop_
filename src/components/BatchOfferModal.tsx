import React from 'react';
import { BatchOfferPayload } from '../types';
import { formatBytes } from '../utils/format';
import { DownloadCloud, Check, X, ShieldCheck } from 'lucide-react';

interface BatchOfferModalProps {
  offer: BatchOfferPayload | null;
  onAccept: (batchId: string, rememberAutoAccept: boolean) => void;
  onDecline: (batchId: string) => void;
}

export const BatchOfferModal: React.FC<BatchOfferModalProps> = ({
  offer,
  onAccept,
  onDecline,
}) => {
  const [rememberAuto, setRememberAuto] = React.useState(false);

  if (!offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <DownloadCloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Incoming File Transfer
            </h2>
            <p className="text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold">{offer.senderName}</span> wants to beam files to you
            </p>
          </div>
        </div>

        {/* Transfer Stats */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Files: </span>
            <span className="font-semibold text-white">{offer.files.length}</span>
          </div>
          <div>
            <span className="text-slate-400">Total Size: </span>
            <span className="font-mono font-bold text-cyan-400">{formatBytes(offer.totalSize)}</span>
          </div>
        </div>

        {/* File items list */}
        <div className="max-h-40 overflow-y-auto mb-4 space-y-1.5 pr-1 divide-y divide-slate-800/40">
          {offer.files.map((file) => (
            <div key={file.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 truncate">{file.name}</span>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>

        {/* Auto-accept toggle checkbox */}
        <label className="flex items-center gap-2 mb-5 cursor-pointer text-xs text-slate-300 select-none">
          <input
            type="checkbox"
            checked={rememberAuto}
            onChange={(e) => setRememberAuto(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
          />
          <span>Always auto-accept files from this room</span>
        </label>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onDecline(offer.batchId)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => onAccept(offer.batchId, rememberAuto)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accept All</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Direct P2P transfer over WebRTC</span>
        </div>
      </div>
    </div>
  );
};
