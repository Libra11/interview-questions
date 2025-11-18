---
title: Web Components 技术了解多少
category: 前端工程化
difficulty: 高级
updatedAt: 2025-11-18
summary: >-
  深入了解 Web Components 技术栈，包括 Custom Elements、Shadow DOM、HTML Templates 等核心概念和实际应用
tags:
  - Web Components
  - Custom Elements
  - Shadow DOM
  - 组件化
estimatedTime: 28 分钟
keywords:
  - Web Components
  - Custom Elements
  - Shadow DOM
  - HTML Templates
  - 原生组件
highlight: Web Components 是浏览器原生支持的组件化方案，无需框架即可创建可复用的自定义元素
order: 105
---

## 问题 1：Web Components 是什么？

### 三大核心技术

```javascript
// Web Components 由三个主要技术组成：

// 1. Custom Elements（自定义元素）
// 定义自己的 HTML 标签
class MyButton extends HTMLElement {
  constructor() {
    super();
  }
}
customElements.define('my-button', MyButton);

// 2. Shadow DOM（影子 DOM）
// 封装样式和结构，避免样式污染
const shadow = this.attachShadow({ mode: 'open' });

// 3. HTML Templates（HTML 模板）
// 定义可复用的 HTML 片段
<template id="my-template">
  <style>/* 样式 */</style>
  <div>/* 结构 */</div>
</template>
```

### 基本示例

```html
<!-- 使用自定义元素 -->
<user-card 
  name="张三" 
  avatar="avatar.jpg"
  role="管理员"
></user-card>

<script>
// 定义自定义元素
class UserCard extends HTMLElement {
  constructor() {
    super();
    
    // 创建 Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 添加样式和结构
    shadow.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }
      </style>
      <div class="card">
        <img class="avatar" src="${this.getAttribute('avatar')}">
        <h3>${this.getAttribute('name')}</h3>
        <p>${this.getAttribute('role')}</p>
      </div>
    `;
  }
}

// 注册自定义元素
customElements.define('user-card', UserCard);
</script>
```

---

## 问题 2：如何创建 Custom Elements？

### 基础创建

```javascript
// 继承 HTMLElement
class MyElement extends HTMLElement {
  constructor() {
    super(); // 必须首先调用 super()
    
    // 初始化
    this.innerHTML = '<p>Hello World</p>';
  }
  
  // 生命周期回调
  connectedCallback() {
    // 元素被插入到 DOM 时调用
    console.log('元素已添加到页面');
  }
  
  disconnectedCallback() {
    // 元素从 DOM 中移除时调用
    console.log('元素已从页面移除');
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    // 属性变化时调用
    console.log(`属性 ${name} 从 ${oldValue} 变为 ${newValue}`);
  }
  
  adoptedCallback() {
    // 元素被移动到新文档时调用
    console.log('元素被移动到新文档');
  }
  
  // 指定要监听的属性
  static get observedAttributes() {
    return ['name', 'age'];
  }
}

// 注册元素
customElements.define('my-element', MyElement);
```

### 完整示例：计数器组件

```javascript
class CounterButton extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
    
    // 创建 Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 创建结构
    shadow.innerHTML = `
      <style>
        button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
        }
        button:hover {
          background: #45a049;
        }
        .count {
          margin-left: 10px;
          font-weight: bold;
        }
      </style>
      <button>
        点击次数: <span class="count">0</span>
      </button>
    `;
    
    // 获取元素
    this.button = shadow.querySelector('button');
    this.countSpan = shadow.querySelector('.count');
    
    // 绑定事件
    this.button.addEventListener('click', () => {
      this.count++;
      this.countSpan.textContent = this.count;
      
      // 触发自定义事件
      this.dispatchEvent(new CustomEvent('countchange', {
        detail: { count: this.count }
      }));
    });
  }
  
  // 提供公共方法
  reset() {
    this.count = 0;
    this.countSpan.textContent = this.count;
  }
}

customElements.define('counter-button', CounterButton);
```

```html
<!-- 使用 -->
<counter-button id="counter"></counter-button>

<script>
const counter = document.getElementById('counter');

// 监听自定义事件
counter.addEventListener('countchange', (e) => {
  console.log('当前计数:', e.detail.count);
});

// 调用公共方法
// counter.reset();
</script>
```

---

## 问题 3：Shadow DOM 有什么作用？

### 样式隔离

```javascript
class StyledButton extends HTMLElement {
  constructor() {
    super();
    
    const shadow = this.attachShadow({ mode: 'open' });
    
    shadow.innerHTML = `
      <style>
        /* 这里的样式只作用于 Shadow DOM 内部 */
        button {
          background: red;
          color: white;
        }
      </style>
      <button>Shadow Button</button>
    `;
  }
}

customElements.define('styled-button', StyledButton);
```

```html
<style>
  /* 外部样式不会影响 Shadow DOM 内部 */
  button {
    background: blue;
  }
</style>

