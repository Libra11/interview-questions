---
title: WebSocket 协议的底层原理是什么
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 WebSocket 协议的工作原理、握手过程和数据帧结构，掌握实时双向通信的实现方法
tags:
  - WebSocket
  - 实时通信
  - 网络协议
  - 双向通信
estimatedTime: 28 分钟
keywords:
  - WebSocket
  - 实时通信
  - 握手协议
  - 数据帧
highlight: WebSocket 通过升级 HTTP 连接实现全双工通信，提供低延迟的实时数据传输
order: 105
---

## 问题 1：什么是 WebSocket？

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，允许服务器主动向客户端推送数据。

### WebSocket vs HTTP

```javascript
// HTTP 的限制
// 1. 单向通信：只能客户端发起请求
客户端 -> 请求 -> 服务器
客户端 <- 响应 <- 服务器

// 2. 无状态：每次请求都是独立的
// 3. 开销大：每次请求都要携带完整的 HTTP 头

// ❌ HTTP 实现实时通信的问题
// 轮询（Polling）
setInterval(() => {
  fetch('/api/messages')  // 每秒请求一次
    .then(res => res.json())
    .then(data => updateUI(data));
}, 1000);

// 问题：
// - 大量无效请求（没有新数据也要请求）
// - 延迟高（最多 1 秒延迟）
// - 服务器压力大

// 长轮询（Long Polling）
async function longPoll() {
  const res = await fetch('/api/messages');  // 服务器有数据才返回
  const data = await res.json();
  updateUI(data);
  longPoll();  // 继续下一次轮询
}

// 问题：
// - 仍然需要频繁建立连接
// - HTTP 头开销大
```

```javascript
// ✅ WebSocket 的优势
// 1. 全双工通信：客户端和服务器可以同时发送数据
客户端 <-> 双向实时通信 <-> 服务器

// 2. 持久连接：一次握手，长期保持连接
// 3. 低延迟：消息即时传递
// 4. 低开销：数据帧头部只有 2-14 字节

const ws = new WebSocket('ws://example.com/socket');

// 发送消息
ws.send('Hello Server');

// 接收消息
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 服务器可以主动推送
// 不需要客户端请求
```

---

## 问题 2：WebSocket 握手过程是怎样的？

WebSocket 通过 HTTP 升级机制建立连接。

### 握手请求

```javascript
// 客户端发起 WebSocket 握手请求
GET /socket HTTP/1.1
Host: example.com
Upgrade: websocket                    // 请求升级协议
Connection: Upgrade                   // 连接升级
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  // 随机密钥
Sec-WebSocket-Version: 13             // WebSocket 版本
Origin: https://example.com           // 来源
Sec-WebSocket-Protocol: chat, superchat  // 子协议（可选）
Sec-WebSocket-Extensions: permessage-deflate  // 扩展（可选）
```

### 握手响应

```javascript
// 服务器响应
HTTP/1.1 101 Switching Protocols      // 101 状态码：切换协议
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=  // 响应密钥
Sec-WebSocket-Protocol: chat          // 选择的子协议
Sec-WebSocket-Extensions: permessage-deflate

// 握手成功后，连接从 HTTP 升级为 WebSocket
// 后续通信使用 WebSocket 协议
```

### 密钥验证

```javascript
// Sec-WebSocket-Accept 的计算过程

// 1. 客户端生成随机密钥
const clientKey = "dGhlIHNhbXBsZSBub25jZQ==";

// 2. 服务器接收密钥，拼接魔术字符串
const magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const combined = clientKey + magicString;
// "dGhlIHNhbXBsZSBub25jZQ==258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

// 3. SHA-1 哈希
const hash = SHA1(combined);

// 4. Base64 编码
const acceptKey = base64Encode(hash);
// "s3pPLMBiTxaQ9kYGzzhZRbK+xOo="

// 5. 服务器返回 acceptKey
// 客户端验证 acceptKey 是否正确

// ✅ 目的：防止缓存代理误认为是 HTTP 响应
```

### Node.js 实现握手

