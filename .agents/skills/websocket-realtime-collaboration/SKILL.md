---
name: websocket-realtime-collaboration
description: Real-time multi-user collaboration using WebSockets, heartbeat pings, reconnect backoff, and state synchronization.
---

# WebSocket Real-Time Collaboration

## Overview
Powers collaborative canvasing, document co-editing, and live chat with resilient WebSocket architectures.

## Best Practices
- **Heartbeat & Pings**: Send application-level ping/pong every 30s to detect broken TCP sockets.
- **Exponential Reconnect Jitter**: Prevent thundering herd re-connections after server restarts.
- **Binary Protocols**: Use Protobuf or MessagePack instead of JSON for high-frequency cursor coordinates.
