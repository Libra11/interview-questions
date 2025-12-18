---
title: Web 系统中如何对图片进行优化
category: 性能优化
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  全面掌握 Web 图片优化的各种技术手段，包括格式选择、压缩、懒加载、响应式图片、CDN 等，从多个维度提升网站性能和用户体验。
tags:
  - 性能优化
  - 图片优化
  - Web性能
  - 用户体验
estimatedTime: 28 分钟
keywords:
  - 图片优化
  - 懒加载
  - WebP
  - 响应式图片
highlight: 图片优化是 Web 性能优化的重中之重，通常能带来 50% 以上的性能提升
order: 24
---

## 问题 1：为什么图片优化如此重要？

### 图片在 Web 中的占比

根据 HTTP Archive 的统计数据：

```javascript
// 典型网页的资源占比
图片: 50-60%  // 最大的资源类型
JavaScript: 15-20%
CSS: 5-10%
HTML: 3-5%
其他: 10-20%
```

### 图片对性能的影响

```javascript
// 未优化的图片
<img src="photo.jpg" />  // 5MB，加载 10 秒

// 优化后的图片
<img src="photo.webp" />  // 500KB，加载 1 秒

// 性能提升
// - 加载时间减少 90%
// - 流量节省 90%
// - 用户体验显著提升
```

---

## 问题 2：如何选择合适的图片格式？

### 常见图片格式对比

**1. JPEG**

```javascript
// 适用场景：照片、复杂图像
// 优点：压缩率高，文件小
// 缺点：不支持透明，有损压缩

<img src="photo.jpg" alt="风景照片" />

// 压缩示例
// 原图: 5MB
// 质量 90%: 800KB  // 肉眼几乎无差别
// 质量 80%: 400KB  // 轻微质量损失
// 质量 60%: 200KB  // 明显质量损失
```

**2. PNG**

```javascript
// 适用场景：需要透明背景、图标、截图
// 优点：无损压缩，支持透明
// 缺点：文件较大

<img src="logo.png" alt="Logo" />

// PNG-8 vs PNG-24
// PNG-8: 256 色，适合简单图标
// PNG-24: 1600万色，适合复杂图像
```

**3. WebP**

```javascript
// 适用场景：现代浏览器，替代 JPEG 和 PNG
// 优点：压缩率高，支持透明和动画
// 缺点：旧浏览器不支持

<picture>
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="照片" />
</picture>

// 压缩对比
// JPEG (80%): 400KB
// WebP (80%): 250KB  // 节省 37.5%
```

**4. SVG**

```javascript
// 适用场景：图标、Logo、简单图形
// 优点：矢量格式，无限缩放，文件小
// 缺点：不适合复杂图像

<img src="icon.svg" alt="图标" />

// 或者内联 SVG
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 2L2 7v10l10 5 10-5V7z" />
</svg>
```

**5. AVIF**

```javascript
// 适用场景：最新的图片格式
// 优点：压缩率最高
// 缺点：浏览器支持有限

<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="照片" />
</picture>

// 压缩对比
// JPEG: 400KB
// WebP: 250KB
// AVIF: 150KB  // 节省 62.5%
```

### 格式选择决策树

```javascript
// 决策流程
if (是简单图标或Logo) {
  return 'SVG';
} else if (需要透明背景) {
  if (支持现代浏览器) {
    return 'WebP';
  } else {
    return 'PNG';
  }
} else if (是照片或复杂图像) {
  if (支持最新浏览器) {
    return 'AVIF';
  } else if (支持现代浏览器) {
    return 'WebP';
  } else {
    return 'JPEG';
  }
}
```

---

## 问题 3：如何实现图片懒加载？

### 1. 原生懒加载

最简单的方式是使用浏览器原生的 `loading` 属性：

```html
<!-- 原生懒加载 -->
<img src="photo.jpg" loading="lazy" alt="照片" />

<!-- 立即加载（默认） -->
<img src="hero.jpg" loading="eager" alt="首屏图片" />
```

**浏览器支持**：
- Chrome 77+
- Firefox 75+
- Safari 15.4+
- Edge 79+

