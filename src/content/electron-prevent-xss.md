---
title: 如何避免 XSS？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 应用中 XSS 攻击的危害和防护措施，包括输入验证、CSP 和安全的 DOM 操作。
tags:
  - Electron
  - 安全
  - XSS
  - 防护
estimatedTime: 12 分钟
keywords:
  - XSS防护
  - 跨站脚本
  - 安全编码
highlight: Electron 中的 XSS 比 Web 更危险，需要严格的输入验证和安全的 DOM 操作
order: 211
---

## 问题 1：为什么 Electron 中的 XSS 更危险？

### 普通 Web vs Electron

```javascript
// 普通 Web 应用的 XSS
// 攻击者能做的：窃取 cookie、修改页面、发送请求

// Electron 应用的 XSS（配置不当时）
// 攻击者能做的：执行系统命令、读写文件、安装恶意软件
const { exec } = require("child_process");
exec("rm -rf /"); // 灾难性后果
```

---

## 问题 2：如何安全地操作 DOM？

### 避免危险的 DOM 操作

```javascript
// ❌ 危险：直接插入 HTML
element.innerHTML = userInput;
document.write(userInput);

// ❌ 危险：动态执行代码
eval(userInput);
new Function(userInput)();
setTimeout(userInput, 0);

// ✅ 安全：使用 textContent
element.textContent = userInput;

// ✅ 安全：使用 DOM API 创建元素
const div = document.createElement("div");
div.textContent = userInput;
parent.appendChild(div);
```

### 安全的模板渲染

```javascript
// ✅ 使用转义函数
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ✅ 使用安全的模板库
// React 默认转义
<div>{userInput}</div>

// Vue 默认转义
<div>{{ userInput }}</div>
```

---

## 问题 3：如何验证和清理输入？

### 输入验证

```javascript
// 白名单验证
function validateInput(input, allowedPattern) {
  const pattern = /^[a-zA-Z0-9\s]+$/; // 只允许字母数字空格
  return pattern.test(input);
}

// URL 验证
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 文件路径验证
function isValidFilename(name) {
  // 禁止路径遍历和特殊字符
  return /^[a-zA-Z0-9_\-\.]+$/.test(name) && !name.includes("..");
}
```

### HTML 清理

```javascript
// 使用 DOMPurify 清理 HTML
const DOMPurify = require("dompurify");

const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p"],
  ALLOWED_ATTR: ["href", "title"],
});

element.innerHTML = cleanHtml;
```

---

## 问题 4：IPC 通信中如何防止 XSS？

### 验证 IPC 数据

```javascript
// main.js
ipcMain.handle("render-content", (event, content) => {
  // 验证内容类型
  if (typeof content !== "string") {
    throw new Error("Invalid content type");
  }

  // 限制长度
  if (content.length > 10000) {
    throw new Error("Content too long");
  }

  // 清理 HTML
  return DOMPurify.sanitize(content);
});
```

### preload 中的防护

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  // 只返回安全的数据
  getContent: async () => {
    const content = await ipcRenderer.invoke("get-content");
    // 不要直接返回可能包含脚本的内容
    return sanitize(content);
  },
});
```

---

## 问题 5：其他防护措施

### 禁用危险功能

```javascript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    // 禁用 eval
    allowRunningInsecureContent: false,
  },
});
```

### 使用 CSP

```javascript
// 设置严格的 CSP
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      "Content-Security-Policy": ["default-src 'self'; script-src 'self'"],
    },
  });
});
```

## 延伸阅读

- [OWASP XSS 防护](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
