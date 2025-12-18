---
title: Next.js 中如何实现 WebSocket？
category: Next.js
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js 应用中实现 WebSocket 实时通信，包括使用自定义服务器、第三方服务和 Server-Sent Events 等多种方案。
tags:
  - Next.js
  - WebSocket
  - 实时通信
  - SSE
estimatedTime: 25 分钟
keywords:
  - Next.js WebSocket
  - 实时通信
  - Socket.io
  - Server-Sent Events
highlight: 掌握在 Next.js 中实现实时通信的多种方案和最佳实践
order: 695
---

## 问题 1：Next.js 中 WebSocket 的实现挑战是什么？

Next.js 的 Route Handlers 基于 Web 标准 API，不直接支持 WebSocket 长连接。

### 主要限制

**Route Handlers 的限制**：

- 基于请求-响应模型
- 不支持持久连接
- 无法直接使用 WebSocket API

**解决方案**：

1. 使用自定义 Node.js 服务器
2. 使用第三方实时服务（Pusher、Ably）
3. 使用 Server-Sent Events (SSE)
4. 使用 Socket.io

---

## 问题 2：如何使用自定义服务器实现 WebSocket？

通过自定义 Node.js 服务器可以完全控制 WebSocket 实现。

### 创建自定义服务器

```javascript
// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // 创建 WebSocket 服务器
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (message) => {
      console.log("Received:", message.toString());

      // 广播给所有客户端
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          // OPEN
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });

    // 发送欢迎消息
    ws.send(
      JSON.stringify({ type: "welcome", message: "Connected to WebSocket" })
    );
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### 客户端连接

```typescript
// app/chat/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 连接 WebSocket
    const ws = new WebSocket("ws://localhost:3000/api/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "welcome") {
        console.log(data.message);
      } else {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (wsRef.current && input.trim()) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          text: input,
          timestamp: new Date().toISOString(),
        })
      );
      setInput("");
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div
        style={{
          height: "400px",
          overflow: "auto",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ width: "300px", marginRight: "10px" }}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
}
```

### 更新 package.json

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "ws": "^8.14.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.8"
  }
}
```

---

## 问题 3：如何使用 Socket.io 实现实时通信？

Socket.io 提供了更高级的实时通信功能，包括自动重连、房间等。

### 服务器端设置

```javascript
// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // 创建 Socket.io 服务器
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 加入房间
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);

      // 通知房间内其他用户
      socket.to(roomId).emit("user-joined", socket.id);
    });

    // 接收消息
    socket.on("send-message", ({ roomId, message }) => {
      console.log(`Message in room ${roomId}:`, message);

      // 发送给房间内所有用户（包括发送者）
      io.to(roomId).emit("receive-message", {
        userId: socket.id,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // 离开房间
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user-left", socket.id);
    });

    // 断开连接
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### 客户端使用 Socket.io

```typescript
// app/chat/ChatRoom.tsx
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type Message = {
  userId: string;
  message: string;
  timestamp: string;
};

export default function ChatRoom({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // 连接 Socket.io
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.io");
      setConnected(true);

      // 加入房间
      socketInstance.emit("join-room", roomId);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.io");
      setConnected(false);
    });

    // 接收消息
    socketInstance.on("receive-message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // 用户加入
    socketInstance.on("user-joined", (userId: string) => {
      console.log("User joined:", userId);
    });

    // 用户离开
    socketInstance.on("user-left", (userId: string) => {
      console.log("User left:", userId);
    });

    return () => {
      socketInstance.emit("leave-room", roomId);
      socketInstance.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.emit("send-message", {
        roomId,
        message: input,
      });
      setInput("");
    }
  };

  return (
    <div>
      <h2>Chat Room: {roomId}</h2>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div
        style={{
          height: "400px",
          overflow: "auto",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "8px" }}>
            <strong>{msg.userId}:</strong> {msg.message}
            <span
              style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}
            >
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ width: "300px", marginRight: "10px" }}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
}
```

---

## 问题 4：如何使用 Server-Sent Events (SSE) 实现单向实时通信？

SSE 是一种更简单的实时通信方案，适合服务器到客户端的单向推送。

### SSE Route Handler

```typescript
// app/api/sse/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 创建一个 TransformStream 用于流式响应
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始消息
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "connected",
            time: new Date().toISOString(),
          })}\n\n`
        )
      );

      // 每秒发送一次时间更新
      const interval = setInterval(() => {
        const message = {
          type: "update",
          time: new Date().toISOString(),
          data: Math.random(),
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
        );
      }, 1000);

      // 清理
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### SSE 客户端

```typescript
// app/sse/page.tsx
"use client";

import { useEffect, useState } from "react";

type SSEMessage = {
  type: string;
  time: string;
  data?: number;
};

export default function SSEPage() {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // 创建 EventSource 连接
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => {
      console.log("SSE connected");
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev.slice(-20), data]); // 只保留最近 20 条
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h1>Server-Sent Events Demo</h1>
      <p>Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>

      <div
        style={{
          height: "400px",
          overflow: "auto",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "5px" }}>
            <strong>{msg.type}:</strong> {msg.time}
            {msg.data && ` - Data: ${msg.data.toFixed(4)}`}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 实际应用：实时通知系统

```typescript
// app/api/notifications/route.ts
import { NextRequest } from "next/server";

// 模拟通知队列
const notificationQueue: any[] = [];

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 发送连接确认
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // 定期检查新通知
      const interval = setInterval(() => {
        if (notificationQueue.length > 0) {
          const notification = notificationQueue.shift();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
          );
        }
      }, 1000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// 发送通知的 API
export async function POST(request: NextRequest) {
  const notification = await request.json();
  notificationQueue.push({
    ...notification,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  });

  return Response.json({ success: true });
}
```

## 总结

**核心概念总结**：

### 1. WebSocket 实现方案

- 自定义服务器：完全控制，适合复杂需求
- Socket.io：功能丰富，自动重连和房间支持
- SSE：简单单向推送，适合通知系统

### 2. 方案选择

- 双向通信：使用 WebSocket 或 Socket.io
- 单向推送：使用 SSE
- 简单场景：使用第三方服务（Pusher、Ably）

### 3. 注意事项

- 自定义服务器需要修改启动脚本
- 考虑部署环境的 WebSocket 支持
- 处理连接断开和重连逻辑

## 延伸阅读

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Next.js Custom Server](https://nextjs.org/docs/pages/building-your-application/configuring/custom-server)
