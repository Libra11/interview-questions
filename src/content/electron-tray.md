---
title: 如何与系统托盘（Tray）交互？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 系统托盘的创建和交互方式，包括托盘图标、菜单、气泡通知等功能。
tags:
  - Electron
  - 系统托盘
  - Tray
  - 桌面应用
estimatedTime: 12 分钟
keywords:
  - Tray
  - 系统托盘
  - 托盘图标
highlight: 使用 Tray 类创建系统托盘图标，通过菜单和事件实现用户交互
order: 29
---

## 问题 1：如何创建系统托盘？

### 基本创建

```javascript
const { app, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

let tray = null;

app.whenReady().then(() => {
  // 创建托盘图标
  const iconPath = path.join(__dirname, "assets/tray-icon.png");
  tray = new Tray(iconPath);

  // 设置提示文字
  tray.setToolTip("我的应用");

  // 设置上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    { label: "显示窗口", click: () => mainWindow.show() },
    { label: "设置", click: () => openSettings() },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
});
```

### 图标要求

```javascript
// 不同平台的图标尺寸建议
// macOS: 16x16, 32x32 (Retina)
// Windows: 16x16, 32x32
// Linux: 根据桌面环境不同

// 使用 nativeImage 处理图标
const icon = nativeImage.createFromPath(iconPath);

// macOS 模板图标（自动适应深色/浅色模式）
const templateIcon = nativeImage.createFromPath(
  path.join(__dirname, "assets/tray-iconTemplate.png")
);
templateIcon.setTemplateImage(true);

tray = new Tray(templateIcon);
```

---

## 问题 2：如何响应托盘事件？

### 点击事件

```javascript
// 单击托盘图标
tray.on("click", (event, bounds, position) => {
  // bounds: 托盘图标的位置和大小
  // position: 点击位置

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 双击托盘图标
tray.on("double-click", () => {
  mainWindow.show();
  mainWindow.focus();
});

// 右键点击（显示菜单）
tray.on("right-click", () => {
  tray.popUpContextMenu();
});

// 鼠标进入/离开
tray.on("mouse-enter", () => {
  console.log("鼠标进入托盘图标");
});

tray.on("mouse-leave", () => {
  console.log("鼠标离开托盘图标");
});
```

### 在托盘图标附近显示窗口

```javascript
tray.on("click", (event, bounds) => {
  const { x, y, width, height } = bounds;

  // 计算窗口位置（在托盘图标下方）
  const windowWidth = 300;
  const windowHeight = 400;

  let windowX = Math.round(x - windowWidth / 2 + width / 2);
  let windowY;

  if (process.platform === "darwin") {
    // macOS: 托盘在顶部
    windowY = y + height;
  } else {
    // Windows: 托盘在底部
    windowY = y - windowHeight;
  }

  mainWindow.setPosition(windowX, windowY);
  mainWindow.show();
});
```

---

## 问题 3：如何动态更新托盘？

### 更新图标

```javascript
// 根据状态切换图标
function updateTrayIcon(status) {
  const iconName = {
    online: "tray-online.png",
    offline: "tray-offline.png",
    busy: "tray-busy.png",
  }[status];

  const iconPath = path.join(__dirname, "assets", iconName);
  tray.setImage(iconPath);
}

// 显示未读数量（macOS）
function updateBadge(count) {
  if (process.platform === "darwin") {
    app.dock.setBadge(count > 0 ? String(count) : "");
  }

  // 更新托盘提示
  tray.setToolTip(count > 0 ? `${count} 条未读消息` : "没有新消息");
}
```

### 动态更新菜单

```javascript
function updateTrayMenu(state) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: state.isPlaying ? "暂停" : "播放",
      click: () => togglePlayback(),
    },
    {
      label: "下一曲",
      enabled: state.hasNext,
      click: () => nextTrack(),
    },
    { type: "separator" },
    {
      label: state.isLoggedIn ? "登出" : "登录",
      click: () => (state.isLoggedIn ? logout() : login()),
    },
    { type: "separator" },
    { label: "退出", click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
}

// 状态变化时更新菜单
onStateChange((newState) => {
  updateTrayMenu(newState);
});
```

---

## 问题 4：如何显示托盘气泡通知？

### Windows 气泡通知

```javascript
// 仅 Windows 支持
if (process.platform === "win32") {
  tray.displayBalloon({
    iconType: "info", // 'none', 'info', 'warning', 'error', 'custom'
    icon: path.join(__dirname, "assets/notification.png"), // custom 时使用
    title: "新消息",
    content: "你有一条新消息",
    largeIcon: false,
    noSound: false,
    respectQuietTime: true,
  });

  // 监听气泡点击
  tray.on("balloon-click", () => {
    mainWindow.show();
  });

  // 监听气泡关闭
  tray.on("balloon-closed", () => {
    console.log("气泡已关闭");
  });
}
```

### 跨平台通知

```javascript
const { Notification } = require("electron");

function showNotification(title, body) {
  // 使用 Notification API（跨平台）
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, "assets/icon.png"),
  });

  notification.on("click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  notification.show();
}
```

---

## 问题 5：完整的托盘管理示例

```javascript
// TrayManager.js
const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");

class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
    this.state = {
      status: "online",
      unreadCount: 0,
    };
  }

  create() {
    const iconPath = this.getIconPath();
    this.tray = new Tray(iconPath);

    this.tray.setToolTip(app.name);
    this.updateMenu();
    this.bindEvents();

    return this.tray;
  }

  getIconPath() {
    const iconName =
      process.platform === "darwin" ? "tray-iconTemplate.png" : "tray-icon.png";
    return path.join(__dirname, "assets", iconName);
  }

  bindEvents() {
    // 点击显示/隐藏窗口
    this.tray.on("click", () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    // macOS 双击
    if (process.platform === "darwin") {
      this.tray.on("double-click", () => {
        this.mainWindow.show();
        this.mainWindow.focus();
      });
    }
  }

  updateMenu() {
    const template = [
      {
        label: this.mainWindow.isVisible() ? "隐藏窗口" : "显示窗口",
        click: () => {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
          }
          this.updateMenu();
        },
      },
      { type: "separator" },
      {
        label: `状态: ${this.state.status}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "设置",
        click: () => this.mainWindow.webContents.send("open-settings"),
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => app.quit(),
      },
    ];

    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateMenu();

    // 更新提示
    const tooltip =
      this.state.unreadCount > 0
        ? `${app.name} - ${this.state.unreadCount} 条未读`
        : app.name;
    this.tray.setToolTip(tooltip);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;
```

## 延伸阅读

- [Tray API 文档](https://www.electronjs.org/docs/latest/api/tray)
- [Notification API](https://www.electronjs.org/docs/latest/api/notification)
- [nativeImage API](https://www.electronjs.org/docs/latest/api/native-image)
