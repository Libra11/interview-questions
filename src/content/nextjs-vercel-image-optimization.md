---
title: 为什么 next/image 默认使用 Vercel Image Optimization？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  了解 Vercel Image Optimization 的工作原理，以及为什么它是 next/image 的默认选择
tags:
  - Next.js
  - Vercel
  - Image 优化
  - CDN
estimatedTime: 18 分钟
keywords:
  - Vercel Image Optimization
  - next/image
  - 图片优化
  - 边缘计算
highlight: Vercel Image Optimization 提供边缘计算、自动格式转换和全球 CDN 分发
order: 13
---

## 问题 1：Vercel Image Optimization 是什么？

Vercel Image Optimization 是一个图片处理和分发服务，专为 Next.js 设计。

### 核心功能

**1. 实时图片转换**

```javascript
// 原始请求
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// 生成的 URL
/_next/image?url=%2Fphoto.jpg&w=828&q=75

// Vercel 处理流程：
// 1. 接收请求
// 2. 检测浏览器支持的格式
// 3. 转换为最优格式（WebP/AVIF）
// 4. 调整尺寸到 828px
// 5. 压缩质量到 75%
// 6. 返回优化后的图片
```

**2. 边缘缓存**

```
用户请求 → 最近的边缘节点 → 缓存检查
                              ↓ 未命中
                         图片优化服务
                              ↓
                         缓存结果
                              ↓
                         返回给用户

// 后续请求直接从边缘缓存返回
```

**3. 自动格式选择**

```javascript
// Chrome 浏览器
Accept: image/avif,image/webp,image/apng,*/*

// Vercel 返回 AVIF（最小）

// Safari 浏览器
Accept: image/webp,image/apng,*/*

// Vercel 返回 WebP

// IE 浏览器
Accept: image/jpeg,image/png,*/*

// Vercel 返回 JPEG（兼容）
```

---

## 问题 2：为什么选择 Vercel Image Optimization 作为默认？

这是 Next.js 和 Vercel 深度集成的结果。

### 优势 1：零配置

```javascript
// 部署到 Vercel 后，自动启用
// 无需任何配置

// next.config.js
module.exports = {
  // 默认配置，无需修改
  images: {
    // loader: 'default', // 使用 Vercel Image Optimization
  },
};

// 对比其他方案：
// - Cloudinary：需要注册账号、配置 API Key
// - Imgix：需要设置域名、配置参数
// - 自托管：需要安装 sharp、配置服务器
```

### 优势 2：全球 CDN

```javascript
// Vercel 在全球有 100+ 边缘节点
// 用户请求自动路由到最近的节点

// 示例：
// 中国用户 → 香港节点（延迟 ~20ms）
// 美国用户 → 旧金山节点（延迟 ~10ms）
// 欧洲用户 → 法兰克福节点（延迟 ~15ms）

// 对比自托管：
// 所有用户 → 单一服务器（延迟 100-500ms）
```

### 优势 3：自动扩展

```javascript
// 流量突增时自动扩展
// 无需担心服务器容量

// 场景：文章被分享到社交媒体
// 1 分钟内 10,000 个图片请求

// Vercel：自动处理，无需干预
// 自托管：可能导致服务器过载
```

### 优势 4：成本效益

```javascript
// Vercel 免费套餐：
// - 1,000 次图片优化/月
// - 适合小型项目

// Pro 套餐：$20/月
// - 5,000 次图片优化
// - 超出部分 $5/1000 次

// 对比自托管成本：
// - 服务器：$10-50/月
// - CDN：$20-100/月
// - 维护时间：无价
```

---

## 问题 3：Vercel Image Optimization 的限制

虽然功能强大，但也有一些限制。

### 限制 1：优化次数

```javascript
// 免费套餐限制
const limits = {
  hobby: 1000, // 每月 1,000 次
  pro: 5000, // 每月 5,000 次
  enterprise: "unlimited", // 无限制
};

// 超出后的行为：
// - 返回原始图片（未优化）
// - 不会报错，但失去优化效果
```

### 限制 2：源图片大小

```javascript
// 最大源图片大小：50MB

// ❌ 超过限制
<Image
  src="/huge-photo.jpg" // 60MB
  alt="Photo"
  width={800}
  height={600}
/>
// 错误：Source image is too large

// ✅ 压缩后使用
// 先用工具压缩到 50MB 以下
```

### 限制 3：外部图片域名

```javascript
// 需要在 next.config.js 中配置
module.exports = {
  images: {
    domains: ["example.com", "cdn.example.com"],
    // 或使用 remotePatterns（更灵活）
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.example.com",
        port: "",
        pathname: "/images/**",
      },
    ],
  },
};

// 未配置的域名会报错
<Image
  src="https://unknown.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>;
// 错误：Invalid src prop
```

### 限制 4：动态路由限制

```javascript
// Vercel 对图片优化 URL 有速率限制
// 避免滥用

// ❌ 可能触发限制
for (let i = 0; i < 1000; i++) {
  fetch(`/_next/image?url=/photo.jpg&w=${i}&q=75`);
}

// ✅ 使用标准尺寸
const standardSizes = [640, 750, 828, 1080, 1200, 1920];
```

---

