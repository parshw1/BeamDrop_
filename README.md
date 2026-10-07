BeamDrop: Instant Peer-to-Peer Temporary File Sharing
Built specifically as the fastest temporary file-sharing room for people sitting next to each other, running direct WebRTC peer-to-peer data channels with zero intermediate cloud storage.
Core User Flow & Features
Sender Flow:
Opens the app and clicks "Create Room & Get QR Code".
An ephemeral 6-character room code and sharp QR code are generated instantly.
Stages up to 20+ files (or entire folders) via drag-and-drop or file picker with thumbnail previews and total size calculations.
Clicks "Beam Files" to broadcast to all or selected devices.
Receiver Flow:
Scans the QR code with their phone/laptop camera (or enters the 6-character code, or opens the shared link).
Immediately joins the room; both devices discover each other through local signaling.
Receives an incoming transfer alert with file summary and total size.
Clicks "Accept All" (or toggles Auto-Accept: ON for zero-friction receiving).
Files stream directly into browser memory at local Wi-Fi speeds with live MB/s and ETA meters.
Offers individual file downloads and a "Download All as ZIP" button.
Smart Multi-Device Mesh (5–10 Devices):
The sender maintains parallel WebRTC RTCDataChannel connections.
When sending to multiple nearby phones, tablets, or laptops, chunks stream simultaneously with per-peer flow control.
Security & Local Speed:
Local Wi-Fi Candidate Pairs: ICE negotiates direct host-to-host LAN connections, bypassing WAN speed limits.
Zero Cloud Storage: All payloads are end-to-end encrypted (DTLS/SCTP) and held only in memory.
Backpressure Regulation: Streams in 64 KB slices throttled by bufferedamountlow events to prevent buffer overflows on large transfers.
Structured Code & Architecture Inspector:
Includes a built-in Structured Code viewer in the header and footer to inspect the protocol breakdown, webrtcEngine.ts, and server.ts.
