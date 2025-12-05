---
title: 路由的两种模式（hash / history）如何选择？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 hash 和 history 两种路由模式的原理和区别，掌握不同场景下的选择策略。
tags:
  - Vue
  - Vue Router
  - hash
  - history
estimatedTime: 12 分钟
keywords:
  - hash 模式
  - history 模式
  - 路由模式
highlight: hash 模式兼容性好无需服务器配置，history 模式 URL 更美观但需要服务器支持。
order: 229
---

## 问题 1：两种模式的原理

### Hash 模式

URL 中带有 `#`，hash 值变化不会触发页面刷新。

```
https://example.com/#/user/profile
                    ↑
                    hash 部分
```

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
})

// 原理：监听 hashchange 事件
window.addEventListener('hashchange', () => {
  console.log(location.hash)  // #/user/profile
})
```

### History 模式

使用 HTML5 History API，URL 看起来像正常路径。

```
https://example.com/user/profile
```

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
})

// 原理：使用 pushState/replaceState + popstate 事件
history.pushState({}, '', '/user/profile')
window.addEventListener('popstate', () => {
  console.log(location.pathname)  // /user/profile
})
```

---

## 问题 2：核心区别

| 特性       | Hash 模式    | History 模式   |
| ---------- | ------------ | -------------- |
| URL 格式   | `/#/path`    | `/path`        |
| 服务器配置 | 不需要       | 需要           |
| SEO        | 较差         | 较好           |
| 兼容性     | 更好（IE9+） | HTML5（IE10+） |
| 刷新页面   | 正常工作     | 需要服务器支持 |

---

## 问题 3：History 模式为什么需要服务器配置？

```
用户访问：https://example.com/user/profile

Hash 模式：
  → 服务器收到请求：https://example.com/
  → 返回 index.html
  → 前端路由处理 #/user/profile
  → ✅ 正常工作

History 模式：
  → 服务器收到请求：https://example.com/user/profile
  → 服务器找不到 /user/profile 文件
  → ❌ 返回 404
```

### 服务器配置示例

```nginx
# Nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

```apache
# Apache (.htaccess)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

```javascript
// Node.js Express
app.use(history()); // connect-history-api-fallback
```

---

## 问题 4：如何选择？

### 选择 Hash 模式

```javascript
// 适合场景：
// 1. 不想配置服务器
// 2. 静态文件托管（GitHub Pages）
// 3. 对 URL 美观度要求不高
// 4. 需要兼容老浏览器

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
})
```

### 选择 History 模式

```javascript
// 适合场景：
// 1. 有服务器配置权限
// 2. 需要 SEO
// 3. 追求 URL 美观
// 4. 正式的生产环境

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
})
```

---

## 问题 5：SEO 考量

### Hash 模式的 SEO 问题

```
https://example.com/#/products
                    ↑
搜索引擎通常忽略 # 后面的内容
所有页面被视为同一个 URL
```

### History 模式的 SEO 优势

```
https://example.com/products
https://example.com/about
https://example.com/contact

每个路由都是独立的 URL
搜索引擎可以正常索引
```

**注意**：如果需要真正的 SEO，应该考虑 SSR（服务端渲染）或 SSG（静态生成）。

---

## 问题 6：实际项目建议

```javascript
// 开发环境
const router = createRouter({
  history: createWebHistory(),  // 开发时用 history
  routes: [...]
})

// 根据环境切换
const router = createRouter({
  history: import.meta.env.PROD
    ? createWebHistory()
    : createWebHashHistory(),
  routes: [...]
})
```

### 决策流程

```
需要 SEO？
  ├── 是 → 考虑 SSR/SSG
  └── 否 → 能配置服务器？
              ├── 是 → History 模式
              └── 否 → Hash 模式
```

## 延伸阅读

- [Vue Router - 不同的历史模式](https://router.vuejs.org/zh/guide/essentials/history-mode.html)
- [MDN - History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
