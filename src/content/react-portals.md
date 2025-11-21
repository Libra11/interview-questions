---
title: React Portals 作用是什么，有哪些使用场景
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 React Portals 的作用和实现原理，掌握如何使用 Portals 将组件渲染到 DOM 树的其他位置，以及常见的应用场景。
tags:
  - React
  - Portals
  - DOM 操作
  - 组件渲染
estimatedTime: 20 分钟
keywords:
  - React Portals
  - createPortal
  - Modal
  - 弹窗
highlight: 掌握 Portals 的核心用法和应用场景，理解如何突破 DOM 层级限制
order: 8
---

## 问题 1：React Portals 是什么？

### 基本概念

Portal 提供了一种将子节点渲染到**父组件 DOM 层次结构之外**的 DOM 节点的方式。

```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  // 将 children 渲染到 document.body 下
  // 而不是当前组件的 DOM 位置
  return createPortal(
    children,
    document.body
  );
}

function App() {
  return (
    <div className="app">
      <h1>My App</h1>
      <Modal>
        <div className="modal">
          这个内容会渲染到 body 下，而不是 .app 下
        </div>
      </Modal>
    </div>
  );
}

// 实际的 DOM 结构：
// <body>
//   <div id="root">
//     <div class="app">
//       <h1>My App</h1>
//     </div>
//   </div>
//   <div class="modal">
//     这个内容会渲染到 body 下，而不是 .app 下
//   </div>
// </body>
```

### Portal 的特点

```jsx
// 1. DOM 层级：渲染到指定的 DOM 节点
// 2. React 树：仍然在原来的 React 组件树中
// 3. 事件冒泡：遵循 React 树的事件冒泡，而非 DOM 树

function Parent() {
  const handleClick = () => {
    console.log('Parent clicked'); // 会被触发
  };
  
  return (
    <div onClick={handleClick}>
      <Modal>
        <button>Click me</button>
      </Modal>
    </div>
  );
}

// 虽然 Modal 渲染到了 body 下
// 但点击 button 时，事件仍会冒泡到 Parent 的 onClick
```

---

## 问题 2：Portal 有哪些使用场景？

### 场景 1：模态框（Modal）

最常见的使用场景是创建模态框，避免 z-index 和 overflow 问题。

```jsx
// ✅ 使用 Portal 实现 Modal
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// 使用
function App() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <button onClick={() => setIsOpen(true)}>打开模态框</button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>模态框标题</h2>
        <p>模态框内容</p>
      </Modal>
    </div>
  );
}

// CSS
// .modal-overlay {
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   background: rgba(0, 0, 0, 0.5);
//   z-index: 1000;
// }
```

### 场景 2：提示框（Tooltip）

```jsx
// ✅ Tooltip 组件
function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef();
  
  const handleMouseEnter = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setIsVisible(true);
  };
  
  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>
      
      {isVisible && createPortal(
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y - 40,
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

// 使用
function App() {
  return (
    <div>
      <Tooltip content="这是一个提示">
        <button>悬停查看提示</button>
      </Tooltip>
    </div>
  );
}
```

### 场景 3：下拉菜单（Dropdown）

```jsx
// ✅ Dropdown 组件
function Dropdown({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef();
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.bottom + 4
      });
    }
  }, [isOpen]);
  
  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && createPortal(
        <div
          className="dropdown-menu"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 1000
          }}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

// 使用
function App() {
  return (
    <Dropdown trigger={<button>打开菜单</button>}>
      <div className="menu-item">选项 1</div>
      <div className="menu-item">选项 2</div>
      <div className="menu-item">选项 3</div>
    </Dropdown>
  );
}
```

### 场景 4：全局通知（Toast/Notification）

```jsx
// ✅ Toast 组件
const ToastContext = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // 3 秒后自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// 自定义 Hook
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// 使用
function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
}

function MyComponent() {
  const { addToast } = useToast();
  
  return (
    <button onClick={() => addToast('操作成功！', 'success')}>
      显示通知
    </button>
  );
}
```

