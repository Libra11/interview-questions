---
title: React Router 中 HashRouter 和 BrowserRouter 的区别和原理
category: React
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 React Router 中两种路由模式的区别和实现原理。
  HashRouter 和 BrowserRouter 分别基于 Hash 和 History API 实现，各有优劣。
tags:
  - React Router
  - 路由
  - Hash
  - History API
estimatedTime: 20 分钟
keywords:
  - HashRouter
  - BrowserRouter
  - 前端路由
  - React Router
highlight: HashRouter 使用 URL hash，BrowserRouter 使用 History API
order: 204
---

## 问题 1：HashRouter 和 BrowserRouter 有什么区别？

**HashRouter 使用 URL 的 hash 部分，BrowserRouter 使用 HTML5 History API**。

### URL 格式对比

```
HashRouter:
http://example.com/#/home
http://example.com/#/about
http://example.com/#/user/123

BrowserRouter:
http://example.com/home
http://example.com/about
http://example.com/user/123
```

### 基本使用

```jsx
import { HashRouter, BrowserRouter, Routes, Route } from 'react-router-dom';

// HashRouter
function AppWithHash() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}

// BrowserRouter
function AppWithBrowser() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 问题 2：HashRouter 的实现原理是什么？

**HashRouter 监听 hashchange 事件来响应路由变化**。

### 核心实现

```javascript
class HashRouter {
  constructor() {
    this.routes = {};
    this.currentPath = '';
    
    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.loadRoute();
    });
    
    // 页面加载时执行
    window.addEventListener('load', () => {
      this.loadRoute();
    });
  }
  
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  loadRoute() {
    // 获取当前 hash（去掉 #）
    this.currentPath = location.hash.slice(1) || '/';
    
    // 执行对应的回调
    const handler = this.routes[this.currentPath];
    if (handler) {
      handler();
    }
  }
  
  push(path) {
    location.hash = path;
  }
  
  replace(path) {
    location.replace(`#${path}`);
  }
}
```

### Hash 的特点

```javascript
// Hash 不会发送到服务器
// http://example.com/index.html#/about
// 服务器只会收到：http://example.com/index.html

// 改变 hash 不会刷新页面
location.hash = '/new-path';  // 不刷新页面

// 会触发 hashchange 事件
window.addEventListener('hashchange', (e) => {
  console.log('旧 URL:', e.oldURL);
  console.log('新 URL:', e.newURL);
});
```

---

## 问题 3：BrowserRouter 的实现原理是什么？

**BrowserRouter 使用 History API 来管理路由**。

### 核心实现

```javascript
class BrowserRouter {
  constructor() {
    this.routes = {};
    
    // 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', (e) => {
      this.loadRoute(location.pathname, e.state);
    });
    
    // 拦截所有链接点击
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        this.push(href);
      }
    });
  }
  
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  loadRoute(path, state) {
    const handler = this.routes[path];
    if (handler) {
      handler(state);
    }
  }
  
  push(path, state = {}) {
    // 添加历史记录
    history.pushState(state, '', path);
    this.loadRoute(path, state);
  }
  
  replace(path, state = {}) {
    // 替换当前历史记录
    history.replaceState(state, '', path);
    this.loadRoute(path, state);
  }
  
  go(n) {
    history.go(n);
  }
  
  back() {
    history.back();
  }
  
  forward() {
    history.forward();
  }
}
```

### History API

```javascript
// pushState：添加历史记录
history.pushState(
  { page: 1 },      // state 对象
  'Title',          // 标题（大多数浏览器忽略）
  '/new-path'       // URL
);

// replaceState：替换当前记录
history.replaceState({ page: 2 }, '', '/another-path');

// popstate 事件：前进/后退时触发
window.addEventListener('popstate', (e) => {
  console.log('State:', e.state);
  console.log('Path:', location.pathname);
});

// 注意：pushState 和 replaceState 不会触发 popstate
```

---

## 问题 4：两者的优缺点是什么？

**HashRouter 兼容性好但 URL 不美观，BrowserRouter URL 美观但需要服务器配置**。

### 对比表格

| 特性 | HashRouter | BrowserRouter |
|------|-----------|--------------|
| URL 格式 | `/#/path` | `/path` |
| 美观度 | 不美观 | 美观 |
| 兼容性 | IE8+ | IE10+ |
| 服务器配置 | 不需要 | 需要 |
| SEO | 不友好 | 相对友好 |
| 刷新 | 正常工作 | 需要配置 |
| state 传递 | 不支持 | 支持 |

### 服务器配置需求

```nginx
# Nginx 配置（BrowserRouter 需要）
server {
  listen 80;
  server_name example.com;
  root /var/www/html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

```javascript
// Express 配置
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('build'));

// 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
```

---

## 问题 5：如何选择使用哪种路由？

**根据项目需求和部署环境选择**。

### 使用 HashRouter 的场景

```javascript
// 1. 不需要服务器配置
// 2. 兼容老旧浏览器
// 3. 静态文件部署（GitHub Pages）
// 4. 不关心 SEO

<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</HashRouter>
```

### 使用 BrowserRouter 的场景

```javascript
// 1. 需要美观的 URL
// 2. 关心 SEO
// 3. 需要使用 state 传递数据
// 4. 有服务器配置能力

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</BrowserRouter>
```

---

## 问题 6：如何传递路由状态？

**BrowserRouter 支持通过 state 传递数据**。

### 使用 state

```jsx
import { useNavigate, useLocation } from 'react-router-dom';

function ListPage() {
  const navigate = useNavigate();
  
  const handleClick = (item) => {
    // 传递 state
    navigate('/detail', {
      state: {
        from: '/list',
        item: item,
        scrollPosition: window.scrollY
      }
    });
  };
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => handleClick(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}

function DetailPage() {
  const location = useLocation();
  
  // 获取传递的 state
  const { from, item, scrollPosition } = location.state || {};
  
  useEffect(() => {
    // 返回时恢复滚动位置
    return () => {
      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    };
  }, []);
  
  return <div>详情: {item?.name}</div>;
}
```

### HashRouter 的替代方案

```jsx
// HashRouter 不支持 state，需要其他方式
function ListPage() {
  const navigate = useNavigate();
  
  const handleClick = (item) => {
    // 使用 URL 参数
    navigate(`/detail?id=${item.id}&from=list`);
    
    // 或使用 sessionStorage
    sessionStorage.setItem('detailData', JSON.stringify(item));
    navigate('/detail');
  };
}
```

---

## 问题 7：如何处理 404 页面？

**使用通配符路由捕获未匹配的路径**。

### 404 处理

```jsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/user/:id" element={<User />} />
      
      {/* 404 页面 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div>
      <h1>404 - 页面未找到</h1>
      <button onClick={() => navigate('/')}>
        返回首页
      </button>
    </div>
  );
}
```

---

## 总结

**核心区别**：

### 1. 实现原理
- HashRouter：基于 hashchange 事件
- BrowserRouter：基于 History API

### 2. URL 格式
- HashRouter：`/#/path`
- BrowserRouter：`/path`

### 3. 服务器配置
- HashRouter：不需要
- BrowserRouter：需要配置

### 4. 功能支持
- HashRouter：不支持 state
- BrowserRouter：支持 state

### 5. 选择建议
- 静态部署 → HashRouter
- 服务器部署 + SEO → BrowserRouter
- 老旧浏览器 → HashRouter
- 现代应用 → BrowserRouter

## 延伸阅读

- [React Router 官方文档](https://reactrouter.com/)
- [History API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [前端路由原理](https://github.com/remix-run/history)
- [服务器配置指南](https://create-react-app.dev/docs/deployment/)
