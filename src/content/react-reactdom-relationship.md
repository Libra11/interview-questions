---
title: react 和 react-dom 是什么关系
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  理解 React 的包拆分设计，掌握 react 和 react-dom 的职责划分，以及 React 如何支持多平台渲染的架构设计。
tags:
  - React
  - react-dom
  - 架构设计
  - 渲染器
estimatedTime: 18 分钟
keywords:
  - React
  - react-dom
  - 渲染器
  - 跨平台
highlight: 理解 React 核心库与渲染器的分离设计，掌握 React 的跨平台能力
order: 7
---

## 问题 1：react 和 react-dom 的职责是什么？

### 包的职责划分

React 采用了**核心库与渲染器分离**的设计，`react` 和 `react-dom` 有着明确的职责划分。

```javascript
// react 包：核心功能
import React, { 
  useState,           // 状态管理
  useEffect,          // 副作用
  useContext,         // Context API
  createElement,      // 创建元素
  Component,          // 类组件基类
  memo,              // 性能优化
  // ... 其他核心 API
} from 'react';

// react-dom 包：DOM 渲染
import ReactDOM from 'react-dom';
import { 
  createRoot,         // React 18 的渲染方法
  hydrateRoot,        // SSR 水合
  flushSync,          // 同步刷新
  createPortal,       // Portal API
} from 'react-dom';
```

### react 包的职责

`react` 包负责**组件的定义和状态管理**，与平台无关。

```jsx
// ✅ react 包提供的功能
import { useState, useEffect } from 'react';

function Counter() {
  // 状态管理
  const [count, setCount] = useState(0);
  
  // 副作用处理
  useEffect(() => {
    console.log('count changed:', count);
  }, [count]);
  
  // 返回 React 元素（虚拟 DOM）
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

// JSX 会被编译为 React.createElement 调用
// <div>Hello</div>
// ↓ 编译后
// React.createElement('div', null, 'Hello')
```

### react-dom 包的职责

`react-dom` 包负责**将 React 元素渲染到 DOM**。

```jsx
// ✅ react-dom 包提供的功能
import { createRoot } from 'react-dom/client';

// 1. 创建根节点
const root = createRoot(document.getElementById('root'));

// 2. 渲染 React 元素到 DOM
root.render(<App />);

// 3. 更新渲染
root.render(<App newProp="value" />);

// 4. 卸载
root.unmount();
```

---

## 问题 2：为什么要拆分成两个包？

### 原因 1：支持多平台渲染

拆分设计使得 React 可以渲染到不同的平台，而不仅仅是浏览器 DOM。

```javascript
// Web 平台：react-dom
import { createRoot } from 'react-dom/client';
createRoot(domNode).render(<App />);

// 移动端：react-native
import { AppRegistry } from 'react-native';
AppRegistry.registerComponent('App', () => App);

// 终端：react-ink
import { render } from 'ink';
render(<App />);

// Canvas：react-konva
import { Stage, Layer } from 'react-konva';
render(
  <Stage>
    <Layer>
      <App />
    </Layer>
  </Stage>
);

// 所有这些平台都使用相同的 react 包
// 只是渲染器不同
```

### 原因 2：职责单一，易于维护

```javascript
// react 包：专注于组件逻辑
// - 组件定义（函数组件、类组件）
// - Hooks 实现
// - Context API
// - 虚拟 DOM 的创建和 Diff

// react-dom 包：专注于 DOM 操作
// - 将虚拟 DOM 转换为真实 DOM
// - 事件系统
// - DOM 属性处理
// - 浏览器兼容性处理
```

### 原因 3：减小包体积

不同平台只需要引入对应的渲染器，减小最终打包体积。

```javascript
// Web 应用只需要 react-dom
import React from 'react';
import ReactDOM from 'react-dom/client';

// React Native 应用只需要 react-native
import React from 'react';
import { AppRegistry } from 'react-native';

// 不需要引入不相关的渲染器代码
```

---

## 问题 3：React 的渲染器架构是如何设计的？

### React 的三层架构

```javascript
// 1. react 包：核心层
// - 定义组件模型
// - 提供 Hooks API
// - 创建虚拟 DOM

// 2. react-reconciler 包：协调层（内部包）
// - Fiber 架构
// - Diff 算法
// - 调度器
// - 协调更新流程

// 3. 渲染器层：平台层
// - react-dom：浏览器 DOM
// - react-native：移动端原生组件
// - react-test-renderer：测试环境
```

### 渲染器的实现方式

每个渲染器都需要实现一组特定的接口，供 `react-reconciler` 调用。