<button>普通按钮（蓝色）</button>
<styled-button></styled-button> <!-- 红色按钮 -->
```

### CSS 变量穿透

```javascript
class ThemedButton extends HTMLElement {
  constructor() {
    super();
    
    const shadow = this.attachShadow({ mode: 'open' });
    
    shadow.innerHTML = `
      <style>
        button {
          /* 使用 CSS 变量，可以从外部传入 */
          background: var(--button-bg, #4CAF50);
          color: var(--button-color, white);
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}

customElements.define('themed-button', ThemedButton);
```

```html
<style>
  /* 通过 CSS 变量自定义样式 */
  .primary {
    --button-bg: #2196F3;
  }
  
  .danger {
    --button-color: white;
    --button-bg: #f44336;
  }
</style>

<themed-button class="primary">主要按钮</themed-button>
<themed-button class="danger">危险按钮</themed-button>
```

### Slot（插槽）

```javascript
class CardComponent extends HTMLElement {
  constructor() {
    super();
    
    const shadow = this.attachShadow({ mode: 'open' });
    
    shadow.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
        }
        .header {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          color: #666;
        }
      </style>
      <div class="card">
        <div class="header">
          <slot name="header">默认标题</slot>
        </div>
        <div class="content">
          <slot>默认内容</slot>
        </div>
      </div>
    `;
  }
}

customElements.define('card-component', CardComponent);
```

```html
<card-component>
  <span slot="header">自定义标题</span>
  <p>这是卡片的内容</p>
</card-component>
```

---

## 问题 4：HTML Templates 如何使用？

### 定义和使用模板

```html
<!-- 定义模板 -->
<template id="user-card-template">
  <style>
    .card {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
    }
    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
  </style>
  <div class="card">
    <img class="avatar" src="">
    <h3 class="name"></h3>
    <p class="email"></p>
  </div>
</template>

<script>
class UserCard extends HTMLElement {
  constructor() {
    super();
    
    // 获取模板
    const template = document.getElementById('user-card-template');
    const content = template.content.cloneNode(true);
    
    // 创建 Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(content);
    
    // 更新内容
    this.updateContent();
  }
  
  updateContent() {
    const shadow = this.shadowRoot;
    shadow.querySelector('.avatar').src = this.getAttribute('avatar');
    shadow.querySelector('.name').textContent = this.getAttribute('name');
    shadow.querySelector('.email').textContent = this.getAttribute('email');
  }
  
  static get observedAttributes() {
    return ['avatar', 'name', 'email'];
  }
  
  attributeChangedCallback() {
    this.updateContent();
  }
}

customElements.define('user-card', UserCard);
</script>

<!-- 使用 -->
<user-card 
  avatar="avatar.jpg"
  name="张三"
  email="zhangsan@example.com"
></user-card>
```

---

## 问题 5：Web Components 的优缺点是什么？

### 优点

```javascript
// 1. 原生支持，无需框架
// 不依赖 React、Vue 等框架

// 2. 真正的组件封装
// 样式和逻辑完全隔离

// 3. 可复用性强
// 可以在任何项目中使用

// 4. 标准化
// 基于 Web 标准，长期稳定

// 5. 框架无关
// 可以在 React、Vue、Angular 中使用
```

### 缺点

```javascript
// 1. 兼容性问题
// IE 不支持（需要 polyfill）

// 2. 生态不如主流框架
// 缺少成熟的组件库和工具链

// 3. 开发体验
// 没有响应式系统
// 没有虚拟 DOM
// 状态管理需要自己实现

// 4. SEO 问题
// Shadow DOM 内容可能不被搜索引擎索引

// 5. 学习曲线
// 需要理解 Shadow DOM、Custom Elements 等概念
```

### 适用场景

```javascript
// ✅ 适合：
// 1. 跨框架的通用组件
// 2. 微前端架构
// 3. 组件库开发
// 4. 简单的交互组件

// ❌ 不适合：
// 1. 复杂的单页应用
// 2. 需要 SEO 的页面
// 3. 需要兼容 IE 的项目
// 4. 需要丰富生态的项目
```

---

## 总结

**核心要点**：

### 1. 三大技术
- **Custom Elements**：自定义 HTML 标签
- **Shadow DOM**：样式和结构封装
- **HTML Templates**：可复用的 HTML 片段

### 2. 生命周期
```javascript
connectedCallback()      // 插入 DOM
disconnectedCallback()   // 移除 DOM
attributeChangedCallback() // 属性变化
adoptedCallback()        // 移动到新文档
```

### 3. 核心特性
- 样式隔离
- 插槽（Slot）
- CSS 变量穿透
- 自定义事件

### 4. 使用建议
- 适合跨框架组件
- 注意兼容性
- 考虑开发成本
- 评估生态需求

---

## 延伸阅读

- [MDN - Web Components](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)
- [Custom Elements v1](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [Shadow DOM v1](https://dom.spec.whatwg.org/#shadow-trees)
- [Lit - Web Components 库](https://lit.dev/)
- [Stencil - Web Components 编译器](https://stenciljs.com/)
