---
name: web-workers-multithreading
description: Offloading heavy computation from the browser main thread using Web Workers, Comlink, and SharedArrayBuffer.
---

# Web Workers & Browser Multithreading

## Overview
Prevents UI freezing and frame drops during intense data filtering, crypto hashing, or PDF generation by running tasks on background CPU threads.

## Comlink RPC Wrapper
Use Comlink to call worker functions as if they were standard asynchronous local promises without manual `postMessage` boilerplate.