### 2. Intersection Observer API

更灵活的懒加载实现：

```javascript
// 创建观察器
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    // 当图片进入视口
    if (entry.isIntersecting) {
      const img = entry.target;
      
      // 加载真实图片
      img.src = img.dataset.src;
      
      // 如果有 srcset
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
      
      // 停止观察
      observer.unobserve(img);
    }
  });
}, {
  // 提前 50px 开始加载
  rootMargin: '50px',
});

// 观察所有懒加载图片
document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

```html
<!-- HTML 结构 -->
<img 
  data-src="photo.jpg" 
  data-srcset="photo-320w.jpg 320w, photo-640w.jpg 640w"
  src="placeholder.jpg"
  alt="照片" 
/>
```

### 3. 渐进式加载

先加载低质量图片，再加载高质量图片：

```javascript
function progressiveLoad(img) {
  // 1. 先显示模糊的缩略图
  img.src = img.dataset.lowsrc;
  
  // 2. 加载高质量图片
  const highResImg = new Image();
  highResImg.src = img.dataset.src;
  
  highResImg.onload = () => {
    // 3. 高质量图片加载完成后替换
    img.src = highResImg.src;
    img.classList.add('loaded');
  };
}
```

```html
<img 
  data-lowsrc="photo-blur.jpg"  <!-- 10KB 模糊图 -->
  data-src="photo.jpg"           <!-- 500KB 高清图 -->
  alt="照片"
/>
```

```css
/* 平滑过渡效果 */
img {
  filter: blur(10px);
  transition: filter 0.3s;
}

img.loaded {
  filter: blur(0);
}
```

---

## 问题 4：如何实现响应式图片？

### 1. srcset 和 sizes

根据屏幕大小加载不同尺寸的图片：

```html
<img 
  src="photo-640w.jpg"
  srcset="
    photo-320w.jpg 320w,
    photo-640w.jpg 640w,
    photo-1024w.jpg 1024w,
    photo-1920w.jpg 1920w
  "
  sizes="
    (max-width: 320px) 280px,
    (max-width: 640px) 600px,
    (max-width: 1024px) 960px,
    1200px
  "
  alt="响应式图片"
/>
```

**工作原理**：

```javascript
// 浏览器根据屏幕宽度和 DPR 选择合适的图片
// 例如：iPhone 12 (375px, 3x DPR)
// 实际需要：375 * 3 = 1125px 宽的图片
// 浏览器会选择：photo-1024w.jpg 或 photo-1920w.jpg
```

### 2. picture 元素

更精确的控制，支持不同格式和艺术指导：

```html
<picture>
  <!-- 移动端：竖版图片 -->
  <source 
    media="(max-width: 768px)" 
    srcset="photo-mobile.webp"
    type="image/webp"
  />
  
  <!-- 桌面端：横版图片 -->
  <source 
    media="(min-width: 769px)" 
    srcset="photo-desktop.webp"
    type="image/webp"
  />
  
  <!-- 降级方案 -->
  <img src="photo.jpg" alt="照片" />
</picture>
```

### 3. CSS 响应式背景图

```css
.hero {
  background-image: url('hero-mobile.jpg');
}

@media (min-width: 768px) {
  .hero {
    background-image: url('hero-tablet.jpg');
  }
}

@media (min-width: 1024px) {
  .hero {
    background-image: url('hero-desktop.jpg');
  }
}

/* 支持 WebP */
@supports (background-image: url('test.webp')) {
  .hero {
    background-image: url('hero-mobile.webp');
  }
}
```

---

## 问题 5：如何压缩和优化图片？

### 1. 自动化压缩工具

**构建时压缩**：

```javascript
// vite.config.js
import viteImagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    viteImagemin({
      // JPEG 压缩
      mozjpeg: {
        quality: 80,
      },
      // PNG 压缩
      pngquant: {
        quality: [0.7, 0.8],
      },
      // WebP 转换
      webp: {
        quality: 80,
      },
    }),
  ],
};
```

**在线压缩工具**：
- TinyPNG (https://tinypng.com/)
- Squoosh (https://squoosh.app/)
- ImageOptim (Mac 应用)

### 2. 图片 CDN

使用图片 CDN 实现动态优化：

```html
<!-- 原始图片 -->
<img src="https://cdn.example.com/photo.jpg" />

