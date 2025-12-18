---
title: DOMContentLoaded 事件和 load 事件有什么区别？
category: JavaScript
difficulty: 入门
updatedAt: 2025-11-17
summary: >-
  深入理解 DOMContentLoaded 和 load 事件的区别，掌握页面加载的不同阶段，学习如何在合适的时机执行 JavaScript 代码，优化页面加载性能。
tags:
  - DOM事件
  - 页面加载
  - DOMContentLoaded
  - load事件
estimatedTime: 18 分钟
keywords:
  - DOMContentLoaded
  - load
  - 页面加载
  - DOM解析
  - 资源加载
highlight: DOMContentLoaded 在 DOM 解析完成后触发，load 在所有资源加载完成后触发，选择合适的事件可以优化页面性能
order: 410
---

## 问题 1：DOMContentLoaded 和 load 事件的基本区别是什么？

两个事件的**触发时机不同**。

### 基本概念

```javascript
// DOMContentLoaded: DOM 解析完成后触发
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 已解析完成');
  // 此时可以操作 DOM，但图片、样式表等资源可能还未加载完成
});

// load: 所有资源加载完成后触发
window.addEventListener('load', () => {
  console.log('页面完全加载');
  // 此时所有资源（图片、样式表、脚本等）都已加载完成
});

// 执行顺序：
// 1. DOMContentLoaded（更早）
// 2. load（更晚）
```

### 触发时机对比

```javascript
// 页面加载流程：
// 1. 开始解析 HTML
// 2. 遇到 <link> 标签，开始加载 CSS（不阻塞 HTML 解析）
// 3. 遇到 <script> 标签，加载并执行 JS（阻塞 HTML 解析，除非有 async/defer）
// 4. HTML 解析完成 → 触发 DOMContentLoaded
// 5. 继续加载图片、字体等资源
// 6. 所有资源加载完成 → 触发 load

// 示例：测量加载时间
const startTime = performance.now();

document.addEventListener('DOMContentLoaded', () => {
  const domTime = performance.now() - startTime;
  console.log(`DOM 解析耗时: ${domTime.toFixed(2)}ms`);
});

window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`页面加载耗时: ${loadTime.toFixed(2)}ms`);
});

// 输出示例：
// DOM 解析耗时: 150.23ms
// 页面加载耗时: 1250.67ms
```

---

## 问题 2：什么时候使用 DOMContentLoaded？

当你需要**尽早操作 DOM** 时使用 DOMContentLoaded。

### 适用场景

```javascript
// 场景 1：初始化 DOM 操作
document.addEventListener('DOMContentLoaded', () => {
  // 获取元素
  const button = document.getElementById('myButton');
  const container = document.querySelector('.container');
  
  // 绑定事件
  button.addEventListener('click', () => {
    console.log('按钮被点击');
  });
  
  // 修改内容
  container.textContent = '页面已准备好';
});

// 场景 2：初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 初始化路由
  initRouter();
  
  // 初始化状态管理
  initStore();
  
  // 渲染应用
  renderApp();
});

// 场景 3：表单验证
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = form.username.value;
    const password = form.password.value;
    
    if (!username || !password) {
      alert('请填写完整信息');
      return;
    }
    
    // 提交表单
    submitForm({ username, password });
  });
});
```

### 优势

```javascript
// 优势 1：更快的交互
// DOMContentLoaded 触发更早，用户可以更快地与页面交互

document.addEventListener('DOMContentLoaded', () => {
  // 页面可以立即响应用户操作
  document.getElementById('searchBtn').addEventListener('click', search);
});

// 如果等待 load 事件，用户需要等待所有图片加载完成
window.addEventListener('load', () => {
  // 可能需要等待很久
  document.getElementById('searchBtn').addEventListener('click', search);
});

// 优势 2：不依赖外部资源
// 不需要等待图片、字体等资源加载完成

document.addEventListener('DOMContentLoaded', () => {
  // 即使图片还在加载，也可以操作 DOM
  const images = document.querySelectorAll('img');
  console.log(`页面有 ${images.length} 张图片`);
});
```

---

## 问题 3：什么时候使用 load 事件？

当你需要**确保所有资源加载完成**时使用 load。

### 适用场景

