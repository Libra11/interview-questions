---
title: requestAnimationFrame 了解多少？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 requestAnimationFrame 的工作原理和优势，掌握其在动画、性能优化中的应用，学会正确使用 RAF 创建流畅的动画效果。
tags:
  - requestAnimationFrame
  - 动画
  - 性能优化
  - 浏览器API
estimatedTime: 30 分钟
keywords:
  - requestAnimationFrame
  - RAF
  - 动画优化
  - 帧率控制
highlight: 理解 requestAnimationFrame 的优势和原理，掌握动画性能优化技巧，能够创建流畅的动画效果
order: 50
---

## 问题 1：requestAnimationFrame 的基本概念

**requestAnimationFrame 定义**

`requestAnimationFrame` (RAF) 是浏览器提供的一个 API，用于在下次重绘之前调用指定的回调函数。它专门为动画而设计，能够提供更流畅、更高效的动画效果。

### 基本语法和使用

```javascript
// 基本语法
const animationId = requestAnimationFrame(callback);

// 取消动画
cancelAnimationFrame(animationId);

// 简单示例
function animate() {
  // 动画逻辑
  console.log("动画帧");

  // 继续下一帧
  requestAnimationFrame(animate);
}

// 开始动画
requestAnimationFrame(animate);
```

### 与传统定时器的对比

```javascript
// ❌ 使用 setTimeout 的问题
function animateWithTimeout() {
  // 动画逻辑
  updateAnimation();

  // 尝试 60fps (16.67ms)
  setTimeout(animateWithTimeout, 16.67);
}

// ❌ 使用 setInterval 的问题
const intervalId = setInterval(() => {
  updateAnimation();
}, 16.67);

// ✅ 使用 requestAnimationFrame
function animateWithRAF() {
  updateAnimation();
  requestAnimationFrame(animateWithRAF);
}

requestAnimationFrame(animateWithRAF);
```

### RAF 的核心优势

```javascript
// 1. 自动适应屏幕刷新率
// 大多数显示器是 60Hz (60fps)，RAF 会自动匹配

// 2. 页面不可见时自动暂停
// 当标签页切换到后台时，RAF 会暂停，节省 CPU

// 3. 与浏览器重绘同步
// 确保动画在重绘之前执行，避免丢帧

// 4. 更好的性能
// 浏览器可以优化 RAF 的执行时机

// 演示页面可见性对 RAF 的影响
let frameCount = 0;
let startTime = Date.now();

function countFrames() {
  frameCount++;

  if (frameCount % 60 === 0) {
    const elapsed = Date.now() - startTime;
    const fps = (frameCount / elapsed) * 1000;
    console.log(`FPS: ${fps.toFixed(2)}`);
  }

  requestAnimationFrame(countFrames);
}

requestAnimationFrame(countFrames);

// 切换标签页时，FPS 会降到 0 或很低的值
```

---

## 问题 2：RAF 的工作原理

### 浏览器渲染流程

```javascript
/**
 * 浏览器渲染流程：
 * 1. JavaScript 执行
 * 2. 样式计算 (Style)
 * 3. 布局 (Layout/Reflow)
 * 4. 绘制 (Paint)
 * 5. 合成 (Composite)
 *
 * RAF 在第1步之前执行，确保动画更新在重绘之前完成
 */

// RAF 的执行时机
function demonstrateRAFTiming() {
  console.log("1. JavaScript 开始执行");

  requestAnimationFrame(() => {
    console.log("2. RAF 回调执行");

    // 修改 DOM
    const element = document.getElementById("animated-element");
    element.style.transform = `translateX(${Math.random() * 100}px)`;

    console.log("3. DOM 修改完成");
  });

  console.log("4. JavaScript 执行结束");

  // 输出顺序：1 -> 4 -> 2 -> 3
}
```

### 帧率和时间戳

```javascript
// RAF 回调函数接收一个时间戳参数
function animate(timestamp) {
  console.log("当前时间戳:", timestamp);

  // timestamp 是从页面加载开始的毫秒数
  // 类似于 performance.now() 的返回值

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// 计算帧率
let lastTimestamp = 0;
let frameCount = 0;
let fps = 0;

function calculateFPS(timestamp) {
  frameCount++;

  if (lastTimestamp) {
    const delta = timestamp - lastTimestamp;
    fps = 1000 / delta; // 计算当前帧率

    if (frameCount % 60 === 0) {
      console.log(`平均 FPS: ${fps.toFixed(2)}`);
    }
  }

  lastTimestamp = timestamp;
  requestAnimationFrame(calculateFPS);
}

requestAnimationFrame(calculateFPS);
```

