---
title: macOS 与 Windows 的菜单行为差异？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  详解 macOS 和 Windows 平台在应用菜单方面的差异，以及如何编写跨平台兼容的菜单代码。
tags:
  - Electron
  - 菜单
  - 跨平台
  - macOS
estimatedTime: 10 分钟
keywords:
  - 菜单差异
  - 跨平台菜单
  - 应用菜单
highlight: macOS 菜单在屏幕顶部且有应用菜单，Windows 菜单在窗口内
order: 183
---

## 问题 1：菜单位置有什么不同？

### macOS

- 菜单栏固定在**屏幕顶部**
- 所有窗口共享同一个菜单栏
- 第一个菜单是**应用菜单**（以应用名称命名）

```
┌─────────────────────────────────────────────────────┐
│ 🍎 MyApp  文件  编辑  视图  窗口  帮助              │  ← 屏幕顶部菜单栏
├─────────────────────────────────────────────────────┤
│                                                     │
│                   应用窗口                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Windows

- 菜单栏在**窗口内部**顶部
- 每个窗口可以有自己的菜单
- 没有应用菜单的概念

```
┌─────────────────────────────────────────────────────┐
│ 文件  编辑  视图  帮助                    _ □ ×    │  ← 窗口内菜单栏
├─────────────────────────────────────────────────────┤
│                                                     │
│                   应用窗口                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 问题 2：如何处理 macOS 应用菜单？

### macOS 必须有应用菜单

```javascript
const { app, Menu } = require("electron");

const isMac = process.platform === "darwin";

const template = [
  // macOS 应用菜单（必须是第一个）
  ...(isMac
    ? [
        {
          label: app.name, // 会显示应用名称
          submenu: [
            { role: "about" }, // 关于 MyApp
            { type: "separator" },
            { role: "services" }, // 服务
            { type: "separator" },
            { role: "hide" }, // 隐藏 MyApp
            { role: "hideOthers" }, // 隐藏其他
            { role: "unhide" }, // 显示全部
            { type: "separator" },
            { role: "quit" }, // 退出 MyApp
          ],
        },
      ]
    : []),

  // 文件菜单
  {
    label: "文件",
    submenu: [
      // macOS 用 close，Windows 用 quit
      isMac ? { role: "close" } : { role: "quit" },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

---

## 问题 3：编辑菜单有什么差异？

### macOS 特有功能

```javascript
const editMenu = {
  label: "编辑",
  submenu: [
    { role: "undo" },
    { role: "redo" },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },

    // macOS 特有
    ...(isMac
      ? [
          { role: "pasteAndMatchStyle" }, // 粘贴并匹配样式
          { role: "delete" },
          { role: "selectAll" },
          { type: "separator" },
          {
            label: "语音",
            submenu: [
              { role: "startSpeaking" }, // 开始朗读
              { role: "stopSpeaking" }, // 停止朗读
            ],
          },
        ]
      : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
  ],
};
```

---

## 问题 4：窗口菜单有什么差异？

### macOS 窗口菜单

```javascript
const windowMenu = {
  label: "窗口",
  submenu: [
    { role: "minimize" },
    { role: "zoom" }, // macOS: 缩放窗口

    ...(isMac
      ? [
          { type: "separator" },
          { role: "front" }, // 前置所有窗口
          { type: "separator" },
          { role: "window" }, // 窗口列表（自动生成）
        ]
      : [{ role: "close" }]),
  ],
};
```

### Windows 没有窗口菜单

Windows 应用通常不需要专门的窗口菜单，窗口控制通过标题栏按钮完成。

---

## 问题 5：完整的跨平台菜单模板

```javascript
const { app, Menu, shell } = require("electron");

function createMenu() {
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
              {
                label: "偏好设置...",
                accelerator: "Cmd+,",
                click: () => openPreferences(),
              },
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
          label: "新建",
          accelerator: "CmdOrCtrl+N",
          click: () => createNewFile(),
        },
        {
          label: "打开...",
          accelerator: "CmdOrCtrl+O",
          click: () => openFile(),
        },
        { type: "separator" },
        {
          label: "保存",
          accelerator: "CmdOrCtrl+S",
          click: () => saveFile(),
        },
        { type: "separator" },
        // Windows: 设置在文件菜单
        ...(!isMac
          ? [
              {
                label: "设置",
                accelerator: "Ctrl+,",
                click: () => openPreferences(),
              },
              { type: "separator" },
            ]
          : []),
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

    // 视图菜单
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },

    // 窗口菜单（主要用于 macOS）
    {
      label: "窗口",
      submenu: [
        { role: "minimize" },
        ...(isMac
          ? [{ role: "zoom" }, { type: "separator" }, { role: "front" }]
          : [{ role: "close" }]),
      ],
    },

    // 帮助菜单
    {
      label: "帮助",
      role: "help",
      submenu: [
        {
          label: "文档",
          click: () => shell.openExternal("https://docs.example.com"),
        },
        {
          label: "报告问题",
          click: () => shell.openExternal("https://github.com/example/issues"),
        },
        // Windows: 关于在帮助菜单
        ...(!isMac
          ? [
              { type: "separator" },
              {
                label: `关于 ${app.name}`,
                click: () => showAboutDialog(),
              },
            ]
          : []),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(createMenu());
});
```

### 快捷键差异总结

| 功能     | macOS | Windows |
| -------- | ----- | ------- |
| 偏好设置 | Cmd+, | Ctrl+,  |
| 退出     | Cmd+Q | Alt+F4  |
| 关闭窗口 | Cmd+W | Ctrl+W  |
| 全选     | Cmd+A | Ctrl+A  |
| 查找     | Cmd+F | Ctrl+F  |

## 延伸阅读

- [Menu API](https://www.electronjs.org/docs/latest/api/menu)
- [macOS 人机界面指南](https://developer.apple.com/design/human-interface-guidelines/menus)
- [Windows 菜单设计指南](https://docs.microsoft.com/en-us/windows/win32/uxguide/cmd-menus)
