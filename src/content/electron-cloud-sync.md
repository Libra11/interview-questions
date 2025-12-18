---
title: 如何让 Electron 与云端系统实时同步？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍 Electron 应用与云端数据实时同步的技术方案，包括 WebSocket、
  轮询、离线优先策略以及冲突解决机制。
tags:
  - Electron
  - 实时同步
  - 云端
  - 数据同步
estimatedTime: 15 分钟
keywords:
  - electron 云端同步
  - 实时数据同步
  - 离线同步
highlight: 掌握 Electron 应用与云端实时同步的实现方案。
order: 319
---

## 问题 1：实时同步有哪些技术方案？

| 方案 | 适用场景 | 特点 |
|------|----------|------|
| WebSocket | 实时性要求高 | 双向通信，低延迟 |
| SSE | 服务端推送 | 单向，简单 |
| 轮询 | 兼容性要求高 | 实现简单，资源消耗大 |

---

## 问题 2：如何实现 WebSocket 同步？

```javascript
class SyncClient {
  constructor(url) {
    this.url = url
    this.handlers = new Map()
  }
  
  connect() {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('同步连接已建立')
      this.sendPendingChanges()
    }
    
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      this.handlers.get(type)?.(data)
    }
    
    this.ws.onclose = () => {
      // 自动重连
      setTimeout(() => this.connect(), 3000)
    }
  }
  
  on(type, handler) {
    this.handlers.set(type, handler)
  }
  
  send(type, data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    } else {
      this.queueChange({ type, data })
    }
  }
}
```

---

## 问题 3：如何实现离线优先策略？

```javascript
class OfflineFirstSync {
  constructor(localDB, syncClient) {
    this.local = localDB
    this.sync = syncClient
    this.pendingChanges = []
  }
  
  async save(data) {
    // 先保存到本地
    const record = { ...data, updatedAt: Date.now(), synced: false }
    await this.local.put(record)
    
    // 尝试同步
    this.queueSync(record)
  }
  
  queueSync(record) {
    this.pendingChanges.push(record)
    this.processSyncQueue()
  }
  
  async processSyncQueue() {
    if (!navigator.onLine || this.syncing) return
    
    this.syncing = true
    
    while (this.pendingChanges.length > 0) {
      const record = this.pendingChanges[0]
      
      try {
        await this.sync.send('update', record)
        await this.local.put({ ...record, synced: true })
        this.pendingChanges.shift()
      } catch (error) {
        break // 等待下次重试
      }
    }
    
    this.syncing = false
  }
}
```

---

## 问题 4：如何解决数据冲突？

```javascript
function resolveConflict(local, remote) {
  // 策略1：最后写入胜出
  if (local.updatedAt > remote.updatedAt) {
    return local
  }
  return remote
  
  // 策略2：合并变更
  // return mergeRecords(local, remote)
  
  // 策略3：用户选择
  // return promptUserToResolve(local, remote)
}

class ConflictResolver {
  constructor(strategy = 'last-write-wins') {
    this.strategy = strategy
  }
  
  resolve(local, remote) {
    switch (this.strategy) {
      case 'last-write-wins':
        return local.updatedAt > remote.updatedAt ? local : remote
      case 'merge':
        return this.merge(local, remote)
      default:
        return remote
    }
  }
  
  merge(local, remote) {
    // 字段级别合并
    return {
      ...remote,
      ...Object.fromEntries(
        Object.entries(local).filter(
          ([key, value]) => local[`${key}UpdatedAt`] > remote[`${key}UpdatedAt`]
        )
      )
    }
  }
}
```

---

## 延伸阅读

- [PouchDB 离线同步](https://pouchdb.com/guides/replication.html)
- [CRDT 冲突解决](https://crdt.tech/)
