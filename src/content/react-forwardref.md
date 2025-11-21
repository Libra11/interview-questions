---
title: React forwardRef 作用是啥，有哪些使用场景
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 forwardRef 的作用和使用场景，掌握如何在函数组件中转发 ref，以及如何结合 useImperativeHandle 暴露自定义的实例方法。
tags:
  - React
  - forwardRef
  - Ref
  - 组件封装
estimatedTime: 20 分钟
keywords:
  - forwardRef
  - React Ref
  - useImperativeHandle
  - 组件转发
highlight: 掌握 forwardRef 的核心用法和最佳实践，理解 ref 转发的应用场景
order: 6
---

## 问题 1：forwardRef 是什么？

### 基本概念

`forwardRef` 允许组件将接收到的 ref 转发给子组件，这在封装可复用组件时非常有用。

```jsx
// ❌ 函数组件默认不能接收 ref
function Input(props) {
  // 这里无法获取到 ref
  return <input {...props} />;
}

function Parent() {
  const inputRef = useRef();
  // ❌ 警告：Function components cannot be given refs
  return <Input ref={inputRef} />;
}

// ✅ 使用 forwardRef 转发 ref
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

function Parent() {
  const inputRef = useRef();
  // ✅ 正常工作
  return <Input ref={inputRef} />;
}
```

### 为什么需要 forwardRef？

在 React 中，`ref` 是一个特殊的 prop，不会像普通 props 那样传递给组件。

```jsx
// ref 不会出现在 props 中
function MyComponent(props) {
  console.log(props.ref); // undefined
  return <div>Hello</div>;
}

// forwardRef 将 ref 作为第二个参数传递
const MyComponent = forwardRef((props, ref) => {
  console.log(ref); // ✅ 可以访问 ref
  return <div ref={ref}>Hello</div>;
});
```

---

## 问题 2：forwardRef 有哪些使用场景？

### 场景 1：封装基础组件

封装原生 DOM 元素时，需要转发 ref 以便父组件访问 DOM。

```jsx
// ✅ 封装 Input 组件
const Input = forwardRef(({ label, ...props }, ref) => {
  return (
    <div className="input-wrapper">
      {label && <label>{label}</label>}
      <input ref={ref} {...props} />
    </div>
  );
});

// 使用
function Form() {
  const inputRef = useRef();
  
  const handleSubmit = () => {
    // 可以直接访问 input 元素
    console.log(inputRef.current.value);
    inputRef.current.focus();
  };
  
  return (
    <div>
      <Input ref={inputRef} label="用户名" />
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
}
```

### 场景 2：高阶组件（HOC）

在 HOC 中转发 ref 到被包装的组件。

```jsx
// ✅ HOC 转发 ref
function withLogging(Component) {
  const WithLogging = forwardRef((props, ref) => {
    useEffect(() => {
      console.log('Component mounted');
    }, []);
    
    // 将 ref 转发给被包装的组件
    return <Component ref={ref} {...props} />;
  });
  
  WithLogging.displayName = `WithLogging(${Component.displayName || Component.name})`;
  
  return WithLogging;
}

// 使用
const EnhancedInput = withLogging(Input);

function App() {
  const inputRef = useRef();
  
  return <EnhancedInput ref={inputRef} />;
}
```

### 场景 3：组件库开发

开发组件库时，需要暴露 DOM 节点给使用者。

```jsx
// ✅ Button 组件
const Button = forwardRef(({ children, variant = 'primary', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`btn btn-${variant}`}
      {...props}
    >
      {children}
    </button>
  );
});

// 使用
function App() {
  const buttonRef = useRef();
  
  const handleClick = () => {
    // 可以访问 button 元素
    buttonRef.current.blur();
  };
  
  return (
    <Button ref={buttonRef} onClick={handleClick}>
      点击我
    </Button>
  );
}
```

### 场景 4：访问子组件的 DOM 节点

父组件需要访问深层嵌套的 DOM 节点。

```jsx
// ✅ 转发 ref 到内部 DOM
const FancyInput = forwardRef((props, ref) => {
  return (
    <div className="fancy-input-wrapper">
      <div className="fancy-input-icon">🔍</div>
      <input ref={ref} className="fancy-input" {...props} />
      <div className="fancy-input-clear">✕</div>
    </div>
  );
});

function SearchBar() {
  const inputRef = useRef();
  
  useEffect(() => {
    // 自动聚焦到输入框
    inputRef.current?.focus();
  }, []);
  
  return <FancyInput ref={inputRef} placeholder="搜索..." />;
}
```

---

## 问题 3：如何结合 useImperativeHandle 使用？

### 暴露自定义的实例方法

`useImperativeHandle` 可以自定义通过 ref 暴露给父组件的实例值。

