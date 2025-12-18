---
title: ipcMain.handle 和 ipcMain.on 的区别？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  对比 ipcMain.handle 和 ipcMain.on 两种消息处理方式的差异，理解何时使用哪种模式。
tags:
  - Electron
  - IPC
  - ipcMain
  - 消息处理
estimatedTime: 8 分钟
keywords:
  - ipcMain.handle
  - ipcMain.on
  - 请求响应
highlight: handle 用于请求-响应模式，on 用于单向消息或需要手动回复的场景
order: 87
---

## 问题 1：两者的基本区别是什么？

### ipcMain.on

用于监听单向消息，不直接返回结果：

```javascript
// 主进程
ipcMain.on("log-message", (event, message) => {
  console.log(message);
  // 没有返回值
  // 如果需要回复，要手动发送
  event.sender.send("log-response", "received");
});

// 渲染进程
ipcRenderer.send("log-message", "hello");
// 需要单独监听回复
ipcRenderer.on("log-response", (event, response) => {
  console.log(response);
});
```

### ipcMain.handle

用于处理请求-响应模式，自动返回结果：

```javascript
// 主进程
ipcMain.handle("get-data", async (event, id) => {
  const data = await fetchData(id);
  return data; // 直接返回，会作为 Promise 结果
});

// 渲染进程
const data = await ipcRenderer.invoke("get-data", 123);
// 直接得到结果，无需额外监听
```

---

## 问题 2：什么时候用 handle，什么时候用 on？

### 使用 handle 的场景

**需要获取返回值的请求**：

```javascript
// 读取文件
ipcMain.handle("read-file", async (event, path) => {
  return await fs.promises.readFile(path, "utf-8");
});

// 数据库查询
ipcMain.handle("query-users", async (event, filter) => {
  return await db.users.find(filter);
});

// 打开对话框
ipcMain.handle("show-open-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result.filePaths;
});
```

### 使用 on 的场景

**单向通知，不需要返回值**：

```javascript
// 日志记录
ipcMain.on("log", (event, level, message) => {
  logger[level](message);
});

// 状态更新
ipcMain.on("update-badge", (event, count) => {
  app.setBadgeCount(count);
});

// 窗口操作
ipcMain.on("minimize-window", (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize();
});
```

**需要多次回复的场景**：

```javascript
// 进度通知
ipcMain.on("start-download", (event, url) => {
  const downloader = new Downloader(url);

  downloader.on("progress", (percent) => {
    // 多次发送进度
    event.sender.send("download-progress", percent);
  });

  downloader.on("complete", (file) => {
    event.sender.send("download-complete", file);
  });
});
```

---

## 问题 3：两者的技术差异是什么？

### 返回值处理

```javascript
// ipcMain.on - 无返回值机制
ipcMain.on("channel", (event, data) => {
  return "result"; // 这个返回值会被忽略
});

// ipcMain.handle - 返回值会传回渲染进程
ipcMain.handle("channel", async (event, data) => {
  return "result"; // 这个会作为 invoke 的结果
});
```

### 错误处理

```javascript
// ipcMain.handle - 错误会传递给渲染进程
ipcMain.handle("may-fail", async () => {
  throw new Error("Something went wrong");
});

// 渲染进程
try {
  await ipcRenderer.invoke("may-fail");
} catch (error) {
  console.log(error.message); // 'Something went wrong'
}

// ipcMain.on - 错误不会自动传递
ipcMain.on("may-fail", (event) => {
  try {
    throw new Error("Something went wrong");
  } catch (error) {
    // 需要手动发送错误
    event.sender.send("error", error.message);
  }
});
```

### 异步支持

```javascript
// ipcMain.handle - 原生支持 async/await
ipcMain.handle("async-task", async (event) => {
  const result = await someAsyncOperation();
  return result;
});

// ipcMain.on - 需要手动处理异步
ipcMain.on("async-task", async (event) => {
  const result = await someAsyncOperation();
  event.sender.send("async-task-result", result);
});
```

---

## 问题 4：如何选择和组合使用？

### 推荐的模式

```javascript
// preload.js - 统一封装
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // 请求-响应：使用 invoke
  getData: (id) => ipcRenderer.invoke("get-data", id),
  saveData: (data) => ipcRenderer.invoke("save-data", data),

  // 单向通知：使用 send
  log: (message) => ipcRenderer.send("log", message),

  // 监听主进程推送
  onUpdate: (callback) => {
    ipcRenderer.on("update", (e, data) => callback(data));
  },
});

// main.js
// 请求处理
ipcMain.handle("get-data", async (event, id) => {
  return await database.get(id);
});

ipcMain.handle("save-data", async (event, data) => {
  await database.save(data);
  return { success: true };
});

// 单向消息
ipcMain.on("log", (event, message) => {
  console.log("[Renderer]", message);
});

// 主动推送
function notifyUpdate(win, data) {
  win.webContents.send("update", data);
}
```

### 对比总结

| 特性     | ipcMain.on | ipcMain.handle |
| -------- | ---------- | -------------- |
| 返回值   | 无         | 有             |
| 配对方法 | send       | invoke         |
| 错误传递 | 手动       | 自动           |
| 异步支持 | 手动       | 原生           |
| 适用场景 | 单向通知   | 请求-响应      |

## 延伸阅读

- [ipcMain API 文档](https://www.electronjs.org/docs/latest/api/ipc-main)
- [IPC 通信模式](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron 最佳实践](https://www.electronjs.org/docs/latest/tutorial/performance)
