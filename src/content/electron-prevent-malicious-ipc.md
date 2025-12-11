---
title: 如何避免恶意 IPC 调用？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍如何保护 Electron IPC 通信免受恶意调用，包括通道白名单、参数验证和来源检查。
tags:
  - Electron
  - 安全
  - IPC
  - 防护
estimatedTime: 10 分钟
keywords:
  - IPC安全
  - 恶意调用
  - 通道验证
highlight: 使用通道白名单、严格的参数验证和来源检查来保护 IPC 通信
order: 42
---

## 问题 1：IPC 有什么安全风险？

### 危险的 IPC 暴露

```javascript
// ❌ 危险：暴露通用 IPC 能力
contextBridge.exposeInMainWorld("electron", {
  invoke: ipcRenderer.invoke,
  send: ipcRenderer.send,
});

// 恶意代码可以调用任意通道
window.electron.invoke("dangerous-channel", maliciousData);
```

---

## 问题 2：如何实现通道白名单？

### preload 中的白名单

```javascript
// preload.js
const validChannels = {
  invoke: ["file:open", "file:save", "app:getVersion"],
  send: ["log:info", "analytics:event"],
  receive: ["update:available", "notification"],
};

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => {
    if (!validChannels.invoke.includes(channel)) {
      throw new Error(`Channel "${channel}" not allowed`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  send: (channel, ...args) => {
    if (!validChannels.send.includes(channel)) {
      return;
    }
    ipcRenderer.send(channel, ...args);
  },

  on: (channel, callback) => {
    if (!validChannels.receive.includes(channel)) {
      return () => {};
    }
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
});
```

---

## 问题 3：如何验证 IPC 参数？

### 主进程参数验证

```javascript
// main.js
ipcMain.handle("file:save", async (event, filename, content) => {
  // 类型验证
  if (typeof filename !== "string" || typeof content !== "string") {
    throw new Error("Invalid parameter types");
  }

  // 格式验证
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    throw new Error("Invalid filename format");
  }

  // 长度限制
  if (filename.length > 255 || content.length > 10 * 1024 * 1024) {
    throw new Error("Parameter too long");
  }

  // 路径安全
  if (filename.includes("..") || filename.includes("/")) {
    throw new Error("Path traversal detected");
  }

  // 执行操作
  const safePath = path.join(app.getPath("userData"), filename);
  await fs.writeFile(safePath, content);
});
```

### 使用 Schema 验证

```javascript
const Joi = require("joi");

const schemas = {
  "file:save": Joi.object({
    filename: Joi.string()
      .pattern(/^[a-zA-Z0-9_\-\.]+$/)
      .max(255)
      .required(),
    content: Joi.string()
      .max(10 * 1024 * 1024)
      .required(),
  }),
};

ipcMain.handle("file:save", async (event, params) => {
  const { error, value } = schemas["file:save"].validate(params);
  if (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
  // 使用验证后的 value
});
```

---

## 问题 4：如何验证请求来源？

```javascript
// main.js
ipcMain.handle("sensitive:operation", async (event) => {
  // 检查来源 URL
  const senderUrl = event.sender.getURL();

  // 只允许本地文件或特定协议
  if (!senderUrl.startsWith("file://") && !senderUrl.startsWith("app://")) {
    throw new Error("Unauthorized origin");
  }

  // 检查 frame 来源
  const frame = event.senderFrame;
  if (frame.url !== senderUrl) {
    throw new Error("Cross-frame request not allowed");
  }

  // 执行操作
});
```

---

## 问题 5：完整的安全 IPC 封装

```javascript
// secure-ipc.js (主进程)
class SecureIPC {
  constructor() {
    this.handlers = new Map();
  }

  register(channel, schema, handler) {
    this.handlers.set(channel, { schema, handler });

    ipcMain.handle(channel, async (event, params) => {
      // 来源验证
      const url = event.sender.getURL();
      if (!this.isValidOrigin(url)) {
        throw new Error("Unauthorized");
      }

      // 参数验证
      const { schema, handler } = this.handlers.get(channel);
      if (schema) {
        const { error } = schema.validate(params);
        if (error) throw new Error(error.message);
      }

      // 执行处理器
      return handler(event, params);
    });
  }

  isValidOrigin(url) {
    return url.startsWith("file://") || url.startsWith("app://");
  }
}

// 使用
const secureIPC = new SecureIPC();
secureIPC.register("file:open", null, async (event) => {
  return dialog.showOpenDialog({ properties: ["openFile"] });
});
```

## 延伸阅读

- [Electron IPC 安全](https://www.electronjs.org/docs/latest/tutorial/security#17-validate-the-sender-of-all-ipc-messages)
- [Joi 验证库](https://joi.dev/)
