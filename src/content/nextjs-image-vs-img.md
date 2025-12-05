---
title: next/image 和原生 img 的区别？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  了解 Next.js Image 组件相比原生 img 标签的优势，掌握图片优化的最佳实践
tags:
  - Next.js
  - Image 优化
  - next/image
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - next/image
  - Image 组件
  - 图片优化
  - 原生 img
highlight: next/image 提供自动优化、懒加载和响应式图片，显著提升性能和用户体验
order: 12
---

## 问题 1：next/image 提供了哪些自动优化？

Next.js Image 组件会自动优化图片，无需手动处理。

### 自动格式转换

```javascript
// 原生 img
<img src="/photo.jpg" alt="Photo" />;
// 浏览器下载原始 JPG 文件

// next/image
import Image from "next/image";

<Image src="/photo.jpg" alt="Photo" width={800} height={600} />;

// Next.js 自动：
// - 检测浏览器支持
// - 转换为 WebP（Chrome、Edge、Firefox）
// - 转换为 AVIF（支持的浏览器）
// - 降级到 JPG（旧浏览器）
```

### 自动尺寸优化

```javascript
// 原生 img
<img src="/large-photo.jpg" alt="Photo" width="400" />
// 下载完整的大图（可能 2MB），然后缩放显示

// next/image
<Image
  src="/large-photo.jpg"
  alt="Photo"
  width={400}
  height={300}
/>

// Next.js 自动：
// - 生成 400px 宽的版本
// - 只下载需要的尺寸（可能 50KB）
// - 节省带宽和加载时间
```

### 响应式图片

```javascript
// 原生 img：需要手动配置
<picture>
  <source media="(min-width: 1200px)" srcset="/photo-large.jpg" />
  <source media="(min-width: 768px)" srcset="/photo-medium.jpg" />
  <img src="/photo-small.jpg" alt="Photo" />
</picture>

// next/image：自动生成
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// 自动生成多个尺寸：
// - 640w, 750w, 828w, 1080w, 1200w, 1920w, 2048w, 3840w
// - 浏览器根据屏幕尺寸选择最合适的
```

---

## 问题 2：懒加载如何工作？

next/image 默认启用懒加载，提升页面加载性能。

### 原生 img 的懒加载

```javascript
// 需要手动添加 loading 属性
<img src="/photo.jpg" alt="Photo" loading="lazy" />

// 问题：
// - 需要记得添加
// - 没有占位符，可能导致布局偏移
// - 浏览器兼容性问题
```

### next/image 的懒加载

```javascript
import Image from "next/image";

// 默认懒加载
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />;

// 工作原理：
// 1. 图片进入视口前不加载
// 2. 使用 Intersection Observer API
// 3. 提前一定距离开始加载（rootMargin）
// 4. 自动显示占位符，避免布局偏移
```

### 优先加载关键图片

```javascript
// 首屏关键图片：禁用懒加载
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // 立即加载，不懒加载
/>

// 折叠下方的图片：懒加载
<Image
  src="/content.jpg"
  alt="Content"
  width={800}
  height={600}
  // 默认懒加载
/>
```

### 占位符

```javascript
// 模糊占位符
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // 小尺寸模糊图
/>;

// 或者使用静态导入自动生成
import photo from "@/public/photo.jpg";

<Image
  src={photo}
  alt="Photo"
  placeholder="blur" // 自动生成 blurDataURL
/>;

// 效果：
// 1. 立即显示模糊占位符
// 2. 图片加载完成后淡入
// 3. 避免空白区域
```

---

## 问题 3：next/image 如何防止布局偏移（CLS）？

布局偏移是影响用户体验的重要指标。

### 原生 img 的问题

```javascript
// ❌ 没有指定尺寸
<img src="/photo.jpg" alt="Photo" />

// 问题：
// 1. 浏览器不知道图片尺寸
// 2. 图片加载前不预留空间
// 3. 图片加载后页面内容跳动
// 4. 导致 CLS（Cumulative Layout Shift）增加
```

### next/image 的解决方案

**方案 1：固定尺寸**

```javascript
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// Next.js 自动：
// 1. 计算宽高比
// 2. 预留正确的空间
// 3. 图片加载后不会导致布局偏移
```

**方案 2：fill 布局**

```javascript
<div style={{ position: "relative", width: "100%", height: "400px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "cover" }} />
</div>

// 图片填充父容器
// 父容器尺寸已知，不会偏移
```

**方案 3：响应式容器**

```javascript
<div style={{ position: "relative", aspectRatio: "16/9", width: "100%" }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>

// 使用 aspect-ratio 保持比例
// 容器高度自动计算
```

