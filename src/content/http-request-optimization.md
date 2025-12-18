---
title: 如何进行 HTTP 请求数量的治理和优化？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP 请求数量对性能的影响，掌握请求合并、资源打包、缓存策略等优化技术，了解 HTTP/2 多路复用的优势，学会在实际项目中有效减少和优化 HTTP 请求。
tags:
  - HTTP
  - 性能优化
  - 请求优化
  - Web性能
estimatedTime: 25 分钟
keywords:
  - HTTP请求优化
  - 请求合并
  - 资源打包
  - 性能优化
highlight: 掌握 HTTP 请求数量治理的策略和技术，提升 Web 应用性能
order: 490
---

## 问题 1：为什么需要控制 HTTP 请求数量？

过多的 HTTP 请求会严重影响页面加载性能。

### 请求数量的性能影响

```javascript
// 性能问题示例
const performanceIssues = {
  // 1. 连接开销
  connectionOverhead: {
    problem: '每个请求都需要建立 TCP 连接',
    cost: {
      dnsLookup: '20-120ms',
      tcpHandshake: '50-200ms',
      tlsHandshake: '100-300ms',  // HTTPS
      total: '170-620ms per request'
    },
    example: `
      // 100 个请求
      // 即使每个请求只需 10ms
      // 连接开销: 100 × 200ms = 20秒
      // 实际数据传输: 100 × 10ms = 1秒
      // 总时间: 21秒（其中 95% 是连接开销）
    `
  },
  
  // 2. 浏览器并发限制
  concurrencyLimit: {
    problem: '浏览器限制同时发起的请求数',
    limits: {
      'HTTP/1.1': '每个域名 6-8 个并发连接',
      'HTTP/2': '理论上无限制，但实际有服务器限制'
    },
    example: `
      // 100 个请求，每次只能并发 6 个
      // 需要 100 / 6 ≈ 17 轮
      // 如果每轮 500ms，总时间 = 8.5秒
    `
  },
  
  // 3. 队头阻塞（HTTP/1.1）
  headOfLineBlocking: {
    problem: '一个慢请求会阻塞后续请求',
    example: `
      Request 1: [████████████████] 2s (slow)
      Request 2:                   [██] 100ms (blocked)
      Request 3:                      [██] 100ms (blocked)
      
      // Request 2 和 3 必须等待 Request 1 完成
    `
  },
  
  // 4. 带宽浪费
  bandwidthWaste: {
    problem: '每个请求都有请求头和响应头',
    overhead: `
      // 典型的请求头: 500-800 字节
      // 100 个请求 = 50-80 KB 的头部数据
      // 如果实际数据只有 10 KB
      // 头部占比 = 83%
    `
  }
};
```

### 实际案例对比

```javascript
// 案例：加载一个页面
const pageLoadComparison = {
  // ❌ 未优化：150 个请求
  unoptimized: {
    requests: 150,
    breakdown: {
      html: 1,
      css: 20,      // 20 个 CSS 文件
      js: 50,       // 50 个 JS 文件
      images: 60,   // 60 张图片
      fonts: 10,    // 10 个字体文件
      api: 9        // 9 个 API 请求
    },
    loadTime: '8.5s',
    userExperience: '糟糕'
  },
  
  // ✅ 优化后：15 个请求
  optimized: {
    requests: 15,
    breakdown: {
      html: 1,
      css: 1,       // 合并为 1 个
      js: 2,        // 合并为 2 个（vendor + app）
      images: 1,    // 雪碧图 + 懒加载
      fonts: 1,     // 合并字体
      api: 9        // API 请求保持不变
    },
    loadTime: '1.2s',
    userExperience: '优秀',
    improvement: '85% faster'
  }
};
```

---

## 问题 2：有哪些减少 HTTP 请求的策略？

### 1. 资源合并

