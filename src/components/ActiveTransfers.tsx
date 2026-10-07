import React from 'react';
import { TransferProgress } from '../types';
import { formatBytes, formatDuration, formatSpeed } from '../utils/format';
import { ArrowUpRight, ArrowDownLeft, XCircle, CheckCircle2, Activity } from 'lucide-react';

interface ActiveTransfersProps {
  transfers: TransferProgress[];
  onCancelTransfer: (fileId: string) => void;
}

export const ActiveTransfers: React.FC<ActiveTransfersProps> = ({
  transfers,
  onCancelTransfer,
}) => {
  const activeList = transfers.filter((t) => t.status === 'transferring' || t.status === 'pending');

  if (activeList.length === 0) return null;

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live Transfers in Progress</span>
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                {activeList.length} active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              WebRTC chunk streaming with buffer flow control
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {activeList.map((t) => {
          const isOutgoing = t.direction === 'outgoing';

          return (
            <div
              key={t.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isOutgoing
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isOutgoing ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate max-w-xs">
                      {t.fileName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isOutgoing ? `Sending to ${t.peerName}` : `Receiving from ${t.peerName}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-cyan-400">
                      {t.percent}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {formatSpeed(t.speedBps)}
                    </div>
                  </div>

                  <button
                    onClick={() => onCancelTransfer(t.fileId)}
                    title="Cancel Transfer"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(2, t.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono">
                <div>
                  {formatBytes(t.bytesTransferred)} / {formatBytes(t.fileSize)}
                </div>
                <div>
                  {t.etaSeconds > 0 ? `ETA: ${formatDuration(t.etaSeconds)}` : 'Finalizing...'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
