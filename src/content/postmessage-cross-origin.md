---
title: postMessage 是如何解决跨域问题的
category: JavaScript
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 window.postMessage API 的工作原理,包括如何在不同源的窗口之间安全地传递消息、使用场景、安全性考虑,以及与 iframe 的配合使用。
tags:
  - postMessage
  - 跨域
  - JavaScript
  - Web API
estimatedTime: 20 分钟
keywords:
  - postMessage
  - 跨域通信
  - iframe
  - 窗口通信
highlight: 掌握跨域窗口通信的标准方案 postMessage API
order: 28
---

## 问题 1：什么是 postMessage

`window.postMessage()` 是 HTML5 引入的 API,用于在不同源的窗口之间安全地传递消息,从而实现跨域通信。

**核心特点**:

- 可以在不同源的窗口之间通信
- 浏览器原生支持,无需服务器配置
- 安全性高,可以验证消息来源

```javascript
// 父页面 (https://a.com)
const iframe = document.querySelector("iframe");

// 向 iframe 发送消息
iframe.contentWindow.postMessage("Hello from parent", "https://b.com");

// 子页面 (https://b.com)
window.addEventListener("message", (event) => {
  // 验证消息来源
  if (event.origin !== "https://a.com") return;

  console.log(event.data); // 'Hello from parent'

  // 回复消息
  event.source.postMessage("Hello from child", event.origin);
});
```

---

## 问题 2：postMessage 的基本用法

### 发送消息

```javascript
targetWindow.postMessage(message, targetOrigin, [transfer]);
```

**参数说明**:

- `targetWindow`: 接收消息的窗口对象
- `message`: 要发送的数据(会被结构化克隆)
- `targetOrigin`: 目标窗口的源(协议+域名+端口)
- `transfer`: 可选,传输的对象(如 ArrayBuffer)

**示例**:

```javascript
// 1. 向 iframe 发送消息
const iframe = document.querySelector("iframe");
iframe.contentWindow.postMessage(
  { type: "greeting", text: "Hello" },
  "https://example.com"
);

// 2. 向父窗口发送消息
window.parent.postMessage(
  { type: "response", data: [1, 2, 3] },
  "https://parent.com"
);

// 3. 向新打开的窗口发送消息
const newWindow = window.open("https://example.com");
newWindow.postMessage("Hello", "https://example.com");

// 4. 使用 * 作为 targetOrigin(不推荐)
iframe.contentWindow.postMessage("Hello", "*"); // ⚠️ 不安全
```

### 接收消息

```javascript
window.addEventListener("message", (event) => {
  // event 对象包含以下属性:
  // - data: 发送的消息数据
  // - origin: 发送消息的源
  // - source: 发送消息的窗口对象

  // 1. 验证消息来源(重要!)
  if (event.origin !== "https://trusted.com") {
    return; // 忽略不信任的源
  }

  // 2. 处理消息
  console.log("收到消息:", event.data);

  // 3. 回复消息
  event.source.postMessage("收到了", event.origin);
});
```

---

## 问题 3：postMessage 的常见使用场景

### 场景 1: 父页面与 iframe 通信

```javascript
// 父页面 (https://parent.com/index.html)
<!DOCTYPE html>
<html>
<body>
  <iframe id="myIframe" src="https://child.com/page.html"></iframe>

  <script>
    const iframe = document.getElementById('myIframe');

    // 等待 iframe 加载完成
    iframe.onload = () => {
      // 向 iframe 发送消息
      iframe.contentWindow.postMessage(
        { action: 'init', userId: 123 },
        'https://child.com'
      );
    };

    // 接收 iframe 的消息
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://child.com') return;

      console.log('来自 iframe 的消息:', event.data);
    });
  </script>
</body>
</html>

// 子页面 (https://child.com/page.html)
<script>
  // 接收父页面的消息
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://parent.com') return;

    console.log('来自父页面的消息:', event.data);

    // 回复父页面
    event.source.postMessage(
      { status: 'ready', message: '初始化完成' },
      event.origin
    );
  });
</script>
```

### 场景 2: 多个 iframe 之间通信

```javascript
// 父页面作为中转站
const iframe1 = document.getElementById("iframe1");
const iframe2 = document.getElementById("iframe2");

window.addEventListener("message", (event) => {
  // 验证来源
  if (event.origin !== "https://trusted.com") return;

  // 转发消息
  if (event.data.target === "iframe2") {
    iframe2.contentWindow.postMessage(
      event.data.message,
      "https://trusted.com"
    );
  }
});
```

### 场景 3: 主窗口与弹出窗口通信

```javascript
// 主窗口
const popup = window.open("https://example.com/popup.html", "popup");

// 向弹出窗口发送消息
popup.postMessage({ type: "init", data: "Hello" }, "https://example.com");

// 接收弹出窗口的消息
window.addEventListener("message", (event) => {
  if (event.origin !== "https://example.com") return;
  console.log("来自弹出窗口:", event.data);
});

// 弹出窗口
window.addEventListener("message", (event) => {
  if (event.origin !== "https://parent.com") return;

  // 回复主窗口
  window.opener.postMessage(
    { type: "response", data: "Received" },
    "https://parent.com"
  );
});
```

