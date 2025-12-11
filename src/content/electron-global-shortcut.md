---
title: globalShortcut 如何实现全局快捷键？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron globalShortcut 模块的使用方法，实现应用外也能响应的全局快捷键。
tags:
  - Electron
  - 全局快捷键
  - globalShortcut
  - 快捷键
estimatedTime: 10 分钟
keywords:
  - globalShortcut
  - 全局快捷键
  - 热键
highlight: globalShortcut 注册的快捷键在应用失去焦点时也能触发
order: 28
---

## 问题 1：什么是全局快捷键？

全局快捷键是指即使应用不在前台（没有焦点）时也能响应的快捷键。

### 与普通快捷键的区别

```javascript
// 普通快捷键（菜单快捷键）- 只在应用有焦点时生效
Menu.buildFromTemplate([
  {
    label: "保存",
    accelerator: "CmdOrCtrl+S", // 只在应用内生效
    click: () => save(),
  },
]);

// 全局快捷键 - 系统级别，始终生效
globalShortcut.register("CmdOrCtrl+Shift+S", () => {
  // 即使应用在后台也能触发
  showApp();
});
```

---

## 问题 2：如何注册全局快捷键？

### 基本用法

```javascript
const { app, globalShortcut } = require("electron");

app.whenReady().then(() => {
  // 注册单个快捷键
  const ret = globalShortcut.register("CommandOrControl+X", () => {
    console.log("CommandOrControl+X 被按下");
  });

  if (!ret) {
    console.log("快捷键注册失败");
  }

  // 检查快捷键是否已注册
  console.log(globalShortcut.isRegistered("CommandOrControl+X"));
});

// 应用退出时注销快捷键
app.on("will-quit", () => {
  // 注销特定快捷键
  globalShortcut.unregister("CommandOrControl+X");

  // 或注销所有快捷键
  globalShortcut.unregisterAll();
});
```

### 快捷键格式

```javascript
// 修饰键
// CommandOrControl (CmdOrCtrl) - macOS 用 Cmd，Windows/Linux 用 Ctrl
// Alt (Option on macOS)
// Shift
// Super (Windows 键 / Command 键)

// 示例
globalShortcut.register("CmdOrCtrl+Shift+I", callback); // 开发者工具
globalShortcut.register("Alt+Space", callback); // 快速启动
globalShortcut.register("CmdOrCtrl+Alt+V", callback); // 剪贴板历史
globalShortcut.register("MediaPlayPause", callback); // 媒体键
globalShortcut.register("F12", callback); // 功能键
```

---

## 问题 3：常见的使用场景

### 场景 1：显示/隐藏应用

```javascript
const { globalShortcut, BrowserWindow } = require("electron");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = createWindow();

  // 注册显示/隐藏快捷键
  globalShortcut.register("CmdOrCtrl+Shift+Space", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});
```

### 场景 2：快速截图

```javascript
globalShortcut.register("CmdOrCtrl+Shift+4", async () => {
  const { desktopCapturer } = require("electron");

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 1920, height: 1080 },
  });

  // 保存截图
  const screenshot = sources[0].thumbnail;
  // ... 保存逻辑
});
```

### 场景 3：剪贴板管理

```javascript
const { clipboard } = require("electron");

globalShortcut.register("CmdOrCtrl+Shift+V", () => {
  // 显示剪贴板历史窗口
  showClipboardHistory();
});

globalShortcut.register("CmdOrCtrl+Shift+C", () => {
  // 复制并添加到历史
  const text = clipboard.readText();
  addToHistory(text);
});
```

---

## 问题 4：如何处理快捷键冲突？

### 检测注册结果

```javascript
function registerShortcut(accelerator, callback) {
  // 先检查是否已被注册
  if (globalShortcut.isRegistered(accelerator)) {
    console.log(`${accelerator} 已被注册`);
    return false;
  }

  const success = globalShortcut.register(accelerator, callback);

  if (!success) {
    console.log(`${accelerator} 注册失败，可能被其他应用占用`);
    // 可以尝试备用快捷键
    return registerShortcut(getAlternativeAccelerator(accelerator), callback);
  }

  return true;
}
```

### 允许用户自定义

```javascript
const Store = require("electron-store");
const store = new Store();

// 默认快捷键配置
const defaultShortcuts = {
  toggleWindow: "CmdOrCtrl+Shift+Space",
  screenshot: "CmdOrCtrl+Shift+4",
  clipboard: "CmdOrCtrl+Shift+V",
};

function registerUserShortcuts() {
  const shortcuts = store.get("shortcuts", defaultShortcuts);

  // 先注销所有
  globalShortcut.unregisterAll();

  // 注册用户配置的快捷键
  Object.entries(shortcuts).forEach(([action, accelerator]) => {
    if (accelerator) {
      globalShortcut.register(accelerator, () => {
        handleAction(action);
      });
    }
  });
}

// 更新快捷键
function updateShortcut(action, newAccelerator) {
  const shortcuts = store.get("shortcuts", defaultShortcuts);
  const oldAccelerator = shortcuts[action];

  // 注销旧的
  if (oldAccelerator) {
    globalShortcut.unregister(oldAccelerator);
  }

  // 注册新的
  if (newAccelerator) {
    const success = globalShortcut.register(newAccelerator, () => {
      handleAction(action);
    });

    if (success) {
      shortcuts[action] = newAccelerator;
      store.set("shortcuts", shortcuts);
    }

    return success;
  }

  return true;
}
```

---

## 问题 5：注意事项和最佳实践

### 1. 及时注销

```javascript
// 应用退出时必须注销
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// 窗口关闭时也可能需要注销
mainWindow.on("closed", () => {
  globalShortcut.unregister("CmdOrCtrl+Shift+Space");
});
```

### 2. 避免常用快捷键

```javascript
// ❌ 避免注册这些常用快捷键
// CmdOrCtrl+C, CmdOrCtrl+V, CmdOrCtrl+X
// CmdOrCtrl+Z, CmdOrCtrl+A
// CmdOrCtrl+Tab, Alt+Tab

// ✅ 使用组合键减少冲突
globalShortcut.register("CmdOrCtrl+Shift+Alt+X", callback);
```

### 3. 提供禁用选项

```javascript
// 允许用户禁用全局快捷键
let shortcutsEnabled = true;

function toggleGlobalShortcuts(enabled) {
  shortcutsEnabled = enabled;

  if (enabled) {
    registerUserShortcuts();
  } else {
    globalShortcut.unregisterAll();
  }
}
```

### 4. macOS 权限

```javascript
// macOS 可能需要辅助功能权限
const { systemPreferences } = require("electron");

if (process.platform === "darwin") {
  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (!trusted) {
    // 提示用户授权
    systemPreferences.isTrustedAccessibilityClient(true);
  }
}
```

## 延伸阅读

- [globalShortcut API](https://www.electronjs.org/docs/latest/api/global-shortcut)
- [Accelerator 格式](https://www.electronjs.org/docs/latest/api/accelerator)
- [快捷键最佳实践](https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts)