---

## 问题 4：next/image 的其他优势

### 自动缓存

```javascript
// next/image
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// 优化后的图片自动缓存：
// /_next/image?url=%2Fphoto.jpg&w=828&q=75

// 缓存策略：
// Cache-Control: public, max-age=31536000, immutable

// 原生 img
<img src="/photo.jpg" alt="Photo" />

// 需要手动配置服务器缓存头
```

### 质量控制

```javascript
// 默认质量：75（平衡质量和大小）
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// 高质量图片
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  quality={90}
/>

// 缩略图（更小的文件）
<Image
  src="/photo.jpg"
  alt="Photo"
  width={200}
  height={150}
  quality={60}
/>
```

### 自动 srcset 生成

```javascript
// next/image 自动生成
<Image src="/photo.jpg" alt="Photo" width={800} height={600} />

// 生成的 HTML：
<img
  srcset="
    /_next/image?url=%2Fphoto.jpg&w=640&q=75 640w,
    /_next/image?url=%2Fphoto.jpg&w=750&q=75 750w,
    /_next/image?url=%2Fphoto.jpg&w=828&q=75 828w,
    /_next/image?url=%2Fphoto.jpg&w=1080&q=75 1080w,
    /_next/image?url=%2Fphoto.jpg&w=1200&q=75 1200w,
    /_next/image?url=%2Fphoto.jpg&w=1920&q=75 1920w
  "
  src="/_next/image?url=%2Fphoto.jpg&w=1920&q=75"
/>

// 原生 img 需要手动写
<img
  srcset="
    /photo-640.jpg 640w,
    /photo-750.jpg 750w,
    /photo-828.jpg 828w
  "
  src="/photo-828.jpg"
/>
```

### 错误处理

```javascript
"use client";

import Image from "next/image";
import { useState } from "react";

export default function SafeImage({ src, alt, ...props }) {
  const [error, setError] = useState(false);

  if (error) {
    return <div className="image-placeholder">图片加载失败</div>;
  }

  return (
    <Image src={src} alt={alt} onError={() => setError(true)} {...props} />
  );
}
```

---

## 问题 5：什么时候使用原生 img？

虽然 next/image 很强大，但某些场景下原生 img 更合适。

### 场景 1：外部不可控图片

```javascript
// ❌ next/image 需要配置域名
<Image
  src="https://random-api.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>;

// 需要在 next.config.js 中配置
module.exports = {
  images: {
    domains: ["random-api.com"],
  },
};

// ✅ 原生 img 无需配置
<img src="https://random-api.com/photo.jpg" alt="Photo" />;
```

### 场景 2：SVG 图标

```javascript
// SVG 不需要优化
<img src="/icon.svg" alt="Icon" width="24" height="24" />

// 或者直接内联
<svg width="24" height="24">
  <path d="..." />
</svg>
```

### 场景 3：Base64 图片

```javascript
// 小图标使用 base64
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..." alt="Icon" />
```

### 场景 4：CSS 背景图

```javascript
// CSS 背景图使用原生方式
<div
  style={{
    backgroundImage: 'url(/background.jpg)',
    backgroundSize: 'cover'
  }}
>
  内容
</div>

// 或者使用 next/image 的 fill
<div style={{ position: 'relative', height: '400px' }}>
  <Image
    src="/background.jpg"
    alt="Background"
    fill
    style={{ objectFit: 'cover', zIndex: -1 }}
  />
  <div style={{ position: 'relative', zIndex: 1 }}>
    内容
  </div>
</div>
```

---

## 总结

**核心概念总结**：

### 1. 自动优化

- 格式转换（WebP、AVIF）
- 尺寸优化（只下载需要的大小）
- 响应式图片（自动生成多个尺寸）
- 质量控制（平衡质量和文件大小）

### 2. 性能提升

- 默认懒加载（节省带宽）
- 优先加载关键图片（priority）
- 自动缓存（immutable 缓存策略）
- 占位符（避免空白）

### 3. 用户体验

- 防止布局偏移（预留空间）
- 模糊占位符（渐进加载）
- 错误处理（优雅降级）
- 自动 srcset（最佳尺寸）

### 4. 使用建议

- 默认使用 next/image
- 关键图片添加 priority
- 提供 width 和 height
- 外部图片配置 domains
- SVG 和 base64 使用原生 img

## 延伸阅读

- [next/image 官方文档](https://nextjs.org/docs/app/api-reference/components/image)
- [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Cumulative Layout Shift](https://web.dev/cls/)
- [WebP and AVIF](https://web.dev/uses-webp-images/)