### 多个 RAF 的执行顺序

```javascript
// 同一帧中多个 RAF 的执行顺序
requestAnimationFrame(() => {
  console.log("RAF 1");
});

requestAnimationFrame(() => {
  console.log("RAF 2");
});

requestAnimationFrame(() => {
  console.log("RAF 3");
});

// 输出顺序：RAF 1 -> RAF 2 -> RAF 3
// 按照注册顺序执行

// 嵌套 RAF
requestAnimationFrame(() => {
  console.log("外层 RAF");

  requestAnimationFrame(() => {
    console.log("内层 RAF");
  });
});

// 输出：外层 RAF（当前帧）-> 内层 RAF（下一帧）
```

---

## 问题 3：RAF 的实际应用

### 基础动画实现

```javascript
// 简单的移动动画
class SimpleAnimation {
  constructor(element) {
    this.element = element;
    this.position = 0;
    this.isRunning = false;
    this.animationId = null;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate() {
    if (!this.isRunning) return;

    // 更新位置
    this.position += 2;

    // 应用到 DOM
    this.element.style.transform = `translateX(${this.position}px)`;

    // 边界检查
    if (this.position > 300) {
      this.position = 0;
    }

    // 继续下一帧
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// 使用
const element = document.getElementById("moving-box");
const animation = new SimpleAnimation(element);
animation.start();
```

### 基于时间的动画

```javascript
// 基于时间的平滑动画
class TimeBasedAnimation {
  constructor(element, duration = 2000) {
    this.element = element;
    this.duration = duration;
    this.startTime = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = null;
    this.animate();
  }

  animate(timestamp) {
    if (!this.isRunning) return;

    if (!this.startTime) {
      this.startTime = timestamp;
    }

    const elapsed = timestamp - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // 缓动函数 (easeInOutQuad)
    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // 应用动画
    const position = eased * 300;
    this.element.style.transform = `translateX(${position}px)`;

    if (progress < 1) {
      requestAnimationFrame((ts) => this.animate(ts));
    } else {
      this.isRunning = false;
    }
  }
}
```

### 复杂动画系统

```javascript
// 动画管理器
class AnimationManager {
  constructor() {
    this.animations = new Set();
    this.isRunning = false;
    this.animationId = null;
  }

  add(animation) {
    this.animations.add(animation);

    if (!this.isRunning) {
      this.start();
    }
  }

  remove(animation) {
    this.animations.delete(animation);

    if (this.animations.size === 0) {
      this.stop();
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate(timestamp) {
    if (!this.isRunning) return;

    // 更新所有动画
    for (const animation of this.animations) {
      if (animation.update) {
        const shouldContinue = animation.update(timestamp);

        if (!shouldContinue) {
          this.remove(animation);
        }
      }
    }

    if (this.animations.size > 0) {
      this.animationId = requestAnimationFrame((ts) => this.animate(ts));
    } else {
      this.isRunning = false;
    }
  }
}

// 可重用的动画类
class TweenAnimation {
  constructor(target, property, from, to, duration, easing = "linear") {
    this.target = target;
    this.property = property;
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.easing = easing;
    this.startTime = null;
  }

  update(timestamp) {
    if (!this.startTime) {
      this.startTime = timestamp;
    }

    const elapsed = timestamp - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // 应用缓动
    const easedProgress = this.applyEasing(progress);

    // 计算当前值
    const currentValue = this.from + (this.to - this.from) * easedProgress;

    // 应用到目标
    this.target[this.property] = currentValue;

    return progress < 1; // 返回是否继续动画
  }

  applyEasing(t) {
    switch (this.easing) {
      case "easeInQuad":
        return t * t;
      case "easeOutQuad":
        return t * (2 - t);
      case "easeInOutQuad":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t; // linear
    }
  }
}

// 使用示例
const manager = new AnimationManager();
const element = { x: 0, y: 0 };

const animX = new TweenAnimation(element, "x", 0, 100, 1000, "easeInOutQuad");
const animY = new TweenAnimation(element, "y", 0, 50, 1500, "easeOutQuad");

manager.add(animX);
manager.add(animY);
```

