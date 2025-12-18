---
title: 如何在 Windows 中创建通知？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 在 Windows 系统中创建原生通知的方法，包括基本通知、交互式通知和通知中心集成。
tags:
  - Electron
  - 通知
  - Windows
  - Notification
estimatedTime: 10 分钟
keywords:
  - Windows通知
  - Notification
  - 系统通知
highlight: 使用 Electron 的 Notification API 创建跨平台原生通知
order: 179
---

## 问题 1：如何创建基本通知？

### 使用 Notification API

```javascript
const { Notification } = require("electron");

// 检查是否支持通知
if (Notification.isSupported()) {
  const notification = new Notification({
    title: "新消息",
    body: "你有一条新消息，点击查看详情",
    icon: path.join(__dirname, "assets/icon.png"),
  });

  // 显示通知
  notification.show();

  // 监听点击事件
  notification.on("click", () => {
    console.log("通知被点击");
    mainWindow.show();
    mainWindow.focus();
  });

  // 监听关闭事件
  notification.on("close", () => {
    console.log("通知已关闭");
  });
}
```

### 通知配置选项

```javascript
const notification = new Notification({
  // 基本内容
  title: "通知标题",
  subtitle: "副标题（macOS）",
  body: "通知正文内容",

  // 图标
  icon: path.join(__dirname, "icon.png"),

  // 声音
  silent: false, // 是否静音

  // 紧急程度（Windows）
  urgency: "normal", // 'normal', 'critical', 'low'

  // 超时（Linux）
  timeoutType: "default", // 'default', 'never'

  // 操作按钮（macOS）
  actions: [
    { type: "button", text: "回复" },
    { type: "button", text: "忽略" },
  ],

  // 回复输入框（macOS）
  hasReply: true,
  replyPlaceholder: "输入回复...",

  // 关闭按钮文字（macOS）
  closeButtonText: "关闭",
});
```

---

## 问题 2：Windows 特有的通知功能

### Toast 通知

```javascript
// Windows 10+ Toast 通知
const notification = new Notification({
  title: "下载完成",
  body: "文件已保存到下载文件夹",
  icon: path.join(__dirname, "assets/download.png"),

  // Windows 特有：通知声音
  silent: false,

  // 通知持续时间
  // Windows 会根据系统设置自动处理
});

notification.show();
```

### 设置应用 ID（重要）

```javascript
// Windows 需要设置 AppUserModelId 才能正确显示通知
const { app } = require("electron");

// 在 app.ready 之前设置
app.setAppUserModelId("com.mycompany.myapp");

// 或者在 package.json 中配置
// {
//   "build": {
//     "appId": "com.mycompany.myapp"
//   }
// }
```

### 通知中心集成

```javascript
// Windows 通知会自动进入通知中心
// 用户可以在通知中心查看历史通知

// 创建持久通知
const notification = new Notification({
  title: "重要提醒",
  body: "这条通知会保留在通知中心",
  // Windows 10+ 会自动保留
});

notification.show();
```

---

## 问题 3：如何处理通知交互？

### 监听通知事件

```javascript
const notification = new Notification({
  title: "新消息",
  body: "来自张三的消息",
});

// 通知显示时
notification.on("show", () => {
  console.log("通知已显示");
});

// 通知被点击时
notification.on("click", () => {
  console.log("用户点击了通知");
  // 打开相关窗口或执行操作
  openMessageWindow();
});

// 通知关闭时
notification.on("close", () => {
  console.log("通知已关闭");
});

// 操作按钮被点击时（macOS）
notification.on("action", (event, index) => {
  console.log(`用户点击了操作 ${index}`);
});

// 用户回复时（macOS）
notification.on("reply", (event, reply) => {
  console.log(`用户回复: ${reply}`);
  sendReply(reply);
});

notification.show();
```

### 通知管理

```javascript
class NotificationManager {
  constructor() {
    this.notifications = new Map();
  }

  show(id, options) {
    // 如果已存在同 ID 的通知，先关闭
    if (this.notifications.has(id)) {
      this.notifications.get(id).close();
    }

    const notification = new Notification(options);

    notification.on("click", () => {
      options.onClick?.();
      this.notifications.delete(id);
    });

    notification.on("close", () => {
      this.notifications.delete(id);
    });

    notification.show();
    this.notifications.set(id, notification);

    return notification;
  }

  close(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.close();
      this.notifications.delete(id);
    }
  }

  closeAll() {
    this.notifications.forEach((n) => n.close());
    this.notifications.clear();
  }
}

// 使用
const notificationManager = new NotificationManager();

notificationManager.show("new-message", {
  title: "新消息",
  body: "你有一条新消息",
  onClick: () => openMessages(),
});
```

---

## 问题 4：渲染进程中如何发送通知？

### 通过 IPC 调用主进程

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notification", {
  show: (options) => ipcRenderer.invoke("show-notification", options),
});

// main.js
const { ipcMain, Notification } = require("electron");

ipcMain.handle("show-notification", (event, options) => {
  const notification = new Notification(options);

  notification.on("click", () => {
    event.sender.send("notification-clicked", options.id);
  });

  notification.show();
});

// renderer.js
await window.notification.show({
  id: "msg-123",
  title: "新消息",
  body: "消息内容",
});
```

### 使用 Web Notification API

```javascript
// 渲染进程可以直接使用 Web API
// 但功能较少，推荐使用 Electron API

if ("Notification" in window) {
  // 请求权限
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const notification = new Notification("标题", {
      body: "内容",
      icon: "/path/to/icon.png",
    });

    notification.onclick = () => {
      console.log("通知被点击");
    };
  }
}
```

---

## 问题 5：通知最佳实践

### 避免通知疲劳

```javascript
class SmartNotificationManager {
  constructor() {
    this.lastNotificationTime = 0;
    this.notificationCount = 0;
    this.COOLDOWN = 5000; // 5秒冷却
    this.MAX_PER_MINUTE = 5;
  }

  shouldShowNotification() {
    const now = Date.now();

    // 重置计数器
    if (now - this.lastNotificationTime > 60000) {
      this.notificationCount = 0;
    }

    // 检查频率限制
    if (this.notificationCount >= this.MAX_PER_MINUTE) {
      return false;
    }

    // 检查冷却时间
    if (now - this.lastNotificationTime < this.COOLDOWN) {
      return false;
    }

    return true;
  }

  show(options) {
    if (!this.shouldShowNotification()) {
      // 可以选择合并通知
      this.queueNotification(options);
      return;
    }

    const notification = new Notification(options);
    notification.show();

    this.lastNotificationTime = Date.now();
    this.notificationCount++;
  }

  queueNotification(options) {
    // 合并多条通知
    // 例如：显示 "你有 5 条新消息"
  }
}
```

### 尊重用户设置

```javascript
const Store = require("electron-store");
const store = new Store();

function showNotification(options) {
  // 检查用户是否启用了通知
  if (!store.get("notifications.enabled", true)) {
    return;
  }

  // 检查是否在勿扰时间
  if (isDoNotDisturbTime()) {
    return;
  }

  // 检查是否静音
  const silent = store.get("notifications.silent", false);

  const notification = new Notification({
    ...options,
    silent,
  });

  notification.show();
}
```

## 延伸阅读

- [Notification API](https://www.electronjs.org/docs/latest/api/notification)
- [Windows Toast 通知](https://docs.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-notifications)
- [通知最佳实践](https://www.electronjs.org/docs/latest/tutorial/notifications)
