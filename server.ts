import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

interface PeerSession {
  ws: WebSocket;
  id: string;
  name: string;
  deviceType: string;
  isSender: boolean;
  joinedAt: number;
}

// In-memory room management for WebRTC signaling
const rooms = new Map<string, Map<string, PeerSession>>();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentPeerId: string | null = null;

  ws.on('message', (rawMessage: string | Buffer) => {
    try {
      const msg = JSON.parse(rawMessage.toString());

      switch (msg.type) {
        case 'join': {
          const { roomId, peerId, name, deviceType, isSender } = msg;
          if (!roomId || !peerId) return;

          currentRoomId = roomId;
          currentPeerId = peerId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }

          const room = rooms.get(roomId)!;
          const peerSession: PeerSession = {
            ws,
            id: peerId,
            name: name || `Device-${peerId.slice(-4)}`,
            deviceType: deviceType || 'unknown',
            isSender: !!isSender,
            joinedAt: Date.now(),
          };

          room.set(peerId, peerSession);

          // Return list of other peers already in the room
          const existingPeers = Array.from(room.values())
            .filter((p) => p.id !== peerId)
            .map((p) => ({
              id: p.id,
              name: p.name,
              deviceType: p.deviceType,
              isSender: p.isSender,
            }));

          ws.send(
            JSON.stringify({
              type: 'joined_room',
              roomId,
              peerId,
              peers: existingPeers,
            })
          );

          // Broadcast to everyone else in this room that a new peer arrived
          const peerJoinedMsg = JSON.stringify({
            type: 'peer_joined',
            peer: {
              id: peerId,
              name: peerSession.name,
              deviceType: peerSession.deviceType,
              isSender: peerSession.isSender,
            },
          });

          for (const [id, peer] of room.entries()) {
            if (id !== peerId && peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(peerJoinedMsg);
            }
          }
          break;
        }

        case 'signal': {
          // Direct WebRTC signaling relay (offer / answer / ice)
          const { targetPeerId, payload, signalType } = msg;
          if (!currentRoomId || !rooms.has(currentRoomId) || !targetPeerId) return;

          const room = rooms.get(currentRoomId)!;
          const target = room.get(targetPeerId);

          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(
              JSON.stringify({
                type: 'signal',
                fromPeerId: currentPeerId,
                signalType,
                payload,
              })
            );
          }
          break;
        }

        case 'transfer_status': {
          // Broadcast progress or transfer completion status inside room
          if (!currentRoomId || !rooms.has(currentRoomId)) return;
          const room = rooms.get(currentRoomId)!;
          const broadcastMsg = JSON.stringify({
            type: 'transfer_status',
            fromPeerId: currentPeerId,
            data: msg.data,
          });
          for (const [id, peer] of room.entries()) {
            if (id !== currentPeerId && peer.ws.readyState === WebSocket.OPEN) {
              peer.ws.send(broadcastMsg);
            }
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing signaling message:', err);
    }
  });

  const cleanup = () => {
    if (currentRoomId && currentPeerId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId)!;
      room.delete(currentPeerId);

      // Notify remaining peers
      const leaveMsg = JSON.stringify({
        type: 'peer_left',
        peerId: currentPeerId,
      });

      for (const peer of room.values()) {
        if (peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(leaveMsg);
        }
      }

      if (room.size === 0) {
        rooms.delete(currentRoomId);
      }
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// REST endpoint to query room metadata
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.json({ exists: false, peerCount: 0 });
  }
  return res.json({
    exists: true,
    peerCount: room.size,
    peers: Array.from(room.values()).map((p) => ({
      id: p.id,
      name: p.name,
      deviceType: p.deviceType,
      isSender: p.isSender,
    })),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: Date.now(),
  });
});

// Mount Vite or serve static build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`BeamDrop server running on http://localhost:${port}`);
  });
}

startServer();