```javascript
// 简化的渲染器接口
const HostConfig = {
  // 创建实例
  createInstance(type, props) {
    // react-dom: 创建 DOM 元素
    return document.createElement(type);
    
    // react-native: 创建原生组件
    // return NativeModules.createView(type);
  },
  
  // 创建文本节点
  createTextInstance(text) {
    // react-dom
    return document.createTextNode(text);
  },
  
  // 添加子节点
  appendChild(parent, child) {
    // react-dom
    parent.appendChild(child);
  },
  
  // 更新属性
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // react-dom: 更新 DOM 属性
    updateDOMProperties(instance, oldProps, newProps);
  },
  
  // 删除子节点
  removeChild(parent, child) {
    // react-dom
    parent.removeChild(child);
  },
  
  // ... 其他接口
};

// react-reconciler 使用这些接口
import Reconciler from 'react-reconciler';
const reconciler = Reconciler(HostConfig);
```

### react-dom 的实现示例

```javascript
// react-dom 的简化实现
import Reconciler from 'react-reconciler';

// 定义 DOM 渲染器的配置
const hostConfig = {
  supportsMutation: true,
  
  createInstance(type, props) {
    const element = document.createElement(type);
    
    // 设置属性
    Object.keys(props).forEach(key => {
      if (key === 'children') return;
      
      if (key === 'className') {
        element.className = props[key];
      } else if (key.startsWith('on')) {
        const eventType = key.toLowerCase().substring(2);
        element.addEventListener(eventType, props[key]);
      } else {
        element.setAttribute(key, props[key]);
      }
    });
    
    return element;
  },
  
  createTextInstance(text) {
    return document.createTextNode(text);
  },
  
  appendChild(parent, child) {
    parent.appendChild(child);
  },
  
  appendInitialChild(parent, child) {
    parent.appendChild(child);
  },
  
  removeChild(parent, child) {
    parent.removeChild(child);
  },
  
  insertBefore(parent, child, beforeChild) {
    parent.insertBefore(child, beforeChild);
  },
  
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // 更新 DOM 属性
    Object.keys(newProps).forEach(key => {
      if (key === 'children') return;
      
      if (newProps[key] !== oldProps[key]) {
        if (key === 'className') {
          instance.className = newProps[key];
        } else {
          instance.setAttribute(key, newProps[key]);
        }
      }
    });
  },
  
  // ... 其他方法
};

// 创建 reconciler 实例
const reconciler = Reconciler(hostConfig);

// 导出渲染方法
export function createRoot(container) {
  const root = reconciler.createContainer(container);
  
  return {
    render(element) {
      reconciler.updateContainer(element, root, null);
    },
    unmount() {
      reconciler.updateContainer(null, root, null);
    }
  };
}
```

---

## 问题 4：react-dom 还提供了哪些功能？

### 1. 服务端渲染（SSR）

```javascript
// react-dom/server：服务端渲染
import { renderToString, renderToStaticMarkup } from 'react-dom/server';

// 渲染为 HTML 字符串（包含 React 的数据属性）
const html = renderToString(<App />);

// 渲染为纯静态 HTML（不包含 React 属性）
const staticHtml = renderToStaticMarkup(<App />);

// React 18 的流式 SSR
import { renderToPipeableStream } from 'react-dom/server';

const stream = renderToPipeableStream(<App />, {
  onShellReady() {
    response.pipe(stream);
  }
});
```

### 2. Portal API

```jsx
// 将子节点渲染到 DOM 树的其他位置
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    children,
    document.getElementById('modal-root')
  );
}

function App() {
  return (
    <div>
      <h1>App</h1>
      <Modal>
        <div>这个内容会渲染到 #modal-root 中</div>
      </Modal>
    </div>
  );
}
```

### 3. 同步刷新

```jsx
// flushSync：强制同步更新
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(count + 1);
  });
  
  // 这里 DOM 已经更新完成
  console.log(ref.current.textContent);
}
```

### 4. 事件系统

`react-dom` 实现了合成事件系统，统一了不同浏览器的事件行为。

```jsx
// React 的合成事件
function Button() {
  const handleClick = (e) => {
    // e 是 React 的 SyntheticEvent
    // 统一了不同浏览器的行为
    e.preventDefault();
    e.stopPropagation();
    
    // 访问原生事件
    const nativeEvent = e.nativeEvent;
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

---

## 总结

**核心要点**：

### 1. 职责划分

- **react**：组件定义、状态管理、虚拟 DOM（平台无关）
- **react-dom**：DOM 渲染、事件系统、浏览器兼容（平台相关）

### 2. 拆分的好处

- 支持多平台渲染（Web、Native、Terminal 等）
- 职责单一，易于维护
- 减小包体积

### 3. 架构设计

- 核心层（react）
- 协调层（react-reconciler）
- 渲染器层（react-dom、react-native 等）

### 4. react-dom 的功能

- 客户端渲染（createRoot）
- 服务端渲染（renderToString）
- Portal API
- 同步刷新（flushSync）
- 合成事件系统

## 延伸阅读

- [React 官方文档 - react-dom](https://react.dev/reference/react-dom)
- [React 官方文档 - react-dom/client](https://react.dev/reference/react-dom/client)
- [React 官方文档 - react-dom/server](https://react.dev/reference/react-dom/server)
- [自定义渲染器](https://github.com/facebook/react/tree/main/packages/react-reconciler)
- [React Native 架构](https://reactnative.dev/architecture/overview)