```javascript
// CSS 合并
// ❌ 未合并：多个 CSS 文件
/*
<link rel="stylesheet" href="/css/reset.css">
<link rel="stylesheet" href="/css/layout.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/theme.css">
// 4 个请求
*/

// ✅ 合并：单个 CSS 文件
/*
<link rel="stylesheet" href="/css/bundle.css">
// 1 个请求
*/

// Webpack 配置
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js'  // 合并所有 JS
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'bundle.css'  // 合并所有 CSS
    })
  ]
};

// Vite 自动合并
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],  // 第三方库
          common: ['./src/utils', './src/components']  // 公共代码
        }
      }
    }
  }
};
```

### 2. 图片优化

```javascript
// 方式1：CSS Sprites（雪碧图）
// ❌ 多个小图标
/*
<img src="/icons/home.png">
<img src="/icons/user.png">
<img src="/icons/settings.png">
// 3 个请求
*/

// ✅ 雪碧图
/*
.icon {
  background-image: url('/images/sprites.png');
  width: 24px;
  height: 24px;
}
.icon-home { background-position: 0 0; }
.icon-user { background-position: -24px 0; }
.icon-settings { background-position: -48px 0; }
// 1 个请求
*/

// 方式2：Base64 内联（小图片）
// ✅ 小于 10KB 的图片内联
const imageOptimization = {
  webpack: `
    module: {
      rules: [
        {
          test: /\\.(png|jpg|gif)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024  // 10KB 以下内联
            }
          }
        }
      ]
    }
  `,
  
  result: `
    // 小图片 → data:image/png;base64,iVBORw0KG...
    // 大图片 → /images/photo.abc123.png
  `
};

// 方式3：SVG Symbols
/*
<!-- 定义 -->
<svg style="display: none;">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </symbol>
  <symbol id="icon-user" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
  </symbol>
</svg>

<!-- 使用 -->
<svg class="icon"><use href="#icon-home"/></svg>
<svg class="icon"><use href="#icon-user"/></svg>
// 0 个额外请求
*/

// 方式4：懒加载
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

// HTML
/*
<img data-src="/images/photo1.jpg" alt="Photo 1">
<img data-src="/images/photo2.jpg" alt="Photo 2">
// 只在可见时加载
*/
```

### 3. 代码分割

```javascript
// React 代码分割
import React, { lazy, Suspense } from 'react';

// ❌ 一次性加载所有组件
import Dashboard from './Dashboard';
import Settings from './Settings';
import Profile from './Profile';

// ✅ 按需加载
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}

// Vue 代码分割
const routes = [
  {
    path: '/dashboard',
    component: () => import('./Dashboard.vue')  // 懒加载
  },
  {
    path: '/settings',
    component: () => import('./Settings.vue')
  }
];

// Webpack 魔法注释
import(
  /* webpackChunkName: "dashboard" */
  /* webpackPrefetch: true */
  './Dashboard'
);
```

### 4. API 请求合并

```javascript
// ❌ 多个单独请求
async function loadUserData() {
  const user = await fetch('/api/user/123');
  const posts = await fetch('/api/user/123/posts');
  const comments = await fetch('/api/user/123/comments');
  const followers = await fetch('/api/user/123/followers');
  // 4 个请求
}

// ✅ 合并为单个请求
async function loadUserData() {
  const data = await fetch('/api/user/123?include=posts,comments,followers');
  // 1 个请求
}

// 服务器端实现
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const include = req.query.include?.split(',') || [];
  
  const result = {
    user: await getUser(userId)
  };
  
  if (include.includes('posts')) {
    result.posts = await getUserPosts(userId);
  }
  if (include.includes('comments')) {
    result.comments = await getUserComments(userId);
  }
  if (include.includes('followers')) {
    result.followers = await getUserFollowers(userId);
  }
  
  res.json(result);
});

// GraphQL 方式
const query = `
  query {
    user(id: "123") {
      name
      email
      posts {
        title
        content
      }
      comments {
        text
      }
      followers {
        name
      }
    }
  }
`;
// 1 个请求获取所有数据
```

### 5. 使用 HTTP/2