```javascript
// 场景 1：获取图片尺寸
window.addEventListener('load', () => {
  const img = document.getElementById('myImage');
  
  // 图片已加载，可以获取真实尺寸
  console.log(`图片宽度: ${img.width}px`);
  console.log(`图片高度: ${img.height}px`);
});

// 场景 2：计算布局
window.addEventListener('load', () => {
  // 所有资源加载完成，布局已稳定
  const container = document.querySelector('.container');
  const height = container.offsetHeight;
  
  // 根据实际高度调整布局
  adjustLayout(height);
});

// 场景 3：性能监控
window.addEventListener('load', () => {
  // 统计页面完整加载时间
  const perfData = performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  
  console.log(`页面加载时间: ${loadTime}ms`);
  
  // 上报性能数据
  reportPerformance({
    loadTime,
    domTime: perfData.domContentLoadedEventEnd - perfData.navigationStart
  });
});

// 场景 4：初始化依赖外部资源的功能
window.addEventListener('load', () => {
  // 确保所有图片加载完成后初始化轮播图
  initCarousel();
  
  // 确保字体加载完成后计算文本宽度
  calculateTextWidth();
});
```

### 监听特定资源加载

```javascript
// 监听单个图片加载
const img = document.getElementById('myImage');

img.addEventListener('load', () => {
  console.log('图片加载完成');
  console.log(`尺寸: ${img.width} x ${img.height}`);
});

img.addEventListener('error', () => {
  console.error('图片加载失败');
  img.src = '/placeholder.png'; // 使用占位图
});

// 监听多个图片加载
function waitForImages(selector) {
  return new Promise((resolve) => {
    const images = document.querySelectorAll(selector);
    let loadedCount = 0;
    
    if (images.length === 0) {
      resolve();
      return;
    }
    
    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === images.length) {
          resolve();
        }
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount === images.length) {
            resolve();
          }
        });
      }
    });
  });
}

// 使用
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM 已解析');
  
  await waitForImages('img');
  console.log('所有图片已加载');
  
  // 初始化图片相关功能
  initImageGallery();
});
```

---

## 问题 4：如何处理脚本加载对事件的影响？

脚本的加载方式会**影响事件触发时机**。

### 普通脚本（阻塞）

```html
<!-- 普通脚本会阻塞 HTML 解析 -->
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <!-- 这个脚本会阻塞 HTML 解析 -->
  <script src="large-script.js"></script>
</head>
<body>
  <div id="content">内容</div>
  
  <script>
    // 此时 DOM 还未完全解析
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded');
    });
  </script>
</body>
</html>

<!-- 执行顺序：
1. 加载并执行 large-script.js（阻塞）
2. 继续解析 HTML
3. 触发 DOMContentLoaded
-->
```

### defer 脚本（延迟执行）

```html
<!-- defer 脚本不阻塞 HTML 解析，在 DOMContentLoaded 之前执行 -->
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <!-- defer 脚本并行下载，不阻塞解析 -->
  <script src="script1.js" defer></script>
  <script src="script2.js" defer></script>
</head>
<body>
  <div id="content">内容</div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded');
    });
  </script>
</body>
</html>

<!-- 执行顺序：
1. HTML 解析（不阻塞）
2. 执行 script1.js
3. 执行 script2.js
4. 触发 DOMContentLoaded
-->
```

### async 脚本（异步执行）

```html
<!-- async 脚本不阻塞 HTML 解析，下载完成后立即执行 -->
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
  <!-- async 脚本并行下载，下载完成后立即执行 -->
  <script src="analytics.js" async></script>
</head>
<body>
  <div id="content">内容</div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded');
    });
  </script>
</body>
</html>

<!-- 执行顺序不确定：
- 如果 async 脚本在 HTML 解析完成前下载完成，会立即执行
- DOMContentLoaded 可能在 async 脚本执行前或后触发
-->
```

### 最佳实践

```html
<!DOCTYPE html>
<html>
<head>
  <title>最佳实践</title>
  <!-- CSS 放在 head 中 -->
  <link rel="stylesheet" href="styles.css">
  
  <!-- 关键脚本使用 defer -->
  <script src="app.js" defer></script>
  
  <!-- 独立的第三方脚本使用 async -->
  <script src="analytics.js" async></script>
</head>
<body>
  <div id="app"></div>
  
  <!-- 或将脚本放在 body 底部 -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM 已准备好');
      initApp();
    });
  </script>
</body>
</html>
```

