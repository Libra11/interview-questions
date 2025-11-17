---
title: JS 脚本延迟加载的方式有哪些？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入探讨 JavaScript 脚本延迟加载的各种方式，理解 defer、async、动态加载的区别与使用场景，掌握性能优化的最佳实践。
tags:
  - 性能优化
  - 脚本加载
  - defer
  - async
  - 动态加载
estimatedTime: 35 分钟
keywords:
  - defer
  - async
  - 动态加载
  - 脚本延迟
  - 性能优化
highlight: 理解 defer 和 async 的执行时机差异，掌握不同场景下的脚本加载策略，能够根据需求选择最合适的加载方式。
order: 28
---

## 问题 1：JavaScript 脚本延迟加载有哪些方式？

**快速总结**

| 方式 | 执行时机 | 阻塞 HTML 解析 | 执行顺序 | 适用场景 |
|------|---------|--------------|---------|---------|
| **正常加载** | 立即下载并执行 | ✅ 阻塞 | 按顺序 | 关键脚本 |
| **defer** | DOM 解析完成后执行 | ❌ 不阻塞 | 按顺序 | 依赖 DOM 的脚本 |
| **async** | 下载完成后立即执行 | ❌ 不阻塞 | 无序 | 独立脚本 |
| **动态加载** | 按需加载 | ❌ 不阻塞 | 可控 | 非关键脚本 |
| **按需加载** | 条件触发时加载 | ❌ 不阻塞 | 可控 | 交互触发 |

```html
<!-- 1. 正常加载（阻塞） -->
<script src="app.js"></script>

<!-- 2. defer 延迟执行 -->
<script defer src="app.js"></script>

<!-- 3. async 异步执行 -->
<script async src="analytics.js"></script>

<!-- 4. 动态加载 -->
<!-- 通过 JavaScript 代码动态创建 -->
```

---

## 问题 2：defer 属性的作用是什么？

**defer：延迟执行，在 DOM 解析完成后按顺序执行**

### 基本特性

```html
<!-- defer 脚本会在 HTML 解析完成后执行 -->
<script defer src="script1.js"></script>
<script defer src="script2.js"></script>
<script defer src="script3.js"></script>

<!-- 执行顺序：script1.js → script2.js → script3.js -->
```

**执行时机**

```
HTML 解析开始
  ↓
遇到 <script defer>
  ↓
继续解析 HTML（不阻塞）
  ↓
下载脚本（并行，不阻塞解析）
  ↓
HTML 解析完成（DOMContentLoaded 之前）
  ↓
按顺序执行所有 defer 脚本
  ↓
触发 DOMContentLoaded 事件
```

### 代码示例

```html
<!DOCTYPE html>
<html>
<head>
  <script defer src="defer1.js"></script>
  <script defer src="defer2.js"></script>
</head>
<body>
  <div id="content">内容</div>
  
  <script>
    // 这个脚本会立即执行
    console.log('内联脚本执行');
    
    // 此时 defer 脚本还未执行
    console.log(document.getElementById('content')); // ✅ 可以访问（HTML 已解析）
  </script>
</body>
</html>
```

```javascript
// defer1.js
console.log('defer1.js 执行');
console.log(document.getElementById('content')); // ✅ 可以访问 DOM

// defer2.js
console.log('defer2.js 执行');
```

**输出顺序**：
```
内联脚本执行
<div id="content">内容</div>
defer1.js 执行
<div id="content">内容</div>
defer2.js 执行
```

### defer 的特点

1. **不阻塞 HTML 解析**：脚本下载和执行都不会阻塞页面渲染
2. **保持执行顺序**：多个 defer 脚本按在 HTML 中的顺序执行
3. **DOM 就绪**：执行时 DOM 已经解析完成
4. **在 DOMContentLoaded 之前执行**：所有 defer 脚本执行完后才触发 DOMContentLoaded

### 使用场景

```html
<!-- ✅ 场景 1：依赖 DOM 的脚本 -->
<script defer src="init.js"></script>
<!-- init.js 需要操作 DOM 元素 -->

<!-- ✅ 场景 2：多个有依赖关系的脚本 -->
<script defer src="utils.js"></script>
<script defer src="app.js"></script>
<!-- app.js 依赖 utils.js，defer 保证顺序 -->

<!-- ✅ 场景 3：非关键脚本 -->
<script defer src="analytics.js"></script>
<!-- 不影响首屏渲染 -->
```

---

## 问题 3：async 属性的作用是什么？

**async：异步执行，下载完成后立即执行（不保证顺序）**

### 基本特性

