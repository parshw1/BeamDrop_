import { PeerInfo, SignalingMessage } from '../types';

export type SignalHandler = (fromPeerId: string, signalType: 'offer' | 'answer' | 'ice', payload: any) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private peerId: string;
  private peerName: string;
  private deviceType: string;
  private isSender: boolean;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private isExplicitlyClosed = false;

  public onJoinedRoom?: (roomId: string, peers: PeerInfo[]) => void;
  public onPeerJoined?: (peer: PeerInfo) => void;
  public onPeerLeft?: (peerId: string) => void;
  public onSignal?: SignalHandler;
  public onConnectionChange?: (connected: boolean) => void;

  constructor(peerId: string, peerName: string, deviceType: string, isSender = false) {
    this.peerId = peerId;
    this.peerName = peerName;
    this.deviceType = deviceType;
    this.isSender = isSender;
  }

  public updateProfile(name: string) {
    this.peerName = name;
  }

  public connect(roomId: string) {
    this.roomId = roomId;
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.onConnectionChange?.(true);
        this.startHeartbeat();

        // Send join packet
        this.send({
          type: 'join',
          roomId: this.roomId!,
          peerId: this.peerId,
          name: this.peerName,
          deviceType: this.deviceType as any,
          isSender: this.isSender,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.onConnectionChange?.(false);
        if (!this.isExplicitlyClosed) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.isExplicitlyClosed && this.roomId) {
              this.connect(this.roomId);
            }
          }, 2500);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Signaling WebSocket error:', err);
      };
    } catch (e) {
      console.error('Failed to instantiate WebSocket:', e);
    }
  }

  private handleMessage(msg: SignalingMessage) {
    switch (msg.type) {
      case 'joined_room':
        if (msg.roomId && msg.peers) {
          this.onJoinedRoom?.(msg.roomId, msg.peers);
        }
        break;

      case 'peer_joined':
        if (msg.peer) {
          this.onPeerJoined?.(msg.peer);
        }
        break;

      case 'peer_left':
        if (msg.peerId) {
          this.onPeerLeft?.(msg.peerId);
        }
        break;

      case 'signal':
        if (msg.fromPeerId && msg.signalType && msg.payload) {
          this.onSignal?.(msg.fromPeerId, msg.signalType, msg.payload);
        }
        break;

      case 'pong':
        break;
    }
  }

  public sendSignal(targetPeerId: string, signalType: 'offer' | 'answer' | 'ice', payload: any) {
    this.send({
      type: 'signal',
      targetPeerId,
      signalType,
      payload,
    });
  }

  private send(msg: SignalingMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
