---
title: 前端路由的 hash 和 history 模式有什么区别
category: 前端工程化
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  深入理解前端路由的两种实现模式，掌握 hash 和 history 模式的原理、区别以及各自的适用场景
tags:
  - 前端路由
  - SPA
  - hash
  - history
estimatedTime: 22 分钟
keywords:
  - hash模式
  - history模式
  - 前端路由
  - pushState
  - replaceState
highlight: hash 模式使用 URL 锚点，history 模式使用 HTML5 History API，各有优缺点
order: 103
---

## 问题 1：hash 模式是什么？

### 基本原理

```javascript
// hash 模式的 URL
https://example.com/#/home
https://example.com/#/user/123
https://example.com/#/about

// # 后面的部分称为 hash
// hash 的变化不会触发页面刷新
// 可以通过 hashchange 事件监听 hash 变化
```

### 实现原理

```javascript
class HashRouter {
  constructor() {
    this.routes = {};
    this.currentUrl = '';
    
    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.currentUrl = location.hash.slice(1) || '/';
      this.render();
    });
    
    // 页面加载时执行一次
    window.addEventListener('load', () => {
      this.currentUrl = location.hash.slice(1) || '/';
      this.render();
    });
  }
  
  // 注册路由
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  // 渲染对应路由
  render() {
    const callback = this.routes[this.currentUrl];
    if (callback) {
      callback();
    }
  }
}

// 使用
const router = new HashRouter();

router.route('/', () => {
  document.getElementById('app').innerHTML = '<h1>首页</h1>';
});

router.route('/about', () => {
  document.getElementById('app').innerHTML = '<h1>关于</h1>';
});

router.route('/user/:id', () => {
  document.getElementById('app').innerHTML = '<h1>用户详情</h1>';
});
```

### 特点

```javascript
// ✅ 优点：
// 1. 兼容性好，支持所有浏览器
// 2. 不需要服务器配置
// 3. hash 变化不会发送请求到服务器

// ❌ 缺点：
// 1. URL 中有 # 号，不美观
// 2. SEO 不友好
// 3. 服务端无法获取 hash 部分
```

---

## 问题 2：history 模式是什么？

### 基本原理

```javascript
// history 模式的 URL
https://example.com/home
https://example.com/user/123
https://example.com/about

// 使用 HTML5 History API
// pushState() - 添加历史记录
// replaceState() - 替换当前历史记录
// popstate 事件 - 监听前进/后退
```

### 实现原理

```javascript
class HistoryRouter {
  constructor() {
    this.routes = {};
    
    // 监听前进/后退
    window.addEventListener('popstate', () => {
      this.render(location.pathname);
    });
    
    // 拦截所有链接点击
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        this.push(href);
      }
    });
    
    // 页面加载时执行
    this.render(location.pathname);
  }
  
  // 注册路由
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  // 跳转路由
  push(path) {
    history.pushState(null, '', path);
    this.render(path);
  }
  
  // 替换路由
  replace(path) {
    history.replaceState(null, '', path);
    this.render(path);
  }
  
  // 渲染对应路由
  render(path) {
    const callback = this.routes[path];
    if (callback) {
      callback();
    }
  }
}

// 使用
const router = new HistoryRouter();

router.route('/', () => {
  document.getElementById('app').innerHTML = '<h1>首页</h1>';
});

router.route('/about', () => {
  document.getElementById('app').innerHTML = '<h1>关于</h1>';
});

// 跳转
router.push('/about');
```

### 特点

```javascript
// ✅ 优点：
// 1. URL 美观，没有 # 号
// 2. SEO 友好
// 3. 可以使用完整的 URL

// ❌ 缺点：
// 1. 需要服务器配置（重定向到 index.html）
// 2. IE9 及以下不支持
// 3. 刷新页面会向服务器发送请求
```

---

## 问题 3：两种模式有什么区别？

### URL 形式

```javascript
// hash 模式
https://example.com/#/home
https://example.com/#/user/123

// history 模式
https://example.com/home
https://example.com/user/123
```

### 实现方式

```javascript
// hash 模式
// 监听 hashchange 事件
window.addEventListener('hashchange', () => {
  const hash = location.hash.slice(1);
  // 渲染对应组件
});

// history 模式
// 使用 pushState/replaceState
history.pushState(null, '', '/home');

// 监听 popstate 事件
window.addEventListener('popstate', () => {
  const path = location.pathname;
  // 渲染对应组件
});
```

### 服务器配置

```nginx
# hash 模式：不需要特殊配置

# history 模式：需要配置
# Nginx 配置
server {
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

```javascript
// Node.js (Express) 配置
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
```

### 对比表格

| 特性 | hash 模式 | history 模式 |
|------|-----------|--------------|
| URL 形式 | `/#/path` | `/path` |
| 美观度 | 有 # 号 | 无 # 号 |
| 兼容性 | 所有浏览器 | IE10+ |
| 服务器配置 | 不需要 | 需要 |
| SEO | 不友好 | 友好 |
| 刷新页面 | 不发请求 | 发请求 |

---

## 问题 4：Vue Router 如何使用？

### hash 模式

```javascript
// Vue Router 3.x
import VueRouter from 'vue-router';

const router = new VueRouter({
  mode: 'hash', // 默认就是 hash
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

// Vue Router 4.x
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});
```

### history 模式

```javascript
// Vue Router 3.x
const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});

// Vue Router 4.x
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
});
```

### React Router

```javascript
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// hash 模式
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}

// history 模式
function App() {
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

## 问题 5：如何选择路由模式？

### 选择 hash 模式

```javascript
// 适用场景：
// 1. 不需要 SEO（后台管理系统）
// 2. 无法配置服务器
// 3. 需要兼容老浏览器
// 4. 快速开发，不想配置服务器

// 示例：后台管理系统
const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/dashboard', component: Dashboard },
    { path: '/users', component: Users },
    { path: '/settings', component: Settings }
  ]
});
```

### 选择 history 模式

```javascript
// 适用场景：
// 1. 需要 SEO（官网、博客）
// 2. 追求 URL 美观
// 3. 可以配置服务器
// 4. 不需要兼容老浏览器

// 示例：官网
const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/products', component: Products },
    { path: '/about', component: About }
  ]
});

// 服务器配置（Nginx）
// location / {
//   try_files $uri $uri/ /index.html;
// }
```

### 混合使用

```javascript
// 根据环境动态选择
const router = new VueRouter({
  mode: process.env.NODE_ENV === 'production' ? 'history' : 'hash',
  routes: [...]
});
```

---

## 总结

**核心要点**：

### 1. hash 模式
- URL 带 # 号
- 监听 hashchange 事件
- 不需要服务器配置
- 兼容性好

### 2. history 模式
- URL 美观
- 使用 History API
- 需要服务器配置
- SEO 友好

### 3. 选择建议
- **后台系统**：hash 模式
- **官网/博客**：history 模式
- **无服务器配置权限**：hash 模式
- **追求 SEO**：history 模式

### 4. 服务器配置
```nginx
# Nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 延伸阅读

- [MDN - History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [Vue Router - 不同的历史模式](https://router.vuejs.org/zh/guide/essentials/history-mode.html)
- [React Router - BrowserRouter](https://reactrouter.com/en/main/router-components/browser-router)
- [前端路由原理](https://juejin.cn/post/6844903890278694919)