```javascript
// HTTP/2 的优势
const http2Benefits = {
  // 1. 多路复用
  multiplexing: {
    description: '单个连接可以并发多个请求',
    benefit: '不受浏览器并发限制',
    example: `
      // HTTP/1.1: 6 个并发连接
      Connection 1: [Req1][Req2][Req3]
      Connection 2: [Req4][Req5][Req6]
      
      // HTTP/2: 1 个连接
      Connection 1: [Req1][Req2][Req3][Req4][Req5][Req6]
                    // 同时进行
    `
  },
  
  // 2. 头部压缩
  headerCompression: {
    description: 'HPACK 压缩请求头',
    benefit: '减少头部开销 50-90%'
  },
  
  // 3. 服务器推送
  serverPush: {
    description: '服务器主动推送资源',
    example: `
      // 客户端请求 HTML
      GET /index.html
      
      // 服务器推送 CSS 和 JS
      PUSH /styles.css
      PUSH /script.js
      
      // 客户端无需额外请求
    `
  }
};

// Nginx 启用 HTTP/2
/*
server {
  listen 443 ssl http2;
  server_name example.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  # HTTP/2 服务器推送
  location / {
    http2_push /css/styles.css;
    http2_push /js/app.js;
  }
}
*/
```

---

## 问题 3：如何监控和分析 HTTP 请求？

### 1. Chrome DevTools

```javascript
// Performance API
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.entryType === 'resource') {
      console.log({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        type: entry.initiatorType
      });
    }
  });
});

performanceObserver.observe({ entryTypes: ['resource'] });

// 统计请求数量
function analyzeRequests() {
  const resources = performance.getEntriesByType('resource');
  
  const stats = {
    total: resources.length,
    byType: {},
    totalSize: 0,
    totalDuration: 0
  };
  
  resources.forEach(resource => {
    // 按类型分组
    const type = resource.initiatorType;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // 累计大小和时间
    stats.totalSize += resource.transferSize || 0;
    stats.totalDuration += resource.duration;
  });
  
  console.table(stats.byType);
  console.log('Total requests:', stats.total);
  console.log('Total size:', (stats.totalSize / 1024).toFixed(2), 'KB');
  console.log('Total time:', stats.totalDuration.toFixed(2), 'ms');
  
  return stats;
}

// 使用
setTimeout(() => {
  const stats = analyzeRequests();
}, 5000);
```

### 2. 请求瀑布图分析

```javascript
// 生成请求瀑布图数据
function generateWaterfallData() {
  const resources = performance.getEntriesByType('resource');
  const navigationStart = performance.timing.navigationStart;
  
  return resources.map(resource => ({
    name: resource.name,
    start: resource.startTime,
    duration: resource.duration,
    dns: resource.domainLookupEnd - resource.domainLookupStart,
    tcp: resource.connectEnd - resource.connectStart,
    request: resource.responseStart - resource.requestStart,
    response: resource.responseEnd - resource.responseStart,
    size: resource.transferSize
  }));
}

// 找出慢请求
function findSlowRequests(threshold = 1000) {
  const resources = performance.getEntriesByType('resource');
  
  return resources
    .filter(r => r.duration > threshold)
    .sort((a, b) => b.duration - a.duration)
    .map(r => ({
      url: r.name,
      duration: r.duration.toFixed(2) + 'ms',
      size: ((r.transferSize || 0) / 1024).toFixed(2) + 'KB'
    }));
}

console.table(findSlowRequests(500));
```

### 3. 自动化监控

