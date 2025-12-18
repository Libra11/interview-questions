---
title: CSS 加载会造成阻塞吗
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS 加载对页面渲染的影响,包括 CSS 是否阻塞 DOM 解析、是否阻塞渲染、以及如何优化 CSS 加载性能。
tags:
  - CSS
  - 性能优化
  - 页面渲染
  - 阻塞
estimatedTime: 18 分钟
keywords:
  - CSS阻塞
  - 渲染阻塞
  - DOM解析
  - 性能优化
highlight: 理解 CSS 加载机制,优化页面渲染性能
order: 100
---

## 问题 1：CSS 加载是否阻塞 DOM 解析

**答案**: CSS 加载**不会阻塞** DOM 解析,但会**阻塞**页面渲染。

```html
<head>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div>内容 1</div>
  <div>内容 2</div>
  <script>
    // DOM 已经解析完成,可以访问
    console.log(document.querySelectorAll("div").length); // 2
  </script>
</body>
```

**工作流程**:

1. 浏览器开始解析 HTML
2. 遇到 `<link>` 标签,开始下载 CSS(异步)
3. 继续解析 HTML,构建 DOM 树
4. CSS 下载完成前,页面不会渲染(白屏)
5. CSS 下载完成,构建 CSSOM 树
6. 合并 DOM 树和 CSSOM 树,生成渲染树
7. 页面渲染

---

## 问题 2：CSS 为什么会阻塞渲染

### 原因

浏览器需要 CSSOM(CSS Object Model)和 DOM 一起构建渲染树,如果 CSS 未加载完成,浏览器无法确定元素的样式,因此会等待 CSS 加载完成。

```
HTML 解析 → DOM 树 ┐
                    ├→ 渲染树 → 渲染
CSS 解析 → CSSOM 树 ┘
```

### 示例

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 这个 CSS 文件很大,需要 3 秒加载 -->
    <link rel="stylesheet" href="large-styles.css" />
  </head>
  <body>
    <h1>标题</h1>
    <p>内容</p>

    <!-- 页面会白屏 3 秒,直到 CSS 加载完成 -->
  </body>
</html>
```

### CSS 阻塞的影响

```html
<head>
  <link rel="stylesheet" href="slow.css" />
</head>
<body>
  <div>内容</div>

  <script>
    // ✅ DOM 已解析,可以访问
    console.log(document.querySelector("div"));

    // ❌ 但页面还没渲染,用户看不到内容
  </script>
</body>
```

---

## 问题 3：CSS 是否阻塞 JavaScript 执行

**答案**: CSS 会**阻塞** JavaScript 执行(如果 JS 在 CSS 后面)。

### 原因

JavaScript 可能会查询元素的样式信息,因此浏览器必须等待 CSS 加载完成,确保 JS 获取到正确的样式。

```html
<head>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="box">内容</div>

  <script>
    // 这段脚本会等待 styles.css 加载完成
    const box = document.getElementById("box");
    const color = getComputedStyle(box).color;
    console.log(color); // 需要等 CSS 加载完成
  </script>
</body>
```

### 不同位置的影响

```html
<!-- 情况 1: JS 在 CSS 前面 -->
<head>
  <script src="script.js"></script>
  <link rel="stylesheet" href="styles.css" />
</head>
<!-- ✅ script.js 不会被 CSS 阻塞 -->

<!-- 情况 2: JS 在 CSS 后面 -->
<head>
  <link rel="stylesheet" href="styles.css" />
  <script src="script.js"></script>
</head>
<!-- ❌ script.js 会等待 styles.css 加载完成 -->

<!-- 情况 3: JS 使用 async -->
<head>
  <link rel="stylesheet" href="styles.css" />
  <script src="script.js" async></script>
</head>
<!-- ✅ script.js 不会被 CSS 阻塞 -->
```

---

## 问题 4：如何优化 CSS 加载

### 方法 1: 内联关键 CSS

```html
<head>
  <!-- 内联首屏必需的 CSS -->
  <style>
    .header {
      /* 关键样式 */
    }
    .hero {
      /* 关键样式 */
    }
  </style>

  <!-- 异步加载其他 CSS -->
  <link
    rel="preload"
    href="main.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <noscript><link rel="stylesheet" href="main.css" /></noscript>
</head>
```

### 方法 2: 使用 media 属性

```html
<!-- 根据媒体查询加载 -->
<link rel="stylesheet" href="mobile.css" media="(max-width: 768px)" />
<link rel="stylesheet" href="desktop.css" media="(min-width: 769px)" />

