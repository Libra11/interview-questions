---
title: 前端动画有哪些实现方式？
category: CSS
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  全面了解前端动画的各种实现方式，包括 CSS 动画、JavaScript 动画、Canvas、SVG、Web Animations API 等，掌握不同方案的特点、适用场景和最佳实践。
tags:
  - 动画
  - CSS Animation
  - requestAnimationFrame
  - Canvas
estimatedTime: 28 分钟
keywords:
  - 动画
  - CSS Animation
  - Transition
  - requestAnimationFrame
  - Canvas
  - SVG
highlight: 前端动画有 CSS、JavaScript、Canvas、SVG 等多种实现方式，需根据场景选择合适方案
order: 106
---

## 问题 1：CSS Transition 如何实现动画？

CSS Transition 是最简单的动画实现方式，用于在 CSS 属性值变化时添加平滑的过渡效果。

### 基本用法

```css
.box {
  width: 100px;
  height: 100px;
  background-color: blue;
  
  /* 定义过渡效果 */
  transition: all 0.3s ease;
}

.box:hover {
  /* 属性变化时会有过渡动画 */
  width: 200px;
  background-color: red;
}
```

### 完整的 transition 语法

```css
.element {
  /* transition: property duration timing-function delay; */
  
  /* 单个属性 */
  transition: width 0.3s ease-in-out;
  
  /* 多个属性 */
  transition: width 0.3s, height 0.5s, background-color 0.2s;
  
  /* 所有属性 */
  transition: all 0.3s;
  
  /* 分开写 */
  transition-property: width, height;
  transition-duration: 0.3s, 0.5s;
  transition-timing-function: ease, linear;
  transition-delay: 0s, 0.1s;
}
```

### 常用的时间函数

```css
.box {
  /* 线性：匀速 */
  transition: all 0.3s linear;
  
  /* 缓入缓出：慢-快-慢 */
  transition: all 0.3s ease;
  
  /* 缓入：慢-快 */
  transition: all 0.3s ease-in;
  
  /* 缓出：快-慢 */
  transition: all 0.3s ease-out;
  
  /* 缓入缓出（更明显）*/
  transition: all 0.3s ease-in-out;
  
  /* 自定义贝塞尔曲线 */
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 实际应用示例

```html
<style>
.button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  /* 平滑过渡 */
  transition: background-color 0.3s, transform 0.2s;
}

.button:hover {
  background-color: #2980b9;
  transform: translateY(-2px); /* 轻微上移 */
}

.button:active {
  transform: translateY(0); /* 按下时恢复 */
}
</style>

<button class="button">Hover Me</button>
```

### Transition 的特点

- **简单易用**：只需定义起始和结束状态
- **自动触发**：属性变化时自动执行
- **双向动画**：鼠标移入移出都有动画
- **局限性**：只能在两个状态间过渡，无法实现复杂动画

---

## 问题 2：CSS Animation 如何实现动画？

CSS Animation 通过 `@keyframes` 定义关键帧，可以实现更复杂的动画效果。

### 基本语法

```css
/* 定义关键帧 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 应用动画 */
.element {
  animation: slideIn 0.5s ease-out;
}
```

### 使用百分比定义多个关键帧

```css
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-30px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0);
  }
}

.bouncing-ball {
  animation: bounce 1s ease-in-out infinite;
}
```

### 完整的 animation 属性

```css
.element {
  /* animation: name duration timing-function delay iteration-count direction fill-mode play-state; */
  
  animation-name: slideIn;              /* 动画名称 */
  animation-duration: 1s;               /* 持续时间 */
  animation-timing-function: ease;      /* 时间函数 */
  animation-delay: 0.5s;                /* 延迟 */
  animation-iteration-count: infinite;  /* 循环次数（infinite 无限循环）*/
  animation-direction: alternate;       /* 方向（normal/reverse/alternate/alternate-reverse）*/
  animation-fill-mode: forwards;        /* 填充模式 */
  animation-play-state: running;        /* 播放状态（running/paused）*/
  
  /* 简写 */
  animation: slideIn 1s ease 0.5s infinite alternate forwards;
}
```

### 实际应用：加载动画

```html
<style>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>

<div class="loader"></div>
```

### 多个动画组合

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); }
  to { transform: translateY(0); }
}

.element {
  /* 同时应用多个动画 */
  animation: 
    fadeIn 0.5s ease-out,
    slideUp 0.5s ease-out;
}
```

---

## 问题 3：JavaScript 动画如何实现？

JavaScript 动画通过定时器或 `requestAnimationFrame` 来控制元素的样式变化。

### 使用 setTimeout/setInterval

