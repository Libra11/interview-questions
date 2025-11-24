---
title: React ref 有哪些使用场景
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入探讨 React ref 的各种使用场景，包括访问 DOM 元素、保存可变值、
  父子组件通信等。理解 ref 的正确使用方式能够帮助我们更好地处理副作用和命令式操作。
tags:
  - React
  - Ref
  - Hooks
  - DOM 操作
estimatedTime: 22 分钟
keywords:
  - React ref
  - useRef
  - forwardRef
  - DOM 引用
highlight: ref 是 React 中处理 DOM 操作和保存可变值的重要工具
order: 103
---

## 问题 1：ref 最基本的使用场景是什么？

**ref 最基本的用途是访问 DOM 元素**。

在某些情况下，我们需要直接操作 DOM，比如聚焦输入框、测量元素尺寸、触发动画等，这时就需要使用 ref。

### 访问 DOM 元素

```jsx
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    // 组件挂载后自动聚焦
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

### 常见的 DOM 操作场景

```jsx
function MediaPlayer() {
  const videoRef = useRef(null);

  const handlePlay = () => {
    // 播放视频
    videoRef.current.play();
  };

  const handlePause = () => {
    // 暂停视频
    videoRef.current.pause();
  };

  return (
    <div>
      <video ref={videoRef} src="video.mp4" />
      <button onClick={handlePlay}>播放</button>
      <button onClick={handlePause}>暂停</button>
    </div>
  );
}
```

---

## 问题 2：如何使用 ref 保存可变值？

**ref 可以用来保存在组件整个生命周期中不会触发重新渲染的可变值**。

与 state 不同，修改 ref.current 不会触发组件重新渲染，这使得它非常适合保存一些辅助性的数据。

### 保存定时器 ID

```jsx
function Timer() {
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    // 保存定时器 ID，用于后续清除
    timerRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stop = () => {
    // 使用保存的 ID 清除定时器
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    // 组件卸载时清除定时器
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

### 保存前一次的值

```jsx
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    // 每次渲染后更新 ref
    ref.current = value;
  });

  // 返回的是上一次渲染的值
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>当前值: {count}</p>
      <p>上一次的值: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### 避免闭包陷阱

```jsx
function ChatRoom() {
  const [message, setMessage] = useState('');
  const messageRef = useRef('');

  useEffect(() => {
    // 保持 ref 与 state 同步
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    const timer = setInterval(() => {
      // 使用 ref 可以获取最新的值
      // 如果直接使用 message，会形成闭包，值不会更新
      console.log('最新消息:', messageRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // 空依赖数组

  return (
    <input
      value={message}
      onChange={e => setMessage(e.target.value)}
    />
  );
}
```

---

## 问题 3：如何在父组件中访问子组件的 ref？

**使用 forwardRef 可以让父组件访问子组件的 DOM 节点或实例方法**。

### 转发 ref 到 DOM 元素

```jsx
import { forwardRef, useRef } from 'react';

// 子组件使用 forwardRef 包裹
const CustomInput = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 父组件可以访问子组件的 input 元素
function Form() {
  const inputRef = useRef(null);

  const handleFocus = () => {
    inputRef.current.focus();
  };

  return (
    <div>
      <CustomInput ref={inputRef} />
      <button onClick={handleFocus}>聚焦输入框</button>
    </div>
  );
}
```

### 使用 useImperativeHandle 暴露特定方法

```jsx
import { forwardRef, useRef, useImperativeHandle } from 'react';

const VideoPlayer = forwardRef((props, ref) => {
  const videoRef = useRef(null);

  // 只暴露特定的方法给父组件
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

  return <video ref={videoRef} {...props} />;
});

function App() {
  const playerRef = useRef(null);

  const handlePlay = () => {
    playerRef.current.play(); // 调用暴露的方法
  };

  return (
    <div>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={handlePlay}>播放</button>
    </div>
  );
}
```

---

## 问题 4：ref 在动画和测量中如何使用？

**ref 可以用来获取元素的尺寸、位置等信息，常用于动画和布局计算**。

### 测量元素尺寸

```jsx
function MeasureElement() {
  const divRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (divRef.current) {
      const { width, height } = divRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  return (
    <div>
      <div ref={divRef} style={{ width: '50%', height: '200px' }}>
        测量我
      </div>
      <p>宽度: {dimensions.width}px</p>
      <p>高度: {dimensions.height}px</p>
    </div>
  );
}
```

### 滚动到指定位置

```jsx
function ScrollToElement() {
  const sectionRef = useRef(null);

  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div>
      <button onClick={scrollToSection}>滚动到目标</button>
      <div style={{ height: '1000px' }}>...</div>
      <div ref={sectionRef}>目标区域</div>
    </div>
  );
}
```

### 配合动画库使用

```jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

function AnimatedBox() {
  const boxRef = useRef(null);

  useEffect(() => {
    // 使用 ref 获取 DOM 元素进行动画
    gsap.to(boxRef.current, {
      x: 100,
      rotation: 360,
      duration: 2
    });
  }, []);

  return <div ref={boxRef} className="box">动画盒子</div>;
}
```

---

## 问题 5：ref 在列表中如何使用？

**在列表中需要为每个元素创建独立的 ref**。

### 使用 ref 数组

```jsx
function ImageGallery({ images }) {
  const imageRefs = useRef([]);

  const scrollToImage = (index) => {
    imageRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  };

  return (
    <div>
      {images.map((img, index) => (
        <img
          key={img.id}
          ref={el => imageRefs.current[index] = el}
          src={img.url}
          alt={img.alt}
        />
      ))}
      <button onClick={() => scrollToImage(5)}>
        滚动到第 6 张图片
      </button>
    </div>
  );
}
```

### 使用 Map 存储 ref

```jsx
function TodoList({ todos }) {
  const todoRefs = useRef(new Map());

  const focusTodo = (id) => {
    const element = todoRefs.current.get(id);
    element?.focus();
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            ref={el => {
              if (el) {
                todoRefs.current.set(todo.id, el);
              } else {
                todoRefs.current.delete(todo.id);
              }
            }}
            defaultValue={todo.text}
          />
        </li>
      ))}
    </ul>
  );
}
```

---

## 问题 6：ref 和 state 有什么区别？

**ref 和 state 的主要区别在于是否触发重新渲染**。

### 对比表格

| 特性 | ref | state |
|------|-----|-------|
| 修改后是否重新渲染 | 否 | 是 |
| 是否可以在渲染期间读取 | 否（会得到旧值） | 是 |
| 是否是异步更新 | 否（同步） | 是（批量更新） |
| 适用场景 | 存储不影响渲染的值 | 存储影响渲染的数据 |

### 使用场景对比

```jsx
function Example() {
  // ✅ 使用 state：影响渲染的数据
  const [count, setCount] = useState(0);
  
  // ✅ 使用 ref：不影响渲染的数据
  const renderCount = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // 记录渲染次数（不需要触发重新渲染）
    renderCount.current += 1;
  });

  return (
    <div>
      {/* 显示在 UI 上，使用 state */}
      <p>Count: {count}</p>
      
      {/* 仅用于调试，使用 ref */}
      <p>Render count: {renderCount.current}</p>
      
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

---

## 问题 7：使用 ref 时需要注意什么？

**避免在渲染期间读写 ref，不要过度使用 ref**。

### 不要在渲染期间读写 ref

```jsx
// ❌ 错误：在渲染期间修改 ref
function BadExample() {
  const ref = useRef(0);
  ref.current += 1; // 不要这样做！
  
  return <div>{ref.current}</div>;
}

// ✅ 正确：在事件处理或 effect 中修改
function GoodExample() {
  const ref = useRef(0);
  
  useEffect(() => {
    ref.current += 1; // 在 effect 中修改
  });
  
  const handleClick = () => {
    ref.current += 1; // 在事件处理中修改
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

### 优先使用声明式方法

```jsx
// ❌ 不推荐：使用 ref 命令式操作
function BadForm() {
  const inputRef = useRef(null);
  
  const handleSubmit = () => {
    const value = inputRef.current.value;
    // ...
  };
  
  return <input ref={inputRef} />;
}

// ✅ 推荐：使用受控组件
function GoodForm() {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    // 直接使用 state
    console.log(value);
  };
  
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
```

---

## 总结

**核心使用场景**：

### 1. DOM 操作
- 聚焦、选择文本
- 媒体播放控制
- 触发动画
- 测量元素尺寸

### 2. 保存可变值
- 定时器 ID
- 前一次的值
- 避免闭包陷阱
- 不触发渲染的计数器

### 3. 父子组件通信
- forwardRef 转发 ref
- useImperativeHandle 暴露方法

### 4. 与第三方库集成
- 动画库
- 图表库
- 编辑器等

### 5. 使用原则
- 不在渲染期间读写 ref
- 优先使用声明式方法
- ref 用于命令式操作

## 延伸阅读

- [React useRef 官方文档](https://react.dev/reference/react/useRef)
- [React forwardRef 官方文档](https://react.dev/reference/react/forwardRef)
- [useImperativeHandle 官方文档](https://react.dev/reference/react/useImperativeHandle)
- [Refs 和 DOM 操作](https://react.dev/learn/manipulating-the-dom-with-refs)
