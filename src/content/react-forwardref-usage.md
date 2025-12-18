---
title: React forwardRef 作用是什么
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 forwardRef 的作用和使用场景。forwardRef 允许组件将 ref 转发给子组件，
  是实现高阶组件和组件库的重要工具。
tags:
  - React
  - forwardRef
  - Ref
  - 组件设计
estimatedTime: 18 分钟
keywords:
  - forwardRef
  - ref 转发
  - useImperativeHandle
  - 组件封装
highlight: forwardRef 实现 ref 转发，让父组件可以访问子组件的 DOM 或实例
order: 375
---

## 问题 1：为什么需要 forwardRef？

**函数组件默认不能接收 ref，forwardRef 解决了这个问题**。

### 问题演示

```jsx
// ❌ 函数组件不能直接接收 ref
function MyInput(props) {
  return <input {...props} />;
}

function Parent() {
  const inputRef = useRef();
  
  // 警告：Function components cannot be given refs
  return <MyInput ref={inputRef} />;
}
```

### 使用 forwardRef 解决

```jsx
// ✅ 使用 forwardRef
const MyInput = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

function Parent() {
  const inputRef = useRef();
  
  const handleFocus = () => {
    inputRef.current.focus();
  };
  
  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleFocus}>聚焦</button>
    </>
  );
}
```

---

## 问题 2：forwardRef 的基本用法是什么？

**forwardRef 接收一个渲染函数，该函数接收 props 和 ref 两个参数**。

### 基本语法

```jsx
const Component = forwardRef((props, ref) => {
  // props: 组件的 props
  // ref: 父组件传递的 ref
  
  return <div ref={ref}>{props.children}</div>;
});
```

### 转发到 DOM 元素

```jsx
const FancyButton = forwardRef((props, ref) => {
  return (
    <button ref={ref} className="fancy-button">
      {props.children}
    </button>
  );
});

function App() {
  const buttonRef = useRef();
  
  useEffect(() => {
    // 可以访问 button 元素
    console.log(buttonRef.current);
    buttonRef.current.focus();
  }, []);
  
  return <FancyButton ref={buttonRef}>Click me</FancyButton>;
}
```

---

## 问题 3：如何配合 useImperativeHandle 使用？

**useImperativeHandle 可以自定义暴露给父组件的实例值**。

### 自定义暴露的方法

```jsx
const VideoPlayer = forwardRef((props, ref) => {
  const videoRef = useRef();
  
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current.play();
    },
    pause: () => {
      videoRef.current.pause();
    },
    getCurrentTime: () => {
      return videoRef.current.currentTime;
    }
  }));
  
  return <video ref={videoRef} src={props.src} />;
});

function App() {
  const playerRef = useRef();
  
  const handlePlay = () => {
    playerRef.current.play();
  };
  
  const handlePause = () => {
    playerRef.current.pause();
  };
  
  return (
    <>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={handlePlay}>播放</button>
      <button onClick={handlePause}>暂停</button>
    </>
  );
}
```

### 只暴露部分功能

```jsx
const Form = forwardRef((props, ref) => {
  const formRef = useRef();
  const [values, setValues] = useState({});
  
  useImperativeHandle(ref, () => ({
    // 只暴露这些方法，隐藏内部实现
    submit: () => {
      formRef.current.submit();
    },
    reset: () => {
      setValues({});
      formRef.current.reset();
    },
    getValues: () => {
      return values;
    }
  }));
  
  return (
    <form ref={formRef}>
      {/* 表单内容 */}
    </form>
  );
});
```

---

## 问题 4：在高阶组件中如何使用？

**高阶组件需要转发 ref 到被包装的组件**。

### 不使用 forwardRef 的问题

```jsx
// ❌ ref 会被附加到 HOC，而不是原始组件
function withLogging(Component) {
  return function LoggingComponent(props) {
    console.log('Rendering:', Component.name);
    return <Component {...props} />;
  };
}

const EnhancedInput = withLogging(Input);

// ref 指向 LoggingComponent，而不是 Input
<EnhancedInput ref={inputRef} />
```

### 使用 forwardRef 解决

```jsx
// ✅ 正确转发 ref
function withLogging(Component) {
  const LoggingComponent = forwardRef((props, ref) => {
    console.log('Rendering:', Component.name);
    return <Component ref={ref} {...props} />;
  });
  
  // 设置 displayName 便于调试
  LoggingComponent.displayName = `withLogging(${Component.name})`;
  
  return LoggingComponent;
}

const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

const EnhancedInput = withLogging(Input);

// ref 正确指向 Input 的 input 元素
<EnhancedInput ref={inputRef} />
```

---

