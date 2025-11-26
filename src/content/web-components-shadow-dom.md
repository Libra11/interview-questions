---
title: 介绍一下 Web Components 的 Shadow DOM
category: HTML
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Web Components 中 Shadow DOM 的概念和使用。Shadow DOM 提供了样式和 DOM 的封装，
  是构建可复用组件的重要技术。
tags:
  - Web Components
  - Shadow DOM
  - 组件化
  - 封装
estimatedTime: 26 分钟
keywords:
  - Shadow DOM
  - Web Components
  - 样式封装
  - DOM 封装
highlight: Shadow DOM 提供了真正的样式和 DOM 封装，隔离组件内外部的影响
order: 205
---

## 问题 1：什么是 Shadow DOM？

**Shadow DOM 是 Web Components 的核心技术之一，提供了 DOM 和样式的封装**。

它允许你将一个隐藏的、独立的 DOM 树附加到元素上，这个 DOM 树与主文档的 DOM 树分离。

### 基本概念

```javascript
// Shadow DOM 的组成部分
const host = document.querySelector('#host');  // Shadow Host
const shadowRoot = host.attachShadow({ mode: 'open' });  // Shadow Root
shadowRoot.innerHTML = '<p>Shadow DOM 内容</p>';  // Shadow Tree
```

### 简单示例

```html
<!DOCTYPE html>
<html>
<body>
  <div id="host"></div>
  
  <script>
    const host = document.getElementById('host');
    
    // 创建 Shadow DOM
    const shadowRoot = host.attachShadow({ mode: 'open' });
    
    // 添加内容
    shadowRoot.innerHTML = `
      <style>
        p {
          color: red;
          font-size: 20px;
        }
      </style>
      <p>这是 Shadow DOM 中的内容</p>
    `;
  </script>
</body>
</html>
```

---

## 问题 2：Shadow DOM 的核心特性是什么？

**样式封装、DOM 封装、事件重定向**。

### 样式封装

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 外部样式 */
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <!-- 普通 DOM -->
  <p>普通段落（蓝色，16px）</p>
  
  <!-- Shadow DOM -->
  <div id="shadow-host"></div>
  
  <script>
    const host = document.getElementById('shadow-host');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    
    shadowRoot.innerHTML = `
      <style>
        /* Shadow DOM 内部样式 */
        p {
          color: red;
          font-size: 20px;
        }
      </style>
      <p>Shadow DOM 段落（红色，20px）</p>
    `;
  </script>
</body>
</html>

<!-- 结果：
  - 普通段落：蓝色，16px（受外部样式影响）
  - Shadow DOM 段落：红色，20px（不受外部样式影响）
-->
```

### DOM 封装

```javascript
// 外部无法直接访问 Shadow DOM 内部元素
const host = document.getElementById('shadow-host');
const shadowRoot = host.attachShadow({ mode: 'open' });

shadowRoot.innerHTML = `
  <div id="inner">Shadow DOM 内部元素</div>
`;

// ❌ 无法通过普通方法访问
console.log(document.getElementById('inner'));  // null
console.log(document.querySelector('#inner'));  // null

// ✅ 只能通过 shadowRoot 访问
console.log(shadowRoot.getElementById('inner'));  // 找到元素
console.log(shadowRoot.querySelector('#inner'));  // 找到元素
```

### 事件重定向

```javascript
const host = document.getElementById('shadow-host');
const shadowRoot = host.attachShadow({ mode: 'open' });

shadowRoot.innerHTML = `
  <button id="btn">点击我</button>
`;

// 监听事件
document.addEventListener('click', (e) => {
  console.log('事件目标:', e.target);
  console.log('组合路径:', e.composedPath());
});

