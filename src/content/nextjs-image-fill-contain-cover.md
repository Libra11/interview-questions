---
title: fill / contain / cover 的区别？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 Next.js Image 组件中 fill、contain 和 cover 的区别，掌握不同场景下的图片布局方式
tags:
  - Next.js
  - Image
  - CSS
  - 布局
estimatedTime: 16 分钟
keywords:
  - fill
  - contain
  - cover
  - object-fit
highlight: fill 让图片填充父容器，contain 和 cover 控制图片如何适应容器
order: 95
---

## 问题 1：fill 属性是什么？

`fill` 让图片填充父容器，类似 CSS 的 `position: absolute`。

### 基本用法

```javascript
// 不使用 fill：需要指定 width 和 height
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>

// 使用 fill：图片填充父容器
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
  />
</div>
```

### fill 的行为

```javascript
// fill 会生成以下 CSS
{
  position: 'absolute',
  height: '100%',
  width: '100%',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  objectFit: 'cover', // 默认值
}

// 父容器必须是 position: relative
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image src="/photo.jpg" alt="Photo" fill />
</div>
```

### 使用场景

```javascript
// 场景 1：响应式背景图
<div style={{ position: 'relative', width: '100%', height: '50vh' }}>
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    style={{ objectFit: 'cover' }}
  />
  <div style={{ position: 'relative', zIndex: 1 }}>
    <h1>标题</h1>
  </div>
</div>

// 场景 2：固定比例容器
<div style={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}>
  <Image src="/video-thumbnail.jpg" alt="Thumbnail" fill />
</div>

// 场景 3：卡片图片
<div style={{ position: 'relative', width: '300px', height: '200px' }}>
  <Image src="/card.jpg" alt="Card" fill />
</div>
```

---

## 问题 2：object-fit: cover 是什么？

`cover` 让图片覆盖整个容器，可能会裁剪图片。

### 工作原理

```javascript
<div style={{ position: "relative", width: "400px", height: "300px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "cover" }} />
</div>

// 图片行为：
// 1. 保持原始宽高比
// 2. 缩放到完全覆盖容器
// 3. 超出部分被裁剪
// 4. 容器内没有空白

// 示例：
// 图片：1600x1200（4:3）
// 容器：400x300（4:3）
// 结果：图片缩小到 400x300，完美适配

// 图片：1600x900（16:9）
// 容器：400x300（4:3）
// 结果：图片缩小到 533x300，左右被裁剪
```

### 视觉效果

```javascript
// 横向图片 + 正方形容器
<div style={{ position: 'relative', width: '300px', height: '300px' }}>
  <Image
    src="/landscape.jpg" // 1600x900
    alt="Landscape"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// 效果：
// - 图片高度填满 300px
// - 图片宽度变为 533px
// - 左右各裁剪 116px
// - 显示图片中心部分

// 纵向图片 + 横向容器
<div style={{ position: 'relative', width: '400px', height: '200px' }}>
  <Image
    src="/portrait.jpg" // 900x1600
    alt="Portrait"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// 效果：
// - 图片宽度填满 400px
// - 图片高度变为 711px
// - 上下各裁剪 255px
// - 显示图片中心部分
```

### 使用场景