```jsx
// ✅ 暴露自定义方法
const Input = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  // 自定义暴露的方法
  useImperativeHandle(ref, () => ({
    // 只暴露需要的方法
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      inputRef.current.value = '';
    },
    getValue: () => {
      return inputRef.current?.value;
    }
  }));
  
  return <input ref={inputRef} {...props} />;
});

// 使用
function Form() {
  const inputRef = useRef();
  
  const handleSubmit = () => {
    // 调用自定义方法
    const value = inputRef.current.getValue();
    console.log(value);
    inputRef.current.clear();
  };
  
  const handleFocus = () => {
    inputRef.current.focus();
  };
  
  return (
    <div>
      <Input ref={inputRef} />
      <button onClick={handleFocus}>聚焦</button>
      <button onClick={handleSubmit}>提交并清空</button>
    </div>
  );
}
```

### 封装复杂的交互逻辑

```jsx
// ✅ 封装视频播放器
const VideoPlayer = forwardRef(({ src, ...props }, ref) => {
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play();
      setIsPlaying(true);
    },
    pause: () => {
      videoRef.current?.pause();
      setIsPlaying(false);
    },
    seek: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => {
      return videoRef.current?.currentTime || 0;
    },
    getDuration: () => {
      return videoRef.current?.duration || 0;
    },
    isPlaying: () => isPlaying
  }));
  
  return (
    <video
      ref={videoRef}
      src={src}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      {...props}
    />
  );
});

// 使用
function VideoApp() {
  const playerRef = useRef();
  
  const handlePlay = () => {
    playerRef.current.play();
  };
  
  const handleSeek = () => {
    playerRef.current.seek(30); // 跳转到 30 秒
  };
  
  return (
    <div>
      <VideoPlayer ref={playerRef} src="/video.mp4" />
      <button onClick={handlePlay}>播放</button>
      <button onClick={handleSeek}>跳转到 30s</button>
    </div>
  );
}
```

### 限制暴露的 API

```jsx
// ✅ 只暴露安全的方法
const SecureInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    // ✅ 只暴露 focus 方法
    focus: () => inputRef.current?.focus(),
    // ❌ 不暴露 DOM 节点本身，防止直接操作
  }), []); // 空依赖数组，方法不会变化
  
  return <input ref={inputRef} type="password" {...props} />;
});

// 使用
function LoginForm() {
  const passwordRef = useRef();
  
  // ✅ 只能调用暴露的方法
  passwordRef.current?.focus();
  
  // ❌ 无法访问 DOM 节点
  // passwordRef.current.value; // undefined
  
  return <SecureInput ref={passwordRef} />;
}
```

---

## 问题 4：forwardRef 的最佳实践是什么？

### 1. 添加 displayName

为了更好的调试体验，应该设置 `displayName`。

```jsx
// ✅ 设置 displayName
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

Input.displayName = 'Input';

// 在 React DevTools 中会显示为 "Input" 而不是 "ForwardRef"
```

### 2. 结合 TypeScript 使用

```typescript
// ✅ TypeScript 类型定义
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} {...props} />
      </div>
    );
  }
);

Input.displayName = 'Input';

// 使用时有完整的类型提示
function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return <Input ref={inputRef} label="用户名" />;
}
```

### 3. 与 memo 结合使用

```jsx
// ✅ 结合 memo 优化性能
const Input = memo(
  forwardRef((props, ref) => {
    console.log('Input 渲染');
    return <input ref={ref} {...props} />;
  })
);

Input.displayName = 'Input';

// Input 只在 props 变化时重新渲染
```

### 4. 处理多个 ref

```jsx
// ✅ 同时使用内部 ref 和转发的 ref
const Input = forwardRef((props, ref) => {
  const innerRef = useRef();
  
  // 合并两个 ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(innerRef.current);
      } else {
        ref.current = innerRef.current;
      }
    }
  }, [ref]);
  
  // 内部也可以使用 ref
  useEffect(() => {
    console.log('Input mounted:', innerRef.current);
  }, []);
  
  return <input ref={innerRef} {...props} />;
});

// 或者使用自定义 hook
function useMergedRef(...refs) {
  return useCallback((node) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    });
  }, refs);
}

const Input = forwardRef((props, ref) => {
  const innerRef = useRef();
  const mergedRef = useMergedRef(ref, innerRef);
  
  return <input ref={mergedRef} {...props} />;
});
```

---

## 总结

**核心要点**：

### 1. forwardRef 的作用

- 允许函数组件接收并转发 ref
- 解决函数组件无法直接接收 ref 的问题
- 常用于组件封装和组件库开发

### 2. 主要使用场景

- 封装基础 UI 组件
- 高阶组件（HOC）中转发 ref
- 组件库开发
- 访问子组件的 DOM 节点

### 3. 结合 useImperativeHandle

- 自定义暴露的实例方法
- 限制对 DOM 的直接访问
- 封装复杂的交互逻辑
- 提供更清晰的组件 API

### 4. 最佳实践

- 设置 displayName 便于调试
- 使用 TypeScript 增强类型安全
- 结合 memo 优化性能
- 正确处理多个 ref 的情况

## 延伸阅读

- [React 官方文档 - forwardRef](https://react.dev/reference/react/forwardRef)
- [React 官方文档 - useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)
- [Forwarding Refs](https://react.dev/learn/manipulating-the-dom-with-refs#accessing-another-components-dom-nodes)
- [TypeScript 与 forwardRef](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forward_and_create_ref/)
