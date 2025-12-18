---
title: 前端路由的实现原理
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解前端路由的两种实现方式：Hash 模式和 History 模式。
  掌握路由原理有助于理解单页应用的导航机制和实现自定义路由。
tags:
  - 路由
  - Hash
  - History API
  - SPA
estimatedTime: 22 分钟
keywords:
  - 前端路由
  - Hash 路由
  - History 路由
  - 单页应用
highlight: 前端路由通过 Hash 或 History API 实现，无需刷新页面即可切换视图
order: 381
---

## 问题 1：什么是前端路由？

**前端路由是在不刷新页面的情况下，根据 URL 变化渲染不同的内容**。

### 传统多页应用 vs 单页应用

```
传统多页应用（MPA）：
/home    -> 请求 home.html
/about   -> 请求 about.html
/contact -> 请求 contact.html
每次切换都刷新整个页面

单页应用（SPA）：
/home    -> 渲染 Home 组件
/about   -> 渲染 About 组件
/contact -> 渲染 Contact 组件
只更新页面内容，不刷新页面
```

### 前端路由的优势

```javascript
// 优势：
// 1. 无刷新切换页面，用户体验好
// 2. 减少服务器压力
// 3. 前后端分离
// 4. 组件化开发

// 劣势：
// 1. 首次加载慢
// 2. SEO 不友好（需要 SSR）
// 3. 浏览器兼容性（History 模式）
```

---

## 问题 2：Hash 模式如何实现？

**Hash 模式通过监听 hashchange 事件实现路由切换**。

### Hash 路由的特点

```
URL 格式：
http://example.com/#/home
http://example.com/#/about

特点：
- # 后面的内容不会发送到服务器
- 改变 hash 不会刷新页面
- 兼容性好（IE8+）
```

### 简单实现

```javascript
class HashRouter {
  constructor() {
    // 存储路由配置
    this.routes = {};
    // 当前路由
    this.currentUrl = '';
    
    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.refresh();
    });
    
    // 监听页面加载
    window.addEventListener('load', () => {
      this.refresh();
    });
  }
  
  // 注册路由
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  // 刷新页面
  refresh() {
    // 获取当前 hash
    this.currentUrl = location.hash.slice(1) || '/';
    
    // 执行对应的回调
    const callback = this.routes[this.currentUrl];
    if (callback) {
      callback();
    }
  }
  
  // 跳转路由
  push(path) {
    location.hash = path;
  }
}

// 使用示例
const router = new HashRouter();

router.route('/', () => {
  document.getElementById('app').innerHTML = '<h1>Home</h1>';
});

router.route('/about', () => {
  document.getElementById('app').innerHTML = '<h1>About</h1>';
});

router.route('/contact', () => {
  document.getElementById('app').innerHTML = '<h1>Contact</h1>';
});

// 跳转
router.push('/about');
```

### 完整实现

```javascript
class HashRouter {
  constructor() {
    this.routes = {};
    this.currentUrl = '';
    this.history = [];
    this.currentIndex = -1;
    
    this.init();
  }
  
  init() {
    window.addEventListener('hashchange', this.refresh.bind(this));
    window.addEventListener('load', this.refresh.bind(this));
  }
  
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  refresh() {
    this.currentUrl = location.hash.slice(1) || '/';
    this.executeCallback(this.currentUrl);
  }
  
  executeCallback(url) {
    const callback = this.routes[url];
    if (callback) {
      callback();
    } else {
      // 404 处理
      const notFound = this.routes['*'];
      if (notFound) {
        notFound();
      }
    }
  }
  
  push(path) {
    // 添加到历史记录
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(path);
    this.currentIndex++;
    
    location.hash = path;
  }
  
  replace(path) {
    // 替换当前路由
    this.history[this.currentIndex] = path;
    location.replace(`#${path}`);
  }
  
  go(n) {
    const targetIndex = this.currentIndex + n;
    if (targetIndex >= 0 && targetIndex < this.history.length) {
      this.currentIndex = targetIndex;
      location.hash = this.history[targetIndex];
    }
  }
  
  back() {
    this.go(-1);
  }
  
  forward() {
    this.go(1);
  }
}
```

---

## 问题 3：History 模式如何实现？

**History 模式使用 HTML5 History API 实现路由切换**。

### History API

```javascript
// pushState：添加历史记录
history.pushState(state, title, url);