// 点击 Shadow DOM 内的按钮
// 事件目标会被重定向为 host 元素
// 但 composedPath() 可以看到完整路径
```

---

## 问题 3：如何创建和使用 Shadow DOM？

**使用 attachShadow 方法创建 Shadow DOM**。

### 创建 Shadow DOM

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    
    // 创建 Shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // 添加内容
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          border: 1px solid #ccc;
        }
        
        .title {
          color: #333;
          font-size: 24px;
        }
        
        .content {
          color: #666;
          margin-top: 10px;
        }
      </style>
      
      <div class="title">
        <slot name="title">默认标题</slot>
      </div>
      <div class="content">
        <slot>默认内容</slot>
      </div>
    `;
  }
}

// 注册自定义元素
customElements.define('my-component', MyComponent);
```

### 使用组件

```html
<my-component>
  <span slot="title">自定义标题</span>
  <p>自定义内容</p>
</my-component>
```

### mode 参数

```javascript
// open 模式：外部可以访问 shadowRoot
const shadowRoot1 = element.attachShadow({ mode: 'open' });
console.log(element.shadowRoot);  // 可以访问

// closed 模式：外部无法访问 shadowRoot
const shadowRoot2 = element.attachShadow({ mode: 'closed' });
console.log(element.shadowRoot);  // null

// 但内部仍然可以访问
class MyElement extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: 'closed' });
    // 保存引用供内部使用
  }
}
```

---

## 问题 4：slot 插槽如何使用？

**slot 允许外部内容投影到 Shadow DOM 内部**。

### 默认插槽

```javascript
class CardComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
      </style>
      
      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('card-component', CardComponent);
```

```html
<card-component>
  <h2>卡片标题</h2>
  <p>卡片内容</p>
</card-component>
```

### 具名插槽

```javascript
class UserCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        .user-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          border: 1px solid #ddd;
        }
        
        .avatar {
          width: 60px;
          height: 60px;
        }
        
        .info {
          flex: 1;
        }
        
        .name {
          font-size: 18px;
          font-weight: bold;
        }
        
        .bio {
          color: #666;
          margin-top: 5px;
        }
      </style>
      
      <div class="user-card">
        <div class="avatar">
          <slot name="avatar"></slot>
        </div>
        <div class="info">
          <div class="name">
            <slot name="name">匿名用户</slot>
          </div>
          <div class="bio">
            <slot name="bio">暂无简介</slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('user-card', UserCard);
```

```html
<user-card>
  <img slot="avatar" src="avatar.jpg" />
  <span slot="name">张三</span>
  <p slot="bio">前端开发工程师</p>
</user-card>
```

### 插槽事件

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <slot></slot>
    `;
    
    // 监听插槽变化
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', (e) => {
      const nodes = slot.assignedNodes();
      console.log('插槽内容变化:', nodes);
    });
  }
}
```

---

## 问题 5：如何实现样式穿透？

**使用 CSS 变量、::part、::slotted 等方式**。

### CSS 变量

```javascript
class ThemedButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: var(--button-bg, #007bff);
          color: var(--button-color, white);
          padding: var(--button-padding, 10px 20px);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background: var(--button-hover-bg, #0056b3);
        }
      </style>
      
      <button>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('themed-button', ThemedButton);
```

```html
<style>
  /* 外部通过 CSS 变量控制样式 */
  themed-button {
    --button-bg: #28a745;
    --button-hover-bg: #218838;
    --button-padding: 15px 30px;
  }
</style>

<themed-button>自定义按钮</themed-button>
```

### ::part 伪元素

```javascript
class CustomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          padding: 20px;
        }
      </style>
      
      <div class="card" part="card">
        <h2 part="title">
          <slot name="title"></slot>
        </h2>
        <div part="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('custom-card', CustomCard);
```

```html
<style>
  /* 外部通过 ::part 选择器设置样式 */
  custom-card::part(card) {
    background: #f5f5f5;
    border-radius: 8px;
  }
  
  custom-card::part(title) {
    color: #007bff;
  }
  
  custom-card::part(content) {
    font-size: 14px;
  }
</style>

<custom-card>
  <span slot="title">卡片标题</span>
  <p>卡片内容</p>
