---
title: 如何禁止加载远程 URL？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍如何限制 Electron 应用只加载本地内容，防止加载恶意远程 URL。
tags:
  - Electron
  - 安全
  - URL限制
  - 导航控制
estimatedTime: 10 分钟
keywords:
  - 禁止远程URL
  - 导航拦截
  - URL白名单
highlight: 通过 will-navigate 和 new-window 事件拦截导航，只允许加载本地或白名单 URL
order: 216
---

## 问题 1：为什么要限制远程 URL？

### 风险说明

```javascript
// 如果应用可以加载任意 URL
win.loadURL("https://malicious-site.com");

// 风险：
// 1. 恶意网站可能利用 Electron 的能力
// 2. 钓鱼攻击
// 3. 中间人攻击注入恶意代码
```

---

## 问题 2：如何拦截导航？

### 拦截 will-navigate

```javascript
// main.js
const { BrowserWindow, shell } = require("electron");

const win = new BrowserWindow({
  /* ... */
});

// 拦截页面内导航
win.webContents.on("will-navigate", (event, url) => {
  const parsedUrl = new URL(url);

  // 只允许本地文件
  if (parsedUrl.protocol !== "file:") {
    event.preventDefault();
    // 可选：在外部浏览器打开
    shell.openExternal(url);
  }
});
```

### 拦截新窗口

```javascript
// 拦截 window.open 和 target="_blank"
win.webContents.setWindowOpenHandler(({ url }) => {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "file:") {
    // 在外部浏览器打开
    shell.openExternal(url);
    return { action: "deny" };
  }

  return { action: "allow" };
});
```

---

## 问题 3：如何实现 URL 白名单？

```javascript
// main.js
const allowedOrigins = [
  "file://",
  "app://",
  "https://api.myapp.com",
  "https://cdn.myapp.com",
];

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return allowedOrigins.some((origin) => url.startsWith(origin));
  } catch {
    return false;
  }
}

// 应用到所有窗口
app.on("web-contents-created", (event, contents) => {
  // 导航拦截
  contents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      console.log("Blocked navigation to:", url);
    }
  });

  // 新窗口拦截
  contents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedUrl(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // iframe 拦截
  contents.on("will-attach-webview", (event, webPreferences, params) => {
    if (!isAllowedUrl(params.src)) {
      event.preventDefault();
    }
  });
});
```

---

## 问题 4：如何限制 webview 和 iframe？

### 禁用 webview

```javascript
// 完全禁用 webview
app.on("web-contents-created", (event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
});
```

### 限制 iframe

```javascript
// 使用 CSP 限制 iframe
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      "Content-Security-Policy": [
        "default-src 'self'",
        "frame-src 'none'", // 禁止所有 iframe
      ].join("; "),
    },
  });
});
```

---

## 问题 5：完整的 URL 安全策略

```javascript
// url-security.js
class UrlSecurity {
  constructor(options = {}) {
    this.allowedProtocols = options.protocols || ["file:", "app:"];
    this.allowedHosts = options.hosts || [];
    this.blockExternal = options.blockExternal ?? true;
  }

  isAllowed(url) {
    try {
      const parsed = new URL(url);

      // 检查协议
      if (this.allowedProtocols.includes(parsed.protocol)) {
        return true;
      }

      // 检查主机白名单
      if (this.allowedHosts.includes(parsed.host)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  apply(contents) {
    contents.on("will-navigate", (event, url) => {
      if (!this.isAllowed(url)) {
        event.preventDefault();
        if (!this.blockExternal) {
          shell.openExternal(url);
        }
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
      if (!this.isAllowed(url)) {
        if (!this.blockExternal) {
          shell.openExternal(url);
        }
        return { action: "deny" };
      }
      return { action: "allow" };
    });
  }
}

// 使用
const urlSecurity = new UrlSecurity({
  protocols: ["file:", "app:"],
  hosts: ["api.myapp.com"],
  blockExternal: false,
});

app.on("web-contents-created", (event, contents) => {
  urlSecurity.apply(contents);
});
```

## 延伸阅读

- [Electron 导航安全](https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation)
- [webContents 事件](https://www.electronjs.org/docs/latest/api/web-contents#event-will-navigate)
