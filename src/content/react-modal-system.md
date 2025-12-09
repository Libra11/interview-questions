---
title: 如何封装一个通用弹窗系统？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  掌握封装通用弹窗系统的设计思路和实现方法。
tags:
  - React
  - 弹窗
  - 组件设计
  - 架构
estimatedTime: 15 分钟
keywords:
  - modal system
  - dialog component
  - React portal
  - component design
highlight: 通用弹窗系统包括 Modal 组件、Portal 渲染、状态管理、命令式调用等核心功能。
order: 295
---

## 问题 1：基础 Modal 组件

### 使用 Portal

```jsx
import { createPortal } from "react-dom";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

### 样式

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
}
```

---

## 问题 2：状态管理方案

### Context 方案

```jsx
const ModalContext = createContext();

function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const openModal = (config) => {
    const id = Date.now();
    setModals((prev) => [...prev, { id, ...config }]);
    return id;
  };

  const closeModal = (id) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modals.map((modal) => (
        <Modal
          key={modal.id}
          open={true}
          onClose={() => closeModal(modal.id)}
          {...modal}
        />
      ))}
    </ModalContext.Provider>
  );
}

// 使用
function App() {
  const { openModal } = useContext(ModalContext);

  const handleClick = () => {
    openModal({
      title: "确认",
      children: <p>确定要删除吗？</p>,
    });
  };
}
```

---

## 问题 3：命令式调用

### 实现 modal.confirm

```jsx
// modal.js
let modalRoot = null;

function getModalRoot() {
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    document.body.appendChild(modalRoot);
  }
  return modalRoot;
}

export const modal = {
  confirm({ title, content, onOk, onCancel }) {
    const container = document.createElement("div");
    getModalRoot().appendChild(container);

    const destroy = () => {
      const root = createRoot(container);
      root.unmount();
      container.remove();
    };

    const root = createRoot(container);
    root.render(
      <ConfirmModal
        title={title}
        content={content}
        onOk={() => {
          onOk?.();
          destroy();
        }}
        onCancel={() => {
          onCancel?.();
          destroy();
        }}
      />
    );

    return { destroy };
  },

  alert({ title, content }) {
    return this.confirm({ title, content });
  },
};

// 使用
modal.confirm({
  title: "确认删除",
  content: "删除后无法恢复",
  onOk: () => deleteItem(),
});
```

---

## 问题 4：高级功能

### 动画支持

```jsx
import { CSSTransition } from "react-transition-group";

function Modal({ open, onClose, children }) {
  return createPortal(
    <CSSTransition in={open} timeout={300} classNames="modal" unmountOnExit>
      <div className="modal-overlay">
        <div className="modal-content">{children}</div>
      </div>
    </CSSTransition>,
    document.body
  );
}
```

### 键盘支持

```jsx
function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  // ...
}
```

### 焦点管理

```jsx
function Modal({ open, onClose, children }) {
  const modalRef = useRef();
  const previousFocus = useRef();

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      modalRef.current?.focus();
    } else {
      previousFocus.current?.focus();
    }
  }, [open]);

  return (
    <div ref={modalRef} tabIndex={-1}>
      {children}
    </div>
  );
}
```

---

## 问题 5：完整示例

### 弹窗系统 API

```jsx
// 声明式使用
<Modal open={isOpen} onClose={handleClose}>
  <Modal.Header>标题</Modal.Header>
  <Modal.Body>内容</Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>取消</Button>
    <Button primary onClick={handleOk}>
      确定
    </Button>
  </Modal.Footer>
</Modal>;

// 命令式使用
modal.confirm({
  title: "确认",
  content: "确定要删除吗？",
  onOk: () => {},
});

modal.alert({
  title: "提示",
  content: "操作成功",
});

// Hooks 使用
const { openModal, closeModal } = useModal();
```

## 总结

| 功能       | 实现方式             |
| ---------- | -------------------- |
| 渲染位置   | Portal               |
| 状态管理   | Context / 外部 store |
| 命令式调用 | createRoot 动态渲染  |
| 动画       | CSSTransition        |
| 键盘支持   | ESC 关闭             |
| 焦点管理   | focus trap           |

## 延伸阅读

- [React Portal](https://react.dev/reference/react-dom/createPortal)
- [WAI-ARIA Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