```html
<!-- async 脚本下载完成后立即执行，不保证顺序 -->
<script async src="script1.js"></script>
<script async src="script2.js"></script>
<script async src="script3.js"></script>

<!-- 执行顺序：取决于下载速度（script2 可能先于 script1 执行） -->
```

**执行时机**

```
HTML 解析开始
  ↓
遇到 <script async>
  ↓
继续解析 HTML（不阻塞）
  ↓
下载脚本（并行）
  ↓
脚本下载完成（立即执行，不等待其他脚本）
  ↓
继续解析 HTML
```

### 代码示例

```html
<!DOCTYPE html>
<html>
<head>
  <script async src="async1.js"></script>
  <script async src="async2.js"></script>
</head>
<body>
  <div id="content">内容</div>
  
  <script>
    console.log('内联脚本执行');
  </script>
</body>
</html>
```

```javascript
// async1.js（假设下载较慢）
console.log('async1.js 执行');

// async2.js（假设下载较快）
console.log('async2.js 执行');
```

**可能的输出顺序**（取决于下载速度）：
```
内联脚本执行
async2.js 执行  ← 先下载完成
async1.js 执行  ← 后下载完成
```

### async 的特点

1. **不阻塞 HTML 解析**：脚本下载和执行都不会阻塞页面渲染
2. **不保证执行顺序**：哪个脚本先下载完成就先执行
3. **可能阻塞 DOMContentLoaded**：如果 async 脚本在 DOMContentLoaded 之前执行完，会阻塞事件触发
4. **独立脚本**：适合不依赖其他脚本的独立模块

### 使用场景

```html
<!-- ✅ 场景 1：独立的第三方脚本（如统计、广告） -->
<script async src="https://www.google-analytics.com/analytics.js"></script>

<!-- ✅ 场景 2：不依赖 DOM 的脚本 -->
<script async src="worker.js"></script>

<!-- ✅ 场景 3：无依赖关系的脚本 -->
<script async src="module1.js"></script>
<script async src="module2.js"></script>
<!-- 两个脚本互不依赖，可以并行执行 -->
```

---

## 问题 4：defer 与 async 的区别是什么？

**核心对比**

| 特性 | defer | async |
|------|-------|-------|
| **执行时机** | DOM 解析完成后 | 下载完成后立即执行 |
| **执行顺序** | ✅ 保持顺序 | ❌ 不保证顺序 |
| **阻塞 HTML 解析** | ❌ 不阻塞 | ❌ 不阻塞 |
| **阻塞 DOMContentLoaded** | ❌ 不阻塞（在之前执行） | ⚠️ 可能阻塞 |
| **DOM 就绪** | ✅ 执行时 DOM 已就绪 | ⚠️ 可能 DOM 未就绪 |
| **适用场景** | 依赖 DOM 的脚本 | 独立脚本 |

### 执行时机对比

```html
<!-- 示例：defer vs async -->
<script defer src="defer.js"></script>
<script async src="async.js"></script>

<script>
  console.log('内联脚本');
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
  });
</script>
```

**执行顺序（defer）**：
```
内联脚本
defer.js 执行
DOMContentLoaded
```

**执行顺序（async，假设 async.js 下载较快）**：
```
内联脚本
async.js 执行  ← 下载完成后立即执行
DOMContentLoaded
```

**执行顺序（async，假设 async.js 下载较慢）**：
```
内联脚本
DOMContentLoaded
async.js 执行  ← 可能晚于 DOMContentLoaded
```

### 实际应用对比

```html
<!-- ❌ 错误：使用 async 加载有依赖的脚本 -->
<script async src="jquery.js"></script>
<script async src="app.js"></script>
<!-- app.js 依赖 jquery.js，但 async 不保证顺序，可能出错 -->

<!-- ✅ 正确：使用 defer 加载有依赖的脚本 -->
<script defer src="jquery.js"></script>
<script defer src="app.js"></script>
<!-- defer 保证顺序，jquery.js 先执行 -->

<!-- ✅ 正确：使用 async 加载独立脚本 -->
<script async src="analytics.js"></script>
<script async src="ads.js"></script>
<!-- 两个脚本互不依赖，可以并行执行 -->
```

---

## 问题 5：如何动态加载脚本？

**动态加载：通过 JavaScript 代码创建 script 元素**

### 基本实现

```javascript
function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
  
  return new Promise((resolve, reject) => {
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  });
}

// 使用
loadScript('app.js')
  .then(() => {
    console.log('脚本加载完成');
    // 使用脚本中的功能
  })
  .catch(error => {
    console.error('脚本加载失败', error);
  });
```

### 支持 async/defer