---

## 问题 4：性能优化技巧

### 避免强制同步布局

```javascript
// ❌ 错误做法：在 RAF 中读取布局属性
function badAnimation() {
  const elements = document.querySelectorAll(".animated");

  requestAnimationFrame(() => {
    elements.forEach((element) => {
      // 强制同步布局！
      const width = element.offsetWidth;
      element.style.width = width + 1 + "px";
    });
  });
}

// ✅ 正确做法：分离读取和写入
function goodAnimation() {
  const elements = document.querySelectorAll(".animated");

  requestAnimationFrame(() => {
    // 批量读取
    const widths = Array.from(elements).map((el) => el.offsetWidth);

    // 批量写入
    elements.forEach((element, index) => {
      element.style.width = widths[index] + 1 + "px";
    });
  });
}
```

### 使用 transform 和 opacity

```javascript
// ✅ 优先使用 transform 和 opacity（不触发重排重绘）
class OptimizedAnimation {
  constructor(element) {
    this.element = element;
    this.x = 0;
    this.y = 0;
    this.opacity = 1;
  }

  animate() {
    // 使用 transform 移动元素
    this.x += 1;
    this.y += 0.5;

    // 使用 opacity 改变透明度
    this.opacity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;

    // 一次性应用所有变换
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
    this.element.style.opacity = this.opacity;

    requestAnimationFrame(() => this.animate());
  }
}

// ❌ 避免使用这些属性（会触发重排）
// element.style.left = '100px';
// element.style.top = '50px';
// element.style.width = '200px';
// element.style.height = '100px';
```

### 节流和防抖

```javascript
// 节流 RAF 调用
class ThrottledAnimation {
  constructor() {
    this.isScheduled = false;
  }

  scheduleUpdate() {
    if (this.isScheduled) return;

    this.isScheduled = true;
    requestAnimationFrame(() => {
      this.update();
      this.isScheduled = false;
    });
  }

  update() {
    // 实际的更新逻辑
    console.log("更新动画");
  }
}

// 使用
const animation = new ThrottledAnimation();

// 多次调用只会执行一次
animation.scheduleUpdate();
animation.scheduleUpdate();
animation.scheduleUpdate();

// 防抖 RAF
function debounceRAF(func) {
  let rafId = null;

  return function (...args) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

const debouncedUpdate = debounceRAF(() => {
  console.log("防抖更新");
});
```

---

## 问题 5：RAF 的兼容性和 Polyfill

### 浏览器兼容性

```javascript
// 检查 RAF 支持
function checkRAFSupport() {
  return !!(
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame
  );
}

// 简单的 Polyfill
(function () {
  let lastTime = 0;
  const vendors = ["webkit", "moz", "o", "ms"];

  // 尝试使用厂商前缀版本
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
    window.cancelAnimationFrame =
      window[vendors[x] + "CancelAnimationFrame"] ||
      window[vendors[x] + "CancelRequestAnimationFrame"];
  }

  // 如果都不支持，使用 setTimeout 模拟
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);

      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
})();
```

### 更完善的 Polyfill

```javascript
// 高精度的 RAF Polyfill
class RAFPolyfill {
  constructor() {
    this.callbacks = [];
    this.isRunning = false;
    this.lastTime = 0;

    // 绑定原生方法
    this.nativeRAF =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame;

    this.nativeCAF =
      window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.msCancelAnimationFrame;
  }

  requestAnimationFrame(callback) {
    if (this.nativeRAF) {
      return this.nativeRAF.call(window, callback);
    }

    // 使用 setTimeout 模拟
    const currTime = performance.now();
    const timeToCall = Math.max(0, 16.67 - (currTime - this.lastTime));

    const id = setTimeout(() => {
      callback(currTime + timeToCall);
    }, timeToCall);

    this.lastTime = currTime + timeToCall;
    return id;
  }

  cancelAnimationFrame(id) {
    if (this.nativeCAF) {
      return this.nativeCAF.call(window, id);
    }

    clearTimeout(id);
  }
}

// 全局安装
if (!window.requestAnimationFrame) {
  const polyfill = new RAFPolyfill();
  window.requestAnimationFrame = (callback) =>
    polyfill.requestAnimationFrame(callback);
  window.cancelAnimationFrame = (id) => polyfill.cancelAnimationFrame(id);
}
```