```javascript
const http = require('http');
const crypto = require('crypto');

const server = http.createServer();

server.on('upgrade', (req, socket, head) => {
  // 检查是否是 WebSocket 升级请求
  if (req.headers['upgrade'] !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request');
    return;
  }
  
  // 获取客户端密钥
  const key = req.headers['sec-websocket-key'];
  
  // 计算响应密钥
  const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  const acceptKey = crypto
    .createHash('sha1')
    .update(key + magicString)
    .digest('base64');
  
  // 发送握手响应
  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '',
    ''
  ].join('\r\n');
  
  socket.write(headers);
  
  // 握手完成，开始 WebSocket 通信
  handleWebSocket(socket);
});

server.listen(8080);
```

---

## 问题 3：WebSocket 数据帧结构是什么？

WebSocket 使用二进制帧格式传输数据。

### 数据帧格式

```javascript
// WebSocket 数据帧结构（最小 2 字节）

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+

// 字段说明：
// FIN (1 bit): 是否是最后一个分片
// RSV1-3 (3 bits): 保留位，通常为 0
// opcode (4 bits): 操作码，定义数据类型
// MASK (1 bit): 是否使用掩码（客户端必须为 1）
// Payload len (7 bits): 数据长度
// Masking-key (4 bytes): 掩码密钥（如果 MASK=1）
// Payload Data: 实际数据
```

### 操作码（Opcode）

```javascript
// opcode 定义帧类型
const OPCODES = {
  0x0: 'continuation',  // 继续帧
  0x1: 'text',          // 文本帧
  0x2: 'binary',        // 二进制帧
  0x8: 'close',         // 关闭连接
  0x9: 'ping',          // Ping
  0xA: 'pong'           // Pong
};

// 示例：发送文本消息 "Hello"
{
  FIN: 1,              // 最后一个分片
  opcode: 0x1,         // 文本帧
  MASK: 1,             // 使用掩码
  payload: "Hello"
}

// 示例：发送二进制数据
{
  FIN: 1,
  opcode: 0x2,         // 二进制帧
  MASK: 1,
  payload: new Uint8Array([1, 2, 3, 4])
}

// 示例：Ping/Pong 心跳
// 客户端发送 Ping
{
  FIN: 1,
  opcode: 0x9,         // Ping
  MASK: 1,
  payload: ""
}

// 服务器响应 Pong
{
  FIN: 1,
  opcode: 0xA,         // Pong
  MASK: 0,
  payload: ""
}
```

### 数据掩码

```javascript
// 客户端发送的数据必须使用掩码
// 防止缓存代理误解析

// 掩码过程：
// 1. 生成 4 字节随机掩码密钥
const maskingKey = new Uint8Array(4);
crypto.getRandomValues(maskingKey);

// 2. 对每个字节进行异或操作
function maskData(data, maskingKey) {
  const masked = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    masked[i] = data[i] ^ maskingKey[i % 4];
  }
  return masked;
}

// 示例：
const data = new TextEncoder().encode("Hello");  // [72, 101, 108, 108, 111]
const maskingKey = [1, 2, 3, 4];
const masked = maskData(data, maskingKey);
// [73, 103, 111, 104, 110]

// 3. 服务器使用相同的掩码密钥解码
const unmasked = maskData(masked, maskingKey);
// [72, 101, 108, 108, 111] -> "Hello"

// ⚠️ 服务器发送的数据不使用掩码
```

### 解析数据帧

```javascript
// Node.js 解析 WebSocket 数据帧
function parseFrame(buffer) {
  let offset = 0;
  
  // 第一个字节
  const byte1 = buffer[offset++];
  const fin = (byte1 & 0x80) === 0x80;
  const opcode = byte1 & 0x0F;
  
  // 第二个字节
  const byte2 = buffer[offset++];
  const masked = (byte2 & 0x80) === 0x80;
  let payloadLength = byte2 & 0x7F;
  
  // 扩展长度
  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readBigUInt64BE(offset);
    offset += 8;
  }
  
  // 掩码密钥
  let maskingKey;
  if (masked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  
  // 数据
  let payload = buffer.slice(offset, offset + payloadLength);
  
  // 解码
  if (masked) {
    payload = maskData(payload, maskingKey);
  }
  
  return {
    fin,
    opcode,
    payload: payload.toString()
  };
}
```

---

## 问题 4：WebSocket 的实际应用

### 前端使用

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:8080');

// 连接打开
ws.onopen = () => {
  console.log('WebSocket 连接已建立');
  ws.send('Hello Server');
};

