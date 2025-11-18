---
title: WebSocket 断联后如何重连并保证数据不丢失
category: 网络
difficulty: 高级
updatedAt: 2025-11-18
summary: >-
  深入理解 WebSocket 断线重连机制，掌握心跳检测、消息队列、消息确认等技术，确保实时通信的可靠性
tags:
  - WebSocket
  - 断线重连
  - 心跳检测
  - 消息队列
estimatedTime: 28 分钟
keywords:
  - WebSocket
  - 重连
  - 心跳
  - 消息队列
  - 可靠传输
highlight: 通过心跳检测及时发现断线，使用消息队列和确认机制保证断线期间数据不丢失
order: 94
---

## 问题 1：如何实现自动重连？

### 基础重连机制

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('连接成功');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onclose = () => {
      console.log('连接关闭');
      this.reconnect();
    };
  }
  
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      return;
    }
    
    this.reconnectAttempts++;
    
    // 指数退避算法
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`);
    
    setTimeout(() => this.connect(), delay);
  }
}
```

---

## 问题 2：如何实现心跳检测？

### 心跳机制

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.heartbeatInterval = 30000; // 30秒
    this.missedHeartbeats = 0;
    this.maxMissedHeartbeats = 3;
    this.connect();
  }
  
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        // 发送心跳
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // 等待 pong 响应
        this.pongTimer = setTimeout(() => {
          this.missedHeartbeats++;
          
          if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
            console.warn('心跳超时，主动断开连接');
            this.ws.close();
          }
        }, 5000);
      }
    }, this.heartbeatInterval);
  }
  
  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.pongTimer);
    this.missedHeartbeats = 0;
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('连接成功');
      this.startHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'pong') {
        // 收到心跳响应
        this.missedHeartbeats = 0;
        clearTimeout(this.pongTimer);
      } else {
        this.handleMessage(data);
      }
    };
    
    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.reconnect();
    };
  }
}
```

---

## 问题 3：如何保证消息不丢失？

### 消息队列 + 确认机制

```javascript
class ReliableWebSocket {
  constructor(url) {
    this.url = url;
    this.messageQueue = []; // 待发送队列
    this.pendingMessages = new Map(); // 等待确认的消息
    this.messageId = 0;
    this.connect();
  }
  
  send(data) {
    const message = {
      id: ++this.messageId,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage(message);
    } else {
      // 连接未打开，加入队列
      this.messageQueue.push(message);
      console.log('消息加入队列:', message.id);
    }
  }
  
  sendMessage(message) {
    this.ws.send(JSON.stringify({
      id: message.id,
      data: message.data
    }));
    
    // 加入待确认列表
    this.pendingMessages.set(message.id, message);
    
    // 设置超时重发
    setTimeout(() => {
      if (this.pendingMessages.has(message.id)) {
        console.warn('消息未确认，重发:', message.id);
        message.retries++;
        
        if (message.retries < 3) {
          this.sendMessage(message);
        } else {
          console.error('消息发送失败:', message.id);
          this.pendingMessages.delete(message.id);
        }
      }
    }, 5000);
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('连接成功');
      this.flushQueue();
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'ack') {
        // 收到确认
        this.pendingMessages.delete(data.messageId);
        console.log('消息已确认:', data.messageId);
      } else {
        this.handleMessage(data);
      }
    };
  }
  
  flushQueue() {
    console.log(`发送队列中的 ${this.messageQueue.length} 条消息`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }
}
```

### 服务器端确认

```javascript
// Node.js 服务器
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // 处理业务消息
    handleBusinessLogic(data);
    
    // 发送确认
    ws.send(JSON.stringify({
      type: 'ack',
      messageId: data.id
    }));
  });
});
```

---

## 问题 4：如何持久化消息队列？

### 使用 localStorage

```javascript
class PersistentWebSocket {
  constructor(url) {
    this.url = url;
    this.storageKey = 'ws_message_queue';
    this.loadQueue(); // 从本地存储加载
    this.connect();
  }
  
  send(data) {
    const message = {
      id: ++this.messageId,
      data,
      timestamp: Date.now()
    };
    
    if (this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage(message);
    } else {
      this.messageQueue.push(message);
      this.saveQueue(); // 持久化
    }
  }
  
  saveQueue() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.messageQueue)
      );
    } catch (error) {
      console.error('保存队列失败:', error);
    }
  }
  
  loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      this.messageQueue = saved ? JSON.parse(saved) : [];
      console.log(`从本地加载 ${this.messageQueue.length} 条消息`);
    } catch (error) {
      console.error('加载队列失败:', error);
      this.messageQueue = [];
    }
  }
  
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
    this.saveQueue(); // 更新本地存储
  }
}
```

---

## 总结

**核心要点**：

### 1. 自动重连
- 使用指数退避算法
- 设置最大重连次数
- 连接成功后重置计数

### 2. 心跳检测
- 定期发送 ping 消息
- 等待 pong 响应
- 超时后主动断开连接

### 3. 消息可靠传输
- 消息队列缓存待发送消息
- 消息确认机制（ACK）
- 超时重发机制

### 4. 持久化
- 使用 localStorage 保存队列
- 页面刷新后恢复未发送消息

---

## 延伸阅读

- [MDN - WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [WebSocket 协议规范 RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Socket.IO - 可靠的 WebSocket 库](https://socket.io/)
- [WebSocket 心跳机制](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
