---
title: JSONP 是如何实现跨域的
category: 网络
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 JSONP 跨域原理,包括 JSONP 的实现机制、使用方法、优缺点,以及为什么 script 标签可以跨域加载资源。
tags:
  - JSONP
  - 跨域
  - JavaScript
  - 网络请求
estimatedTime: 20 分钟
keywords:
  - JSONP
  - 跨域
  - script标签
  - 回调函数
highlight: 理解 JSONP 利用 script 标签实现跨域的巧妙原理
order: 3
---

## 问题 1：什么是 JSONP

JSONP(JSON with Padding)是一种利用 `<script>` 标签不受同源策略限制的特性来实现跨域数据请求的技巧。

**核心思想**:

- `<script>` 标签的 `src` 属性可以加载跨域的 JavaScript 文件
- 服务器返回一段 JavaScript 代码,调用客户端预先定义的回调函数
- 通过回调函数的参数传递数据

```javascript
// 客户端定义回调函数
function handleData(data) {
  console.log(data); // { name: 'John', age: 30 }
}

// 创建 script 标签
const script = document.createElement("script");
script.src = "https://api.example.com/user?callback=handleData";
document.body.appendChild(script);

// 服务器返回的内容:
// handleData({ name: 'John', age: 30 });
```

---

## 问题 2：JSONP 的实现原理

JSONP 的实现分为客户端和服务端两部分:

### 客户端实现

```javascript
// 封装一个 JSONP 函数
function jsonp(url, callbackName, success) {
  // 1. 创建 script 标签
  const script = document.createElement("script");

  // 2. 定义全局回调函数
  window[callbackName] = function (data) {
    success(data); // 处理数据

    // 3. 清理:删除 script 标签和回调函数
    document.body.removeChild(script);
    delete window[callbackName];
  };

  // 4. 设置 src 并添加到页面
  script.src = `${url}?callback=${callbackName}`;
  document.body.appendChild(script);
}

// 使用示例
jsonp("https://api.example.com/user", "handleUser", (data) => {
  console.log("用户数据:", data);
});
```

### 服务端实现

```javascript
// Node.js + Express 示例
app.get("/user", (req, res) => {
  // 1. 获取回调函数名
  const callbackName = req.query.callback;

  // 2. 准备数据
  const data = {
    name: "John",
    age: 30,
  };

  // 3. 返回 JavaScript 代码(调用回调函数)
  res.send(`${callbackName}(${JSON.stringify(data)})`);
});

// 客户端收到的响应内容:
// handleUser({"name":"John","age":30})
```

**工作流程**:

1. 客户端创建 `<script>` 标签,指定 `src` 为接口地址
2. 在 URL 中传递回调函数名(如 `?callback=handleData`)
3. 服务器接收请求,获取回调函数名
4. 服务器返回一段 JavaScript 代码,调用该回调函数并传入数据
5. 浏览器执行返回的 JavaScript 代码,触发回调函数

---

## 问题 3：为什么 script 标签可以跨域

浏览器的同源策略主要限制的是 JavaScript 代码对跨域资源的**读取**,而不是**加载**。

**允许跨域加载的资源**:

```html
<!-- ✅ 这些标签都可以跨域加载资源 -->
<script src="https://cdn.example.com/jquery.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/style.css" />
<img src="https://cdn.example.com/image.jpg" />
<video src="https://cdn.example.com/video.mp4"></video>
```

**原因**:

- 这些标签加载的资源是**嵌入**到页面中的,不是通过 JavaScript 读取的
- 浏览器认为这种加载行为是安全的
- 但 JavaScript 无法读取跨域 `<img>` 的像素数据,无法读取跨域 `<script>` 的源代码

**JSONP 的巧妙之处**:

- 利用 `<script>` 标签可以跨域加载 JavaScript 代码
- 服务器返回的不是数据,而是可执行的 JavaScript 代码
- 这段代码调用客户端的回调函数,从而传递数据

---

## 问题 4：JSONP 有哪些优缺点

### 优点

**1. 兼容性好**

```javascript
// 支持所有浏览器,包括 IE6+
jsonp("https://api.example.com/data", "callback", (data) => {
  console.log(data);
});
```

**2. 实现简单**

- 不需要 XMLHttpRequest 或 Fetch API
- 不需要服务器设置 CORS 头部
- 只需要服务器支持回调函数包裹

### 缺点

**1. 只支持 GET 请求**

```javascript
// ❌ 无法发送 POST、PUT、DELETE 等请求
// 因为 script 标签只能发送 GET 请求
```

**2. 安全性问题**

```javascript
// ❌ 容易受到 XSS 攻击
// 如果服务器返回恶意代码,会被直接执行
// 恶意服务器返回:
// callback(alert('XSS攻击'))

// ❌ 无法确定请求是否失败
// script 标签没有错误处理机制
```

**3. 错误处理困难**

```javascript
// ❌ 难以判断请求是否成功
const script = document.createElement("script");
script.src = "https://api.example.com/data?callback=handleData";

// script.onerror 可以检测加载失败
script.onerror = () => {
  console.error("请求失败");
};

// 但无法获取 HTTP 状态码和错误信息
```

**4. 污染全局命名空间**

```javascript
// 回调函数必须是全局函数
window.handleData = function (data) {
  // ...
};

// 可能与其他代码冲突
```

---

## 问题 5：JSONP 与 CORS 的对比

| 特性               | JSONP              | CORS                |
| ------------------ | ------------------ | ------------------- |
| 支持的请求方法     | 仅 GET             | 所有 HTTP 方法      |
| 浏览器兼容性       | 所有浏览器         | IE10+               |
| 安全性             | 较低,易受 XSS 攻击 | 较高,浏览器原生支持 |
| 错误处理           | 困难               | 完善                |
| 实现复杂度         | 简单               | 需要服务器配置      |
| 是否需要服务器支持 | 需要包裹回调       | 需要设置响应头      |

**CORS 示例**:

```javascript
// 客户端(无需特殊处理)
fetch("https://api.example.com/user", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "John" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err)); // ✅ 完善的错误处理

// 服务器端
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://example.com");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
```

**现代开发建议**:

- 优先使用 CORS
- JSONP 仅在需要兼容老旧浏览器时使用
- 如果使用 JSONP,务必验证数据来源的安全性

## 总结

**核心概念总结**:

### 1. JSONP 原理

- 利用 `<script>` 标签不受同源策略限制
- 服务器返回可执行的 JavaScript 代码
- 通过回调函数传递数据

### 2. JSONP 的局限性

- 只支持 GET 请求
- 安全性较低
- 错误处理困难
- 污染全局命名空间

### 3. 使用建议

- 现代项目优先使用 CORS
- JSONP 仅用于兼容老旧浏览器
- 使用时注意安全性验证

## 延伸阅读

- [MDN - JSONP](https://developer.mozilla.org/zh-CN/docs/Glossary/JSONP)
- [MDN - CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Understanding JSONP](https://www.sitepoint.com/jsonp-examples/)
- [Why JSONP is a bad idea](https://stackoverflow.com/questions/2067472/what-is-jsonp-and-why-was-it-created)