## 问题 5：在组件库中如何使用？

**组件库通常需要暴露 ref 给使用者**。

### 封装 Input 组件

```jsx
const Input = forwardRef(({
  label,
  error,
  ...props
}, ref) => {
  return (
    <div className="input-wrapper">
      {label && <label>{label}</label>}
      <input
        ref={ref}
        className={error ? 'input-error' : 'input'}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

// 使用
function LoginForm() {
  const emailRef = useRef();
  
  const handleSubmit = () => {
    if (!emailRef.current.value) {
      emailRef.current.focus();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        ref={emailRef}
        label="Email"
        type="email"
        placeholder="Enter email"
      />
    </form>
  );
}
```

### 封装 Modal 组件

```jsx
const Modal = forwardRef(({
  title,
  children,
  onClose
}, ref) => {
  const modalRef = useRef();
  
  useImperativeHandle(ref, () => ({
    open: () => {
      modalRef.current.showModal();
    },
    close: () => {
      modalRef.current.close();
    }
  }));
  
  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-header">
        <h2>{title}</h2>
        <button onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        {children}
      </div>
    </dialog>
  );
});

// 使用
function App() {
  const modalRef = useRef();
  
  return (
    <>
      <button onClick={() => modalRef.current.open()}>
        打开模态框
      </button>
      <Modal ref={modalRef} title="提示">
        <p>这是模态框内容</p>
      </Modal>
    </>
  );
}
```

---

## 问题 6：使用 forwardRef 需要注意什么？

**注意命名、类型定义和性能优化**。

### 设置 displayName

```jsx
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

// 设置 displayName 便于调试
MyComponent.displayName = 'MyComponent';

// 在 React DevTools 中会显示为 MyComponent
// 而不是 ForwardRef
```

### TypeScript 类型定义

```tsx
import { forwardRef, ForwardedRef } from 'react';

interface InputProps {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...props} />
        {error && <span>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 避免不必要的重新创建

```jsx
// ❌ 每次渲染都创建新的 forwardRef 组件
function Parent() {
  const MyComponent = forwardRef((props, ref) => {
    return <div ref={ref}>{props.children}</div>;
  });
  
  return <MyComponent>Content</MyComponent>;
}

// ✅ 在组件外部定义
const MyComponent = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

function Parent() {
  return <MyComponent>Content</MyComponent>;
}
```

---

## 问题 7：forwardRef 和普通 ref 有什么区别？

**forwardRef 用于组件，普通 ref 用于 DOM 元素**。

### 对比

```jsx
// 普通 ref - 直接用于 DOM 元素
function Component() {
  const divRef = useRef();
  
  return <div ref={divRef}>Content</div>;
}

// forwardRef - 用于组件
const CustomDiv = forwardRef((props, ref) => {
  return <div ref={ref}>{props.children}</div>;
});

function Parent() {
  const customDivRef = useRef();
  
  return <CustomDiv ref={customDivRef}>Content</CustomDiv>;
}
```

### 使用场景

```jsx
// 场景 1：封装第三方组件
const DatePicker = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => inputRef.current.value = ''
  }));
  
  return <ThirdPartyDatePicker ref={inputRef} {...props} />;
});

// 场景 2：组件库
const Button = forwardRef((props, ref) => {
  return (
    <button ref={ref} className="custom-button" {...props}>
      {props.children}
    </button>
  );
});

// 场景 3：高阶组件
function withTracking(Component) {
  return forwardRef((props, ref) => {
    const handleClick = () => {
      track('click', Component.name);
    };
    
    return <Component ref={ref} onClick={handleClick} {...props} />;
  });
}
```

---

## 总结

**核心要点**：

### 1. forwardRef 的作用
- 让函数组件可以接收 ref
- 将 ref 转发给子组件或 DOM 元素
- 实现组件封装和复用

### 2. 基本用法
- `forwardRef((props, ref) => JSX)`
- ref 作为第二个参数
- 可以转发到任何元素

### 3. 配合 useImperativeHandle
- 自定义暴露的实例值
- 隐藏内部实现细节
- 提供更好的 API

### 4. 使用场景
- 高阶组件
- 组件库
- 封装第三方组件
- 需要访问 DOM 的场景

### 5. 注意事项
- 设置 displayName
- TypeScript 类型定义
- 避免在渲染中创建
- 合理使用 memo 优化

## 延伸阅读

- [forwardRef 官方文档](https://react.dev/reference/react/forwardRef)
- [useImperativeHandle 官方文档](https://react.dev/reference/react/useImperativeHandle)
- [Ref 转发指南](https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes)
- [高阶组件与 Ref](https://legacy.reactjs.org/docs/forwarding-refs.html)
