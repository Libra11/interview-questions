---
title: 如何让用户选择文件夹？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中使用 dialog.showOpenDialog 让用户选择文件夹的方法和相关配置。
tags:
  - Electron
  - 文件夹选择
  - dialog
  - 文件系统
estimatedTime: 8 分钟
keywords:
  - 选择文件夹
  - openDirectory
  - dialog
highlight: 使用 dialog.showOpenDialog 配合 openDirectory 属性实现文件夹选择
order: 36
---

## 问题 1：如何打开文件夹选择对话框？

### 基本用法

```javascript
// main.js
const { dialog } = require("electron");

async function selectFolder() {
  const result = await dialog.showOpenDialog({
    title: "选择文件夹",
    properties: ["openDirectory"], // 关键：指定选择目录
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0]; // 返回选中的文件夹路径
}
```

### 完整配置

```javascript
const result = await dialog.showOpenDialog({
  // 对话框标题
  title: "选择项目文件夹",

  // 默认打开的路径
  defaultPath: app.getPath("documents"),

  // 确认按钮文字
  buttonLabel: "选择此文件夹",

  // 属性配置
  properties: [
    "openDirectory", // 选择目录
    "createDirectory", // 允许创建新目录（macOS）
    "promptToCreate", // 路径不存在时提示创建（Windows）
  ],

  // 消息（macOS）
  message: "请选择项目所在的文件夹",
});
```

---

## 问题 2：如何支持多选文件夹？

```javascript
const result = await dialog.showOpenDialog({
  title: "选择多个文件夹",
  properties: [
    "openDirectory",
    "multiSelections", // 允许多选
  ],
});

if (!result.canceled) {
  console.log("选中的文件夹:", result.filePaths);
  // ['C:/folder1', 'C:/folder2', ...]
}
```

---

## 问题 3：如何通过 IPC 在渲染进程中使用？

### 主进程

```javascript
// main.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs").promises;
const path = require("path");

// 选择文件夹
ipcMain.handle("dialog:selectFolder", async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    title: options.title || "选择文件夹",
    defaultPath: options.defaultPath || app.getPath("documents"),
    buttonLabel: options.buttonLabel || "选择",
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// 选择文件夹并列出内容
ipcMain.handle(
  "dialog:selectFolderWithContents",
  async (event, options = {}) => {
    const result = await dialog.showOpenDialog({
      title: options.title || "选择文件夹",
      properties: ["openDirectory"],
    });

    if (result.canceled) {
      return null;
    }

    const folderPath = result.filePaths[0];
    const files = await fs.readdir(folderPath, { withFileTypes: true });

    const contents = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(folderPath, file.name),
    }));

    return {
      path: folderPath,
      name: path.basename(folderPath),
      contents,
    };
  }
);
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("folderAPI", {
  select: (options) => ipcRenderer.invoke("dialog:selectFolder", options),
  selectWithContents: (options) =>
    ipcRenderer.invoke("dialog:selectFolderWithContents", options),
});
```

### 渲染进程

```javascript
// renderer.js

// 选择项目文件夹
async function selectProjectFolder() {
  const folderPath = await window.folderAPI.select({
    title: "选择项目文件夹",
  });

  if (folderPath) {
    console.log("选中的文件夹:", folderPath);
    loadProject(folderPath);
  }
}

// 选择并显示文件夹内容
async function browseFolder() {
  const folder = await window.folderAPI.selectWithContents({
    title: "浏览文件夹",
  });

  if (folder) {
    console.log("文件夹路径:", folder.path);
    console.log("文件夹名称:", folder.name);

    // 显示内容
    folder.contents.forEach((item) => {
      console.log(item.isDirectory ? "📁" : "📄", item.name);
    });
  }
}
```

---

## 问题 4：如何同时选择文件和文件夹？

```javascript
// 同时允许选择文件和文件夹
const result = await dialog.showOpenDialog({
  title: "选择文件或文件夹",
  properties: ["openFile", "openDirectory", "multiSelections"],
  filters: [{ name: "所有文件", extensions: ["*"] }],
});

// 区分选中的是文件还是文件夹
if (!result.canceled) {
  for (const selectedPath of result.filePaths) {
    const stats = await fs.stat(selectedPath);

    if (stats.isDirectory()) {
      console.log("文件夹:", selectedPath);
    } else {
      console.log("文件:", selectedPath);
    }
  }
}
```

---

## 问题 5：实际应用示例

### 选择工作区

```javascript
// main.js
ipcMain.handle("workspace:select", async () => {
  const result = await dialog.showOpenDialog({
    title: "选择工作区",
    properties: ["openDirectory", "createDirectory"],
    buttonLabel: "打开工作区",
  });

  if (result.canceled) {
    return null;
  }

  const workspacePath = result.filePaths[0];

  // 检查是否是有效的工作区（例如包含配置文件）
  const configPath = path.join(workspacePath, ".workspace.json");
  let isExistingWorkspace = false;

  try {
    await fs.access(configPath);
    isExistingWorkspace = true;
  } catch {
    // 配置文件不存在，是新工作区
  }

  return {
    path: workspacePath,
    name: path.basename(workspacePath),
    isNew: !isExistingWorkspace,
  };
});

// renderer.js
async function openWorkspace() {
  const workspace = await window.workspaceAPI.select();

  if (workspace) {
    if (workspace.isNew) {
      // 初始化新工作区
      await initializeWorkspace(workspace.path);
    }

    // 加载工作区
    await loadWorkspace(workspace.path);

    // 更新 UI
    document.getElementById("workspace-name").textContent = workspace.name;
  }
}
```

### 选择导出目录

```javascript
// main.js
ipcMain.handle("export:selectFolder", async (event, suggestedName) => {
  const result = await dialog.showOpenDialog({
    title: "选择导出位置",
    defaultPath: app.getPath("documents"),
    properties: ["openDirectory", "createDirectory"],
    buttonLabel: "导出到此处",
  });

  if (result.canceled) {
    return null;
  }

  const exportPath = path.join(result.filePaths[0], suggestedName);

  // 检查目标是否已存在
  try {
    await fs.access(exportPath);
    // 已存在，询问是否覆盖
    return { path: exportPath, exists: true };
  } catch {
    return { path: exportPath, exists: false };
  }
});
```

## 延伸阅读

- [dialog.showOpenDialog](https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogbrowserwindow-options)
- [文件系统操作](https://www.electronjs.org/docs/latest/tutorial/native-file-drag-drop)
- [Node.js fs 模块](https://nodejs.org/api/fs.html)