```javascript
// ❌ 不推荐：使用 setInterval（可能不流畅）
function animateWithInterval() {
  const element = document.querySelector('.box');
  let position = 0;
  
  const interval = setInterval(() => {
    position += 5;
    element.style.left = position + 'px';
    
    if (position >= 300) {
      clearInterval(interval); // 停止动画
    }
  }, 16); // 约 60fps
}
```

### 使用 requestAnimationFrame

```javascript
// ✅ 推荐：使用 requestAnimationFrame（更流畅）
function animateWithRAF() {
  const element = document.querySelector('.box');
  let position = 0;
  
  function step() {
    position += 5;
    element.style.left = position + 'px';
    
    if (position < 300) {
      requestAnimationFrame(step); // 继续下一帧
    }
  }
  
  requestAnimationFrame(step); // 开始动画
}
```

### 基于时间的动画

```javascript
// 更精确的动画控制
function smoothAnimate(element, from, to, duration) {
  const startTime = performance.now();
  
  function update(currentTime) {
    // 计算进度（0 到 1）
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 缓动函数（ease-out）
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // 计算当前值
    const currentValue = from + (to - from) * easeProgress;
    element.style.left = currentValue + 'px';
    
    // 继续动画
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// 使用
const box = document.querySelector('.box');
smoothAnimate(box, 0, 300, 1000); // 1秒内从 0 移动到 300px
```

### 封装可复用的动画函数

```javascript
class Animator {
  constructor(element) {
    this.element = element;
    this.animationId = null;
  }
  
  // 动画到指定位置
  to(properties, duration = 300, easing = 'easeOut') {
    const startTime = performance.now();
    const startValues = {};
    
    // 记录起始值
    for (let prop in properties) {
      startValues[prop] = parseFloat(
        getComputedStyle(this.element)[prop]
      ) || 0;
    }
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 应用缓动
      const easedProgress = this.easingFunctions[easing](progress);
      
      // 更新所有属性
      for (let prop in properties) {
        const start = startValues[prop];
        const end = properties[prop];
        const current = start + (end - start) * easedProgress;
        
        this.element.style[prop] = current + 'px';
      }
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
    return this;
  }
  
  // 缓动函数
  easingFunctions = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };
  
  // 停止动画
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    return this;
  }
}

// 使用
const animator = new Animator(document.querySelector('.box'));
animator.to({ left: 300, top: 200 }, 1000, 'easeOut');
```

---

## 问题 4：Canvas 动画如何实现？

Canvas 通过不断清除和重绘画布来实现动画，适合复杂的图形动画和游戏。

### 基本的 Canvas 动画

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let x = 0;
let y = 100;
let dx = 2; // x 方向速度

function draw() {
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制圆形
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#3498db';
  ctx.fill();
  
  // 更新位置
  x += dx;
  
  // 边界检测
  if (x > canvas.width - 20 || x < 20) {
    dx = -dx; // 反向
  }
  
  // 继续动画
  requestAnimationFrame(draw);
}

// 开始动画
draw();
```

### 粒子系统示例

```javascript
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4; // 随机速度
    this.vy = (Math.random() - 0.5) * 4;
    this.radius = Math.random() * 3 + 1;
    this.life = 1; // 生命值
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.01; // 逐渐消失
  }
  
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(52, 152, 219, ${this.life})`;
    ctx.fill();
  }
}

const particles = [];

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 添加新粒子
  if (Math.random() < 0.1) {
    particles.push(new Particle(canvas.width / 2, canvas.height / 2));
  }
  
  // 更新和绘制粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.update();
    particle.draw(ctx);
    
    // 移除死亡的粒子
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
  
  requestAnimationFrame(animate);
}

animate();
```

### Canvas 动画的特点

- **高性能**：适合大量元素的动画
- **完全控制**：可以绘制任意图形
- **像素级操作**：可以进行图像处理
- **不支持 DOM 事件**：需要手动处理交互

---

## 问题 5：SVG 动画如何实现？

SVG 动画可以通过 CSS、JavaScript 或 SVG 自带的动画元素实现。

### 使用 CSS 动画 SVG

```html
<style>
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rotating-circle {
  transform-origin: center;
  animation: rotate 2s linear infinite;
}
</style>

<svg width="200" height="200">
  <circle 
    class="rotating-circle"
    cx="100" 
    cy="100" 
    r="40" 
    fill="none" 
    stroke="#3498db" 
    stroke-width="4"
  />
</svg>
```

### 使用 SVG 动画元素

```html
<svg width="200" height="200">
  <circle cx="100" cy="100" r="40" fill="#3498db">
    <!-- 动画元素 -->
    <animate
      attributeName="r"
      from="40"
      to="60"
      dur="1s"
      repeatCount="indefinite"
      direction="alternate"
    />
    <animate
      attributeName="opacity"
      from="1"
      to="0.3"
      dur="1s"
      repeatCount="indefinite"
      direction="alternate"
    />
  </circle>
</svg>
```