---

## 问题 5：如何兼容不同的加载场景？

处理**各种边界情况**。

### 检查 DOM 是否已加载

```javascript
// 方法 1：检查 document.readyState
function domReady(callback) {
  if (document.readyState === 'loading') {
    // DOM 还在加载中
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    // DOM 已加载完成
    callback();
  }
}

// 使用
domReady(() => {
  console.log('DOM 已准备好');
  initApp();
});

// 方法 2：使用 Promise
function waitForDOM() {
  return new Promise(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// 使用
await waitForDOM();
console.log('DOM 已准备好');

// 方法 3：jQuery 风格
function $(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// 使用
$(() => {
  console.log('DOM 已准备好');
});
```

### 检查页面是否完全加载

```javascript
// 检查页面加载状态
function pageReady(callback) {
  if (document.readyState === 'complete') {
    // 页面已完全加载
    callback();
  } else {
    // 等待 load 事件
    window.addEventListener('load', callback);
  }
}

// 使用
pageReady(() => {
  console.log('页面完全加载');
  initGallery();
});

// document.readyState 的值：
// - 'loading': 文档正在加载
// - 'interactive': 文档已解析完成（DOMContentLoaded 触发）
// - 'complete': 文档和所有资源已加载完成（load 触发）

// 监听 readyState 变化
document.addEventListener('readystatechange', () => {
  console.log('readyState:', document.readyState);
  
  if (document.readyState === 'interactive') {
    console.log('DOM 已解析');
  }
  
  if (document.readyState === 'complete') {
    console.log('页面完全加载');
  }
});
```

### 封装通用工具

```javascript
// 通用的页面加载工具
const PageLoader = {
  // DOM 准备好时执行
  ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  },
  
  // 页面完全加载时执行
  loaded(callback) {
    if (document.readyState === 'complete') {
      callback();
    } else {
      window.addEventListener('load', callback);
    }
  },
  
  // 返回 Promise
  whenReady() {
    return new Promise(resolve => {
      this.ready(resolve);
    });
  },
  
  whenLoaded() {
    return new Promise(resolve => {
      this.loaded(resolve);
    });
  },
  
  // 获取加载时间
  getLoadTime() {
    if (document.readyState !== 'complete') {
      return null;
    }
    
    const perfData = performance.timing;
    return {
      domTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      loadTime: perfData.loadEventEnd - perfData.navigationStart
    };
  }
};

// 使用
PageLoader.ready(() => {
  console.log('DOM 已准备好');
});

PageLoader.loaded(() => {
  console.log('页面完全加载');
  const times = PageLoader.getLoadTime();
  console.log('加载时间:', times);
});

// 使用 Promise
await PageLoader.whenReady();
console.log('DOM 已准备好');

await PageLoader.whenLoaded();
console.log('页面完全加载');
```

---

## 问题 6：实际项目中的应用场景有哪些？

了解**实际开发中的最佳实践**。

### 场景 1：SPA 应用初始化

```javascript
// 单页应用初始化
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化路由
  const router = new Router();
  router.init();
  
  // 2. 初始化状态管理
  const store = new Store();
  
  // 3. 渲染根组件
  const app = new App({
    el: '#app',
    router,
    store
  });
  
  app.mount();
});

// 等待资源加载完成后的操作
window.addEventListener('load', () => {
  // 隐藏加载动画
  document.getElementById('loading').style.display = 'none';
  
  // 上报性能数据
  reportPerformance();
});
```

### 场景 2：图片懒加载

```javascript
// 使用 DOMContentLoaded 初始化懒加载
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
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
  
  lazyImages.forEach(img => imageObserver.observe(img));
});
```

### 场景 3：性能监控

```javascript
// 完整的性能监控
let domTime = 0;
let loadTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  domTime = performance.now();
  console.log(`DOM 解析完成: ${domTime.toFixed(2)}ms`);
});

window.addEventListener('load', () => {
  loadTime = performance.now();
  console.log(`页面加载完成: ${loadTime.toFixed(2)}ms`);
  
  // 上报性能数据
  const perfData = performance.timing;
  
  fetch('/api/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: window.location.href,
      domTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      loadTime: perfData.loadEventEnd - perfData.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
      resources: performance.getEntriesByType('resource').length
    })
  });
});
```

