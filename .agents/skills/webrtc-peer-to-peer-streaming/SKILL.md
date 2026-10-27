---
name: webrtc-peer-to-peer-streaming
description: Low-latency peer-to-peer video, audio, and data streaming with WebRTC, ICE candidates, and STUN/TURN traversal.
---

# WebRTC Real-Time Streaming & NAT Traversal

## Overview
Enables sub-second bidirectional media streams and data channels directly between browsers without central media proxy servers.

## Connection Lifecycle
1. **Signaling**: Exchange SDP Offer/Answer over WebSockets.
2. **ICE Candidates**: Discover public IP mappings via STUN servers.
3. **TURN Fallback**: Relay encrypted packets if symmetric NAT blocks direct P2P.
4. **DataChannel**: Low-latency, unordered/ordered UDP-like messaging.
