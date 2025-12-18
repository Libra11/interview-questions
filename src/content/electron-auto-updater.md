---
title: autoUpdater 如何工作？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron autoUpdater 的工作原理，包括更新检查、下载和安装流程。
tags:
  - Electron
  - 自动更新
  - autoUpdater
  - 应用分发
estimatedTime: 12 分钟
keywords:
  - autoUpdater
  - 自动更新
  - 应用更新
highlight: autoUpdater 通过检查远程服务器的版本信息，自动下载并安装更新
order: 235
---

## 问题 1：autoUpdater 的基本原理

### 更新流程

```
1. 检查更新 → 请求服务器获取最新版本信息
2. 发现更新 → 比较版本号
3. 下载更新 → 下载新版本安装包
4. 安装更新 → 替换旧版本文件
5. 重启应用 → 启动新版本
```

### 平台差异

```
macOS: 使用 Squirrel.Mac
  - 下载 .zip 文件
  - 解压替换 .app

Windows: 使用 Squirrel.Windows 或 NSIS
  - 下载 .exe 或 .nupkg
  - 静默安装

Linux: 需要手动处理
  - 下载 AppImage/deb/rpm
  - 用户手动安装
```

---

## 问题 2：如何使用 electron-updater？

### 安装

```bash
npm install electron-updater
```

### 基本配置

```javascript
// main.js
const { autoUpdater } = require("electron-updater");

app.whenReady().then(() => {
  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();
});

// 监听事件
autoUpdater.on("checking-for-update", () => {
  console.log("检查更新中...");
});

autoUpdater.on("update-available", (info) => {
  console.log("发现新版本:", info.version);
});

autoUpdater.on("update-not-available", () => {
  console.log("当前已是最新版本");
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`下载进度: ${progress.percent}%`);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("更新下载完成");
  // 提示用户重启
  autoUpdater.quitAndInstall();
});

autoUpdater.on("error", (err) => {
  console.error("更新错误:", err);
});
```

---

## 问题 3：如何配置更新服务器？

### electron-builder 配置

```javascript
// package.json 或 electron-builder.json
{
  "build": {
    "publish": [
      {
        "provider": "generic",
        "url": "https://your-server.com/updates"
      }
    ]
  }
}
```

### 服务器文件结构

```
/updates/
├── latest.yml          # 最新版本信息
├── latest-mac.yml      # macOS 版本信息
├── MyApp-1.0.0.exe     # Windows 安装包
├── MyApp-1.0.0.dmg     # macOS 安装包
└── MyApp-1.0.0.AppImage # Linux 安装包
```

### latest.yml 格式

```yaml
version: 1.0.0
files:
  - url: MyApp-1.0.0.exe
    sha512: <hash>
    size: 12345678
path: MyApp-1.0.0.exe
sha512: <hash>
releaseDate: "2025-12-11T00:00:00.000Z"
```

---

## 问题 4：如何实现用户交互？

### 通知用户更新

```javascript
// main.js
const { dialog } = require("electron");

autoUpdater.on("update-available", async (info) => {
  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "发现新版本",
    message: `新版本 ${info.version} 可用，是否下载？`,
    buttons: ["下载", "稍后"],
  });

  if (response === 0) {
    autoUpdater.downloadUpdate();
  }
});

autoUpdater.on("update-downloaded", async () => {
  const { response } = await dialog.showMessageBox({
    type: "info",
    title: "更新就绪",
    message: "更新已下载完成，是否立即重启安装？",
    buttons: ["立即重启", "稍后"],
  });

  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
});
```

### 显示下载进度

```javascript
// 通过 IPC 发送到渲染进程
autoUpdater.on("download-progress", (progress) => {
  mainWindow.webContents.send("update-progress", {
    percent: progress.percent,
    transferred: progress.transferred,
    total: progress.total,
  });
});
```

---

## 问题 5：配置选项

```javascript
const { autoUpdater } = require("electron-updater");

// 配置
autoUpdater.autoDownload = false; // 不自动下载
autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装
autoUpdater.allowDowngrade = false; // 不允许降级

// 设置更新源
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://your-server.com/updates",
});

// 手动检查
async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result.updateInfo;
  } catch (error) {
    console.error("检查更新失败:", error);
    return null;
  }
}
```

## 延伸阅读

- [electron-updater 文档](https://www.electron.build/auto-update)
- [Electron autoUpdater](https://www.electronjs.org/docs/latest/api/auto-updater)
- [发布配置](https://www.electron.build/configuration/publish)
