---
name: network-socket-epoll-io_uring
description: Ultra-high-throughput network event loops using Linux epoll and modern asynchronous io_uring syscalls.
---

# High-Concurrency Network I/O (epoll & io_uring)

## Overview
Enables single-threaded or worker-pool network servers (like NGINX, Redis, Envoy) to handle 1,000,000+ concurrent idle connections without thread-per-connection overhead.
