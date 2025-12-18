---
title: 如何让应用监听目录变化？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中监听文件系统变化的方法，包括使用 Node.js fs.watch 和 chokidar 库。
tags:
  - Electron
  - 文件监听
  - fs.watch
  - chokidar
estimatedTime: 12 分钟
keywords:
  - 目录监听
  - 文件变化
  - watch
highlight: 使用 chokidar 库可以更可靠地跨平台监听文件系统变化
order: 199
---

## 问题 1：如何使用 Node.js 原生 API 监听？

### fs.watch 基本用法

```javascript
// main.js
const fs = require("fs");
const path = require("path");

function watchDirectory(dirPath) {
  const watcher = fs.watch(
    dirPath,
    { recursive: true },
    (eventType, filename) => {
      console.log(`事件类型: ${eventType}`);
      console.log(`文件名: ${filename}`);

      // eventType: 'rename' 或 'change'
      // rename: 文件创建、删除或重命名
      // change: 文件内容修改
    }
  );

  watcher.on("error", (error) => {
    console.error("监听错误:", error);
  });

  return watcher;
}

// 使用
const watcher = watchDirectory("/path/to/directory");

// 停止监听
// watcher.close();
```

### fs.watch 的局限性

```javascript
// fs.watch 的问题：
// 1. 不同平台行为不一致
// 2. recursive 选项在某些平台不支持
// 3. 可能触发重复事件
// 4. 无法区分创建和删除

// 需要额外处理
const fs = require("fs");

function watchWithDebounce(dirPath, callback) {
  const pending = new Map();

  const watcher = fs.watch(
    dirPath,
    { recursive: true },
    (eventType, filename) => {
      // 防抖处理
      if (pending.has(filename)) {
        clearTimeout(pending.get(filename));
      }

      pending.set(
        filename,
        setTimeout(() => {
          pending.delete(filename);

          // 检查文件是否存在来区分创建/删除
          const fullPath = path.join(dirPath, filename);
          fs.access(fullPath, (err) => {
            if (err) {
              callback("deleted", filename);
            } else {
              callback(
                eventType === "rename" ? "created" : "changed",
                filename
              );
            }
          });
        }, 100)
      );
    }
  );

  return watcher;
}
```

---

## 问题 2：如何使用 chokidar 监听？

### 安装和基本用法

```bash
npm install chokidar
```

```javascript
// main.js
const chokidar = require("chokidar");

function watchDirectory(dirPath) {
  const watcher = chokidar.watch(dirPath, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    ignoreInitial: true, // 忽略初始扫描事件
    awaitWriteFinish: {
      // 等待写入完成
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  // 监听各种事件
  watcher
    .on("add", (filePath) => {
      console.log(`文件创建: ${filePath}`);
    })
    .on("change", (filePath) => {
      console.log(`文件修改: ${filePath}`);
    })
    .on("unlink", (filePath) => {
      console.log(`文件删除: ${filePath}`);
    })
    .on("addDir", (dirPath) => {
      console.log(`目录创建: ${dirPath}`);
    })
    .on("unlinkDir", (dirPath) => {
      console.log(`目录删除: ${dirPath}`);
    })
    .on("error", (error) => {
      console.error(`监听错误: ${error}`);
    })
    .on("ready", () => {
      console.log("初始扫描完成，开始监听变化");
    });

  return watcher;
}
```

### chokidar 配置选项

```javascript
const watcher = chokidar.watch(dirPath, {
  // 忽略模式
  ignored: [
    /(^|[\/\\])\../, // 隐藏文件
    "**/node_modules/**", // node_modules
    "**/*.log", // 日志文件
  ],

  // 持久监听
  persistent: true,

  // 忽略初始扫描的 add 事件
  ignoreInitial: true,

  // 跟随符号链接
  followSymlinks: true,

  // 监听深度（undefined 表示无限）
  depth: 5,

  // 等待写入完成再触发事件
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },

  // 使用轮询（某些网络文件系统需要）
  usePolling: false,
  interval: 100,

  // 忽略权限错误
  ignorePermissionErrors: true,
});
```

---

## 问题 3：如何通过 IPC 通知渲染进程？

### 主进程