// replaceState：替换当前历史记录
history.replaceState(state, title, url);

// popstate 事件：浏览器前进/后退时触发
window.addEventListener('popstate', (event) => {
  console.log('state:', event.state);
});

// 前进/后退
history.back();
history.forward();
history.go(-2);
```

### 简单实现

```javascript
class HistoryRouter {
  constructor() {
    this.routes = {};
    this.currentUrl = '';
    
    // 监听 popstate 事件（前进/后退）
    window.addEventListener('popstate', (event) => {
      this.currentUrl = location.pathname;
      this.executeCallback(this.currentUrl, event.state);
    });
    
    // 初始化
    this.refresh();
  }
  
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  refresh() {
    this.currentUrl = location.pathname;
    this.executeCallback(this.currentUrl);
  }
  
  executeCallback(url, state) {
    const callback = this.routes[url];
    if (callback) {
      callback(state);
    }
  }
  
  push(path, state = {}) {
    history.pushState(state, '', path);
    this.currentUrl = path;
    this.executeCallback(path, state);
  }
  
  replace(path, state = {}) {
    history.replaceState(state, '', path);
    this.currentUrl = path;
    this.executeCallback(path, state);
  }
}

// 使用示例
const router = new HistoryRouter();

router.route('/', () => {
  document.getElementById('app').innerHTML = '<h1>Home</h1>';
});

router.route('/about', () => {
  document.getElementById('app').innerHTML = '<h1>About</h1>';
});

// 跳转
router.push('/about');
```

### 拦截链接点击

```javascript
class HistoryRouter {
  constructor() {
    this.routes = {};
    this.init();
  }
  
  init() {
    // 监听 popstate
    window.addEventListener('popstate', (event) => {
      this.refresh(event.state);
    });
    
    // 拦截所有链接点击
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      if (target.tagName === 'A' && target.getAttribute('href')) {
        event.preventDefault();
        const href = target.getAttribute('href');
        this.push(href);
      }
    });
    
    this.refresh();
  }
  
  route(path, callback) {
    this.routes[path] = callback;
  }
  
  refresh(state) {
    const path = location.pathname;
    const callback = this.routes[path];
    
    if (callback) {
      callback(state);
    }
  }
  
  push(path, state = {}) {
    history.pushState(state, '', path);
    this.refresh(state);
  }
  
  replace(path, state = {}) {
    history.replaceState(state, '', path);
    this.refresh(state);
  }
}
```

---

## 问题 4：Hash 和 History 模式有什么区别？

**Hash 模式兼容性好但 URL 不美观，History 模式 URL 美观但需要服务器配置**。

### 对比表格

| 特性 | Hash 模式 | History 模式 |
|------|----------|-------------|
| URL 格式 | `/#/path` | `/path` |
| 美观度 | 不美观 | 美观 |
| 兼容性 | IE8+ | IE10+ |
| 服务器配置 | 不需要 | 需要 |
| SEO | 不友好 | 相对友好 |
| 刷新 | 正常 | 需要配置 |

### 服务器配置

```nginx
# Nginx 配置
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

app.use(express.static('public'));

// 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000);
```

---

## 问题 5：如何实现路由参数和查询字符串？

**通过正则匹配和 URLSearchParams 解析参数**。

### 路由参数

```javascript
class Router {
  constructor() {
    this.routes = [];
  }
  
  route(path, callback) {
    // 将路径转换为正则表达式
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    this.routes.push({
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      callback
    });
  }
  
  match(path) {
    for (const route of this.routes) {
      const match = path.match(route.regex);
      
      if (match) {
        // 提取参数
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        
        return {
          callback: route.callback,
          params
        };
      }
    }
    
    return null;
  }
  
  navigate(path) {
    const result = this.match(path);
    
    if (result) {
      result.callback(result.params);
    }
  }
}

// 使用
const router = new Router();

router.route('/users/:id', (params) => {
  console.log('User ID:', params.id);
});

router.route('/posts/:postId/comments/:commentId', (params) => {
  console.log('Post ID:', params.postId);
  console.log('Comment ID:', params.commentId);
});

router.navigate('/users/123');  // User ID: 123
router.navigate('/posts/456/comments/789');  // Post ID: 456, Comment ID: 789
```

