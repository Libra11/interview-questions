---
title: JS 放在 head 里和放在 body 里有什么区别
category: HTML
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  理解 JavaScript 在 HTML 中不同位置的加载和执行时机，掌握 defer 和 async 属性的使用，优化页面加载性能
tags:
  - JavaScript
  - HTML
  - 性能优化
  - 脚本加载
estimatedTime: 20 分钟
keywords:
  - script标签
  - defer
  - async
  - 脚本加载
  - 页面渲染
highlight: script 位置影响页面渲染和脚本执行时机，使用 defer/async 可以优化加载性能
order: 101
---

## 问题 1：script 放在不同位置有什么区别？

### 放在 head 中

```html
<!DOCTYPE html>
<html>
<head>
  <script src="app.js"></script>
</head>
<body>
  <div id="app">Hello</div>
</body>
</html>
```

**问题**：
- 浏览器遇到 script 标签会停止解析 HTML
- 下载并执行 JS 后才继续解析
- 页面渲染被阻塞，出现白屏
- 此时 DOM 还未生成，无法操作 DOM

```javascript
// app.js
// ❌ 错误：此时 DOM 还未生成
const app = document.getElementById('app'); // null
```

### 放在 body 底部

```html
<!DOCTYPE html>
<html>
<head>
  <title>页面</title>
</head>
<body>
  <div id="app">Hello</div>
  
  <!-- 放在 body 底部 -->
  <script src="app.js"></script>
</body>
</html>
```

**优点**：
- HTML 先解析完成，页面内容先显示
- 避免白屏时间过长
- 可以直接操作 DOM

```javascript
// app.js
// ✅ 正确：DOM 已经生成
const app = document.getElementById('app'); // <div id="app">
```

---

## 问题 2：defer 和 async 有什么区别？

### 普通 script（阻塞）

```html
<script src="app.js"></script>

<!-- 执行流程 -->
<!-- 1. 停止 HTML 解析 -->
<!-- 2. 下载 app.js -->
<!-- 3. 执行 app.js -->
<!-- 4. 继续解析 HTML -->
```

### defer（延迟执行）

```html
<script src="app.js" defer></script>

<!-- 执行流程 -->
<!-- 1. 并行下载 app.js，不阻塞 HTML 解析 -->
<!-- 2. HTML 解析完成 -->
<!-- 3. 执行 app.js -->
<!-- 4. 触发 DOMContentLoaded -->
```

**特点**：
- 异步下载，不阻塞 HTML 解析
- 在 DOMContentLoaded 之前执行
- 多个 defer 脚本按顺序执行
- 只对外部脚本有效

```html
<head>
  <script src="jquery.js" defer></script>
  <script src="app.js" defer></script>
</head>

<!-- jquery.js 先执行，app.js 后执行 -->
```

### async（异步执行）

```html
<script src="app.js" async></script>

<!-- 执行流程 -->
<!-- 1. 并行下载 app.js，不阻塞 HTML 解析 -->
<!-- 2. 下载完成后立即执行 -->
<!-- 3. 执行时会阻塞 HTML 解析 -->
```

**特点**：
- 异步下载，不阻塞 HTML 解析
- 下载完成后立即执行
- 多个 async 脚本执行顺序不确定
- 适合独立的第三方脚本

```html
<head>
  <script src="analytics.js" async></script>
  <script src="ads.js" async></script>
</head>

<!-- 哪个先下载完就先执行哪个 -->
```

### 对比总结

```html
<!-- 普通：阻塞解析，立即执行 -->
<script src="app.js"></script>

<!-- defer：不阻塞解析，HTML 解析完后按顺序执行 -->
<script src="app.js" defer></script>

<!-- async：不阻塞解析，下载完立即执行，顺序不定 -->
<script src="app.js" async></script>
```

| 特性 | 普通 | defer | async |
|------|------|-------|-------|
| 阻塞 HTML 解析 | ✅ | ❌ | ❌ |
| 执行时机 | 立即 | DOMContentLoaded 前 | 下载完立即执行 |
| 执行顺序 | 按顺序 | 按顺序 | 不确定 |
| 可操作 DOM | 取决于位置 | ✅ | 不一定 |

