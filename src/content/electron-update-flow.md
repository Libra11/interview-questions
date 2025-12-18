---
title: 升级流程：下载 → 校验 → 安装 → 重启？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  详解 Electron 应用自动更新的完整流程，包括版本检查、下载、校验、安装和重启各个阶段。
tags:
  - Electron
  - 自动更新
  - 更新流程
  - 应用分发
estimatedTime: 12 分钟
keywords:
  - 更新流程
  - 下载校验
  - 安装重启
highlight: 更新流程包括检查、下载、校验、安装和重启五个阶段，每个阶段都有对应的事件
order: 241
---

## 问题 1：完整的更新流程

### 流程图

```
┌─────────────┐
│  检查更新   │ ← checkForUpdates()
└──────┬──────┘
       ▼
┌─────────────┐
│  发现更新   │ ← update-available 事件
└──────┬──────┘
       ▼
┌─────────────┐
│  下载更新   │ ← downloadUpdate()
└──────┬──────┘
       ▼
┌─────────────┐
│  校验文件   │ ← 自动校验 SHA512
└──────┬──────┘
       ▼
┌─────────────┐
│  下载完成   │ ← update-downloaded 事件
└──────┬──────┘
       ▼
┌─────────────┐
│  安装重启   │ ← quitAndInstall()
└─────────────┘
```

---

## 问题 2：各阶段的实现

### 检查更新

```javascript
const { autoUpdater } = require("electron-updater");

// 手动检查
async function checkUpdate() {
  try {
    const result = await autoUpdater.checkForUpdates();
    console.log("检查结果:", result.updateInfo);
    return result;
  } catch (error) {
    console.error("检查失败:", error);
  }
}

// 定时检查
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60 * 60 * 1000); // 每小时检查
```

### 下载更新

```javascript
autoUpdater.on("update-available", (info) => {
  console.log("发现新版本:", info.version);

  // 自动下载
  autoUpdater.downloadUpdate();

  // 或询问用户
  // dialog.showMessageBox(...)
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`
    下载速度: ${progress.bytesPerSecond} B/s
    进度: ${progress.percent.toFixed(2)}%
    已下载: ${progress.transferred} / ${progress.total}
  `);
});
```

### 校验和安装

```javascript
autoUpdater.on("update-downloaded", (info) => {
  console.log("下载完成，版本:", info.version);
  // SHA512 校验已自动完成

  // 立即安装
  autoUpdater.quitAndInstall();

  // 或延迟安装
  // autoUpdater.autoInstallOnAppQuit = true;
});
```

---

## 问题 3：错误处理

```javascript
autoUpdater.on("error", (error) => {
  console.error("更新错误:", error);

  // 根据错误类型处理
  if (error.message.includes("net::")) {
    // 网络错误
    showNotification("网络连接失败，请检查网络");
  } else if (error.message.includes("sha512")) {
    // 校验失败
    showNotification("文件校验失败，请重试");
  } else {
    showNotification("更新失败: " + error.message);
  }
});
```

---

## 问题 4：用户交互流程

```javascript
// UpdateManager.js
class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupListeners();
  }

  setupListeners() {
    autoUpdater.on("update-available", async (info) => {
      const { response } = await dialog.showMessageBox(this.mainWindow, {
        type: "info",
        title: "发现新版本",
        message: `版本 ${info.version} 可用\n\n更新内容:\n${
          info.releaseNotes || "无"
        }`,
        buttons: ["立即更新", "稍后提醒"],
      });

      if (response === 0) {
        autoUpdater.downloadUpdate();
        this.showProgress();
      }
    });

    autoUpdater.on("update-downloaded", async () => {
      const { response } = await dialog.showMessageBox(this.mainWindow, {
        type: "info",
        title: "更新就绪",
        message: "更新已下载完成，是否立即重启安装？",
        buttons: ["立即重启", "退出时安装"],
      });

      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }

  showProgress() {
    // 发送进度到渲染进程
    autoUpdater.on("download-progress", (progress) => {
      this.mainWindow.webContents.send("update-progress", progress);
    });
  }
}
```

---

## 问题 5：平台差异

### macOS

```javascript
// macOS 更新流程
// 1. 下载 .zip 文件
// 2. 解压到临时目录
// 3. 替换 .app 包
// 4. 重启应用
```

### Windows

```javascript
// Windows 更新流程（NSIS）
// 1. 下载 .exe 安装程序
// 2. 退出应用
// 3. 运行安装程序（静默模式）
// 4. 启动新版本
```

### 处理 Windows 特殊情况

```javascript
// Windows 需要处理 Squirrel 事件
if (process.platform === "win32") {
  const { app } = require("electron");

  if (require("electron-squirrel-startup")) {
    app.quit();
  }
}
```

## 延伸阅读

- [electron-updater 文档](https://www.electron.build/auto-update)
- [Squirrel.Windows](https://github.com/Squirrel/Squirrel.Windows)
- [Squirrel.Mac](https://github.com/Squirrel/Squirrel.Mac)
