---
title: BrowserRouter 和 HashRouter 的原理？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 BrowserRouter 和 HashRouter 的实现原理，掌握两者的区别和适用场景。
tags:
  - React
  - React Router
  - 路由
  - History API
estimatedTime: 12 分钟
keywords:
  - BrowserRouter
  - HashRouter
  - History API
  - hash routing
highlight: BrowserRouter 使用 History API 实现，HashRouter 使用 URL hash 实现，各有适用场景。
order: 592
---

## 问题 1：两者的基本区别？

### URL 格式

```jsx
// BrowserRouter
https://example.com/users/123
https://example.com/about

// HashRouter
https://example.com/#/users/123
https://example.com/#/about
```

### 使用方式

```jsx
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// BrowserRouter
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</BrowserRouter>

// HashRouter
<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</HashRouter>
```

---

## 问题 2：BrowserRouter 的原理？

### History API

```jsx
// 使用 HTML5 History API
window.history.pushState(state, title, url);
window.history.replaceState(state, title, url);
window.history.back();
window.history.forward();

// 监听路由变化
window.addEventListener("popstate", (event) => {
  // 浏览器前进/后退时触发
  console.log(event.state);
});
```

### 简化实现

```jsx
function BrowserRouter({ children }) {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, "", path);
    setLocation(path);
  };

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
```

### 服务器配置要求

```jsx
// 问题：直接访问 /users/123 会 404
// 因为服务器没有这个文件

// 解决：服务器配置所有路由返回 index.html

// Nginx
location / {
  try_files $uri $uri/ /index.html;
}

// Express
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
```

---

## 问题 3：HashRouter 的原理？

### Hash 变化

```jsx
// URL hash 变化不会发送请求到服务器
// 只在客户端处理

window.location.hash = "#/users/123";

// 监听 hash 变化
window.addEventListener("hashchange", (event) => {
  console.log(window.location.hash); // #/users/123
});
```

### 简化实现

```jsx
function HashRouter({ children }) {
  const [location, setLocation] = useState(
    window.location.hash.slice(1) || "/"
  );

  useEffect(() => {
    const handleHashChange = () => {
      setLocation(window.location.hash.slice(1) || "/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
```

### 无需服务器配置

```jsx
// Hash 部分不会发送到服务器
// https://example.com/#/users/123
// 服务器只收到 https://example.com/

// 所以不需要特殊的服务器配置
// 适合静态文件托管（如 GitHub Pages）
```

---

## 问题 4：如何选择？

### BrowserRouter 适合

```jsx
// 1. 有服务器控制权
// 2. 需要 SEO
// 3. 需要美观的 URL
// 4. 现代 Web 应用

// URL 示例
https://example.com/products/123
https://example.com/users/profile
```

### HashRouter 适合

```jsx
// 1. 静态文件托管（GitHub Pages、S3）
// 2. 无法配置服务器
// 3. 旧浏览器兼容
// 4. 简单的单页应用

// URL 示例
https://example.com/#/products/123
https://example.com/#/users/profile
```

---

## 问题 5：对比总结

### 特性对比

| 特性       | BrowserRouter | HashRouter |
| ---------- | ------------- | ---------- |
| URL 格式   | /path         | /#/path    |
| 实现原理   | History API   | hashchange |
| 服务器配置 | 需要          | 不需要     |
| SEO        | 友好          | 不友好     |
| 兼容性     | IE10+         | IE8+       |
| 美观度     | 好            | 一般       |

### 代码对比

```jsx
// 两者使用方式完全相同
// 只是包裹的 Router 不同

// BrowserRouter
import { BrowserRouter as Router } from "react-router-dom";

// HashRouter
import { HashRouter as Router } from "react-router-dom";

// 应用代码
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</Router>;
```

## 总结

| 方面   | BrowserRouter | HashRouter |
| ------ | ------------- | ---------- |
| 原理   | History API   | URL hash   |
| URL    | 美观          | 带 # 号    |
| 服务器 | 需配置        | 无需配置   |
| 推荐   | 生产环境      | 静态托管   |

## 延伸阅读

- [React Router 文档](https://reactrouter.com/)
- [History API MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
