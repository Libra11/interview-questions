---
title: CDN 是如何决策资源请求的
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 CDN 的工作原理、请求决策机制、缓存策略和性能优化,掌握如何利用 CDN 提升网站性能和用户体验。
tags:
  - CDN
  - 网络
  - 性能优化
  - 缓存
estimatedTime: 22 分钟
keywords:
  - CDN原理
  - DNS解析
  - 边缘节点
  - 缓存策略
highlight: CDN 通过智能 DNS 解析和边缘节点缓存,将资源就近分发给用户,大幅提升访问速度
order: 17
---

## 问题 1:什么是 CDN?

### 基本概念

CDN (Content Delivery Network) 是内容分发网络,通过在全球部署边缘节点,将内容缓存到离用户最近的节点,加速内容访问。

```javascript
// 没有 CDN
用户(北京) → 源服务器(美国) → 500ms 延迟

// 使用 CDN
用户(北京) → CDN 节点(北京) → 10ms 延迟

// 速度提升 50 倍!
```

### CDN 的价值

```javascript
// 1. 加速访问
// 就近获取资源,减少延迟

// 2. 减轻源站压力
// 大部分请求由 CDN 处理

// 3. 提高可用性
// 多节点冗余,单点故障不影响服务

// 4. 节省带宽
// CDN 承担流量,减少源站带宽成本
```

---

## 问题 2:CDN 请求决策流程

### 完整流程

```javascript
// 1. 用户请求
// https://cdn.example.com/image.jpg

// 2. DNS 解析
// cdn.example.com → CNAME → cdn-provider.com

// 3. 智能 DNS 决策
// 根据用户 IP、地理位置、网络状况
// 返回最优 CDN 节点 IP

// 4. 请求 CDN 节点
// 用户 → CDN 节点

// 5. CDN 节点处理
// 如果有缓存 → 直接返回
// 如果无缓存 → 回源获取

// 6. 返回内容
// CDN 节点 → 用户
```

### DNS 解析过程

```javascript
// 1. 用户请求
GET https://cdn.example.com/image.jpg

// 2. 本地 DNS 查询
// 查询 cdn.example.com

// 3. 返回 CNAME
// cdn.example.com CNAME cdn-provider.com

// 4. 查询 CDN 提供商 DNS
// cdn-provider.com

// 5. 智能 DNS 分析
// - 用户 IP: 1.2.3.4
// - 地理位置: 北京
// - 运营商: 电信
// - 网络质量: 良好

// 6. 返回最优节点 IP
// 返回北京电信节点: 10.20.30.40

// 7. 用户连接节点
// 用户 → 10.20.30.40
```

---

## 问题 3:CDN 节点选择策略

### 1. 地理位置

```javascript
// 根据用户地理位置选择最近的节点

// 用户在北京
// 优先选择:
// 1. 北京节点
// 2. 天津节点
// 3. 河北节点

// 用户在上海
// 优先选择:
// 1. 上海节点
// 2. 杭州节点
// 3. 南京节点
```

### 2. 网络运营商

```javascript
// 根据用户运营商选择对应节点

// 用户: 电信
// 选择: 电信节点

// 用户: 联通
// 选择: 联通节点

// 用户: 移动
// 选择: 移动节点

// 避免跨运营商访问,减少延迟
```

### 3. 节点负载

```javascript
// 根据节点负载均衡

// 节点 A: 负载 80%
// 节点 B: 负载 40%
// 节点 C: 负载 60%

// 优先选择负载较低的节点 B
```

### 4. 网络质量

```javascript
// 实时监测网络质量

// 节点 A: 延迟 10ms, 丢包率 0.1%
// 节点 B: 延迟 15ms, 丢包率 0.5%
// 节点 C: 延迟 12ms, 丢包率 0.2%

// 综合评分选择节点 A
```

---

## 问题 4:CDN 缓存策略

### 1. 缓存判断

```javascript
// CDN 节点收到请求后

// 1. 检查缓存
if (cache.has(url)) {
  // 2. 检查是否过期
  if (!cache.isExpired(url)) {
    // 3. 直接返回缓存
    return cache.get(url);
  } else {
    // 4. 验证缓存是否仍然有效
    if (validateCache(url)) {
      // 5. 更新过期时间
      cache.refresh(url);
      return cache.get(url);
    }
  }
}

// 6. 回源获取
const content = await fetchFromOrigin(url);

// 7. 缓存内容
cache.set(url, content);

// 8. 返回内容
return content;
```

### 2. 缓存时间

```javascript
// 根据 HTTP 头决定缓存时间

// 1. Cache-Control
Cache-Control: max-age=3600  // 缓存 1 小时

// 2. Expires
Expires: Wed, 21 Oct 2024 07:28:00 GMT

// 3. ETag
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// 4. Last-Modified
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

// 优先级:
// Cache-Control > Expires > ETag/Last-Modified
```

### 3. 缓存刷新

```javascript
// 主动刷新缓存

// 1. URL 刷新
// 刷新指定 URL 的缓存
POST /api/cdn/purge
{
  "urls": [
    "https://cdn.example.com/image.jpg",
    "https://cdn.example.com/style.css"
  ]
}

// 2. 目录刷新
// 刷新整个目录
POST /api/cdn/purge
{
  "dirs": [
    "https://cdn.example.com/images/"
  ]
}

// 3. 全站刷新
// 刷新所有缓存
POST /api/cdn/purge
{
  "type": "all"
}
```

