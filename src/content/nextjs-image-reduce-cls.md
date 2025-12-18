---
title: 图片优化如何减少 CLS？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  了解如何通过图片优化减少 CLS（Cumulative Layout Shift），提升用户体验和 Core Web Vitals 评分
tags:
  - Next.js
  - CLS
  - 图片优化
  - Web Vitals
estimatedTime: 20 分钟
keywords:
  - CLS
  - Cumulative Layout Shift
  - 布局偏移
  - 图片优化
highlight: 通过预留空间、使用占位符和正确的尺寸配置可以有效防止图片导致的布局偏移
order: 102
---

## 问题 1：什么是 CLS？

CLS（Cumulative Layout Shift）衡量页面视觉稳定性，是 Core Web Vitals 的重要指标。

### CLS 的定义

```javascript
// CLS 计算公式
CLS = Σ(影响分数 × 距离分数)

// 影响分数：元素移动前后占据的视口面积
// 距离分数：元素移动的距离

// 示例：
// 元素占据 50% 视口
// 向下移动 25% 视口高度
// CLS = 0.5 × 0.25 = 0.125
```

### CLS 评分标准

```javascript
// 优秀：< 0.1
// 需要改进：0.1 - 0.25
// 较差：> 0.25

// 图片导致的 CLS 示例
<img src="/photo.jpg" alt="Photo" />
// 问题：
// 1. 浏览器不知道图片尺寸
// 2. 图片加载前不预留空间
// 3. 图片加载后页面内容向下移动
// 4. CLS 增加
```

### 图片导致 CLS 的场景

```javascript
// 场景 1：未指定尺寸的图片
<img src="/hero.jpg" alt="Hero" />;
// 加载前：占据 0px 高度
// 加载后：占据 600px 高度
// 下方内容向下移动 600px

// 场景 2：动态加载的图片
useEffect(() => {
  fetch("/api/images")
    .then((res) => res.json())
    .then((images) => setImages(images));
}, []);

// 图片加载后插入 DOM，导致布局偏移

// 场景 3：响应式图片尺寸错误
<img
  src="/photo.jpg"
  alt="Photo"
  width="800"
  height="600"
  style={{ width: "100%", height: "auto" }}
/>;
// 在小屏幕上可能导致意外的高度
```

---

## 问题 2：next/image 如何防止 CLS？

next/image 通过多种机制自动防止 CLS。

### 自动预留空间

```javascript
// next/image 自动计算宽高比并预留空间
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>

// 生成的 HTML 包含：
<span style="
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  margin: 0;
">
  <span style="
    box-sizing: border-box;
    display: block;
    max-width: 100%;
    padding-top: 75%; /* 600/800 = 75% */
  "></span>
  <img src="..." />
</span>

// 效果：
// 1. 使用 padding-top 预留空间
// 2. 图片加载前就有正确的高度
// 3. 图片加载后不会导致布局偏移
```

### 响应式尺寸

```javascript
// 响应式图片也能正确预留空间
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  style={{ width: "100%", height: "auto" }}
/>

// 在不同屏幕尺寸下：
// 320px 宽：预留 240px 高度（320 × 0.75）
// 768px 宽：预留 576px 高度（768 × 0.75）
// 1200px 宽：预留 900px 高度（1200 × 0.75）

// 始终保持 4:3 的宽高比
```

### fill 模式

```javascript
// 使用 fill 时，父容器尺寸已知
<div style={{ position: "relative", width: "100%", height: "400px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "cover" }} />
</div>

// 效果：
// 1. 父容器高度固定（400px）
// 2. 图片填充父容器
// 3. 不会导致布局偏移
```

---

## 问题 3：如何使用占位符减少 CLS？

占位符可以提供更好的加载体验。

### 模糊占位符

```javascript
// 使用 blur 占位符
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>

// 效果：
// 1. 立即显示模糊的占位图
// 2. 占位图已经占据正确的空间
// 3. 真实图片加载后淡入替换
// 4. 整个过程无布局偏移
```

### 静态导入自动生成

```javascript
// 静态导入会自动生成 blurDataURL
import photo from "@/public/photo.jpg";

<Image
  src={photo}
  alt="Photo"
  placeholder="blur" // 自动使用生成的 blurDataURL
/>;

// Next.js 在构建时：
// 1. 读取图片文件
// 2. 生成小尺寸模糊版本（约 10x10 像素）
// 3. 转换为 base64
// 4. 嵌入到代码中
```

### 自定义占位符

```javascript
// 使用纯色占位符
<div style={{
  position: 'relative',
  width: '100%',
  height: '400px',
  backgroundColor: '#f0f0f0' // 占位背景色
}}>
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// 使用骨架屏
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  {!imageLoaded && <Skeleton />}
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    onLoadingComplete={() => setImageLoaded(true)}
  />
</div>
```

