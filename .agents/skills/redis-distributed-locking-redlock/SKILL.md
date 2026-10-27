---
name: redis-distributed-locking-redlock
description: Safe distributed locking across distributed systems using Redis, Redlock algorithm, and fencing tokens.
---

# Distributed Locking with Redis & Redlock

## Overview
Coordinates mutual exclusion across independent worker processes and serverless containers to prevent race conditions during state mutations.

## Safe Lock Rules
1. **Set NX PX**: Always acquire locks atomically with a lease duration (`SET key token NX PX 10000`).
2. **Unique Token per Lock**: Always generate a cryptographically random UUID token to prevent Process A from unlocking Process B's renewed lease.
3. **Fencing Tokens**: Append monotonically increasing sequence numbers to downstream write operations to reject writes from expired lease holders.

## Lua Unlock Script
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```
