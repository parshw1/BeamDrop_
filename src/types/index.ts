export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface PeerInfo {
  id: string;
  name: string;
  deviceType: DeviceType;
  isSender?: boolean;
  connectionState?: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isDirectP2P?: boolean;
  latencyMs?: number;
}

export interface SignalingMessage {
  type: 'join' | 'joined_room' | 'peer_joined' | 'peer_left' | 'signal' | 'transfer_status' | 'ping' | 'pong';
  roomId?: string;
  peerId?: string;
  name?: string;
  deviceType?: DeviceType;
  isSender?: boolean;
  peers?: PeerInfo[];
  peer?: PeerInfo;
  targetPeerId?: string;
  fromPeerId?: string;
  signalType?: 'offer' | 'answer' | 'ice';
  payload?: any;
  data?: any;
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface BatchOfferPayload {
  type: 'batch_offer';
  batchId: string;
  senderName: string;
  senderPeerId: string;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  totalSize: number;
}

export interface BatchResponsePayload {
  type: 'batch_response';
  batchId: string;
  accepted: boolean;
  receiverPeerId: string;
}

export interface FileMetaPayload {
  type: 'file_meta';
  batchId: string;
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
}

export interface FileEndPayload {
  type: 'file_end';
  batchId: string;
  fileId: string;
}

export interface FileAckPayload {
  type: 'file_ack';
  batchId: string;
  fileId: string;
}

export interface TransferProgress {
  id: string; // transfer id or file id
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: 'outgoing' | 'incoming';
  peerId: string;
  peerName: string;
  bytesTransferred: number;
  percent: number;
  speedBps: number; // bytes per second
  etaSeconds: number;
  status: 'pending' | 'transferring' | 'completed' | 'canceled' | 'error';
  blob?: Blob;
  downloadUrl?: string;
  startedAt: number;
  completedAt?: number;
}

export interface ReceivedFile {
  id: string;
  fileId: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  downloadUrl: string;
  senderId: string;
  senderName: string;
  receivedAt: number;
}
