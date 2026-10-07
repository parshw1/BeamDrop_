import { SignalingClient } from './signaling';
import {
  BatchOfferPayload,
  BatchResponsePayload,
  FileEndPayload,
  FileItem,
  FileMetaPayload,
  PeerInfo,
  ReceivedFile,
  TransferProgress,
} from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk
const BUFFER_LOW_THRESHOLD = 256 * 1024; // 256 KB threshold for backpressure

interface PeerConnectionData {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  candidateQueue: RTCIceCandidateInit[];
  isDirectP2P?: boolean;
}

interface IncomingFileState {
  meta: FileMetaPayload;
  senderPeerId: string;
  senderName: string;
  chunks: ArrayBuffer[];
  receivedBytes: number;
  lastProgressUpdate: number;
  lastBytesCount: number;
  speedBps: number;
  startTime: number;
}

export class WebRTCEngine {
  private signaling: SignalingClient;
  private myPeerId: string;
  private myPeerName: string;
  private connections = new Map<string, PeerConnectionData>();
  private activeIncomingFiles = new Map<string, IncomingFileState>();
  private canceledTransfers = new Set<string>();

  // Callbacks for UI updates
  public onPeerStatusChange?: (peerId: string, state: PeerInfo['connectionState'], isDirectP2P: boolean) => void;
  public onBatchOfferReceived?: (offer: BatchOfferPayload) => void;
  public onTransferProgress?: (progress: TransferProgress) => void;
  public onFileReceived?: (file: ReceivedFile) => void;
  public autoAcceptFiles = false;

  constructor(signaling: SignalingClient, myPeerId: string, myPeerName: string) {
    this.signaling = signaling;
    this.myPeerId = myPeerId;
    this.myPeerName = myPeerName;
    this.setupSignalingHooks();
  }

  public updateProfile(name: string) {
    this.myPeerName = name;
  }

  private setupSignalingHooks() {
    this.signaling.onSignal = async (fromPeerId, signalType, payload) => {
      await this.handleIncomingSignal(fromPeerId, signalType, payload);
    };

    this.signaling.onPeerLeft = (peerId) => {
      this.closePeerConnection(peerId);
    };
  }

  public async connectToPeer(targetPeerId: string, isInitiator = false) {
    if (this.connections.has(targetPeerId)) {
      return this.connections.get(targetPeerId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const connData: PeerConnectionData = {
      pc,
      candidateQueue: [],
      isDirectP2P: false,
    };
    this.connections.set(targetPeerId, connData);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.signaling.sendSignal(targetPeerId, 'ice', e.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const isDirect = connData.isDirectP2P || false;
      this.onPeerStatusChange?.(targetPeerId, state as any, isDirect);
    };

    // Listen for candidate pair to detect direct LAN connection
    pc.addEventListener('icegatheringstatechange', () => {
      this.checkDirectConnection(targetPeerId, pc);
    });

    if (isInitiator) {
      // Create DataChannel
      const dc = pc.createDataChannel('beamDropChannel', { ordered: true });
      dc.binaryType = 'arraybuffer';
      connData.dc = dc;
      this.setupDataChannel(targetPeerId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signaling.sendSignal(targetPeerId, 'offer', offer);
    } else {
      pc.ondatachannel = (e) => {
        connData.dc = e.channel;
        e.channel.binaryType = 'arraybuffer';
        this.setupDataChannel(targetPeerId, e.channel);
      };
    }

    return connData;
  }

  private async checkDirectConnection(peerId: string, pc: RTCPeerConnection) {
    try {
      const stats = await pc.getStats();
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCand = stats.get(report.localCandidateId);
          const remoteCand = stats.get(report.remoteCandidateId);
          if (localCand?.candidateType === 'host' && remoteCand?.candidateType === 'host') {
            const conn = this.connections.get(peerId);
            if (conn) {
              conn.isDirectP2P = true;
              this.onPeerStatusChange?.(peerId, pc.connectionState as any, true);
            }
          }
        }
      });
    } catch {
      // stats not yet ready
    }
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;

    dc.onopen = () => {
      this.onPeerStatusChange?.(peerId, 'connected', true);
    };

    dc.onclose = () => {
      this.onPeerStatusChange?.(peerId, 'disconnected', false);
    };

    dc.onerror = (err) => {
      console.warn(`DataChannel error with peer ${peerId}:`, err);
    };

    dc.onmessage = (e) => {
      this.handleDataChannelMessage(peerId, e.data);
    };
  }