---

## 问题 6：实际项目中的应用案例

### 滚动动画优化

```javascript
// 滚动驱动的动画
class ScrollAnimation {
  constructor() {
    this.isScheduled = false;
    this.scrollY = 0;

    window.addEventListener("scroll", () => this.onScroll());
  }

  onScroll() {
    if (this.isScheduled) return;

    this.isScheduled = true;
    requestAnimationFrame(() => {
      this.updateAnimations();
      this.isScheduled = false;
    });
  }

  updateAnimations() {
    this.scrollY = window.pageYOffset;

    // 视差滚动效果
    const parallaxElements = document.querySelectorAll(".parallax");
    parallaxElements.forEach((element) => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(this.scrollY * speed);
      element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });

    // 淡入淡出效果
    const fadeElements = document.querySelectorAll(".fade-on-scroll");
    fadeElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const opacity = Math.max(
        0,
        Math.min(1, 1 - rect.top / window.innerHeight)
      );
      element.style.opacity = opacity;
    });
  }
}

new ScrollAnimation();
```

### 粒子系统

```javascript
// 简单的粒子系统
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.isRunning = false;

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
    };
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // 创建初始粒子
    for (let i = 0; i < 100; i++) {
      this.particles.push(this.createParticle());
    }

    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) return;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      // 边界检查
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      // 移除死亡的粒子
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        this.particles.push(this.createParticle()); // 添加新粒子
        continue;
      }

      // 绘制粒子
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// 使用
const canvas = document.getElementById("particle-canvas");
const particleSystem = new ParticleSystem(canvas);
particleSystem.start();
```

### 游戏循环

```javascript
// 游戏主循环
class GameLoop {
  constructor() {
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60; // 60 FPS
    this.isRunning = false;

    this.entities = [];
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // 固定时间步长的物理更新
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // 可变时间步长的渲染更新
    const alpha = this.accumulator / this.fixedTimeStep;
    this.render(alpha);

    requestAnimationFrame((time) => this.loop(time));
  }

  fixedUpdate(deltaTime) {
    // 物理更新、碰撞检测等
    this.entities.forEach((entity) => {
      if (entity.fixedUpdate) {
        entity.fixedUpdate(deltaTime);
      }
    });
  }

  render(alpha) {
    // 渲染更新、插值等
    this.entities.forEach((entity) => {
      if (entity.render) {
        entity.render(alpha);
      }
    });
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }
}
```

---

## 总结

**requestAnimationFrame 的核心特点**：

### 1. 主要优势

- **自适应刷新率**：自动匹配显示器刷新率（通常 60Hz）
- **页面优化**：页面不可见时自动暂停，节省资源
- **渲染同步**：与浏览器重绘周期同步，避免丢帧
- **更好性能**：浏览器可以进行优化，比定时器更高效

### 2. 工作原理

- 在下次重绘之前执行回调
- 提供高精度时间戳参数
- 按注册顺序执行多个回调
- 与浏览器渲染流程紧密集成

### 3. 最佳实践

- **避免强制同步布局**：分离读取和写入操作
- **优先使用 transform 和 opacity**：避免重排重绘
- **合理使用节流**：避免过度调用
- **及时取消动画**：使用 cancelAnimationFrame

### 4. 应用场景

- **基础动画**：元素移动、缩放、旋转
- **滚动效果**：视差滚动、滚动驱动动画
- **数据可视化**：图表动画、粒子系统
- **游戏开发**：游戏主循环、物理模拟

### 5. 兼容性处理

- 现代浏览器广泛支持
- 提供 setTimeout 降级方案
- 处理厂商前缀版本

### 6. 与其他方案对比

- **vs setTimeout/setInterval**：更流畅、更节能
- **vs CSS 动画**：更灵活、可编程控制
- **vs Web Animations API**：更底层、更通用

requestAnimationFrame 是现代 Web 动画的基础，掌握其原理和最佳实践对于创建高性能的动画效果至关重要。
