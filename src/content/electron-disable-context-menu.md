---
title: 如何禁用默认右键菜单？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中禁用或替换默认右键菜单的多种方法，以及如何实现自定义右键菜单。
tags:
  - Electron
  - 右键菜单
  - 上下文菜单
  - 事件处理
estimatedTime: 8 分钟
keywords:
  - 禁用右键菜单
  - contextmenu
  - 自定义菜单
highlight: 通过 preventDefault 禁用默认右键菜单，然后实现自定义菜单
order: 27
---

## 问题 1：如何完全禁用右键菜单？

### 在渲染进程中禁用

```javascript
// renderer.js 或 HTML 中的 script
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // 阻止默认右键菜单
});
```

### 在特定元素上禁用

```javascript
// 只在特定区域禁用
document
  .querySelector(".no-context-menu")
  .addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

// 或使用 CSS（不推荐，兼容性问题）
// .no-context-menu {
//   pointer-events: none;
// }
```

### 在 HTML 中禁用

```html
<!-- 整个页面禁用 -->
<body oncontextmenu="return false;">
  <!-- 特定元素禁用 -->
  <div oncontextmenu="return false;">这个区域没有右键菜单</div>
</body>
```

---

## 问题 2：如何替换为自定义右键菜单？

### 方案 1：纯前端实现

```javascript
// renderer.js
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  // 移除已存在的菜单
  const existingMenu = document.querySelector(".custom-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  // 创建自定义菜单
  const menu = document.createElement("div");
  menu.className = "custom-context-menu";
  menu.innerHTML = `
    <div class="menu-item" data-action="copy">复制</div>
    <div class="menu-item" data-action="paste">粘贴</div>
    <div class="menu-divider"></div>
    <div class="menu-item" data-action="delete">删除</div>
  `;

  // 定位菜单
  menu.style.left = `${e.pageX}px`;
  menu.style.top = `${e.pageY}px`;

  document.body.appendChild(menu);
});

// 点击菜单项
document.addEventListener("click", (e) => {
  const menuItem = e.target.closest(".menu-item");
  if (menuItem) {
    const action = menuItem.dataset.action;
    handleMenuAction(action);
  }

  // 点击任意位置关闭菜单
  const menu = document.querySelector(".custom-context-menu");
  if (menu) {
    menu.remove();
  }
});

function handleMenuAction(action) {
  switch (action) {
    case "copy":
      document.execCommand("copy");
      break;
    case "paste":
      document.execCommand("paste");
      break;
    case "delete":
      // 删除操作
      break;
  }
}
```

```css
/* 自定义菜单样式 */
.custom-context-menu {
  position: absolute;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-width: 150px;
  z-index: 10000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}
```

### 方案 2：使用 Electron Menu API

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronMenu", {
  showContextMenu: (options) => ipcRenderer.send("show-context-menu", options),
});

// main.js
const { ipcMain, Menu, BrowserWindow } = require("electron");

ipcMain.on("show-context-menu", (event, options) => {
  const template = [
    {
      label: "复制",
      role: "copy",
      enabled: options.canCopy,
    },
    {
      label: "粘贴",
      role: "paste",
    },
    { type: "separator" },
    {
      label: "刷新",
      click: () => event.sender.reload(),
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup({
    window: BrowserWindow.fromWebContents(event.sender),
  });
});

// renderer.js
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  window.electronMenu.showContextMenu({
    canCopy: window.getSelection().toString().length > 0,
  });
});
```

---

## 问题 3：如何根据上下文显示不同菜单？

```javascript
// renderer.js
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const target = e.target;
  let menuType = "default";
  let menuData = {};

  // 判断点击的元素类型
  if (target.tagName === "IMG") {
    menuType = "image";
    menuData.src = target.src;
  } else if (target.tagName === "A") {
    menuType = "link";
    menuData.href = target.href;
  } else if (target.closest(".editable")) {
    menuType = "editable";
  } else if (window.getSelection().toString()) {
    menuType = "selection";
    menuData.text = window.getSelection().toString();
  }

  window.electronMenu.showContextMenu({
    type: menuType,
    data: menuData,
    x: e.screenX,
    y: e.screenY,
  });
});

// main.js
ipcMain.on("show-context-menu", (event, options) => {
  let template;

  switch (options.type) {
    case "image":
      template = [
        { label: "复制图片", click: () => copyImage(options.data.src) },
        { label: "保存图片", click: () => saveImage(options.data.src) },
      ];
      break;

    case "link":
      template = [
        {
          label: "打开链接",
          click: () => shell.openExternal(options.data.href),
        },
        {
          label: "复制链接",
          click: () => clipboard.writeText(options.data.href),
        },
      ];
      break;

    case "selection":
      template = [
        { label: "复制", role: "copy" },
        { label: "搜索", click: () => searchText(options.data.text) },
      ];
      break;

    default:
      template = [
        { label: "刷新", role: "reload" },
        {
          label: "检查",
          click: () => event.sender.inspectElement(options.x, options.y),
        },
      ];
  }

  Menu.buildFromTemplate(template).popup();
});
```

---

## 问题 4：如何在开发环境保留右键菜单？

```javascript
// renderer.js
const isDev = process.env.NODE_ENV === "development";

document.addEventListener("contextmenu", (e) => {
  if (isDev) {
    // 开发环境：保留默认菜单用于调试
    return;
  }

  e.preventDefault();
  showCustomMenu(e);
});

// 或者通过 preload 传递环境信息
// preload.js
contextBridge.exposeInMainWorld("env", {
  isDev: process.env.NODE_ENV === "development",
});

// renderer.js
document.addEventListener("contextmenu", (e) => {
  if (window.env.isDev && e.shiftKey) {
    // Shift + 右键 显示默认菜单
    return;
  }

  e.preventDefault();
  showCustomMenu(e);
});
```

## 延伸阅读

- [Menu API](https://www.electronjs.org/docs/latest/api/menu)
- [contextmenu 事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/contextmenu_event)
- [Electron 上下文菜单示例](https://github.com/electron/electron/blob/main/docs/api/menu.md)