### 场景 4: Web Worker 通信

```javascript
// 主线程
const worker = new Worker("worker.js");

// 向 Worker 发送消息
worker.postMessage({ type: "start", data: [1, 2, 3] });

// 接收 Worker 的消息
worker.addEventListener("message", (event) => {
  console.log("Worker 返回:", event.data);
});

// worker.js
self.addEventListener("message", (event) => {
  const result = event.data.data.reduce((a, b) => a + b, 0);

  // 回复主线程
  self.postMessage({ type: "result", value: result });
});
```

---

## 问题 4：postMessage 的安全性考虑

### 1. 始终验证 origin

```javascript
// ❌ 危险:不验证来源
window.addEventListener("message", (event) => {
  eval(event.data); // 非常危险!
});

// ✅ 安全:验证来源
window.addEventListener("message", (event) => {
  // 方式 1: 精确匹配
  if (event.origin !== "https://trusted.com") {
    return;
  }

  // 方式 2: 白名单
  const allowedOrigins = ["https://a.com", "https://b.com"];
  if (!allowedOrigins.includes(event.origin)) {
    return;
  }

  // 方式 3: 正则匹配(谨慎使用)
  if (!/^https:\/\/.*\.trusted\.com$/.test(event.origin)) {
    return;
  }

  // 处理消息
  console.log(event.data);
});
```

### 2. 不要使用 \* 作为 targetOrigin

```javascript
// ❌ 危险:任何窗口都能接收消息
iframe.contentWindow.postMessage("sensitive data", "*");

// ✅ 安全:指定具体的源
iframe.contentWindow.postMessage("sensitive data", "https://trusted.com");
```

### 3. 验证消息内容

```javascript
window.addEventListener("message", (event) => {
  if (event.origin !== "https://trusted.com") return;

  // 验证消息格式
  if (typeof event.data !== "object" || !event.data.type) {
    console.error("无效的消息格式");
    return;
  }

  // 根据类型处理
  switch (event.data.type) {
    case "greeting":
      console.log(event.data.text);
      break;
    case "data":
      // 验证数据
      if (Array.isArray(event.data.value)) {
        processData(event.data.value);
      }
      break;
    default:
      console.error("未知的消息类型");
  }
});
```

### 4. 避免发送敏感信息

```javascript
// ❌ 不要发送敏感信息
iframe.contentWindow.postMessage(
  { password: "secret123" },
  "https://example.com"
);

// ✅ 使用令牌或标识符
iframe.contentWindow.postMessage(
  { token: "public-token-123" },
  "https://example.com"
);
```

---

## 问题 5：postMessage 与其他跨域方案的对比

| 特性               | postMessage       | CORS      | JSONP      |
| ------------------ | ----------------- | --------- | ---------- |
| 适用场景           | 窗口通信          | Ajax 请求 | Ajax 请求  |
| 浏览器支持         | IE8+              | IE10+     | 所有浏览器 |
| 是否需要服务器支持 | 否                | 是        | 是         |
| 安全性             | 高(需验证 origin) | 高        | 低         |
| 支持的数据类型     | 任意可序列化数据  | 任意      | JSON       |
| 双向通信           | 支持              | 支持      | 不支持     |

**使用建议**:

```javascript
// 1. 窗口/iframe 通信 → 使用 postMessage
const iframe = document.querySelector("iframe");
iframe.contentWindow.postMessage(data, origin);

// 2. Ajax 请求 → 使用 CORS
fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// 3. 兼容老旧浏览器的 GET 请求 → 使用 JSONP
jsonp("https://api.example.com/data", "callback", (data) => {
  console.log(data);
});
```

## 总结

**核心概念总结**:

### 1. postMessage 用途

- 不同源的窗口之间通信
- 父页面与 iframe 通信
- 主窗口与弹出窗口通信
- Web Worker 通信

### 2. 基本用法

- 发送: `targetWindow.postMessage(message, targetOrigin)`
- 接收: `window.addEventListener('message', handler)`
- 验证: 检查 `event.origin`

### 3. 安全要点

- 始终验证 `event.origin`
- 不要使用 `*` 作为 `targetOrigin`
- 验证消息内容和格式
- 避免发送敏感信息

### 4. 适用场景

- 跨域窗口通信的首选方案
- 不适用于 Ajax 请求(应使用 CORS)

## 延伸阅读

- [MDN - Window.postMessage()](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
- [MDN - MessageEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageEvent)
- [HTML5 规范 - postMessage](https://html.spec.whatwg.org/multipage/web-messaging.html#posting-messages)
- [Web Security - postMessage](https://portswigger.net/web-security/dom-based/postmessage)