### 场景 4：渐进式增强

```javascript
// 基础功能在 DOMContentLoaded 时可用
document.addEventListener('DOMContentLoaded', () => {
  // 基础交互立即可用
  const form = document.getElementById('searchForm');
  form.addEventListener('submit', handleSearch);
  
  // 显示基础内容
  document.body.classList.add('interactive');
});

// 增强功能在 load 时启用
window.addEventListener('load', () => {
  // 启用高级功能
  initAnimations();
  initCharts();
  
  // 显示完整功能
  document.body.classList.add('fully-loaded');
});
```

---

## 问题 7：常见问题和注意事项有哪些？

了解**常见陷阱和最佳实践**。

### 常见问题

```javascript
// 问题 1：重复监听
// ❌ 不好：可能重复添加监听器
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', init); // 重复

// ✅ 好：使用 once 选项
document.addEventListener('DOMContentLoaded', init, { once: true });

// 或使用函数包装
let initialized = false;
function init() {
  if (initialized) return;
  initialized = true;
  
  // 初始化代码
}

// 问题 2：在事件触发后添加监听器
// ❌ 不好：可能永远不会执行
setTimeout(() => {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('这可能不会执行');
  });
}, 1000);

// ✅ 好：检查 readyState
function domReady(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// 问题 3：在 load 事件中操作 DOM
// ⚠️ 注意：load 事件触发较晚，影响用户体验
window.addEventListener('load', () => {
  // 用户需要等待很久才能交互
  document.getElementById('button').addEventListener('click', handleClick);
});

// ✅ 好：在 DOMContentLoaded 中操作 DOM
document.addEventListener('DOMContentLoaded', () => {
  // 用户可以更快地交互
  document.getElementById('button').addEventListener('click', handleClick);
});
```

### 最佳实践

```javascript
// 1. 根据需求选择合适的事件
// 需要操作 DOM → DOMContentLoaded
// 需要获取资源尺寸 → load

// 2. 使用 defer 优化脚本加载
// <script src="app.js" defer></script>

// 3. 封装工具函数
const DOM = {
  ready: (callback) => {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }
};

// 4. 使用 Performance API 监控
window.addEventListener('load', () => {
  const perfData = performance.timing;
  console.log('DOM 解析:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart);
  console.log('页面加载:', perfData.loadEventEnd - perfData.loadEventStart);
});

// 5. 渐进式加载
document.addEventListener('DOMContentLoaded', () => {
  // 核心功能
  initCore();
});

window.addEventListener('load', () => {
  // 增强功能
  initEnhancements();
});
```

---

## 总结

**DOMContentLoaded 和 load 事件的核心要点**：

### 1. 基本区别
- **DOMContentLoaded**：DOM 解析完成后触发
- **load**：所有资源加载完成后触发
- DOMContentLoaded 触发更早

### 2. 触发时机
- DOMContentLoaded：HTML 解析完成
- load：图片、样式表、脚本等全部加载完成
- 执行顺序：DOMContentLoaded → load

### 3. 使用场景
- **DOMContentLoaded**：操作 DOM、绑定事件、初始化应用
- **load**：获取资源尺寸、性能监控、依赖外部资源的功能

### 4. 脚本影响
- 普通脚本：阻塞 HTML 解析
- defer 脚本：不阻塞，在 DOMContentLoaded 前执行
- async 脚本：不阻塞，下载完立即执行

### 5. 兼容处理
- 检查 document.readyState
- 封装工具函数
- 使用 Promise 包装

### 6. 实际应用
- SPA 初始化
- 图片懒加载
- 性能监控
- 渐进式增强

### 7. 最佳实践
- 根据需求选择合适的事件
- 使用 defer 优化加载
- 检查 DOM 状态
- 避免重复监听

## 延伸阅读

- [MDN - DOMContentLoaded](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/DOMContentLoaded_event)
- [MDN - load](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/load_event)
- [MDN - document.readyState](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/readyState)
- [页面生命周期](https://javascript.info/onload-ondomcontentloaded)
