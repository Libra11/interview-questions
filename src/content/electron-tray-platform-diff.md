---
title: 系统托盘行为差异？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 系统托盘在不同平台上的行为差异和适配方法。
tags:
  - Electron
  - 系统托盘
  - 跨平台
  - Tray
estimatedTime: 10 分钟
keywords:
  - 托盘差异
  - Tray跨平台
  - 系统托盘
highlight: 托盘图标大小、点击行为和菜单显示在各平台有明显差异
order: 262
---

## 问题 1：图标大小差异

### 各平台要求

```
macOS：
├── 推荐 16x16 或 22x22
├── 支持 @2x 高分屏
├── 使用 Template 图标（黑白）
└── 自动适应深色/浅色模式

Windows：
├── 推荐 16x16 或 32x32
├── 支持 ICO 格式
├── 彩色图标
└── 高 DPI 需要更大尺寸

Linux：
├── 推荐 22x22 或 24x24
├── 取决于桌面环境
├── 某些环境不支持托盘
└── 需要安装额外依赖
```

### 适配代码

```javascript
const path = require("path");

function getTrayIcon() {
  if (process.platform === "darwin") {
    // macOS 使用 Template 图标
    return path.join(__dirname, "assets/trayTemplate.png");
  } else if (process.platform === "win32") {
    return path.join(__dirname, "assets/tray.ico");
  } else {
    return path.join(__dirname, "assets/tray.png");
  }
}

const tray = new Tray(getTrayIcon());
```

---

## 问题 2：点击行为差异

```javascript
const tray = new Tray(icon);

// macOS: 左键点击显示菜单
// Windows: 左键点击触发 click 事件，右键显示菜单
// Linux: 取决于桌面环境

tray.on("click", () => {
  // Windows 上左键点击
  if (process.platform === "win32") {
    mainWindow.show();
  }
});

tray.on("right-click", () => {
  // Windows 上右键点击
  tray.popUpContextMenu();
});

// macOS 上设置菜单会自动响应左键
if (process.platform === "darwin") {
  tray.setContextMenu(contextMenu);
}
```

---

## 问题 3：菜单显示差异

```javascript
// macOS: 菜单从托盘图标下方弹出
// Windows: 菜单从托盘图标上方弹出
// Linux: 取决于桌面环境

const contextMenu = Menu.buildFromTemplate([
  { label: "显示窗口", click: () => mainWindow.show() },
  { type: "separator" },
  { label: "退出", click: () => app.quit() },
]);

// Windows 需要手动弹出菜单
if (process.platform === "win32") {
  tray.on("right-click", () => {
    tray.popUpContextMenu(contextMenu);
  });
} else {
  tray.setContextMenu(contextMenu);
}
```

---

## 问题 4：气泡通知差异

```javascript
// Windows 支持气泡通知
if (process.platform === "win32") {
  tray.displayBalloon({
    iconType: "info",
    title: "提示",
    content: "应用已最小化到托盘",
  });

  tray.on("balloon-click", () => {
    mainWindow.show();
  });
}

// macOS 使用 Notification API
if (process.platform === "darwin") {
  new Notification({
    title: "提示",
    body: "应用已最小化到托盘",
  }).show();
}
```

---

## 问题 5：完整跨平台实现

```javascript
class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
  }

  create() {
    this.tray = new Tray(this.getIcon());
    this.tray.setToolTip("MyApp");

    const menu = this.createMenu();

    if (process.platform === "darwin") {
      this.tray.setContextMenu(menu);
    } else {
      this.tray.on("click", () => this.mainWindow.show());
      this.tray.on("right-click", () => {
        this.tray.popUpContextMenu(menu);
      });
    }
  }

  getIcon() {
    const iconName =
      process.platform === "darwin"
        ? "trayTemplate.png"
        : process.platform === "win32"
        ? "tray.ico"
        : "tray.png";
    return path.join(__dirname, "assets", iconName);
  }

  createMenu() {
    return Menu.buildFromTemplate([
      { label: "打开", click: () => this.mainWindow.show() },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
```

## 延伸阅读

- [Tray API](https://www.electronjs.org/docs/latest/api/tray)
- [macOS 托盘图标指南](https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/system-icons/)
