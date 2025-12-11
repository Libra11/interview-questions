---
title: 如何防止 IPC 被恶意利用？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron IPC 通信的安全风险和防护措施，包括通道白名单、输入验证、来源检查等最佳实践。
tags:
  - Electron
  - IPC
  - 安全
  - 最佳实践
estimatedTime: 12 分钟
keywords:
  - IPC安全
  - 通道白名单
  - 输入验证
highlight: 通过通道白名单、输入验证和来源检查来防止 IPC 被恶意利用
order: 16
---

## 问题 1：IPC 有哪些安全风险？

### 风险 1：暴露过多能力

```javascript
// ❌ 危险：直接暴露 ipcRenderer
contextBridge.exposeInMainWorld("ipc", {
  send: ipcRenderer.send,
  invoke: ipcRenderer.invoke,
  on: ipcRenderer.on,
});

// 恶意脚本可以调用任意通道
window.ipc.invoke("delete-all-files");
window.ipc.invoke("execute-command", "rm -rf /");
```

### 风险 2：缺乏输入验证

```javascript
// ❌ 危险：不验证输入
ipcMain.handle("read-file", async (event, path) => {
  return fs.readFileSync(path, "utf-8"); // 可以读取任意文件
});

// 攻击者可以读取敏感文件
window.api.readFile("/etc/passwd");
window.api.readFile("~/.ssh/id_rsa");
```

### 风险 3：不检查消息来源

```javascript
// ❌ 危险：不验证来源
ipcMain.handle("admin-operation", async (event, data) => {
  // 任何窗口都可以调用
  return performAdminOperation(data);
});
```

---

## 问题 2：如何实现通道白名单？

### 在 preload 中限制通道

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// 定义允许的通道
const ALLOWED_CHANNELS = {
  invoke: ["get-user", "save-document", "show-dialog"],
  send: ["log", "analytics"],
  receive: ["update-available", "notification"],
};

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => {
    if (ALLOWED_CHANNELS.invoke.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Channel "${channel}" is not allowed`);
  },

  send: (channel, ...args) => {
    if (ALLOWED_CHANNELS.send.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`Channel "${channel}" is not allowed`);
    }
  },

  on: (channel, callback) => {
    if (ALLOWED_CHANNELS.receive.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    } else {
      throw new Error(`Channel "${channel}" is not allowed`);
    }
  },
});
```

### 更好的方式：只暴露具体功能

```javascript
// preload.js - 推荐
contextBridge.exposeInMainWorld("api", {
  // 只暴露具体的、受控的功能
  getUser: (id) => ipcRenderer.invoke("get-user", id),
  saveDocument: (doc) => ipcRenderer.invoke("save-document", doc),
  showOpenDialog: () => ipcRenderer.invoke("show-dialog", "open"),

  // 不暴露通用的 invoke/send
});
```

---

## 问题 3：如何验证输入？

### 在主进程中验证

```javascript
// main.js
const path = require("path");
const { app } = require("electron");

ipcMain.handle("read-file", async (event, filename) => {
  // 1. 类型检查
  if (typeof filename !== "string") {
    throw new Error("Filename must be a string");
  }

  // 2. 路径遍历检查
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error("Invalid filename");
  }

  // 3. 限制到安全目录
  const safePath = path.join(app.getPath("userData"), "documents", filename);

  // 4. 验证最终路径仍在安全目录内
  const userDataPath = app.getPath("userData");
  if (!safePath.startsWith(userDataPath)) {
    throw new Error("Access denied");
  }

  return fs.promises.readFile(safePath, "utf-8");
});
```

### 使用 Schema 验证

```javascript
// 使用 zod 或类似库进行验证
const { z } = require("zod");

const SaveDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(1000000),
  tags: z.array(z.string()).max(10).optional(),
});

ipcMain.handle("save-document", async (event, data) => {
  // 验证数据结构
  const validated = SaveDocumentSchema.parse(data);
  return await saveDocument(validated);
});
```

---

## 问题 4：如何检查消息来源？

### 验证发送者

```javascript
ipcMain.handle("sensitive-operation", async (event, data) => {
  const webContents = event.sender;
  const url = webContents.getURL();

  // 只允许本地页面
  if (!url.startsWith("file://") && !url.startsWith("app://")) {
    throw new Error("Unauthorized: remote content cannot access this API");
  }

  // 检查是否是主窗口
  const win = BrowserWindow.fromWebContents(webContents);
  if (win !== mainWindow) {
    throw new Error("Unauthorized: only main window can access this API");
  }

  return performSensitiveOperation(data);
});
```

### 使用 senderFrame 检查

```javascript
ipcMain.handle("admin-action", async (event, data) => {
  const frame = event.senderFrame;

  // 检查 frame 的 URL
  if (!frame.url.startsWith("file://")) {
    throw new Error("Unauthorized");
  }

  // 检查是否是顶级 frame
  if (frame.parent) {
    throw new Error("Cannot be called from iframe");
  }

  return performAdminAction(data);
});
```

---

## 问题 5：完整的安全实践示例

```javascript
// main.js
const { ipcMain, BrowserWindow, app } = require("electron");
const path = require("path");

// 安全的 IPC 处理器
class SecureIPCHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.userDataPath = app.getPath("userData");
  }

  // 验证请求来源
  validateSender(event) {
    const url = event.sender.getURL();
    if (!url.startsWith("file://")) {
      throw new Error("Unauthorized");
    }
  }

  // 验证文件路径
  validateFilePath(filename) {
    if (typeof filename !== "string") {
      throw new Error("Invalid filename");
    }

    // 防止路径遍历
    const safeName = path.basename(filename);
    const fullPath = path.join(this.userDataPath, "documents", safeName);

    if (!fullPath.startsWith(this.userDataPath)) {
      throw new Error("Access denied");
    }

    return fullPath;
  }

  register() {
    ipcMain.handle("read-document", async (event, filename) => {
      this.validateSender(event);
      const safePath = this.validateFilePath(filename);
      return fs.promises.readFile(safePath, "utf-8");
    });

    ipcMain.handle("save-document", async (event, filename, content) => {
      this.validateSender(event);
      const safePath = this.validateFilePath(filename);

      // 验证内容大小
      if (content.length > 10 * 1024 * 1024) {
        throw new Error("Content too large");
      }

      await fs.promises.writeFile(safePath, content);
      return { success: true };
    });
  }
}

// 使用
app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    /* ... */
  });
  const ipcHandler = new SecureIPCHandler(mainWindow);
  ipcHandler.register();
});
```

## 延伸阅读

- [Electron 安全清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [IPC 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [OWASP Electron 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html)