```javascript
// 场景 1：头像
<div style={{
  position: 'relative',
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
  <Image
    src="/avatar.jpg"
    alt="Avatar"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// 场景 2：卡片缩略图
<div style={{ position: 'relative', width: '100%', height: '200px' }}>
  <Image
    src="/thumbnail.jpg"
    alt="Thumbnail"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>

// 场景 3：全屏背景
<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
  <Image
    src="/background.jpg"
    alt="Background"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

---

## 问题 3：object-fit: contain 是什么？

`contain` 让图片完整显示在容器内，可能会有空白。

### 工作原理

```javascript
<div style={{ position: "relative", width: "400px", height: "300px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "contain" }} />
</div>

// 图片行为：
// 1. 保持原始宽高比
// 2. 缩放到完全显示在容器内
// 3. 不裁剪任何部分
// 4. 可能有空白区域

// 示例：
// 图片：1600x1200（4:3）
// 容器：400x300（4:3）
// 结果：图片缩小到 400x300，完美适配

// 图片：1600x900（16:9）
// 容器：400x300（4:3）
// 结果：图片缩小到 400x225，上下有空白
```

### 视觉效果

```javascript
// 横向图片 + 正方形容器
<div style={{
  position: 'relative',
  width: '300px',
  height: '300px',
  backgroundColor: '#f0f0f0' // 显示空白区域
}}>
  <Image
    src="/landscape.jpg" // 1600x900
    alt="Landscape"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>

// 效果：
// - 图片宽度填满 300px
// - 图片高度变为 169px
// - 上下各有 65px 空白
// - 显示完整图片

// 纵向图片 + 横向容器
<div style={{
  position: 'relative',
  width: '400px',
  height: '200px',
  backgroundColor: '#f0f0f0'
}}>
  <Image
    src="/portrait.jpg" // 900x1600
    alt="Portrait"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>

// 效果：
// - 图片高度填满 200px
// - 图片宽度变为 112px
// - 左右各有 144px 空白
// - 显示完整图片
```

### 使用场景

```javascript
// 场景 1：产品图片
<div style={{
  position: 'relative',
  width: '300px',
  height: '300px',
  backgroundColor: 'white'
}}>
  <Image
    src="/product.png"
    alt="Product"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>

// 场景 2：Logo
<div style={{ position: 'relative', width: '200px', height: '80px' }}>
  <Image
    src="/logo.svg"
    alt="Logo"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>

// 场景 3：图片预览
<div style={{
  position: 'relative',
  width: '100%',
  height: '500px',
  backgroundColor: '#000'
}}>
  <Image
    src="/preview.jpg"
    alt="Preview"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>
```

---

## 问题 4：cover 和 contain 的对比

### 视觉对比

```javascript
// 同一张图片，不同的 object-fit

// 原图：1600x900（16:9）
// 容器：400x400（1:1）

// cover：填满容器，裁剪图片
<div style={{ position: 'relative', width: '400px', height: '400px' }}>
  <Image
    src="/photo.jpg"
    alt="Cover"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
// 结果：图片 711x400，左右被裁剪

// contain：显示完整图片，有空白
<div style={{ position: 'relative', width: '400px', height: '400px' }}>
  <Image
    src="/photo.jpg"
    alt="Contain"
    fill
    style={{ objectFit: 'contain' }}
  />
</div>
// 结果：图片 400x225，上下有空白
```

### 选择建议

```javascript
// 使用 cover 的场景：
// ✅ 背景图片
// ✅ 头像
// ✅ 卡片缩略图
// ✅ 装饰性图片
// ✅ 可以接受裁剪

// 使用 contain 的场景：
// ✅ 产品图片
// ✅ Logo
// ✅ 图表和图示
// ✅ 艺术作品
// ✅ 必须显示完整内容
```

### 实际示例

```javascript
// 电商网站
export default function ProductCard({ product }) {
  return (
    <div className="card">
      {/* 缩略图：使用 cover */}
      <div style={{ position: "relative", width: "100%", height: "200px" }}>
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="content">
        <h3>{product.name}</h3>

        {/* 产品图：使用 contain */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "300px",
            backgroundColor: "white",
          }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 问题 5：其他 object-fit 值

除了 cover 和 contain，还有其他选项。

### object-fit: fill

```javascript
// 拉伸图片填充容器，不保持宽高比
<div style={{ position: "relative", width: "400px", height: "300px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "fill" }} />
</div>

// 效果：
// - 图片被拉伸到 400x300
// - 不保持原始比例
// - 可能变形
// - 很少使用
```

### object-fit: none

```javascript
// 保持原始尺寸，不缩放
<div style={{ position: "relative", width: "400px", height: "300px" }}>
  <Image src="/photo.jpg" alt="Photo" fill style={{ objectFit: "none" }} />
</div>

// 效果：
// - 图片保持原始大小
// - 超出部分被裁剪
// - 居中显示
// - 很少使用
```

### object-fit: scale-down

```javascript
// contain 和 none 的结合
<div style={{ position: "relative", width: "400px", height: "300px" }}>
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    style={{ objectFit: "scale-down" }}
  />
</div>

// 效果：
// - 如果图片小于容器：使用 none（不放大）
// - 如果图片大于容器：使用 contain（缩小）
// - 适合不确定图片大小的场景
```

### object-position

```javascript
// 控制图片在容器中的位置
<div style={{ position: 'relative', width: '400px', height: '300px' }}>
  <Image
    src="/photo.jpg"
    alt="Photo"
    fill
    style={{
      objectFit: 'cover',
      objectPosition: 'top' // 顶部对齐
    }}
  />
</div>

// 可选值：
// - 'center'（默认）
// - 'top', 'bottom', 'left', 'right'
// - 'top left', 'bottom right' 等
// - '50% 50%'（百分比）
// - '10px 20px'（像素）

// 示例：人物照片
<div style={{ position: 'relative', width: '300px', height: '300px' }}>
  <Image
    src="/portrait.jpg"
    alt="Portrait"
    fill
    style={{
      objectFit: 'cover',
      objectPosition: 'top' // 确保显示人脸
    }}
  />
</div>
```

---

## 总结

**核心概念总结**：

### 1. fill 属性

- 让图片填充父容器
- 父容器必须是 `position: relative`
- 不需要指定 width 和 height
- 适合响应式布局

### 2. object-fit: cover

- 填满容器，保持宽高比
- 可能裁剪图片
- 无空白区域
- 适合背景图、头像、缩略图

### 3. object-fit: contain

- 显示完整图片，保持宽高比
- 不裁剪图片
- 可能有空白区域
- 适合产品图、Logo、艺术作品

### 4. 选择建议

- 装饰性图片 → cover
- 内容性图片 → contain
- 可以裁剪 → cover
- 必须完整 → contain

## 延伸阅读

- [next/image fill](https://nextjs.org/docs/app/api-reference/components/image#fill)
- [CSS object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [CSS object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position)
- [Responsive Images](https://web.dev/responsive-images/)