### 使用 JavaScript 控制 SVG

```javascript
const circle = document.querySelector('circle');
let radius = 40;
let growing = true;

function animateSVG() {
  if (growing) {
    radius += 0.5;
    if (radius >= 60) growing = false;
  } else {
    radius -= 0.5;
    if (radius <= 40) growing = true;
  }
  
  circle.setAttribute('r', radius);
  requestAnimationFrame(animateSVG);
}

animateSVG();
```

### 路径动画

```html
<svg width="400" height="200">
  <path
    id="motionPath"
    d="M 50,100 Q 200,50 350,100"
    fill="none"
    stroke="#ddd"
    stroke-width="2"
  />
  
  <circle r="10" fill="#3498db">
    <!-- 沿路径运动 -->
    <animateMotion
      dur="3s"
      repeatCount="indefinite"
    >
      <mpath href="#motionPath" />
    </animateMotion>
  </circle>
</svg>
```

---

## 问题 6：Web Animations API 如何使用？

Web Animations API 是现代浏览器提供的原生 JavaScript 动画 API，结合了 CSS 动画的性能和 JavaScript 的灵活性。

### 基本用法

```javascript
const element = document.querySelector('.box');

// 定义关键帧
const keyframes = [
  { transform: 'translateX(0px)', opacity: 1 },
  { transform: 'translateX(300px)', opacity: 0.5 }
];

// 定义选项
const options = {
  duration: 1000,      // 持续时间
  easing: 'ease-out',  // 缓动函数
  fill: 'forwards'     // 保持最终状态
};

// 执行动画
const animation = element.animate(keyframes, options);
```

### 控制动画播放

```javascript
const animation = element.animate(keyframes, options);

// 暂停
animation.pause();

// 播放
animation.play();

// 反向播放
animation.reverse();

// 取消
animation.cancel();

// 跳到指定时间
animation.currentTime = 500; // 跳到 500ms

// 监听动画完成
animation.onfinish = () => {
  console.log('动画完成');
};
```

### 复杂动画示例

```javascript
function createBouncingAnimation(element) {
  const keyframes = [
    { transform: 'translateY(0px)', easing: 'ease-out' },
    { transform: 'translateY(-100px)', easing: 'ease-in' },
    { transform: 'translateY(0px)', easing: 'ease-out' },
    { transform: 'translateY(-50px)', easing: 'ease-in' },
    { transform: 'translateY(0px)', easing: 'ease-out' }
  ];
  
  return element.animate(keyframes, {
    duration: 1000,
    iterations: Infinity // 无限循环
  });
}

const bounceAnimation = createBouncingAnimation(document.querySelector('.ball'));

// 鼠标悬停时暂停
element.addEventListener('mouseenter', () => {
  bounceAnimation.pause();
});

element.addEventListener('mouseleave', () => {
  bounceAnimation.play();
});
```

### 动画序列

```javascript
async function sequenceAnimation(element) {
  // 第一个动画：淡入
  await element.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 500, fill: 'forwards' }
  ).finished;
  
  // 第二个动画：移动
  await element.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(200px)' }],
    { duration: 800, fill: 'forwards' }
  ).finished;
  
  // 第三个动画：缩放
  await element.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }],
    { duration: 300, fill: 'forwards' }
  ).finished;
  
  console.log('所有动画完成');
}

sequenceAnimation(document.querySelector('.box'));
```

---

## 问题 7：如何选择合适的动画实现方式？

不同的动画实现方式有各自的优缺点和适用场景，需要根据具体需求选择。

### 各种方式的对比

```javascript
// 1. CSS Transition
// ✅ 优点：简单、性能好、自动双向
// ❌ 缺点：只能两个状态间过渡
// 适用：简单的状态切换（hover、focus 等）

.button {
  transition: all 0.3s;
}

// 2. CSS Animation
// ✅ 优点：复杂动画、关键帧控制、性能好
// ❌ 缺点：不灵活、难以动态控制
// 适用：固定的循环动画、加载动画

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 3. JavaScript + requestAnimationFrame
// ✅ 优点：完全控制、可以响应交互
// ❌ 缺点：代码复杂、需要手动优化
// 适用：需要精确控制的动画、游戏

function animate() {
  // 自定义动画逻辑
  requestAnimationFrame(animate);
}

// 4. Canvas
// ✅ 优点：高性能、像素级控制
// ❌ 缺点：不支持 DOM、重绘开销大
// 适用：大量粒子、复杂图形、游戏

ctx.clearRect(0, 0, width, height);
// 绘制逻辑

// 5. SVG
// ✅ 优点：矢量、可缩放、支持交互
// ❌ 缺点：复杂图形性能较差
// 适用：图标动画、路径动画、数据可视化

<animate attributeName="r" from="10" to="20" />

// 6. Web Animations API
// ✅ 优点：性能好、易控制、Promise 支持
// ❌ 缺点：浏览器兼容性
// 适用：需要精确控制的 CSS 动画

element.animate(keyframes, options);
```