---

## 问题 3：如何选择合适的加载方式？

### 场景 1：依赖 DOM 的脚本

```html
<!-- 需要操作 DOM，使用 defer -->
<head>
  <script src="app.js" defer></script>
</head>
<body>
  <div id="app"></div>
</body>
```

### 场景 2：独立的第三方脚本

```html
<!-- 不依赖其他脚本，使用 async -->
<head>
  <script src="https://www.google-analytics.com/analytics.js" async></script>
  <script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" async></script>
</head>
```

### 场景 3：有依赖关系的脚本

```html
<!-- 有依赖关系，使用 defer 保证顺序 -->
<head>
  <script src="jquery.js" defer></script>
  <script src="bootstrap.js" defer></script> <!-- 依赖 jQuery -->
  <script src="app.js" defer></script> <!-- 依赖 Bootstrap -->
</head>
```

### 场景 4：关键渲染路径

```html
<!-- 关键 CSS 内联，JS 延迟加载 -->
<head>
  <style>
    /* 关键 CSS 内联 */
    body { margin: 0; }
    .header { background: #333; }
  </style>
  
  <!-- 非关键 JS 延迟加载 -->
  <script src="app.js" defer></script>
</head>
```

---

## 问题 4：动态加载脚本如何实现？

### 基本动态加载

```javascript
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`加载失败: ${src}`));
    
    document.head.appendChild(script);
  });
}

// 使用
loadScript('https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js')
  .then(() => {
    console.log('jQuery 加载完成');
    console.log($); // 可以使用 jQuery
  })
  .catch(error => {
    console.error(error);
  });
```

### 按顺序加载多个脚本

```javascript
async function loadScriptsInOrder(urls) {
  for (const url of urls) {
    await loadScript(url);
  }
}

// 使用
loadScriptsInOrder([
  'jquery.js',
  'bootstrap.js',
  'app.js'
]).then(() => {
  console.log('所有脚本加载完成');
});
```

### 并行加载脚本

```javascript
async function loadScriptsParallel(urls) {
  const promises = urls.map(url => loadScript(url));
  return Promise.all(promises);
}

// 使用
loadScriptsParallel([
  'analytics.js',
  'ads.js',
  'tracking.js'
]).then(() => {
  console.log('所有脚本加载完成');
});
```

---

## 问题 5：模块化脚本如何加载？

### ES6 模块

```html
<!-- type="module" 自动 defer -->
<script type="module" src="app.js"></script>

<!-- 等价于 -->
<script src="app.js" defer></script>
```

```javascript
// app.js
import { add } from './utils.js';

console.log(add(1, 2));
```

### 动态 import

```javascript
// 按需加载模块
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js');
  module.doSomething();
});

// 条件加载
if (condition) {
  const module = await import('./module-a.js');
} else {
  const module = await import('./module-b.js');
}
```

### 预加载模块

```html
<!-- 预加载模块，但不执行 -->
<link rel="modulepreload" href="app.js">
<link rel="modulepreload" href="utils.js">

<script type="module" src="app.js"></script>
```

---

## 总结

**核心要点**：

### 1. 位置选择
- **head 中**：阻塞渲染，可能白屏
- **body 底部**：不阻塞渲染，推荐
- **使用 defer/async**：最佳实践

### 2. defer vs async
- **defer**：顺序执行，DOM 可用
- **async**：立即执行，顺序不定
- **选择依据**：是否依赖 DOM 和其他脚本

### 3. 最佳实践
```html
<head>
  <!-- 关键 CSS 内联 -->
  <style>/* ... */</style>
  
  <!-- 依赖 DOM 的脚本用 defer -->
  <script src="app.js" defer></script>
  
  <!-- 独立脚本用 async -->
  <script src="analytics.js" async></script>
</head>
```

### 4. 现代方案
- 使用 ES6 模块（type="module"）
- 动态 import 按需加载
- 预加载关键资源（modulepreload）

---

## 延伸阅读

- [MDN - script 元素](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script)
- [MDN - defer 和 async](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script#attr-defer)
- [JavaScript 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)
- [关键渲染路径](https://web.dev/articles/critical-rendering-path)