```javascript
// 页面加载完成后上报
window.addEventListener('load', () => {
  setTimeout(() => {
    const stats = analyzeRequests();
    
    // 上报到监控系统
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname,
        requestCount: stats.total,
        totalSize: stats.totalSize,
        totalDuration: stats.totalDuration,
        breakdown: stats.byType,
        timestamp: Date.now()
      })
    });
  }, 1000);
});

// 设置告警阈值
const thresholds = {
  maxRequests: 50,
  maxSize: 2 * 1024 * 1024,  // 2MB
  maxDuration: 3000  // 3s
};

function checkThresholds(stats) {
  const warnings = [];
  
  if (stats.total > thresholds.maxRequests) {
    warnings.push(`Too many requests: ${stats.total}`);
  }
  
  if (stats.totalSize > thresholds.maxSize) {
    warnings.push(`Total size too large: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (stats.totalDuration > thresholds.maxDuration) {
    warnings.push(`Load time too slow: ${stats.totalDuration.toFixed(2)}ms`);
  }
  
  if (warnings.length > 0) {
    console.warn('Performance warnings:', warnings);
    // 上报告警
  }
}
```

---

## 问题 4：请求优化的最佳实践是什么？

### 优化策略总结

```javascript
const optimizationStrategies = {
  // 1. 减少请求数量
  reduceRequests: {
    techniques: [
      '合并 CSS 和 JS 文件',
      '使用 CSS Sprites',
      '内联小图片（Base64）',
      '合并 API 请求',
      '使用 SVG Symbols'
    ],
    target: '< 50 个请求'
  },
  
  // 2. 优化请求顺序
  optimizeOrder: {
    techniques: [
      '关键资源优先加载',
      '使用 <link rel="preload">',
      '延迟加载非关键资源',
      '异步加载 JS',
      '懒加载图片'
    ],
    example: `
      <!-- 预加载关键资源 -->
      <link rel="preload" href="/css/critical.css" as="style">
      <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
      
      <!-- 异步加载 JS -->
      <script src="/js/app.js" async></script>
      <script src="/js/analytics.js" defer></script>
    `
  },
  
  // 3. 利用缓存
  leverageCache: {
    techniques: [
      '设置合理的 Cache-Control',
      '使用 ETag 和 Last-Modified',
      '启用 Service Worker',
      '使用 CDN',
      '版本化资源文件名'
    ],
    example: `
      // 静态资源：长期缓存
      Cache-Control: public, max-age=31536000, immutable
      
      // HTML：不缓存
      Cache-Control: no-cache
      
      // API：短期缓存
      Cache-Control: private, max-age=300
    `
  },
  
  // 4. 使用现代协议
  modernProtocols: {
    techniques: [
      '启用 HTTP/2',
      '使用 HTTP/3（QUIC）',
      '启用 Brotli 压缩',
      '使用 WebSocket（实时数据）'
    ]
  },
  
  // 5. 监控和持续优化
  monitoring: {
    techniques: [
      '使用 Performance API',
      '设置性能预算',
      '定期审查请求',
      'A/B 测试优化效果'
    ]
  }
};
```

### 完整的优化示例

```javascript
// 1. Webpack 配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        }
      }
    ]
  }
};

// 2. HTML 优化
/*
<!DOCTYPE html>
<html>
<head>
  <!-- 预加载关键资源 -->
  <link rel="preload" href="/css/critical.css" as="style">
  <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
  
  <!-- 预连接 -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="dns-prefetch" href="https://cdn.example.com">
  
  <!-- 关键 CSS 内联 -->
  <style>
    /* Critical CSS */
  </style>
  
  <!-- 非关键 CSS 异步加载 -->
  <link rel="stylesheet" href="/css/main.css" media="print" onload="this.media='all'">
</head>
<body>
  <!-- 内容 -->
  
  <!-- JS 延迟加载 -->
  <script src="/js/vendor.js" defer></script>
  <script src="/js/app.js" defer></script>
</body>
</html>
*/

// 3. Service Worker 缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/css/main.css',
        '/js/app.js',
        '/images/logo.png'
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
```

## 总结

**HTTP 请求数量治理核心要点**：

### 1. 为什么要优化

- 连接开销大（DNS、TCP、TLS）
- 浏览器并发限制
- 队头阻塞问题
- 带宽浪费

### 2. 优化策略

- **资源合并**：CSS、JS、图片
- **代码分割**：按需加载
- **懒加载**：图片、组件
- **API 合并**：减少接口调用
- **使用 HTTP/2**：多路复用

### 3. 监控分析

- Performance API
- Chrome DevTools
- 请求瀑布图
- 自动化监控

### 4. 最佳实践

- 设置性能预算（< 50 个请求）
- 关键资源优先加载
- 充分利用缓存
- 持续监控和优化

## 延伸阅读

- [Web Performance Optimization](https://web.dev/performance/)
- [HTTP/2 Specification](https://httpwg.org/specs/rfc7540.html)
- [Resource Hints](https://www.w3.org/TR/resource-hints/)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