### 选择建议

```javascript
// 场景 1：按钮 hover 效果
// 推荐：CSS Transition
.button {
  transition: background-color 0.3s, transform 0.2s;
}
.button:hover {
  background-color: #2980b9;
  transform: scale(1.05);
}

// 场景 2：加载动画
// 推荐：CSS Animation
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader {
  animation: spin 1s linear infinite;
}

// 场景 3：拖拽动画
// 推荐：JavaScript + requestAnimationFrame
element.addEventListener('drag', (e) => {
  requestAnimationFrame(() => {
    element.style.left = e.clientX + 'px';
    element.style.top = e.clientY + 'px';
  });
});

// 场景 4：粒子效果
// 推荐：Canvas
function drawParticles() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw(ctx);
  });
  requestAnimationFrame(drawParticles);
}

// 场景 5：图标动画
// 推荐：SVG + CSS
<svg class="icon">
  <path class="animated-path" d="..." />
</svg>

// 场景 6：复杂的时间线动画
// 推荐：Web Animations API 或动画库（GSAP）
const timeline = [
  element.animate(keyframes1, options1),
  element.animate(keyframes2, options2)
];
```

### 性能考虑

```javascript
// ✅ 性能优化建议

// 1. 优先使用 transform 和 opacity（GPU 加速）
.element {
  /* ✅ 好 - 触发 GPU 加速 */
  transform: translateX(100px);
  opacity: 0.5;
  
  /* ❌ 差 - 触发重排 */
  left: 100px;
  width: 200px;
}

// 2. 使用 will-change 提示浏览器
.element {
  will-change: transform, opacity;
}

// 3. 避免在动画中修改布局属性
// ❌ 避免
function badAnimate() {
  element.style.width = newWidth + 'px'; // 触发重排
}

// ✅ 推荐
function goodAnimate() {
  element.style.transform = `scaleX(${scale})`; // 只触发重绘
}

// 4. 使用 requestAnimationFrame 而不是 setInterval
// ❌ 避免
setInterval(animate, 16);

// ✅ 推荐
function animate() {
  // 动画逻辑
  requestAnimationFrame(animate);
}

// 5. 批量 DOM 操作
// ❌ 避免
elements.forEach(el => {
  el.style.left = newLeft + 'px'; // 多次重排
});

// ✅ 推荐
requestAnimationFrame(() => {
  elements.forEach(el => {
    el.style.left = newLeft + 'px'; // 一次重排
  });
});
```

---

## 总结

**前端动画实现方式总结**：

### 1. CSS Transition

- 简单的状态过渡
- 自动双向动画
- 性能优秀
- 适合 hover、focus 等交互

### 2. CSS Animation

- 关键帧动画
- 支持循环和复杂时序
- 声明式、易维护
- 适合固定的动画效果

### 3. JavaScript 动画

- 完全控制动画过程
- 可响应用户交互
- 使用 requestAnimationFrame
- 适合需要精确控制的场景

### 4. Canvas 动画

- 像素级控制
- 高性能渲染
- 适合大量元素
- 游戏和复杂图形

### 5. SVG 动画

- 矢量图形
- 可缩放不失真
- 支持路径动画
- 适合图标和数据可视化

### 6. Web Animations API

- 原生 JavaScript API
- 结合 CSS 和 JS 优点
- 精确控制和性能
- 现代浏览器推荐

### 选择原则

- **简单交互**：CSS Transition
- **固定动画**：CSS Animation
- **复杂控制**：JavaScript + RAF
- **大量元素**：Canvas
- **矢量图形**：SVG
- **精确控制**：Web Animations API

### 性能优化

- 使用 transform 和 opacity
- 避免修改布局属性
- 使用 will-change 提示
- 批量 DOM 操作
- 使用 requestAnimationFrame

## 延伸阅读

- [MDN - CSS Transitions](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Transitions)
- [MDN - CSS Animations](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Animations)
- [MDN - requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/window/requestAnimationFrame)
- [MDN - Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [MDN - SVG Animation](https://developer.mozilla.org/zh-CN/docs/Web/SVG/SVG_animation_with_SMIL)
- [MDN - Web Animations API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API)
- [CSS Triggers - 触发重排/重绘的属性](https://csstriggers.com/)