```javascript
// main.js
const chokidar = require("chokidar");
const { ipcMain, BrowserWindow } = require("electron");

class FileWatcher {
  constructor() {
    this.watchers = new Map();
  }

  watch(id, dirPath, win) {
    // 如果已存在，先关闭
    this.unwatch(id);

    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300 },
    });

    watcher
      .on("add", (filePath) => {
        win.webContents.send("file:created", { id, filePath });
      })
      .on("change", (filePath) => {
        win.webContents.send("file:changed", { id, filePath });
      })
      .on("unlink", (filePath) => {
        win.webContents.send("file:deleted", { id, filePath });
      })
      .on("error", (error) => {
        win.webContents.send("file:error", { id, error: error.message });
      });

    this.watchers.set(id, watcher);
    return true;
  }

  unwatch(id) {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.close();
      this.watchers.delete(id);
    }
  }

  unwatchAll() {
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers.clear();
  }
}

const fileWatcher = new FileWatcher();

ipcMain.handle("watcher:start", (event, id, dirPath) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return fileWatcher.watch(id, dirPath, win);
});

ipcMain.handle("watcher:stop", (event, id) => {
  fileWatcher.unwatch(id);
  return true;
});

// 应用退出时清理
app.on("will-quit", () => {
  fileWatcher.unwatchAll();
});
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fileWatcher", {
  start: (id, dirPath) => ipcRenderer.invoke("watcher:start", id, dirPath),
  stop: (id) => ipcRenderer.invoke("watcher:stop", id),

  onCreated: (callback) => {
    ipcRenderer.on("file:created", (event, data) => callback(data));
  },
  onChanged: (callback) => {
    ipcRenderer.on("file:changed", (event, data) => callback(data));
  },
  onDeleted: (callback) => {
    ipcRenderer.on("file:deleted", (event, data) => callback(data));
  },
  onError: (callback) => {
    ipcRenderer.on("file:error", (event, data) => callback(data));
  },
});
```

### 渲染进程

```javascript
// renderer.js

// 设置监听器
window.fileWatcher.onCreated(({ id, filePath }) => {
  console.log(`[${id}] 文件创建:`, filePath);
  refreshFileList();
});

window.fileWatcher.onChanged(({ id, filePath }) => {
  console.log(`[${id}] 文件修改:`, filePath);
  if (isCurrentFile(filePath)) {
    promptReload();
  }
});

window.fileWatcher.onDeleted(({ id, filePath }) => {
  console.log(`[${id}] 文件删除:`, filePath);
  refreshFileList();
});

// 开始监听
async function watchProject(projectPath) {
  await window.fileWatcher.start("project", projectPath);
}

// 停止监听
async function unwatchProject() {
  await window.fileWatcher.stop("project");
}
```

---

## 问题 4：如何处理大量文件变化？

### 批量处理

```javascript
class BatchedFileWatcher {
  constructor(dirPath, onBatch, options = {}) {
    this.batchDelay = options.batchDelay || 500;
    this.changes = new Map();
    this.timeout = null;
    this.onBatch = onBatch;

    this.watcher = chokidar.watch(dirPath, {
      ignored: options.ignored,
      ignoreInitial: true,
    });

    this.watcher
      .on("add", (path) => this.addChange("add", path))
      .on("change", (path) => this.addChange("change", path))
      .on("unlink", (path) => this.addChange("unlink", path));
  }

  addChange(type, filePath) {
    this.changes.set(filePath, { type, path: filePath, time: Date.now() });

    // 重置定时器
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  flush() {
    if (this.changes.size === 0) return;

    const batch = Array.from(this.changes.values());
    this.changes.clear();

    this.onBatch(batch);
  }

  close() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.watcher.close();
  }
}

// 使用
const watcher = new BatchedFileWatcher("/path/to/dir", (changes) => {
  console.log(`批量处理 ${changes.length} 个变化`);

  const added = changes.filter((c) => c.type === "add");
  const changed = changes.filter((c) => c.type === "change");
  const deleted = changes.filter((c) => c.type === "unlink");

  if (added.length)
    console.log(
      "新增:",
      added.map((c) => c.path)
    );
  if (changed.length)
    console.log(
      "修改:",
      changed.map((c) => c.path)
    );
  if (deleted.length)
    console.log(
      "删除:",
      deleted.map((c) => c.path)
    );
});
```

---

## 问题 5：注意事项

### 资源管理

```javascript
// 确保在不需要时关闭监听器
class WatcherManager {
  constructor() {
    this.watchers = new Map();
  }

  add(id, watcher) {
    this.close(id); // 关闭已存在的
    this.watchers.set(id, watcher);
  }

  close(id) {
    const watcher = this.watchers.get(id);
    if (watcher) {
      watcher.close();
      this.watchers.delete(id);
    }
  }

  closeAll() {
    this.watchers.forEach((w) => w.close());
    this.watchers.clear();
  }
}

// 窗口关闭时清理
win.on("closed", () => {
  watcherManager.closeAll();
});
```

### 性能考虑

```javascript
// 限制监听深度
const watcher = chokidar.watch(dirPath, {
  depth: 3, // 只监听 3 层深度
});

// 忽略不必要的文件
const watcher = chokidar.watch(dirPath, {
  ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/*.log"],
});
```

## 延伸阅读

- [chokidar 文档](https://github.com/paulmillr/chokidar)
- [Node.js fs.watch](https://nodejs.org/api/fs.html#fswatchfilename-options-listener)
- [文件系统事件处理](https://www.electronjs.org/docs/latest/tutorial/native-file-drag-drop)
