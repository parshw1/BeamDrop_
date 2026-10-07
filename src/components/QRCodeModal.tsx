import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, roomId }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const joinUrl = `${window.location.origin}?room=${roomId}`;

  useEffect(() => {
    if (isOpen && roomId) {
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#f8fafc',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, roomId, joinUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Zap className="w-3.5 h-3.5" /> Instant Join QR
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Scan to Join This Room
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Point camera from nearby phone, tablet, or another laptop
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl shadow-inner border border-slate-200 mx-auto w-fit mb-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for room ${roomId}`}
              className="w-56 h-56 rounded-lg select-none"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
              Generating QR...
            </div>
          )}
        </div>

        {/* Room Code Display */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Room Code</div>
            <div className="font-mono text-xl font-bold tracking-widest text-cyan-400">
              {roomId}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Room Link'}</span>
          </button>

          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Second Window (Test Transfer Now)</span>
          </a>
        </div>

        {/* P2P Notice */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Direct WebRTC P2P • No files ever pass through cloud storage</span>
        </div>
      </div>
    </div>
  );
};