  private async handleIncomingSignal(fromPeerId: string, signalType: 'offer' | 'answer' | 'ice', payload: any) {
    let conn = this.connections.get(fromPeerId);

    if (signalType === 'offer') {
      if (!conn) {
        conn = await this.connectToPeer(fromPeerId, false);
      }
      const pc = conn.pc;
      await pc.setRemoteDescription(new RTCSessionDescription(payload));

      // Flush queued ICE candidates
      while (conn.candidateQueue.length > 0) {
        const c = conn.candidateQueue.shift()!;
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.signaling.sendSignal(fromPeerId, 'answer', answer);
    } else if (signalType === 'answer') {
      if (conn) {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(payload));
        while (conn.candidateQueue.length > 0) {
          const c = conn.candidateQueue.shift()!;
          await conn.pc.addIceCandidate(new RTCIceCandidate(c));
        }
      }
    } else if (signalType === 'ice') {
      if (conn && conn.pc.remoteDescription) {
        await conn.pc.addIceCandidate(new RTCIceCandidate(payload));
      } else if (conn) {
        conn.candidateQueue.push(payload);
      }
    }
  }

  private handleDataChannelMessage(fromPeerId: string, data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);

        switch (msg.type) {
          case 'batch_offer': {
            const offer = msg as BatchOfferPayload;
            if (this.autoAcceptFiles) {
              this.respondToBatchOffer(offer.senderPeerId, offer.batchId, true);
            } else {
              this.onBatchOfferReceived?.(offer);
            }
            break;
          }

          case 'batch_response': {
            const res = msg as BatchResponsePayload;
            this.handleBatchResponse(fromPeerId, res);
            break;
          }

          case 'file_meta': {
            const meta = msg as FileMetaPayload;
            this.handleFileMeta(fromPeerId, meta);
            break;
          }

          case 'file_end': {
            const end = msg as FileEndPayload;
            this.finishIncomingFile(fromPeerId, end.fileId);
            break;
          }

          case 'cancel_transfer': {
            this.canceledTransfers.add(msg.fileId);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse text message from peer:', err);
      }
    } else if (data instanceof ArrayBuffer) {
      // Binary chunk received for active file
      this.handleIncomingChunk(fromPeerId, data);
    }
  }

  // --- Handshake & Batch Operations ---

  public async sendBatchOffer(
    targetPeerIds: string[],
    files: FileItem[]
  ): Promise<string> {
    const batchId = 'batch_' + Math.random().toString(36).slice(2, 9);
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const payload: BatchOfferPayload = {
      type: 'batch_offer',
      batchId,
      senderName: this.myPeerName,
      senderPeerId: this.myPeerId,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      totalSize,
    };

    const offerStr = JSON.stringify(payload);

    for (const peerId of targetPeerIds) {
      const conn = this.connections.get(peerId);
      if (conn?.dc && conn.dc.readyState === 'open') {
        conn.dc.send(offerStr);
      }
    }

    return batchId;
  }

  public respondToBatchOffer(senderPeerId: string, batchId: string, accepted: boolean) {
    const conn = this.connections.get(senderPeerId);
    if (conn?.dc && conn.dc.readyState === 'open') {
      const resp: BatchResponsePayload = {
        type: 'batch_response',
        batchId,
        accepted,
        receiverPeerId: this.myPeerId,
      };
      conn.dc.send(JSON.stringify(resp));
    }
  }

  private pendingBatchResolvers = new Map<string, (accepted: boolean) => void>();

  public waitForBatchResponse(batchId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingBatchResolvers.set(batchId, resolve);
      // Timeout fallback after 45 seconds
      setTimeout(() => {
        if (this.pendingBatchResolvers.has(batchId)) {
          this.pendingBatchResolvers.delete(batchId);
          resolve(false);
        }
      }, 45000);
    });
  }

  private handleBatchResponse(_fromPeerId: string, res: BatchResponsePayload) {
    if (this.pendingBatchResolvers.has(res.batchId)) {
      const resolver = this.pendingBatchResolvers.get(res.batchId)!;
      this.pendingBatchResolvers.delete(res.batchId);
      resolver(res.accepted);
    }
  }

  // --- Multi-Device Streaming with Flow Control ---

  public async sendFilesToPeers(
    targetPeerIds: string[],
    files: FileItem[],
    batchId: string
  ) {
    // Only send to connected peers with open data channel
    const activePeers = targetPeerIds.filter((pid) => {
      const conn = this.connections.get(pid);
      return conn?.dc && conn.dc.readyState === 'open';
    });

    if (activePeers.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (this.canceledTransfers.has(fileItem.id)) continue;

      await this.sendFileToPeers(activePeers, fileItem, batchId);
    }
  }

  private async sendFileToPeers(
    peerIds: string[],
    fileItem: FileItem,
    batchId: string
  ) {
    const { file, id: fileId, name, size, type } = fileItem;
    const totalChunks = Math.ceil(size / CHUNK_SIZE) || 1;

    // Send metadata header to all peers
    const meta: FileMetaPayload = {
      type: 'file_meta',
      batchId,
      fileId,
      name,
      size,
      mimeType: type || 'application/octet-stream',
      totalChunks,
      chunkSize: CHUNK_SIZE,
    };

    const metaStr = JSON.stringify(meta);
    for (const pid of peerIds) {
      const conn = this.connections.get(pid);
      if (conn?.dc && conn.dc.readyState === 'open') {
        conn.dc.send(metaStr);
      }
    }

    let offset = 0;
    let bytesSent = 0;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastBytesSent = 0;

    while (offset < size) {
      if (this.canceledTransfers.has(fileId)) break;

      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();

      // Send chunk to all peers and handle backpressure per peer
      const sendPromises = peerIds.map(async (pid) => {
        const conn = this.connections.get(pid);
        if (!conn?.dc || conn.dc.readyState !== 'open') return;

        const dc = conn.dc;
        if (dc.bufferedAmount > BUFFER_LOW_THRESHOLD) {
          await this.waitForBufferLow(dc);
        }
        try {
          dc.send(buffer);
        } catch (e) {
          console.warn(`Error sending chunk to peer ${pid}:`, e);
        }
      });

      await Promise.all(sendPromises);

      offset += buffer.byteLength;
      bytesSent += buffer.byteLength;

      const now = Date.now();
      if (now - lastProgressTime >= 150 || offset >= size) {
        const timeDiffSec = (now - lastProgressTime) / 1000 || 0.001;
        const speedBps = (bytesSent - lastBytesSent) / timeDiffSec;
        const remainingBytes = size - bytesSent;
        const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : 0;
        const percent = Math.min(100, Math.round((bytesSent / size) * 100));

        peerIds.forEach((pid) => {
          this.onTransferProgress?.({
            id: `out_${fileId}_${pid}`,
            fileId,
            fileName: name,
            fileSize: size,
            mimeType: type,
            direction: 'outgoing',
            peerId: pid,
            peerName: `Peer ${pid.slice(-4)}`,
            bytesTransferred: bytesSent,
            percent,
            speedBps,
            etaSeconds,
            status: percent === 100 ? 'completed' : 'transferring',
            startedAt: startTime,
            completedAt: percent === 100 ? now : undefined,
          });
        });

        lastProgressTime = now;
        lastBytesSent = bytesSent;
      }
    }

    // Send file end signal
    const endStr = JSON.stringify({
      type: 'file_end',
      batchId,
      fileId,
    });

    for (const pid of peerIds) {
      const conn = this.connections.get(pid);
      if (conn?.dc && conn.dc.readyState === 'open') {
        conn.dc.send(endStr);
      }
    }
  }

  private waitForBufferLow(dc: RTCDataChannel): Promise<void> {
    return new Promise((resolve) => {
      const onLow = () => {
        dc.removeEventListener('bufferedamountlow', onLow);
        resolve();
      };
      dc.addEventListener('bufferedamountlow', onLow);
      // Fallback timer if event missed
      setTimeout(() => {
        dc.removeEventListener('bufferedamountlow', onLow);
        resolve();
      }, 500);
    });
  }

  // --- Receiving Logic ---

  private handleFileMeta(senderPeerId: string, meta: FileMetaPayload) {
    const key = `${senderPeerId}_${meta.fileId}`;
    this.activeIncomingFiles.set(key, {
      meta,
      senderPeerId,
      senderName: `Peer ${senderPeerId.slice(-4)}`,
      chunks: [],
      receivedBytes: 0,
      lastProgressUpdate: Date.now(),
      lastBytesCount: 0,
      speedBps: 0,
      startTime: Date.now(),
    });

    this.onTransferProgress?.({
      id: `in_${meta.fileId}`,
      fileId: meta.fileId,
      fileName: meta.name,
      fileSize: meta.size,
      mimeType: meta.mimeType,
      direction: 'incoming',
      peerId: senderPeerId,
      peerName: `Peer ${senderPeerId.slice(-4)}`,
      bytesTransferred: 0,
      percent: 0,
      speedBps: 0,
      etaSeconds: 0,
      status: 'transferring',
      startedAt: Date.now(),
    });
  }

  private handleIncomingChunk(senderPeerId: string, chunk: ArrayBuffer) {
    // Find active incoming file for this sender
    let activeKey: string | null = null;
    let activeFile: IncomingFileState | null = null;

    for (const [key, item] of this.activeIncomingFiles.entries()) {
      if (item.senderPeerId === senderPeerId) {
        activeKey = key;
        activeFile = item;
        break;
      }
    }

    if (!activeFile || !activeKey) return;

    activeFile.chunks.push(chunk);
    activeFile.receivedBytes += chunk.byteLength;

    const now = Date.now();
    if (now - activeFile.lastProgressUpdate >= 150) {
      const timeDiff = (now - activeFile.lastProgressUpdate) / 1000 || 0.001;
      const speedBps = (activeFile.receivedBytes - activeFile.lastBytesCount) / timeDiff;
      const remainingBytes = activeFile.meta.size - activeFile.receivedBytes;
      const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : 0;
      const percent = Math.min(
        100,
        Math.round((activeFile.receivedBytes / (activeFile.meta.size || 1)) * 100)
      );

      this.onTransferProgress?.({
        id: `in_${activeFile.meta.fileId}`,
        fileId: activeFile.meta.fileId,
        fileName: activeFile.meta.name,
        fileSize: activeFile.meta.size,
        mimeType: activeFile.meta.mimeType,
        direction: 'incoming',
        peerId: senderPeerId,
        peerName: activeFile.senderName,
        bytesTransferred: activeFile.receivedBytes,
        percent,
        speedBps,
        etaSeconds,
        status: 'transferring',
        startedAt: activeFile.startTime,
      });

      activeFile.lastProgressUpdate = now;
      activeFile.lastBytesCount = activeFile.receivedBytes;
      activeFile.speedBps = speedBps;
    }
  }

  private finishIncomingFile(senderPeerId: string, fileId: string) {
    const key = `${senderPeerId}_${fileId}`;
    const item = this.activeIncomingFiles.get(key);
    if (!item) return;

    const blob = new Blob(item.chunks, { type: item.meta.mimeType });
    const downloadUrl = URL.createObjectURL(blob);

    const receivedFile: ReceivedFile = {
      id: 'rec_' + Math.random().toString(36).slice(2, 9),
      fileId: item.meta.fileId,
      name: item.meta.name,
      size: item.meta.size,
      type: item.meta.mimeType,
      blob,
      downloadUrl,
      senderId: senderPeerId,
      senderName: item.senderName,
      receivedAt: Date.now(),
    };

    this.onTransferProgress?.({
      id: `in_${item.meta.fileId}`,
      fileId: item.meta.fileId,
      fileName: item.meta.name,
      fileSize: item.meta.size,
      mimeType: item.meta.mimeType,
      direction: 'incoming',
      peerId: senderPeerId,
      peerName: item.senderName,
      bytesTransferred: item.meta.size,
      percent: 100,
      speedBps: 0,
      etaSeconds: 0,
      status: 'completed',
      blob,
      downloadUrl,
      startedAt: item.startTime,
      completedAt: Date.now(),
    });

    this.onFileReceived?.(receivedFile);
    this.activeIncomingFiles.delete(key);
  }

  public cancelTransfer(fileId: string) {
    this.canceledTransfers.add(fileId);
    // Broadcast cancel message to peers
    for (const conn of this.connections.values()) {
      if (conn.dc && conn.dc.readyState === 'open') {
        conn.dc.send(JSON.stringify({ type: 'cancel_transfer', fileId }));
      }
    }
  }

  public closePeerConnection(peerId: string) {
    const conn = this.connections.get(peerId);
    if (conn) {
      if (conn.dc) conn.dc.close();
      conn.pc.close();
      this.connections.delete(peerId);
    }
  }

  public cleanup() {
    for (const [peerId] of this.connections) {
      this.closePeerConnection(peerId);
    }
    this.connections.clear();
    this.activeIncomingFiles.clear();
  }
}