---

## 问题 3：Portal 的事件冒泡机制是怎样的？

### 遵循 React 树的事件冒泡

即使 Portal 渲染到了 DOM 树的其他位置，事件仍然会按照 React 组件树冒泡。

```jsx
function Parent() {
  const handleClick = (e) => {
    console.log('Parent clicked');
    console.log('Target:', e.target);
    console.log('CurrentTarget:', e.currentTarget);
  };
  
  return (
    <div onClick={handleClick} style={{ padding: 20, background: 'lightblue' }}>
      <h1>Parent Component</h1>
      
      <Modal>
        <button>Click me</button>
      </Modal>
    </div>
  );
}

function Modal({ children }) {
  return createPortal(
    <div style={{ padding: 20, background: 'white' }}>
      {children}
    </div>,
    document.body
  );
}

// 点击 button 时：
// 1. 事件从 button 开始
// 2. 冒泡到 Modal 的 div（在 body 下）
// 3. 继续冒泡到 Parent 的 div（在 React 树中的父组件）
// 4. Parent 的 handleClick 被触发
```

### 阻止事件冒泡

```jsx
function Modal({ children, onClose }) {
  const handleOverlayClick = (e) => {
    // 点击遮罩层关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()} // 阻止冒泡到 overlay
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
```

---

## 问题 4：使用 Portal 的注意事项有哪些？

### 1. 确保目标容器存在

```jsx
// ❌ 可能出错：容器不存在
function Modal({ children }) {
  return createPortal(
    children,
    document.getElementById('modal-root') // 可能为 null
  );
}

// ✅ 确保容器存在
function Modal({ children }) {
  const [container] = useState(() => {
    let el = document.getElementById('modal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-root';
      document.body.appendChild(el);
    }
    return el;
  });
  
  return createPortal(children, container);
}

// ✅ 或者在 HTML 中预先创建
// <body>
//   <div id="root"></div>
//   <div id="modal-root"></div>
// </body>
```

### 2. 清理动态创建的容器

```jsx
// ✅ 清理动态创建的元素
function Modal({ children }) {
  const [container] = useState(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  });
  
  useEffect(() => {
    // 组件卸载时清理
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);
  
  return createPortal(children, container);
}
```

### 3. 处理焦点管理

```jsx
// ✅ Modal 打开时管理焦点
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef();
  const previousActiveElement = useRef();
  
  useEffect(() => {
    if (isOpen) {
      // 保存之前的焦点元素
      previousActiveElement.current = document.activeElement;
      
      // 聚焦到 Modal
      modalRef.current?.focus();
      
      return () => {
        // 恢复焦点
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div
      ref={modalRef}
      tabIndex={-1}
      className="modal"
      onKeyDown={e => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      {children}
    </div>,
    document.body
  );
}
```

### 4. 防止滚动穿透

```jsx
// ✅ Modal 打开时禁止 body 滚动
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

## 总结

**核心要点**：

### 1. Portal 的作用

- 将子节点渲染到父组件 DOM 之外的位置
- 突破 CSS overflow 和 z-index 的限制
- 保持 React 组件树的逻辑关系

### 2. 主要使用场景

- 模态框（Modal）
- 提示框（Tooltip）
- 下拉菜单（Dropdown）
- 全局通知（Toast）

### 3. 事件冒泡

- 遵循 React 组件树，而非 DOM 树
- 可以正常使用 stopPropagation
- Context 等特性正常工作

### 4. 注意事项

- 确保目标容器存在
- 清理动态创建的容器
- 管理焦点和键盘导航
- 防止滚动穿透

## 延伸阅读

- [React 官方文档 - Portals](https://react.dev/reference/react-dom/createPortal)
- [React 官方文档 - Portals 与事件冒泡](https://react.dev/reference/react-dom/createPortal#event-bubbling-through-portals)
- [无障碍访问 - Modal 对话框](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [React Portal 实践指南](https://blog.logrocket.com/learn-react-portals-example/)