---

## 问题 5:CDN 回源策略

### 1. 回源时机

```javascript
// 什么时候回源?

// 1. 缓存未命中
// CDN 节点没有该资源

// 2. 缓存过期
// 资源已过期,需要验证或重新获取

// 3. 用户强制刷新
// Ctrl+F5 或 Cache-Control: no-cache

// 4. 缓存被清除
// 主动刷新或容量不足被淘汰
```

### 2. 回源优化

```javascript
// 1. 回源合并
// 多个用户同时请求同一资源
// 只发起一次回源请求

const pendingRequests = new Map();

async function fetchWithMerge(url) {
  // 检查是否有正在进行的请求
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }
  
  // 发起新请求
  const promise = fetch(url);
  pendingRequests.set(url, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(url);
  }
}

// 2. 预热
// 提前将热门资源推送到 CDN 节点
POST /api/cdn/preheat
{
  "urls": [
    "https://cdn.example.com/hot-image.jpg"
  ]
}

// 3. 智能回源
// 选择最优的源站节点
// 源站 A: 延迟 50ms
// 源站 B: 延迟 30ms
// 选择源站 B
```

---

## 问题 6:CDN 在前端的应用

### 1. 静态资源加速

```html
<!-- 使用 CDN 加载静态资源 -->

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>

<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">

<!-- 图片 -->
<img src="https://cdn.example.com/images/logo.png">

<!-- 字体 -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto">
```

### 2. 配置 webpack 使用 CDN

```javascript
// webpack.config.js
module.exports = {
  output: {
    publicPath: 'https://cdn.example.com/'
  },
  
  externals: {
    'vue': 'Vue',
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};

// index.html
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
<script src="bundle.js"></script>
```

### 3. 图片 CDN

```javascript
// 使用图片 CDN 服务
// 支持动态处理:缩放、裁剪、格式转换等

// 原图
https://cdn.example.com/image.jpg

// 缩放到 800px 宽
https://cdn.example.com/image.jpg?w=800

// 转换为 WebP 格式
https://cdn.example.com/image.jpg?format=webp

// 质量 80%
https://cdn.example.com/image.jpg?q=80

// 组合参数
https://cdn.example.com/image.jpg?w=800&format=webp&q=80
```

### 4. 版本管理

```javascript
// 使用版本号或 hash 避免缓存问题

// 方式 1: 版本号
https://cdn.example.com/app.js?v=1.2.3

// 方式 2: 时间戳
https://cdn.example.com/app.js?t=1634567890

// 方式 3: 文件 hash (推荐)
https://cdn.example.com/app.abc123.js

// webpack 自动生成 hash
output: {
  filename: '[name].[contenthash:8].js'
}
```

---

## 问题 7:CDN 性能优化

### 1. 合理设置缓存

```javascript
// 不同类型资源设置不同缓存时间

// 长期缓存 (1 年)
// - 带 hash 的 JS/CSS
// - 不变的图片/字体
Cache-Control: public, max-age=31536000, immutable

// 短期缓存 (1 天)
// - HTML 文件
Cache-Control: public, max-age=86400

// 不缓存
// - API 接口
Cache-Control: no-cache, no-store, must-revalidate
```

### 2. 启用 HTTP/2

```javascript
// HTTP/2 优势
// 1. 多路复用 - 一个连接处理多个请求
// 2. 头部压缩 - 减少传输数据
// 3. 服务器推送 - 主动推送资源

// CDN 配置
// 大部分 CDN 默认支持 HTTP/2
// 确保源站也支持 HTTP/2
```

### 3. 图片优化

```javascript
// 使用 CDN 的图片处理能力

// 1. 自适应格式
// 自动选择最优格式 (WebP/AVIF)
<img src="https://cdn.example.com/image.jpg?auto=format">

// 2. 响应式图片
// 根据设备返回不同尺寸
<img 
  src="https://cdn.example.com/image.jpg?w=800"
  srcset="
    https://cdn.example.com/image.jpg?w=400 400w,
    https://cdn.example.com/image.jpg?w=800 800w,
    https://cdn.example.com/image.jpg?w=1200 1200w
  "
>

// 3. 懒加载
// 延迟加载图片
<img 
  src="placeholder.jpg"
  data-src="https://cdn.example.com/image.jpg"
  loading="lazy"
>
```

### 4. 预连接

```html
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 预连接 -->
<link rel="preconnect" href="https://cdn.example.com">

<!-- 预加载 -->
<link rel="preload" href="https://cdn.example.com/critical.css" as="style">
```

---

## 总结

**核心概念总结**:

### 1. CDN 工作原理

- DNS 智能解析
- 边缘节点缓存
- 就近分发内容
- 回源获取资源

### 2. 请求决策

- 地理位置
- 网络运营商
- 节点负载
- 网络质量

### 3. 缓存策略

- 缓存时间控制
- 缓存验证
- 主动刷新
- 预热机制

### 4. 性能优化

- 合理设置缓存
- 启用 HTTP/2
- 图片优化
- 预连接

## 延伸阅读

- [CDN 工作原理](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [DNS 解析](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [图片 CDN 最佳实践](https://web.dev/image-cdns/)
- [HTTP/2 介绍](https://developers.google.com/web/fundamentals/performance/http2)