## 问题 4：如何监控图片优化使用量？

### Vercel Dashboard

```javascript
// 访问 Vercel Dashboard
// https://vercel.com/dashboard

// 查看指标：
// 1. Analytics → Image Optimization
// 2. 查看当前月份使用量
// 3. 查看历史趋势
// 4. 设置用量警告
```

### 自定义监控

```javascript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // 记录图片请求
  if (request.nextUrl.pathname.startsWith("/_next/image")) {
    const url = request.nextUrl.searchParams.get("url");
    const width = request.nextUrl.searchParams.get("w");

    // 发送到分析服务
    fetch("https://analytics.example.com/image", {
      method: "POST",
      body: JSON.stringify({
        url,
        width,
        timestamp: Date.now(),
      }),
    });
  }

  return NextResponse.next();
}
```

### 优化建议

```javascript
// 1. 使用适当的图片尺寸
// ❌ 过大
<Image src="/photo.jpg" alt="Photo" width={3840} height={2160} />

// ✅ 合适
<Image src="/photo.jpg" alt="Photo" width={1200} height={800} />

// 2. 启用缓存
// 优化后的图片会被缓存，减少重复优化

// 3. 使用静态导入
import photo from '@/public/photo.jpg';

<Image src={photo} alt="Photo" />
// 构建时生成优化版本，减少运行时优化

// 4. 合理使用 quality
// ❌ 过高质量
<Image src="/photo.jpg" alt="Photo" width={800} height={600} quality={100} />

// ✅ 默认质量
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />
// quality 默认 75，已经足够好
```

---

## 问题 5：Vercel Image Optimization 的工作原理

### 请求流程

```javascript
// 1. 用户请求页面
GET /posts

// 2. HTML 包含 Image 组件
<img
  srcset="
    /_next/image?url=%2Fphoto.jpg&w=640&q=75 640w,
    /_next/image?url=%2Fphoto.jpg&w=828&q=75 828w,
    /_next/image?url=%2Fphoto.jpg&w=1200&q=75 1200w
  "
/>

// 3. 浏览器选择合适的尺寸
// 假设选择 828w

// 4. 请求图片
GET /_next/image?url=%2Fphoto.jpg&w=828&q=75

// 5. 请求到达 Vercel Edge Network

// 6. 边缘节点检查缓存
if (cached) {
  return cachedImage; // 缓存命中，直接返回
}

// 7. 缓存未命中，转发到图片优化服务

// 8. 图片优化服务处理
// - 从源获取原始图片
// - 检测浏览器支持的格式
// - 转换格式（AVIF/WebP/JPEG）
// - 调整尺寸到 828px
// - 压缩质量到 75%

// 9. 返回优化后的图片

// 10. 边缘节点缓存结果
cache(optimizedImage, {
  maxAge: 31536000, // 1 年
  immutable: true,
});

// 11. 返回给浏览器
```

### 缓存策略

```javascript
// 响应头
Cache-Control: public, max-age=31536000, immutable

// 含义：
// - public：允许 CDN 和浏览器缓存
// - max-age=31536000：缓存 1 年
// - immutable：告诉浏览器内容永不改变

// 缓存键
const cacheKey = `${url}-${width}-${quality}-${format}`;

// 示例：
// /photo.jpg-828-75-webp
// /photo.jpg-1200-75-avif
// /photo.jpg-640-75-jpeg

// 不同参数生成不同的缓存
```

### 格式选择逻辑

```javascript
// 伪代码
function selectFormat(acceptHeader, originalFormat) {
  // 1. 检查浏览器支持
  if (acceptHeader.includes("image/avif")) {
    return "avif"; // 最小文件，最新格式
  }

  if (acceptHeader.includes("image/webp")) {
    return "webp"; // 较小文件，广泛支持
  }

  // 2. 降级到原始格式
  if (originalFormat === "png") {
    return "png"; // 保持透明度
  }

  return "jpeg"; // 默认格式
}

// 实际效果：
// Chrome 93+：AVIF（最小）
// Chrome 32-92：WebP
// Safari 14+：WebP
// Safari <14：JPEG/PNG
// IE：JPEG/PNG
```

---

## 总结

**核心概念总结**：

### 1. Vercel Image Optimization 优势

- 零配置，开箱即用
- 全球 CDN，低延迟
- 自动扩展，无需维护
- 成本效益高

### 2. 工作原理

- 实时图片转换和优化
- 边缘节点缓存
- 自动格式选择（AVIF/WebP/JPEG）
- 智能尺寸调整

### 3. 使用限制

- 每月优化次数限制
- 源图片大小限制（50MB）
- 需要配置外部域名
- 速率限制

### 4. 最佳实践

- 使用合适的图片尺寸
- 默认质量（75）已足够
- 静态导入减少运行时优化
- 监控使用量，避免超限

## 延伸阅读

- [Vercel Image Optimization](https://vercel.com/docs/image-optimization)
- [next/image 官方文档](https://nextjs.org/docs/app/api-reference/components/image)
- [Image Optimization Pricing](https://vercel.com/docs/image-optimization/limits-and-pricing)
- [Edge Network](https://vercel.com/docs/edge-network/overview)
- [WebP and AVIF](https://web.dev/uses-webp-images/)