</custom-card>
```

### ::slotted 伪元素

```javascript
class SlottedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        /* 选择插槽中的元素 */
        ::slotted(p) {
          color: blue;
          margin: 10px 0;
        }
        
        ::slotted(.highlight) {
          background: yellow;
        }
      </style>
      
      <slot></slot>
    `;
  }
}

customElements.define('slotted-component', SlottedComponent);
```

```html
<slotted-component>
  <p>这段文字会是蓝色</p>
  <p class="highlight">这段文字有黄色背景</p>
</slotted-component>
```

---

## 问题 6：Shadow DOM 的事件处理有什么特殊之处？

**事件会重定向，但可以通过 composedPath 获取完整路径**。

### 事件重定向

```javascript
class ClickableComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <button id="inner-btn">内部按钮</button>
    `;
  }
}

customElements.define('clickable-component', ClickableComponent);
```

```html
<clickable-component id="component"></clickable-component>

<script>
  document.addEventListener('click', (e) => {
    console.log('事件目标:', e.target);
    // 输出：<clickable-component>（而不是内部的 button）
    
    console.log('组合路径:', e.composedPath());
    // 输出：[button, shadow-root, clickable-component, body, html, document, window]
  });
</script>
```

### 自定义事件

```javascript
class CounterComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.count = 0;
    
    this.shadowRoot.innerHTML = `
      <button id="btn">点击次数: <span id="count">0</span></button>
    `;
    
    const btn = this.shadowRoot.getElementById('btn');
    const countSpan = this.shadowRoot.getElementById('count');
    
    btn.addEventListener('click', () => {
      this.count++;
      countSpan.textContent = this.count;
      
      // 派发自定义事件
      this.dispatchEvent(new CustomEvent('countchange', {
        detail: { count: this.count },
        bubbles: true,
        composed: true  // 允许事件穿透 Shadow DOM
      }));
    });
  }
}

customElements.define('counter-component', CounterComponent);
```

```html
<counter-component id="counter"></counter-component>

<script>
  const counter = document.getElementById('counter');
  
  counter.addEventListener('countchange', (e) => {
    console.log('计数变化:', e.detail.count);
  });
</script>
```

---

## 问题 7：Shadow DOM 的实际应用场景有哪些？

**组件库、第三方插件、样式隔离等**。

### 创建可复用组件

```javascript
class TooltipComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
          display: inline-block;
        }
        
        .tooltip {
          visibility: hidden;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          white-space: nowrap;
          margin-bottom: 8px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #333;
        }
        
        :host(:hover) .tooltip {
          visibility: visible;
          opacity: 1;
        }
      </style>
      
      <slot></slot>
      <div class="tooltip">
        <slot name="tooltip">提示信息</slot>
      </div>
    `;
  }
}

customElements.define('tooltip-component', TooltipComponent);
```

```html
<tooltip-component>
  <button>悬停查看提示</button>
  <span slot="tooltip">这是一个提示信息</span>
</tooltip-component>
```

### 第三方组件隔离

```javascript
// 嵌入第三方组件，避免样式冲突
class ThirdPartyWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // 加载第三方样式和脚本
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="third-party.css">
      <div id="widget-container"></div>
      <script src="third-party.js"></script>
    `;
  }
}
```

---

## 总结

**核心特性**：

### 1. 封装性
- 样式封装：内外样式互不影响
- DOM 封装：外部无法直接访问
- 真正的组件化

### 2. 插槽系统
- 默认插槽
- 具名插槽
- 内容投影

### 3. 样式控制
- CSS 变量
- ::part 伪元素
- ::slotted 伪元素
- :host 选择器

### 4. 事件处理
- 事件重定向
- composedPath 获取路径
- 自定义事件

### 5. 应用场景
- 可复用组件
- 第三方插件
- 样式隔离
- 组件库开发

## 延伸阅读

- [Shadow DOM 官方文档](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_shadow_DOM)
- [Web Components 规范](https://www.w3.org/TR/shadow-dom/)
- [Custom Elements](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_custom_elements)
- [Shadow DOM 最佳实践](https://developers.google.com/web/fundamentals/web-components/shadowdom)