```javascript
function loadScript(src, options = {}) {
  const script = document.createElement('script');
  script.src = src;
  
  // 支持 async
  if (options.async) {
    script.async = true;
  }
  
  // 支持 defer
  if (options.defer) {
    script.defer = true;
  }
  
  document.head.appendChild(script);
  
  return new Promise((resolve, reject) => {
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
  });
}

// 使用
loadScript('app.js', { async: true });
loadScript('utils.js', { defer: true });
```

### 按需加载（条件加载）

```javascript
// 场景 1：用户交互时加载
function loadAnalytics() {
  if (window.analyticsLoaded) return;
  
  loadScript('analytics.js').then(() => {
    window.analyticsLoaded = true;
    initAnalytics();
  });
}

// 用户点击按钮时加载
document.getElementById('track-button').addEventListener('click', () => {
  loadAnalytics();
});

// 场景 2：检测到特定条件时加载
if (window.innerWidth > 768) {
  // 桌面端加载特定脚本
  loadScript('desktop-features.js');
} else {
  // 移动端加载特定脚本
  loadScript('mobile-features.js');
}

// 场景 3：懒加载非关键脚本
function loadNonCriticalScripts() {
  // 使用 requestIdleCallback（如果支持）
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadScript('non-critical.js');
    });
  } else {
    // 降级方案：延迟加载
    setTimeout(() => {
      loadScript('non-critical.js');
    }, 2000);
  }
}

window.addEventListener('load', loadNonCriticalScripts);
```

### 模块化动态加载（ES Modules）

```javascript
// 动态导入 ES 模块
async function loadModule() {
  try {
    const module = await import('./module.js');
    module.doSomething();
  } catch (error) {
    console.error('模块加载失败', error);
  }
}

// 条件加载模块
if (someCondition) {
  const { default: Component } = await import('./Component.js');
  // 使用组件
}

// 路由级别的代码分割（React/Vue）
// React
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Vue
const LazyComponent = () => import('./LazyComponent.vue');
```

---

## 问题 6：如何实现脚本的预加载和预解析？

**预加载：提前下载资源，但不执行**

### 预加载（preload）

```html
<!-- 预加载关键脚本 -->
<link rel="preload" href="critical.js" as="script">
<link rel="preload" href="styles.css" as="style">

<!-- 然后在需要时执行 -->
<script src="critical.js"></script>
```

**特点**：
- 提前下载资源
- 不执行脚本
- 提高关键资源的加载速度

### 预解析（prefetch）

```html
<!-- 预解析可能需要的资源 -->
<link rel="prefetch" href="next-page.js">
<link rel="prefetch" href="next-page.css">
```

**特点**：
- 在浏览器空闲时下载
- 优先级较低
- 适合预加载下一页的资源

### DNS 预解析（dns-prefetch）

```html
<!-- 预解析第三方域名 -->
<link rel="dns-prefetch" href="https://www.google-analytics.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

**特点**：
- 提前解析 DNS
- 减少后续请求的延迟
- 适合第三方资源

### 完整示例

```html
<!DOCTYPE html>
<html>
<head>
  <!-- DNS 预解析 -->
  <link rel="dns-prefetch" href="https://cdn.example.com">
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="critical.js" as="script">
  <link rel="preload" href="critical.css" as="style">
  
  <!-- 预解析可能需要的资源 -->
  <link rel="prefetch" href="next-page.js">
  
  <!-- 正常加载 -->
  <link rel="stylesheet" href="critical.css">
</head>
<body>
  <!-- 关键脚本 -->
  <script src="critical.js"></script>
  
  <!-- 非关键脚本延迟加载 -->
  <script defer src="non-critical.js"></script>
</body>
</html>
```

---

## 问题 7：实际开发中如何选择加载方式？

### 决策树

```
需要加载脚本？
├─ 是关键脚本（影响首屏）？
│  ├─ 是 → 正常加载或 preload
│  └─ 否 → 继续
├─ 依赖 DOM？
│  ├─ 是 → defer
│  └─ 否 → 继续
├─ 依赖其他脚本？
│  ├─ 是 → defer（保证顺序）
│  └─ 否 → 继续
├─ 独立脚本（如统计、广告）？
│  ├─ 是 → async
│  └─ 否 → 继续
└─ 按需加载（用户交互触发）？
   └─ 动态加载
```

### 最佳实践

**1. 关键脚本（首屏必需）**

```html
<!-- 方式 1：正常加载（阻塞，但保证执行） -->
<script src="critical.js"></script>

