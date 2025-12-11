---
title: Electron 中如何集成 React / Vue / Svelte？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 应用中集成主流前端框架的方法和项目结构。
tags:
  - Electron
  - React
  - Vue
  - Svelte
  - 框架集成
estimatedTime: 12 分钟
keywords:
  - 框架集成
  - React
  - Vue
  - Svelte
highlight: 前端框架在渲染进程中运行，通过构建工具打包后由 Electron 加载
order: 71
---

## 问题 1：集成方式概述

### 项目结构

```
my-electron-app/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── main.js
│   │   └── preload.js
│   └── renderer/       # 前端框架代码
│       ├── App.jsx     # React/Vue/Svelte
│       └── index.html
├── package.json
└── vite.config.js      # 或 webpack.config.js
```

---

## 问题 2：集成 React

### 使用 Vite

```bash
# 创建项目
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install electron electron-builder -D
```

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist/renderer",
  },
});
```

### main.js

```javascript
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 开发环境加载 Vite 服务器
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);
```

---

## 问题 3：集成 Vue

### 使用 electron-vite

```bash
npm create electron-vite@latest my-vue-app -- --template vue
```

### 手动集成

```javascript
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "dist/renderer",
  },
});
```

### Vue 组件中使用 IPC

```vue
<script setup>
import { ref, onMounted } from "vue";

const version = ref("");

onMounted(async () => {
  version.value = await window.api.getVersion();
});
</script>

<template>
  <div>版本: {{ version }}</div>
</template>
```

---

## 问题 4：集成 Svelte

```bash
# 创建 Svelte 项目
npm create vite@latest my-app -- --template svelte
npm install electron -D
```

### Svelte 组件

```svelte
<script>
  import { onMount } from 'svelte';

  let data = [];

  onMount(async () => {
    data = await window.api.getData();
  });
</script>

<ul>
  {#each data as item}
    <li>{item.name}</li>
  {/each}
</ul>
```

---

## 问题 5：通用的 preload 配置

```javascript
// preload.js - 适用于所有框架
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getVersion: () => ipcRenderer.invoke("get-version"),
  getData: () => ipcRenderer.invoke("get-data"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
  onUpdate: (callback) => {
    ipcRenderer.on("update", (event, data) => callback(data));
  },
});
```

### package.json 脚本

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && electron-builder",
    "preview": "vite preview"
  }
}
```

## 延伸阅读

- [electron-vite](https://electron-vite.org/)
- [Electron Forge + Vite](https://www.electronforge.io/config/plugins/vite)
- [Electron + React 模板](https://github.com/electron-react-boilerplate/electron-react-boilerplate)
