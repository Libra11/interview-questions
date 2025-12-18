---
title: 如何创建自定义菜单？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 应用菜单和上下文菜单的创建方法，包括菜单模板、快捷键绑定和动态菜单。
tags:
  - Electron
  - 菜单
  - Menu
  - 快捷键
estimatedTime: 12 分钟
keywords:
  - 自定义菜单
  - 应用菜单
  - 上下文菜单
highlight: 使用 Menu.buildFromTemplate 创建菜单，通过 role 或 click 定义菜单行为
order: 160
---

## 问题 1：如何创建应用菜单？

### 基本菜单模板

```javascript
const { app, Menu, BrowserWindow } = require("electron");

const template = [
  {
    label: "文件",
    submenu: [
      {
        label: "新建",
        accelerator: "CmdOrCtrl+N",
        click: () => {
          console.log("新建文件");
        },
      },
      {
        label: "打开",
        accelerator: "CmdOrCtrl+O",
        click: async () => {
          const { dialog } = require("electron");
          const result = await dialog.showOpenDialog({
            properties: ["openFile"],
          });
          console.log(result.filePaths);
        },
      },
      { type: "separator" }, // 分隔线
      {
        label: "退出",
        accelerator: "CmdOrCtrl+Q",
        click: () => app.quit(),
      },
    ],
  },
  {
    label: "编辑",
    submenu: [
      { label: "撤销", role: "undo" },
      { label: "重做", role: "redo" },
      { type: "separator" },
      { label: "剪切", role: "cut" },
      { label: "复制", role: "copy" },
      { label: "粘贴", role: "paste" },
      { label: "全选", role: "selectAll" },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

---

## 问题 2：菜单项有哪些配置选项？

### 常用配置

```javascript
{
  // 显示文本
  label: '菜单项',

  // 快捷键
  accelerator: 'CmdOrCtrl+Shift+S',

  // 点击回调
  click: (menuItem, browserWindow, event) => {
    console.log('菜单被点击');
  },

  // 预定义角色（自动处理行为）
  role: 'copy',  // undo, redo, cut, copy, paste, quit, etc.

  // 菜单类型
  type: 'normal',  // normal, separator, submenu, checkbox, radio

  // 是否启用
  enabled: true,

  // 是否可见
  visible: true,

  // 复选框/单选框状态
  checked: false,

  // 子菜单
  submenu: [...]
}
```

### 预定义 role

```javascript
const editMenu = {
  label: "编辑",
  submenu: [
    { role: "undo" }, // 撤销
    { role: "redo" }, // 重做
    { type: "separator" },
    { role: "cut" }, // 剪切
    { role: "copy" }, // 复制
    { role: "paste" }, // 粘贴
    { role: "delete" }, // 删除
    { role: "selectAll" }, // 全选
  ],
};

const viewMenu = {
  label: "视图",
  submenu: [
    { role: "reload" }, // 重新加载
    { role: "forceReload" }, // 强制重新加载
    { role: "toggleDevTools" }, // 开发者工具
    { type: "separator" },
    { role: "resetZoom" }, // 重置缩放
    { role: "zoomIn" }, // 放大
    { role: "zoomOut" }, // 缩小
    { type: "separator" },
    { role: "togglefullscreen" }, // 全屏
  ],
};

const windowMenu = {
  label: "窗口",
  submenu: [
    { role: "minimize" }, // 最小化
    { role: "zoom" }, // 缩放（macOS）
    { role: "close" }, // 关闭
  ],
};
```

---

## 问题 3：如何创建上下文菜单（右键菜单）？

### 在主进程中创建

```javascript
// main.js
const { Menu, ipcMain } = require("electron");

ipcMain.on("show-context-menu", (event, params) => {
  const template = [
    {
      label: "复制",
      role: "copy",
      enabled: params.hasSelection,
    },
    {
      label: "粘贴",
      role: "paste",
    },
    { type: "separator" },
    {
      label: "检查元素",
      click: () => {
        event.sender.inspectElement(params.x, params.y);
      },
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup({
    window: BrowserWindow.fromWebContents(event.sender),
  });
});
```

### 在渲染进程中触发

```javascript
// preload.js
contextBridge.exposeInMainWorld("contextMenu", {
  show: (params) => ipcRenderer.send("show-context-menu", params),
});

// renderer.js
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  window.contextMenu.show({
    x: e.x,
    y: e.y,
    hasSelection: window.getSelection().toString().length > 0,
  });
});
```

---

## 问题 4：如何动态更新菜单？

### 更新菜单项状态

```javascript
// 创建菜单时保存引用
let darkModeMenuItem;

const template = [
  {
    label: "视图",
    submenu: [
      {
        label: "深色模式",
        type: "checkbox",
        checked: false,
        click: (menuItem) => {
          darkModeMenuItem = menuItem;
          toggleDarkMode(menuItem.checked);
        },
      },
    ],
  },
];

// 从其他地方更新菜单状态
function setDarkMode(enabled) {
  if (darkModeMenuItem) {
    darkModeMenuItem.checked = enabled;
  }
}
```

### 完全重建菜单

```javascript
function updateMenu(state) {
  const template = [
    {
      label: "文件",
      submenu: [
        {
          label: "保存",
          enabled: state.hasChanges, // 根据状态启用/禁用
          click: () => saveFile(),
        },
        {
          label: state.isLoggedIn ? "登出" : "登录",
          click: () => (state.isLoggedIn ? logout() : login()),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 状态变化时更新菜单
updateMenu({ hasChanges: true, isLoggedIn: false });
```

---

## 问题 5：完整的菜单示例

```javascript
const { app, Menu, shell } = require("electron");

function createMenu(mainWindow) {
  const isMac = process.platform === "darwin";

  const template = [
    // macOS 应用菜单
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),

    // 文件菜单
    {
      label: "文件",
      submenu: [
        {
          label: "新建窗口",
          accelerator: "CmdOrCtrl+N",
          click: () => createWindow(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },

    // 编辑菜单
    {
      label: "编辑",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },

    // 帮助菜单
    {
      label: "帮助",
      submenu: [
        {
          label: "文档",
          click: () => shell.openExternal("https://docs.example.com"),
        },
        {
          label: "报告问题",
          click: () => shell.openExternal("https://github.com/example/issues"),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

app.whenReady().then(() => {
  const menu = createMenu();
  Menu.setApplicationMenu(menu);
});
```

## 延伸阅读

- [Menu API 文档](https://www.electronjs.org/docs/latest/api/menu)
- [MenuItem 文档](https://www.electronjs.org/docs/latest/api/menu-item)
- [快捷键 Accelerator](https://www.electronjs.org/docs/latest/api/accelerator)
