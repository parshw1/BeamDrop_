/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalingClient } from './services/signaling';
import { WebRTCEngine } from './services/webrtcEngine';
import {
  BatchOfferPayload,
  FileItem,
  PeerInfo,
  ReceivedFile,
  TransferProgress,
} from './types';
import { generatePeerId, generatePeerName, generateRoomId, getDeviceType } from './utils/device';
import { Header } from './components/Header';
import { RoomCreateJoin } from './components/RoomCreateJoin';
import { PeerGrid } from './components/PeerGrid';
import { FileDropzone } from './components/FileDropzone';
import { ActiveTransfers } from './components/ActiveTransfers';
import { ReceivedFiles } from './components/ReceivedFiles';
import { QRCodeModal } from './components/QRCodeModal';
import { QRScannerModal } from './components/QRScannerModal';
import { BatchOfferModal } from './components/BatchOfferModal';
import { CodeArchitectureViewer } from './components/CodeArchitectureViewer';

export default function App() {
  // Device & Profile
  const [deviceType] = useState(() => getDeviceType());
  const [peerId] = useState(() => generatePeerId());
  const [peerName, setPeerName] = useState(() => {
    const saved = localStorage.getItem('beamdrop_peer_name');
    return saved || generatePeerName(getDeviceType());
  });

  // Room & Network State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>([]);
  const [isSender, setIsSender] = useState(false);

  // Transfers & Files
  const [stagedFiles, setStagedFiles] = useState<FileItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [incomingOffer, setIncomingOffer] = useState<BatchOfferPayload | null>(null);
  const [autoAccept, setAutoAccept] = useState(() => {
    return localStorage.getItem('beamdrop_auto_accept') === 'true';
  });

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

  // Refs for persistent service instances
  const signalingRef = useRef<SignalingClient | null>(null);
  const engineRef = useRef<WebRTCEngine | null>(null);

  // Initialize and sync Signaling & WebRTC Engine
  const initServices = useCallback(() => {
    if (!signalingRef.current) {
      const signaling = new SignalingClient(peerId, peerName, deviceType, isSender);
      const engine = new WebRTCEngine(signaling, peerId, peerName);
      engine.autoAcceptFiles = autoAccept;

      // Signaling event handlers
      signaling.onConnectionChange = (connected) => {
        setIsSignalingConnected(connected);
      };

      signaling.onJoinedRoom = (room, existingPeers) => {
        setRoomId(room);
        setPeers(existingPeers);
        // Automatically select all joined peers as recipients
        setSelectedPeerIds(existingPeers.map((p) => p.id));

        // As a new peer joining, initiate WebRTC connection with existing peers
        existingPeers.forEach((p) => {
          engine.connectToPeer(p.id, true);
        });
      };

      signaling.onPeerJoined = (newPeer) => {
        setPeers((prev) => {
          const filtered = prev.filter((p) => p.id !== newPeer.id);
          return [...filtered, newPeer];
        });
        setSelectedPeerIds((prev) => [...new Set([...prev, newPeer.id])]);
      };

      signaling.onPeerLeft = (leftPeerId) => {
        setPeers((prev) => prev.filter((p) => p.id !== leftPeerId));
        setSelectedPeerIds((prev) => prev.filter((id) => id !== leftPeerId));
      };

      // WebRTC Engine event handlers
      engine.onPeerStatusChange = (pid, state, isDirect) => {
        setPeers((prev) =>
          prev.map((p) =>
            p.id === pid
              ? {
                  ...p,
                  connectionState: state,
                  isDirectP2P: isDirect,
                }
              : p
          )
        );
      };

      engine.onBatchOfferReceived = (offer) => {
        setIncomingOffer(offer);
      };

      engine.onTransferProgress = (progress) => {
        setTransfers((prev) => {
          const idx = prev.findIndex((t) => t.id === progress.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = progress;
            return next;
          }
          return [progress, ...prev];
        });
      };

      engine.onFileReceived = (received) => {
        setReceivedFiles((prev) => [received, ...prev]);
      };

      signalingRef.current = signaling;
      engineRef.current = engine;
    }
  }, [peerId, peerName, deviceType, isSender, autoAccept]);

  useEffect(() => {
    initServices();
    return () => {
      signalingRef.current?.disconnect();
      engineRef.current?.cleanup();
    };
  }, [initServices]);

  // Sync autoAccept preference with engine and storage
  const handleToggleAutoAccept = () => {
    const nextVal = !autoAccept;
    setAutoAccept(nextVal);
    localStorage.setItem('beamdrop_auto_accept', String(nextVal));
    if (engineRef.current) {
      engineRef.current.autoAcceptFiles = nextVal;
    }
  };

  // Check URL query parameters for ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      const cleanRoom = roomParam.trim().toUpperCase();
      handleJoinRoom(cleanRoom, false);
    }
  }, []);

  // Room Actions
  const handleCreateRoom = () => {
    const newRoom = generateRoomId();
    setIsSender(true);
    setRoomId(newRoom);
    window.history.pushState({}, '', `?room=${newRoom}`);

    if (signalingRef.current) {
      signalingRef.current.connect(newRoom);
    }
    // Automatically pop up the QR code so people next to the user can immediately scan
    setIsQrModalOpen(true);
  };

  const handleJoinRoom = (targetRoomId: string, openQR = false) => {
    const cleanRoom = targetRoomId.trim().toUpperCase();
    setIsSender(false);
    setRoomId(cleanRoom);
    window.history.pushState({}, '', `?room=${cleanRoom}`);

    if (signalingRef.current) {
      signalingRef.current.connect(cleanRoom);
    }
    if (openQR) {
      setIsQrModalOpen(true);
    }
  };

  const handleLeaveRoom = () => {
    signalingRef.current?.disconnect();
    engineRef.current?.cleanup();
    setRoomId(null);
    setPeers([]);
    setSelectedPeerIds([]);
    setStagedFiles([]);
    setTransfers([]);
    window.history.pushState({}, '', window.location.pathname);
    initServices();
  };

  // Peer Selection
  const handleTogglePeerSelect = (targetPeerId: string) => {
    setSelectedPeerIds((prev) =>
      prev.includes(targetPeerId)
        ? prev.filter((id) => id !== targetPeerId)
        : [...prev, targetPeerId]
    );
  };

  const handleSelectAllPeers = () => {
    const otherPeerIds = peers.filter((p) => p.id !== peerId).map((p) => p.id);
    if (selectedPeerIds.length === otherPeerIds.length) {
      setSelectedPeerIds([]);
    } else {
      setSelectedPeerIds(otherPeerIds);
    }
  };

  // File Staging
  const handleAddFiles = (newFiles: File[]) => {
    const formatted: FileItem[] = newFiles.map((f) => ({
      id: 'file_' + Math.random().toString(36).slice(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      lastModified: f.lastModified,
    }));
    setStagedFiles((prev) => [...prev, ...formatted]);
  };

  const handleRemoveFile = (fileId: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleClearFiles = () => {
    setStagedFiles([]);
  };

  // Send Files to Peers via WebRTC
  const handleSendFiles = async () => {
    if (stagedFiles.length === 0 || selectedPeerIds.length === 0 || isSending) return;
    if (!engineRef.current) return;

    try {
      setIsSending(true);

      // 1. Send Batch Offer Handshake to target peers
      const batchId = await engineRef.current.sendBatchOffer(selectedPeerIds, stagedFiles);

      // 2. Stream files in chunks with backpressure
      await engineRef.current.sendFilesToPeers(selectedPeerIds, stagedFiles, batchId);
    } catch (err) {
      console.error('Error during file transfer:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Incoming Batch Acceptance
  const handleAcceptBatch = (batchId: string, rememberAutoAccept: boolean) => {
    if (rememberAutoAccept) {
      setAutoAccept(true);
      localStorage.setItem('beamdrop_auto_accept', 'true');
      if (engineRef.current) {
        engineRef.current.autoAcceptFiles = true;
      }
    }
    if (incomingOffer && engineRef.current) {
      engineRef.current.respondToBatchOffer(incomingOffer.senderPeerId, batchId, true);
    }
    setIncomingOffer(null);
  };

  const handleDeclineBatch = (batchId: string) => {
    if (incomingOffer && engineRef.current) {
      engineRef.current.respondToBatchOffer(incomingOffer.senderPeerId, batchId, false);
    }
    setIncomingOffer(null);
  };

  const handleCancelTransfer = (fileId: string) => {
    engineRef.current?.cancelTransfer(fileId);
    setTransfers((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, status: 'canceled' } : t))
    );
  };

  const handleClearReceived = () => {
    setReceivedFiles([]);
  };

  const otherPeers = peers.filter((p) => p.id !== peerId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        roomId={roomId}
        isConnected={isSignalingConnected}
        connectedPeerCount={otherPeers.length}
        autoAccept={autoAccept}
        onToggleAutoAccept={handleToggleAutoAccept}
        onOpenQR={() => setIsQrModalOpen(true)}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        onLeaveRoom={roomId ? handleLeaveRoom : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!roomId ? (
          /* Landing Screen: Create or Join Room */
          <RoomCreateJoin
            onCreateRoom={handleCreateRoom}
            onJoinRoom={(id) => handleJoinRoom(id)}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
          />
        ) : (
          /* Active Room View */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Peers Grid (Smart Multi-Device Display) */}
            <PeerGrid
              myPeerId={peerId}
              myPeerName={peerName}
              peers={peers}
              selectedPeerIds={selectedPeerIds}
              onTogglePeerSelect={handleTogglePeerSelect}
              onSelectAllPeers={handleSelectAllPeers}
              isSender={isSender}
              onOpenQR={() => setIsQrModalOpen(true)}
            />

            {/* Active Transfers in Progress */}
            <ActiveTransfers
              transfers={transfers}
              onCancelTransfer={handleCancelTransfer}
            />

            {/* Received Files Gallery */}
            <ReceivedFiles
              files={receivedFiles}
              onClearAll={handleClearReceived}
            />

            {/* Transfer Panels: File Dropzone (Sender) */}
            <div className="grid grid-cols-1 gap-6">
              <FileDropzone
                files={stagedFiles}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onClearFiles={handleClearFiles}
                onSendFiles={handleSendFiles}
                isSending={isSending}
                selectedPeersCount={selectedPeerIds.length}
                totalPeersCount={otherPeers.length}
                onOpenQR={() => setIsQrModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>BeamDrop — Ephemeral WebRTC P2P Transfer</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Local Gigabit Speeds</span>
            <span>•</span>
            <span>Zero Cloud Storage</span>
            <span>•</span>
            <button
              onClick={() => setIsCodeViewerOpen(true)}
              className="hover:text-cyan-400 underline transition-colors"
            >
              View Protocol Code
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      {roomId && (
        <QRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          roomId={roomId}
        />
      )}

      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={(code) => {
          // If code is a URL, extract ?room=XYZ
          if (code.includes('?room=')) {
            const match = code.match(/room=([A-Za-z0-9]+)/);
            if (match && match[1]) {
              handleJoinRoom(match[1].toUpperCase());
              return;
            }
          }
          handleJoinRoom(code.toUpperCase());
        }}
      />

      <BatchOfferModal
        offer={incomingOffer}
        onAccept={handleAcceptBatch}
        onDecline={handleDeclineBatch}
      />

      <CodeArchitectureViewer
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
    </div>
  );
}