<!-- 打印样式不阻塞渲染 -->
<link rel="stylesheet" href="print.css" media="print" />
```

### 方法 3: 异步加载非关键 CSS

```html
<!-- 方式 1: 使用 media 技巧 -->
<link
  rel="stylesheet"
  href="non-critical.css"
  media="print"
  onload="this.media='all'"
/>

<!-- 方式 2: 使用 JavaScript -->
<script>
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "non-critical.css";
  document.head.appendChild(link);
</script>

<!-- 方式 3: 使用 preload -->
<link
  rel="preload"
  href="styles.css"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```

### 方法 4: 压缩和合并

```bash
# 压缩 CSS
npx cssnano input.css output.min.css

# 移除未使用的 CSS
npx purgecss --css input.css --content index.html --output output.css
```

### 方法 5: 使用 CDN

```html
<!-- 使用 CDN 加速加载 -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css" />

<!-- 添加 crossorigin 属性 -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css" crossorigin />
```

### 方法 6: 资源提示

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://cdn.example.com" />

<!-- 预连接 -->
<link rel="preconnect" href="https://cdn.example.com" />

<!-- 预加载 -->
<link rel="preload" href="styles.css" as="style" />

<!-- 预获取(低优先级) -->
<link rel="prefetch" href="next-page.css" />
```

---

## 问题 5：完整的优化方案

### 优化前

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- ❌ 阻塞渲染 -->
    <link rel="stylesheet" href="reset.css" />
    <link rel="stylesheet" href="layout.css" />
    <link rel="stylesheet" href="components.css" />
    <link rel="stylesheet" href="utilities.css" />
  </head>
  <body>
    <header>头部</header>
    <main>内容</main>
    <footer>底部</footer>
  </body>
</html>
```

### 优化后

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- 1. 内联关键 CSS -->
    <style>
      /* 首屏必需的样式 */
      header {
        /* ... */
      }
      main {
        /* ... */
      }
    </style>

    <!-- 2. 预连接到 CDN -->
    <link rel="preconnect" href="https://cdn.example.com" />

    <!-- 3. 预加载字体 -->
    <link
      rel="preload"
      href="font.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

    <!-- 4. 异步加载非关键 CSS -->
    <link
      rel="preload"
      href="main.css"
      as="style"
      onload="this.onload=null;this.rel='stylesheet'"
    />
    <noscript><link rel="stylesheet" href="main.css" /></noscript>

    <!-- 5. 打印样式 -->
    <link rel="stylesheet" href="print.css" media="print" />
  </head>
  <body>
    <header>头部</header>
    <main>内容</main>
    <footer>底部</footer>

    <!-- 6. 延迟加载底部样式 -->
    <script>
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "footer.css";
          document.head.appendChild(link);
        });
      }
    </script>
  </body>
</html>
```

### 性能对比

```javascript
// 测量 CSS 加载时间
performance
  .getEntriesByType("resource")
  .filter((entry) => entry.name.endsWith(".css"))
  .forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });

// 测量首次内容绘制(FCP)
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === "first-contentful-paint") {
      console.log("FCP:", entry.startTime);
    }
  }
});
observer.observe({ entryTypes: ["paint"] });
```

## 总结

**核心概念**:

### 1. CSS 阻塞行为

- 不阻塞 DOM 解析
- 阻塞页面渲染
- 阻塞后续 JavaScript 执行

### 2. 阻塞原因

- 浏览器需要 CSSOM 和 DOM 构建渲染树
- JavaScript 可能查询样式信息

### 3. 优化方法

- 内联关键 CSS
- 异步加载非关键 CSS
- 使用 media 属性
- 压缩和合并
- 使用 CDN
- 资源提示(preload, prefetch)

### 4. 最佳实践

- 首屏 CSS 内联
- 非关键 CSS 异步加载
- 移除未使用的 CSS
- 使用 HTTP/2 多路复用

## 延伸阅读

- [MDN - 关键渲染路径](https://developer.mozilla.org/zh-CN/docs/Web/Performance/Critical_rendering_path)
- [Google Developers - 优化 CSS 传送](https://developers.google.com/web/fundamentals/performance/critical-rendering-path/render-blocking-css)
- [Web.dev - Extract critical CSS](https://web.dev/extract-critical-css/)
- [CSS Tricks - The Simplest Way to Load CSS Asynchronously](https://css-tricks.com/the-simplest-way-to-load-css-asynchronously/)