<!-- 方式 2：preload + 正常加载（优化下载） -->
<link rel="preload" href="critical.js" as="script">
<script src="critical.js"></script>
```

**2. 依赖 DOM 的脚本**

```html
<!-- 使用 defer，保证 DOM 就绪 -->
<script defer src="init.js"></script>
```

**3. 有依赖关系的脚本**

```html
<!-- 使用 defer，保证执行顺序 -->
<script defer src="utils.js"></script>
<script defer src="app.js"></script>
<script defer src="components.js"></script>
```

**4. 独立第三方脚本**

```html
<!-- 使用 async，不阻塞页面 -->
<script async src="https://www.google-analytics.com/analytics.js"></script>
<script async src="https://cdn.example.com/widget.js"></script>
```

**5. 非关键脚本**

```html
<!-- 方式 1：defer（延迟执行） -->
<script defer src="analytics.js"></script>

<!-- 方式 2：动态加载（按需） -->
<script>
  window.addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = 'analytics.js';
    document.head.appendChild(script);
  });
</script>
```

**6. 路由级别的代码分割**

```javascript
// React Router
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// Vue Router
const routes = [
  {
    path: '/home',
    component: () => import('./pages/Home.vue')
  }
];
```

### 性能优化建议

```html
<!-- ✅ 推荐：关键资源优化 -->
<head>
  <!-- DNS 预解析 -->
  <link rel="dns-prefetch" href="https://cdn.example.com">
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="critical.js" as="script">
  <link rel="preload" href="critical.css" as="style">
  
  <!-- 关键 CSS 内联 -->
  <style>
    /* 关键 CSS */
  </style>
</head>
<body>
  <!-- 关键脚本 -->
  <script src="critical.js"></script>
  
  <!-- 非关键脚本延迟加载 -->
  <script defer src="non-critical.js"></script>
  
  <!-- 第三方脚本异步加载 -->
  <script async src="analytics.js"></script>
</body>
```

---

## 问题 8：现代框架中的脚本加载策略

### React 代码分割

```javascript
// 1. React.lazy（组件级别）
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// 2. 路由级别代码分割
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// 3. Webpack 动态导入
import(/* webpackChunkName: "utils" */ './utils')
  .then(module => {
    module.doSomething();
  });
```

### Vue 代码分割

```javascript
// 1. 组件级别
const AsyncComponent = () => import('./AsyncComponent.vue');

// 2. 路由级别
const routes = [
  {
    path: '/home',
    component: () => import('./pages/Home.vue')
  },
  {
    path: '/about',
    component: () => import('./pages/About.vue')
  }
];

// 3. 预加载策略
const routes = [
  {
    path: '/home',
    component: () => import(
      /* webpackPrefetch: true */
      './pages/Home.vue'
    )
  }
];
```

### Next.js 优化

```javascript
// 1. 动态导入
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./Component'), {
  loading: () => <p>Loading...</p>,
  ssr: false  // 禁用服务端渲染
});

// 2. 预加载
<Link href="/about" prefetch>
  <a>About</a>
</Link>
```

---

## 总结

### 核心对比表

| 方式 | 执行时机 | 阻塞解析 | 执行顺序 | 适用场景 |
|------|---------|---------|---------|---------|
| **正常加载** | 立即 | ✅ | 按顺序 | 关键脚本 |
| **defer** | DOM 解析后 | ❌ | 按顺序 | 依赖 DOM 的脚本 |
| **async** | 下载完成后 | ❌ | 无序 | 独立脚本 |
| **动态加载** | 按需 | ❌ | 可控 | 非关键脚本 |
| **preload** | 提前下载 | ❌ | - | 关键资源优化 |

### 关键要点

1. **defer**：延迟执行，保持顺序，适合依赖 DOM 的脚本
2. **async**：异步执行，不保证顺序，适合独立脚本
3. **动态加载**：按需加载，灵活控制，适合非关键脚本
4. **preload/prefetch**：提前下载资源，优化加载性能
5. **代码分割**：现代框架通过路由和组件级别分割，实现按需加载

### 最佳实践

1. **关键脚本**：正常加载或 preload
2. **依赖 DOM 的脚本**：使用 defer
3. **有依赖关系的脚本**：使用 defer 保证顺序
4. **独立第三方脚本**：使用 async
5. **非关键脚本**：动态加载或 defer
6. **路由级别**：使用框架的代码分割功能

### 推荐阅读

- [MDN: defer](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#attr-defer)
- [MDN: async](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#attr-async)
- [Web.dev: Preload, Prefetch, And Priorities](https://web.dev/preload-prefetch-and-priorities/)
- [Web.dev: Code Splitting](https://web.dev/code-splitting-suspense/)

