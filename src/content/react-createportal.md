---
title: React createPortal 了解多少
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Portal 的工作原理和使用场景。Portal 允许将子节点渲染到父组件 DOM 层次结构之外的 DOM 节点中，
  常用于实现模态框、提示框等需要脱离文档流的组件。
tags:
  - React
  - Portal
  - DOM 操作
  - 组件设计
estimatedTime: 20 分钟
keywords:
  - React Portal
  - createPortal
  - 模态框
  - DOM 层级
highlight: Portal 可以将组件渲染到任意 DOM 节点，同时保持 React 组件树的完整性
order: 107
---

## 问题 1：createPortal 是什么？

**createPortal 允许将子节点渲染到父组件 DOM 层次之外的 DOM 节点中**。

虽然渲染位置改变了，但在 React 组件树中的位置不变，事件冒泡等行为仍然遵循 React 组件树。

### 基本语法

```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    children,                          // 要渲染的内容
    document.getElementById('modal-root')  // 目标 DOM 节点
  );
}
```

### HTML 结构

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <!-- Portal 的目标容器 -->
    <div id="modal-root"></div>
  </body>
</html>
```

---

## 问题 2：为什么需要 Portal？

**Portal 主要用于解决 CSS 层级和布局问题**。

### 问题场景

```jsx
// ❌ 没有使用 Portal
function Parent() {
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <Modal>
        {/* Modal 会被父元素的 overflow: hidden 裁剪 */}
        <div className="modal-content">模态框内容</div>
      </Modal>
    </div>
  );
}
```

### 使用 Portal 解决

```jsx
// ✅ 使用 Portal
function Modal({ children }) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.body  // 渲染到 body，不受父元素影响
  );
}

function Parent() {
  return (
    <div style={{ overflow: 'hidden' }}>
      <Modal>
        {/* Modal 渲染到 body，不会被裁剪 */}
        模态框内容
      </Modal>
    </div>
  );
}
```

---

## 问题 3：Portal 的常见使用场景有哪些？

**模态框、提示框、下拉菜单等需要脱离文档流的组件**。

### 模态框

```jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}>关闭</button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        打开模态框
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>模态框标题</h2>
        <p>模态框内容</p>
      </Modal>
    </div>
  );
}
```

### 提示框（Tooltip）

```jsx
function Tooltip({ children, content }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = (e) => {
    const rect = e.target.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setIsVisible(true);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y - 30,
            transform: 'translateX(-50%)'
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
```

### 全局通知

```jsx
function Notification({ message, type }) {
  return createPortal(
    <div className={`notification notification-${type}`}>
      {message}
    </div>,
    document.getElementById('notification-root')
  );
}

function App() {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <div>
      <button onClick={() => showNotification('操作成功', 'success')}>
        显示通知
      </button>
      {notifications.map(notif => (
        <Notification key={notif.id} {...notif} />
      ))}
    </div>
  );
}
```

---

## 问题 4：Portal 中的事件冒泡如何工作？

**Portal 中的事件会按照 React 组件树冒泡，而不是 DOM 树**。

### 事件冒泡示例

```jsx
function Parent() {
  const handleClick = () => {
    console.log('父组件捕获到点击');
  };

  return (
    <div onClick={handleClick}>
      <h1>父组件</h1>
      <Modal>
        <button>点击我</button>
      </Modal>
    </div>
  );
}

function Modal({ children }) {
  return createPortal(
    <div className="modal">
      {children}
    </div>,
    document.body
  );
}

// 点击 Modal 中的按钮，会触发父组件的 handleClick
// 即使 Modal 在 DOM 树中不是父组件的子节点
```

### DOM 树 vs React 树

```
DOM 树：
<div id="root">
  <div>父组件</div>
</div>
<div id="modal-root">
  <div>Modal</div>  ← 实际渲染位置
</div>

React 组件树：
<Parent>
  <Modal>  ← 在 React 树中仍是 Parent 的子组件
    ...
  </Modal>
</Parent>

事件冒泡遵循 React 组件树！
```

---

## 问题 5：使用 Portal 需要注意什么？

**需要注意目标容器的存在、清理工作和无障碍访问**。

### 确保目标容器存在

```jsx
function Modal({ children }) {
  const [container] = useState(() => {
    // 创建容器
    const el = document.createElement('div');
    el.id = 'modal-container';
    return el;
  });

  useEffect(() => {
    // 挂载容器
    document.body.appendChild(container);
    
    // 清理容器
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  return createPortal(children, container);
}
```

### 处理焦点管理

```jsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // 保存之前的焦点元素
      const previousActiveElement = document.activeElement;
      
      // 聚焦到模态框
      modalRef.current?.focus();
      
      return () => {
        // 恢复焦点
        previousActiveElement?.focus();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
}
```

### 阻止滚动

```jsx
function Modal({ isOpen, children }) {
  useEffect(() => {
    if (isOpen) {
      // 禁止 body 滚动
      document.body.style.overflow = 'hidden';
      
      return () => {
        // 恢复滚动
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal">{children}</div>,
    document.body
  );
}
```

---

## 问题 6：Portal 和普通渲染有什么区别？

**Portal 改变了 DOM 渲染位置，但保持了 React 组件树的关系**。

### 对比表格

| 特性 | 普通渲染 | Portal |
|------|---------|--------|
| DOM 位置 | 父组件内部 | 指定的 DOM 节点 |
| React 树位置 | 父组件内部 | 父组件内部 |
| 事件冒泡 | 按 DOM 树 | 按 React 树 |
| Context | 可访问 | 可访问 |
| CSS 继承 | 继承父元素 | 不继承父元素 |

### Context 访问示例

```jsx
const ThemeContext = createContext('light');

function Parent() {
  return (
    <ThemeContext.Provider value="dark">
      <Modal>
        <ThemedButton />
      </Modal>
    </ThemeContext.Provider>
  );
}

function Modal({ children }) {
  return createPortal(
    children,
    document.body
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  // 即使渲染到 body，仍然可以访问 Context
  return <button className={theme}>按钮</button>;
}
```

---

## 总结

**核心要点**：

### 1. Portal 的作用
- 将组件渲染到任意 DOM 节点
- 解决 CSS 层级和布局问题
- 保持 React 组件树的完整性

### 2. 常见使用场景
- 模态框（Modal）
- 提示框（Tooltip）
- 下拉菜单（Dropdown）
- 全局通知（Notification）

### 3. 事件冒泡特性
- 按 React 组件树冒泡
- 不按 DOM 树冒泡
- 可以被父组件捕获

### 4. 注意事项
- 确保目标容器存在
- 处理焦点管理
- 阻止背景滚动
- 无障碍访问

### 5. 与普通渲染的区别
- DOM 位置不同
- React 树位置相同
- 仍可访问 Context
- 不继承父元素样式

## 延伸阅读

- [createPortal 官方文档](https://react.dev/reference/react-dom/createPortal)
- [Portal 使用指南](https://react.dev/learn/escape-hatches#rendering-to-a-different-part-of-the-dom)
- [模态框最佳实践](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Portal 源码解析](https://github.com/facebook/react/blob/main/packages/react-dom/src/client/ReactDOMRoot.js)
