import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, ArrowRight } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'beamdrop-qr-reader';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          })
          .catch(() => {});
      }
      return;
    }

    setCameraError(null);

    // Initialize scanner with brief delay to let DOM render
    const timer = setTimeout(() => {
      try {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // Successfully decoded
              html5QrCode
                .stop()
                .then(() => {
                  html5QrCode.clear();
                  scannerRef.current = null;
                  onScanSuccess(decodedText);
                  onClose();
                })
                .catch(() => {
                  onScanSuccess(decodedText);
                  onClose();
                });
            },
            () => {
              // frame scanned without QR, ignore
            }
          )
          .catch((err) => {
            console.warn('Camera scan start failed:', err);
            setCameraError(
              'Camera access was denied or is not supported. You can enter the 6-character room code below!'
            );
          });
      } catch (err: any) {
        setCameraError(err.message || 'Failed to initialize camera scanner.');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, [isOpen, onScanSuccess, onClose]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Scan Sender QR Code</h2>
          <p className="text-xs text-slate-400 mt-1">
            Point camera at the sender's screen to join immediately
          </p>
        </div>

        {/* Video Scanner Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-slate-800 min-h-[260px] flex items-center justify-center">
          <div id={containerId} className="w-full h-full" />
          {cameraError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/95">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Code Input fallback */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2">Or enter 6-character room code:</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={12}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K4MZP"
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm font-mono tracking-wider text-white uppercase placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
