---
title: macOS 关闭窗口但不退出如何实现？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍如何实现 macOS 风格的窗口关闭行为：关闭窗口但应用继续运行。
tags:
  - Electron
  - macOS
  - 窗口管理
  - 平台适配
estimatedTime: 8 分钟
keywords:
  - macOS关闭
  - 窗口不退出
  - activate事件
highlight: 监听 window-all-closed 事件，在 macOS 上不调用 app.quit()
order: 69
---

## 问题 1：macOS 的默认行为

### 用户期望

```
macOS 用户习惯：
├── 点击红色关闭按钮 → 关闭窗口
├── 应用继续在后台运行
├── Dock 图标仍然显示
├── 点击 Dock 图标 → 重新打开窗口
└── Cmd+Q 才是真正退出
```

---

## 问题 2：基本实现

```javascript
const { app, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });
  mainWindow.loadFile("index.html");
}

// 所有窗口关闭时
app.on("window-all-closed", () => {
  // macOS 上不退出应用
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 点击 Dock 图标时
app.on("activate", () => {
  // 如果没有窗口，创建一个
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
```

---

## 问题 3：隐藏窗口而非关闭

```javascript
// 更好的方式：隐藏窗口而不是销毁
mainWindow.on("close", (event) => {
  if (process.platform === "darwin") {
    // 阻止默认关闭行为
    event.preventDefault();
    // 隐藏窗口
    mainWindow.hide();
  }
});

// 点击 Dock 图标时显示窗口
app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
  }
});
```

---

## 问题 4：处理真正的退出

```javascript
let isQuitting = false;

// 标记真正退出
app.on("before-quit", () => {
  isQuitting = true;
});

mainWindow.on("close", (event) => {
  if (process.platform === "darwin" && !isQuitting) {
    event.preventDefault();
    mainWindow.hide();
  }
});

// 菜单中的退出选项
const template = [
  {
    label: app.name,
    submenu: [
      {
        label: "退出",
        accelerator: "Cmd+Q",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ],
  },
];
```

---

## 问题 5：完整实现

```javascript
const { app, BrowserWindow, Menu } = require("electron");

let mainWindow;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  mainWindow.loadFile("index.html");

  // macOS 关闭行为
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// 创建菜单
function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        {
          label: "退出",
          accelerator: "Cmd+Q",
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
  } else {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  if (process.platform === "darwin") {
    createMenu();
  }
});
```

## 延伸阅读

- [app 事件](https://www.electronjs.org/docs/latest/api/app#events)
- [macOS 应用生命周期](https://developer.apple.com/documentation/appkit/nsapplication)