// 接收消息
ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
  
  // 处理不同类型的消息
  try {
    const message = JSON.parse(event.data);
    handleMessage(message);
  } catch (error) {
    // 非 JSON 消息
    console.log('文本消息:', event.data);
  }
};

// 连接关闭
ws.onclose = (event) => {
  console.log('连接已关闭:', event.code, event.reason);
  
  // 重连
  setTimeout(() => {
    reconnect();
  }, 3000);
};

// 连接错误
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};

// 发送不同类型的数据
// 1. 文本
ws.send('Hello');

// 2. JSON
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// 3. 二进制
const buffer = new Uint8Array([1, 2, 3, 4]);
ws.send(buffer);

// 4. Blob
const blob = new Blob(['Hello'], { type: 'text/plain' });
ws.send(blob);

// 关闭连接
ws.close(1000, 'Normal closure');
```

### 服务器端（Node.js + ws 库）

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// 连接建立
wss.on('connection', (ws, req) => {
  console.log('新客户端连接');
  
  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '欢迎连接到 WebSocket 服务器'
  }));
  
  // 接收消息
  ws.on('message', (data) => {
    console.log('收到消息:', data.toString());
    
    // 广播给所有客户端
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
  
  // 连接关闭
  ws.on('close', (code, reason) => {
    console.log('客户端断开:', code, reason.toString());
  });
  
  // 错误处理
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
  
  // Ping/Pong 心跳
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);  // 每 30 秒 ping 一次
  
  ws.on('pong', () => {
    console.log('收到 pong');
  });
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

### 实际应用场景

```javascript
// 1. 实时聊天
class ChatClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.init();
  }
  
  init() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.displayMessage(message);
    };
  }
  
  sendMessage(text) {
    this.ws.send(JSON.stringify({
      type: 'chat',
      user: this.username,
      text: text,
      timestamp: Date.now()
    }));
  }
  
  displayMessage(message) {
    const div = document.createElement('div');
    div.textContent = `${message.user}: ${message.text}`;
    document.getElementById('messages').appendChild(div);
  }
}

// 2. 实时数据推送（股票、加密货币）
class StockTicker {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updatePrice(data);
    };
  }
  
  subscribe(symbol) {
    this.ws.send(JSON.stringify({
      action: 'subscribe',
      symbol: symbol
    }));
  }
  
  updatePrice(data) {
    document.getElementById(`price-${data.symbol}`).textContent = data.price;
  }
}

// 3. 多人协作编辑
class CollaborativeEditor {
  constructor(url, docId) {
    this.ws = new WebSocket(url);
    this.docId = docId;
    this.init();
  }
  
  init() {
    this.ws.onmessage = (event) => {
      const change = JSON.parse(event.data);
      this.applyChange(change);
    };
    
    // 监听本地编辑
    this.editor.on('change', (change) => {
      this.ws.send(JSON.stringify({
        docId: this.docId,
        change: change
      }));
    });
  }
  
  applyChange(change) {
    // 应用远程用户的编辑
    this.editor.applyChange(change);
  }
}

// 4. 在线游戏
class GameClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';  // 使用二进制数据
    
    this.ws.onmessage = (event) => {
      const data = new Uint8Array(event.data);
      this.handleGameState(data);
    };
  }
  
  sendPlayerAction(action) {
    // 发送二进制数据（更高效）
    const buffer = this.encodeAction(action);
    this.ws.send(buffer);
  }
}
```

---

## 总结

**核心概念总结**：

### 1. WebSocket 的特点

- 全双工通信，服务器可主动推送
- 持久连接，低延迟
- 数据帧开销小，高效

### 2. 握手过程

- 通过 HTTP Upgrade 升级协议
- 使用 Sec-WebSocket-Key 验证
- 握手成功后切换到 WebSocket 协议

### 3. 数据帧结构

- 二进制帧格式
- 支持文本、二进制、控制帧
- 客户端数据必须掩码

### 4. 应用场景

- 实时聊天
- 数据推送
- 协作编辑
- 在线游戏

## 延伸阅读

- [RFC 6455 - WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [MDN - WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [WebSocket.org](https://www.websocket.org/)
- [Socket.IO](https://socket.io/) - WebSocket 库
- [ws - Node.js WebSocket library](https://github.com/websockets/ws)
