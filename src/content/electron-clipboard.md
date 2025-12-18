---
title: 如何使用原生剪贴板（clipboard）？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中使用 clipboard 模块进行剪贴板操作的方法。
tags:
  - Electron
  - 剪贴板
  - clipboard
  - 系统集成
estimatedTime: 8 分钟
keywords:
  - clipboard
  - 剪贴板
  - 复制粘贴
highlight: Electron 的 clipboard 模块支持文本、HTML、图片和自定义格式
order: 275
---

## 问题 1：基本文本操作

### 主进程使用

```javascript
const { clipboard } = require("electron");

// 写入文本
clipboard.writeText("Hello, World!");

// 读取文本
const text = clipboard.readText();
console.log("剪贴板内容:", text);

// 清空剪贴板
clipboard.clear();
```

### 通过 IPC 暴露

```javascript
// main.js
ipcMain.handle("clipboard:read", () => {
  return clipboard.readText();
});

ipcMain.handle("clipboard:write", (event, text) => {
  clipboard.writeText(text);
});

// preload.js
contextBridge.exposeInMainWorld("clipboard", {
  read: () => ipcRenderer.invoke("clipboard:read"),
  write: (text) => ipcRenderer.invoke("clipboard:write", text),
});
```

---

## 问题 2：HTML 内容

```javascript
// 写入 HTML
clipboard.writeHTML("<b>粗体文本</b>");

// 读取 HTML
const html = clipboard.readHTML();

// 同时写入文本和 HTML
clipboard.write({
  text: "粗体文本",
  html: "<b>粗体文本</b>",
});
```

---

## 问题 3：图片操作

```javascript
const { clipboard, nativeImage } = require("electron");

// 从文件创建图片
const image = nativeImage.createFromPath("/path/to/image.png");

// 写入图片
clipboard.writeImage(image);

// 读取图片
const clipboardImage = clipboard.readImage();

// 检查是否有图片
if (!clipboardImage.isEmpty()) {
  // 保存到文件
  const buffer = clipboardImage.toPNG();
  fs.writeFileSync("output.png", buffer);
}
```

---

## 问题 4：自定义格式

```javascript
// 写入自定义格式
clipboard.writeBuffer("my-custom-type", Buffer.from("custom data"));

// 读取自定义格式
const data = clipboard.readBuffer("my-custom-type");

// 检查可用格式
const formats = clipboard.availableFormats();
console.log("可用格式:", formats);
// ['text/plain', 'text/html', 'image/png', ...]
```

---

## 问题 5：完整封装

```javascript
// clipboard-manager.js
const { clipboard, nativeImage } = require("electron");

class ClipboardManager {
  // 文本
  getText() {
    return clipboard.readText();
  }

  setText(text) {
    clipboard.writeText(text);
  }

  // HTML
  getHTML() {
    return clipboard.readHTML();
  }

  setHTML(html, text = "") {
    clipboard.write({ html, text });
  }

  // 图片
  getImage() {
    const image = clipboard.readImage();
    if (image.isEmpty()) return null;
    return image.toDataURL();
  }

  setImage(dataUrl) {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
  }

  setImageFromPath(path) {
    const image = nativeImage.createFromPath(path);
    clipboard.writeImage(image);
  }

  // 通用
  clear() {
    clipboard.clear();
  }

  getFormats() {
    return clipboard.availableFormats();
  }

  hasFormat(format) {
    return this.getFormats().includes(format);
  }
}

module.exports = new ClipboardManager();
```

### 渲染进程使用

```javascript
// renderer.js
async function copyToClipboard() {
  const text = document.getElementById("input").value;
  await window.clipboard.write(text);
}

async function pasteFromClipboard() {
  const text = await window.clipboard.read();
  document.getElementById("output").value = text;
}
```

## 延伸阅读

- [clipboard API](https://www.electronjs.org/docs/latest/api/clipboard)
- [nativeImage](https://www.electronjs.org/docs/latest/api/native-image)