---

## 问题 4：常见导致 CLS 的错误

### 错误 1：未指定尺寸

```javascript
// ❌ 错误：没有 width 和 height
<Image src="/photo.jpg" alt="Photo" />
// 错误：Image with src "/photo.jpg" must use "width" and "height" properties

// ✅ 正确：指定尺寸
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>

// ✅ 或使用 fill
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>
```

### 错误 2：动态内容插入

```javascript
// ❌ 错误：图片加载后插入
'use client';

export default function Gallery() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('/api/images')
      .then(res => res.json())
      .then(data => setImages(data)); // 导致布局偏移
  }, []);

  return (
    <div>
      {images.map(img => (
        <Image key={img.id} src={img.url} alt={img.alt} width={300} height={200} />
      ))}
    </div>
  );
}

// ✅ 正确：预留空间
'use client';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/images')
      .then(res => res.json())
      .then(data => {
        setImages(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {loading ? (
        // 显示占位符，预留空间
        Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-[3/2] bg-gray-200" />
        ))
      ) : (
        images.map(img => (
          <Image
            key={img.id}
            src={img.url}
            alt={img.alt}
            width={300}
            height={200}
          />
        ))
      )}
    </div>
  );
}
```

### 错误 3：CSS 覆盖尺寸

```javascript
// ❌ 错误：CSS 改变了图片尺寸
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  className="custom-image"
/>

// CSS
.custom-image {
  width: 100%;
  height: 300px !important; // 强制改变高度
}
// 导致宽高比不一致，可能产生 CLS

// ✅ 正确：使用 object-fit
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  style={{
    width: '100%',
    height: 'auto' // 保持宽高比
  }}
/>
```

### 错误 4：父容器尺寸不确定

```javascript
// ❌ 错误：父容器高度由内容决定
<div style={{ position: 'relative', width: '100%' }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>
// 父容器没有高度，图片无法正确显示

// ✅ 正确：指定父容器高度
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>

// ✅ 或使用 aspect-ratio
<div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>
```

---

## 问题 5：如何测量和优化 CLS？

### 使用 Chrome DevTools

```javascript
// 1. 打开 Chrome DevTools
// 2. 切换到 Performance 面板
// 3. 勾选 "Screenshots" 和 "Web Vitals"
// 4. 录制页面加载
// 5. 查看 Layout Shift 事件

// 查看具体哪些元素导致了偏移
// 点击 Layout Shift 事件查看详情
```

### 使用 Lighthouse

```javascript
// 1. 打开 Chrome DevTools
// 2. 切换到 Lighthouse 面板
// 3. 选择 "Performance"
// 4. 点击 "Generate report"
// 5. 查看 CLS 分数和建议

// Lighthouse 会指出：
// - CLS 分数
// - 导致偏移的元素
// - 优化建议
```

### 使用 Web Vitals 库

```javascript
// 安装
// npm install web-vitals

// app/layout.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (metric.name === "CLS") {
      console.log("CLS:", metric.value);

      // 发送到分析服务
      fetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
        }),
      });
    }
  });

  return null;
}
```

### 实时监控

```javascript
// 使用 PerformanceObserver
"use client";

import { useEffect } from "react";

export default function CLSMonitor() {
  useEffect(() => {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log("Layout Shift:", entry.value);
          console.log("Total CLS:", clsValue);

          // 记录导致偏移的元素
          console.log("Affected elements:", entry.sources);
        }
      }
    });

    observer.observe({ type: "layout-shift", buffered: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
```

---

## 总结

**核心概念总结**：

### 1. CLS 的影响

- 影响用户体验（内容跳动）
- 影响 SEO 排名（Core Web Vitals）
- 图片是主要原因之一

### 2. next/image 的防护

- 自动预留空间（padding-top）
- 保持宽高比
- 支持响应式尺寸
- fill 模式需要父容器尺寸

### 3. 占位符策略

- 模糊占位符（blur）
- 静态导入自动生成
- 纯色背景
- 骨架屏

### 4. 常见错误

- 未指定尺寸
- 动态插入内容
- CSS 覆盖尺寸
- 父容器尺寸不确定

### 5. 测量和优化

- Chrome DevTools Performance
- Lighthouse
- Web Vitals 库
- 实时监控

## 延伸阅读

- [Cumulative Layout Shift (CLS)](https://web.dev/cls/)
- [Optimize CLS](https://web.dev/optimize-cls/)
- [Core Web Vitals](https://web.dev/vitals/)
- [next/image and CLS](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