### 查询字符串

```javascript
class Router {
  parseQuery(url) {
    const [path, search] = url.split('?');
    const params = new URLSearchParams(search);
    const query = {};
    
    for (const [key, value] of params) {
      query[key] = value;
    }
    
    return { path, query };
  }
  
  navigate(url) {
    const { path, query } = this.parseQuery(url);
    
    const result = this.match(path);
    if (result) {
      result.callback(result.params, query);
    }
  }
}

// 使用
router.route('/search', (params, query) => {
  console.log('Query:', query);
  // Query: { q: 'react', page: '1' }
});

router.navigate('/search?q=react&page=1');
```

---

## 问题 6：如何实现路由守卫？

**在路由切换前进行权限检查或其他逻辑**。

### 路由守卫实现

```javascript
class Router {
  constructor() {
    this.routes = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }
  
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
  }
  
  afterEach(hook) {
    this.afterEachHooks.push(hook);
  }
  
  async navigate(to, from) {
    // 执行 beforeEach 钩子
    for (const hook of this.beforeEachHooks) {
      const result = await hook(to, from);
      
      if (result === false) {
        // 取消导航
        return;
      } else if (typeof result === 'string') {
        // 重定向
        return this.navigate(result, from);
      }
    }
    
    // 执行路由回调
    const route = this.match(to);
    if (route) {
      route.callback(route.params);
    }
    
    // 执行 afterEach 钩子
    for (const hook of this.afterEachHooks) {
      hook(to, from);
    }
  }
}

// 使用
const router = new Router();

// 权限检查
router.beforeEach((to, from) => {
  if (to.startsWith('/admin') && !isAuthenticated()) {
    // 重定向到登录页
    return '/login';
  }
});

// 页面统计
router.afterEach((to, from) => {
  console.log(`从 ${from} 导航到 ${to}`);
  analytics.track('page_view', { path: to });
});
```

---

## 问题 7：如何实现嵌套路由？

**通过递归匹配实现嵌套路由**。

### 嵌套路由实现

```javascript
class Router {
  constructor() {
    this.routes = [];
  }
  
  addRoute(config) {
    this.routes.push(config);
  }
  
  matchRoute(path, routes = this.routes) {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }
      
      // 检查是否匹配子路由
      if (path.startsWith(route.path) && route.children) {
        const childPath = path.slice(route.path.length);
        const childRoute = this.matchRoute(childPath, route.children);
        
        if (childRoute) {
          return {
            ...route,
            child: childRoute
          };
        }
      }
    }
    
    return null;
  }
  
  navigate(path) {
    const route = this.matchRoute(path);
    
    if (route) {
      this.renderRoute(route);
    }
  }
  
  renderRoute(route) {
    // 渲染父路由
    if (route.component) {
      route.component();
    }
    
    // 渲染子路由
    if (route.child) {
      this.renderRoute(route.child);
    }
  }
}

// 使用
const router = new Router();

router.addRoute({
  path: '/dashboard',
  component: () => console.log('Dashboard'),
  children: [
    {
      path: '/overview',
      component: () => console.log('Overview')
    },
    {
      path: '/settings',
      component: () => console.log('Settings')
    }
  ]
});

router.navigate('/dashboard/overview');
// 输出：Dashboard, Overview
```

---

## 总结

**核心原理**：

### 1. Hash 模式
- 监听 hashchange 事件
- URL 格式：`/#/path`
- 兼容性好，不需要服务器配置

### 2. History 模式
- 使用 History API
- URL 格式：`/path`
- 需要服务器配置

### 3. 核心功能
- 路由注册和匹配
- 路由参数解析
- 查询字符串解析
- 路由守卫
- 嵌套路由

### 4. 区别对比
- Hash 模式：兼容性好，URL 不美观
- History 模式：URL 美观，需要配置

### 5. 实现要点
- 监听 URL 变化
- 匹配路由规则
- 执行对应回调
- 处理历史记录

## 延伸阅读

- [History API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
- [React Router 源码](https://github.com/remix-run/react-router)
- [Vue Router 源码](https://github.com/vuejs/router)
- [前端路由原理详解](https://juejin.cn/post/6844903890278694919)
