---
title: SPA 首屏加载速度慢怎么解决
category: 性能优化
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入分析 SPA 首屏加载慢的原因,提供路由懒加载、代码分割、资源优化、SSR 等多种解决方案,全面提升 SPA 应用的首屏加载性能。
tags:
  - 性能优化
  - SPA
  - 首屏优化
  - 用户体验
estimatedTime: 28 分钟
keywords:
  - SPA首屏优化
  - 路由懒加载
  - 代码分割
  - SSR
highlight: SPA 首屏优化需要从资源加载、代码分割、渲染优化等多个维度综合施策
order: 64
---

## 问题 1:SPA 首屏加载慢的原因是什么?

### SPA 的加载流程

```javascript
// 传统 SPA 的加载过程
1. 下载 HTML (很小,几 KB)
2. 下载 JavaScript bundle (很大,可能几 MB)
3. 解析执行 JavaScript
4. 创建 DOM
5. 渲染页面

// 问题:用户需要等待 2-5 步全部完成才能看到内容
```

### 主要原因

```javascript
// 1. JavaScript bundle 过大
// 打包了所有页面的代码
main.js  // 2MB - 包含所有路由组件

// 2. 资源加载阻塞
<script src="main.js"></script>  // 阻塞渲染

// 3. 白屏时间长
// 在 JS 执行完成前,页面一片空白

// 4. 没有服务端渲染
// 所有内容都在客户端生成
```

---

## 问题 2:如何通过代码分割优化?

### 1. 路由懒加载

```javascript
// ❌ 不好的做法 - 同步导入所有路由
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/contact', component: Contact }
];

// ✅ 好的做法 - 路由懒加载
const routes = [
  {
    path: '/',
    component: () => import('./pages/Home')  // 访问时才加载
  },
  {
    path: '/about',
    component: () => import('./pages/About')
  },
  {
    path: '/contact',
    component: () => import('./pages/Contact')
  }
];

// 打包结果
// main.js (100KB) - 核心代码
// 0.chunk.js (50KB) - Home 页面
// 1.chunk.js (30KB) - About 页面
// 2.chunk.js (20KB) - Contact 页面

// 首屏只加载 main.js + 0.chunk.js = 150KB
// 而不是全部 200KB
```

### 2. 组件懒加载

```javascript
// React
import React, { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}

// Vue
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
```

### 3. 第三方库按需加载

```javascript
// ❌ 不好 - 导入整个库
import _ from 'lodash';
_.debounce(fn, 100);

// ✅ 好 - 按需导入
import debounce from 'lodash/debounce';
debounce(fn, 100);

// 或使用 lodash-es
import { debounce } from 'lodash-es';

// 体积对比
// 整个 lodash: 70KB
// 单个函数: 2KB
```

---

## 问题 3:如何优化资源加载?

### 1. 资源压缩

```javascript
// Webpack 配置
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      // 压缩 JS
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,  // 删除 console
          }
        }
      }),
      // 压缩 CSS
      new CssMinimizerPlugin()
    ]
  }
};

// 效果
// 压缩前: 500KB
// 压缩后: 150KB
```

### 2. Gzip 压缩

```javascript
// Webpack 插件
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,  // 只压缩大于 10KB 的文件
      minRatio: 0.8
    })
  ]
};

// Nginx 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;

// 效果
// 原始文件: 150KB
// Gzip 后: 50KB
```

### 3. 资源预加载

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="main.js" as="script">
<link rel="preload" href="style.css" as="style">
<link rel="preload" href="font.woff2" as="font" crossorigin>

<!-- 预获取未来可能需要的资源 -->
<link rel="prefetch" href="about.chunk.js">
<link rel="prefetch" href="contact.chunk.js">

<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://api.example.com">

<!-- 预连接 -->
<link rel="preconnect" href="https://cdn.example.com">
```

### 4. CDN 加速

```javascript
// 使用 CDN 加载第三方库
// webpack.config.js
module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'vue': 'Vue'
  }
};

// index.html
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>

// 好处
// 1. 减小 bundle 体积
// 2. 利用浏览器缓存
// 3. 并行下载
```

---

## 问题 4:如何优化渲染性能?

### 1. 骨架屏

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 骨架屏样式 */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- 骨架屏 -->
    <div class="skeleton" style="width: 100%; height: 60px;"></div>
    <div class="skeleton" style="width: 80%; height: 20px; margin-top: 20px;"></div>
    <div class="skeleton" style="width: 60%; height: 20px; margin-top: 10px;"></div>
  </div>
</body>
</html>
```