<!-- 使用 CDN 参数优化 -->
<img src="https://cdn.example.com/photo.jpg?w=800&q=80&fm=webp" />

<!-- 参数说明 -->
<!-- w=800: 宽度 800px -->
<!-- q=80: 质量 80% -->
<!-- fm=webp: 格式转换为 WebP -->
```

**常见图片 CDN**：
- Cloudinary
- Imgix
- 阿里云 OSS
- 腾讯云 COS

### 3. 尺寸优化

```javascript
// 不要加载过大的图片
// ❌ 错误：加载 4K 图片显示在 300px 容器中
<img src="photo-4k.jpg" width="300" />  // 浪费流量

// ✅ 正确：加载合适尺寸的图片
<img src="photo-600w.jpg" width="300" />  // 2x DPR

// 计算公式
// 图片宽度 = 显示宽度 × DPR
// 例如：300px 容器，2x 屏幕 = 600px 图片
```

---

## 问题 6：其他图片优化技巧

### 1. 使用 CSS Sprites

合并小图标减少 HTTP 请求：

```css
/* 雪碧图 */
.icon {
  background-image: url('sprites.png');
  background-repeat: no-repeat;
}

.icon-home {
  background-position: 0 0;
  width: 24px;
  height: 24px;
}

.icon-user {
  background-position: -24px 0;
  width: 24px;
  height: 24px;
}
```

**现代替代方案**：使用 SVG Sprite 或 Icon Font

### 2. Base64 内联小图片

```css
/* 小于 2KB 的图片可以内联 */
.icon {
  background-image: url('data:image/png;base64,iVBORw0KG...');
}
```

**注意**：
- 只适合很小的图片（< 2KB）
- 会增加 CSS 文件大小
- 无法利用浏览器缓存

### 3. 预加载关键图片

```html
<!-- 预加载首屏关键图片 -->
<link rel="preload" as="image" href="hero.jpg" />

<!-- 预加载响应式图片 -->
<link 
  rel="preload" 
  as="image" 
  href="hero-mobile.jpg"
  media="(max-width: 768px)"
/>
```

### 4. 使用 Content-Visibility

```css
/* 延迟渲染屏幕外的图片 */
.image-container {
  content-visibility: auto;
  contain-intrinsic-size: 800px 600px;
}
```

### 5. 图片占位符

防止布局抖动：

```html
<!-- 使用 aspect-ratio -->
<img 
  src="photo.jpg" 
  style="aspect-ratio: 16/9; width: 100%;"
  alt="照片"
/>
```

```css
/* 或者使用 padding-top 技巧 */
.image-wrapper {
  position: relative;
  padding-top: 56.25%; /* 16:9 比例 */
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

---

## 总结

**核心概念总结**：

### 1. 格式选择

- **照片**：AVIF > WebP > JPEG
- **透明图**：WebP > PNG
- **图标**：SVG > Icon Font
- **动画**：WebP > GIF

### 2. 加载优化

- **懒加载**：原生 loading 或 Intersection Observer
- **响应式**：srcset/sizes 或 picture
- **预加载**：关键图片使用 preload

### 3. 压缩优化

- **自动化**：构建时压缩
- **CDN**：动态优化和格式转换
- **尺寸**：加载合适尺寸的图片

### 4. 最佳实践

- 优先使用现代格式（WebP/AVIF）
- 提供降级方案
- 避免布局抖动
- 监控图片性能

## 延伸阅读

- [MDN 响应式图片](https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web.dev 图片优化](https://web.dev/fast/#optimize-your-images)
- [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)
- [WebP 格式介绍](https://developers.google.com/speed/webp)
- [AVIF 格式介绍](https://jakearchibald.com/2020/avif-has-landed/)
- [图片 CDN 最佳实践](https://web.dev/image-cdns/)