```javascript
// React 组件
import Skeleton from 'react-loading-skeleton';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return (
      <div>
        <Skeleton count={5} height={100} />
      </div>
    );
  }
  
  return <div>{/* 真实内容 */}</div>;
}
```

### 2. 首屏内联关键 CSS

```html
<!-- 内联首屏 CSS -->
<style>
  /* 首屏关键样式 */
  body { margin: 0; font-family: sans-serif; }
  .header { height: 60px; background: #333; }
  .hero { height: 400px; background: #f0f0f0; }
</style>

<!-- 异步加载完整 CSS -->
<link rel="preload" href="style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="style.css"></noscript>
```

### 3. 虚拟列表

```javascript
// 长列表优化
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </FixedSizeList>
  );
}

// 只渲染可见区域的元素
// 10000 条数据,只渲染 20 条
// 大幅提升性能
```

---

## 问题 5:服务端渲染 (SSR) 方案

### 1. SSR 的优势

```javascript
// 传统 SPA
// 1. 下载 HTML (空白)
// 2. 下载 JS
// 3. 执行 JS
// 4. 渲染内容 ← 用户才能看到内容

// SSR
// 1. 下载 HTML (已包含内容) ← 用户立即看到内容
// 2. 下载 JS
// 3. 激活(Hydration)
```

### 2. Next.js (React)

```javascript
// pages/index.js
export default function Home({ data }) {
  return <div>{data}</div>;
}

// 服务端获取数据
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  
  return {
    props: { data }
  };
}

// 首屏 HTML 已包含数据
// 无需等待客户端请求
```

### 3. Nuxt.js (Vue)

```javascript
// pages/index.vue
<template>
  <div>{{ data }}</div>
</template>

<script setup>
// 服务端获取数据
const { data } = await useFetch('https://api.example.com/data');
</script>
```

### 4. 静态站点生成 (SSG)

```javascript
// Next.js SSG
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  
  return {
    props: { data },
    revalidate: 60  // 60 秒后重新生成
  };
}

// 构建时生成 HTML
// 部署后直接返回静态 HTML
// 速度最快
```

---

## 问题 6:其他优化技巧

### 1. HTTP/2 Server Push

```javascript
// 服务端推送关键资源
// Node.js 示例
const http2 = require('http2');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

server.on('stream', (stream, headers) => {
  if (headers[':path'] === '/') {
    // 推送关键资源
    stream.pushStream({ ':path': '/main.js' }, (err, pushStream) => {
      pushStream.respondWithFile('main.js');
    });
    
    stream.respondWithFile('index.html');
  }
});
```

### 2. Service Worker 缓存

```javascript
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/main.js',
        '/style.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 第二次访问时从缓存加载
// 几乎瞬间完成
```

### 3. 图片优化

```html
<!-- 响应式图片 -->
<img
  src="image-800w.jpg"
  srcset="
    image-400w.jpg 400w,
    image-800w.jpg 800w,
    image-1200w.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  alt="图片"
>

<!-- 现代格式 -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="图片">
</picture>
```

### 4. 减少第三方脚本

```javascript
// ❌ 不好 - 阻塞加载
<script src="https://analytics.com/script.js"></script>

// ✅ 好 - 异步加载
<script async src="https://analytics.com/script.js"></script>

// ✅ 更好 - 延迟加载
<script defer src="https://analytics.com/script.js"></script>

// ✅ 最好 - 按需加载
window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'https://analytics.com/script.js';
  document.body.appendChild(script);
});
```

---

## 总结

**核心概念总结**:

### 1. 代码分割

- **路由懒加载**: 按需加载页面
- **组件懒加载**: 按需加载组件
- **第三方库优化**: 按需导入

### 2. 资源优化

- **压缩**: JS/CSS/图片压缩
- **Gzip**: 服务端压缩
- **CDN**: 加速资源加载
- **预加载**: preload/prefetch

### 3. 渲染优化

- **骨架屏**: 改善感知性能
- **关键 CSS**: 内联首屏样式
- **虚拟列表**: 优化长列表

### 4. SSR/SSG

- **服务端渲染**: 首屏直出
- **静态生成**: 最快的方案
- **混合模式**: 灵活选择

## 延伸阅读

- [Web.dev 性能优化](https://web.dev/fast/)
- [Next.js 性能优化](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Nuxt.js SSR](https://nuxtjs.org/docs/concepts/server-side-rendering)
- [React 代码分割](https://reactjs.org/docs/code-splitting.html)
- [Vue 路由懒加载](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [Service Worker 指南](https://developers.google.com/web/fundamentals/primers/service-workers)
