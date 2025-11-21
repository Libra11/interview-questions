---
title: React useLayoutEffect 和 useEffect 有什么区别
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 useLayoutEffect 和 useEffect 的执行时机差异，掌握何时使用 useLayoutEffect 来避免视觉闪烁，以及两者的性能影响。
tags:
  - React
  - Hooks
  - useEffect
  - useLayoutEffect
estimatedTime: 20 分钟
keywords:
  - useLayoutEffect
  - useEffect
  - 执行时机
  - 副作用
highlight: 掌握 useLayoutEffect 和 useEffect 的核心区别，理解何时使用哪个 Hook
order: 13
---

## 问题 1：useLayoutEffect 和 useEffect 的执行时机有什么区别？

### 执行时机对比

两者的主要区别在于**执行时机**：

```jsx
function Component() {
  const [count, setCount] = useState(0);
  
  console.log('1. 组件渲染');
  
  useLayoutEffect(() => {
    console.log('2. useLayoutEffect 执行');
  });
  
  useEffect(() => {
    console.log('3. useEffect 执行');
  });
  
  return <div>{count}</div>;
}

// 执行顺序：
// 1. 组件渲染
// (React 更新 DOM)
// 2. useLayoutEffect 执行（同步，阻塞浏览器绘制）
// (浏览器绘制)
// 3. useEffect 执行（异步）
```

### 详细的执行流程

```javascript
// React 渲染流程
function commitRoot() {
  // 1. Render 阶段：计算变化
  performWork();
  
  // 2. Commit 阶段：应用变化
  
  // 2.1 Before Mutation：DOM 变更前
  commitBeforeMutationEffects();
  
  // 2.2 Mutation：执行 DOM 变更
  commitMutationEffects();
  
  // 2.3 Layout：DOM 变更后，浏览器绘制前
  commitLayoutEffects(); // ← useLayoutEffect 在这里执行（同步）
  
  // 3. 浏览器绘制
  // (用户可以看到更新)
  
  // 4. 异步执行 useEffect
  scheduleCallback(() => {
    flushPassiveEffects(); // ← useEffect 在这里执行（异步）
  });
}
```

---

## 问题 2：什么时候应该使用 useLayoutEffect？

### 场景 1：避免视觉闪烁

当需要在浏览器绘制前读取或修改 DOM 时，使用 `useLayoutEffect`。

```jsx
// ❌ 使用 useEffect 会闪烁
function Tooltip() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef();
  
  useEffect(() => {
    // 浏览器已经绘制了，然后再调整位置
    // 用户会看到 tooltip 先出现在错误位置，然后跳到正确位置
    const rect = tooltipRef.current.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      setPosition({ x: window.innerWidth - rect.width, y: rect.top });
    }
  }, []);
  
  return (
    <div ref={tooltipRef} style={{ position: 'fixed', ...position }}>
      Tooltip
    </div>
  );
}

// ✅ 使用 useLayoutEffect 避免闪烁
function Tooltip() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef();
  
  useLayoutEffect(() => {
    // 在浏览器绘制前调整位置
    // 用户只会看到最终的正确位置
    const rect = tooltipRef.current.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      setPosition({ x: window.innerWidth - rect.width, y: rect.top });
    }
  }, []);
  
  return (
    <div ref={tooltipRef} style={{ position: 'fixed', ...position }}>
      Tooltip
    </div>
  );
}
```

### 场景 2：测量 DOM 尺寸

```jsx
// ✅ 测量元素尺寸并调整布局
function ResponsiveComponent() {
  const [width, setWidth] = useState(0);
  const containerRef = useRef();
  
  useLayoutEffect(() => {
    // 在绘制前获取准确的尺寸
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  return (
    <div ref={containerRef}>
      <p>Container width: {width}px</p>
      {width > 600 ? <LargeLayout /> : <SmallLayout />}
    </div>
  );
}
```

### 场景 3：同步动画

```jsx
// ✅ 确保动画在绘制前开始
function AnimatedComponent({ isVisible }) {
  const elementRef = useRef();
  
  useLayoutEffect(() => {
    if (isVisible) {
      // 在浏览器绘制前设置初始状态
      elementRef.current.style.opacity = '0';
      elementRef.current.style.transform = 'translateY(-20px)';
      
      // 触发动画
      requestAnimationFrame(() => {
        elementRef.current.style.transition = 'all 0.3s';
        elementRef.current.style.opacity = '1';
        elementRef.current.style.transform = 'translateY(0)';
      });
    }
  }, [isVisible]);
  
  return <div ref={elementRef}>Animated Content</div>;
}
```

### 场景 4：操作第三方 DOM 库

```jsx
// ✅ 初始化需要准确 DOM 信息的第三方库
function ChartComponent({ data }) {
  const chartRef = useRef();
  const chartInstance = useRef();
  
  useLayoutEffect(() => {
    // 在绘制前初始化图表库
    // 确保图表库能获取到准确的容器尺寸
    if (chartRef.current) {
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: data
      });
    }
    
    return () => {
      chartInstance.current?.destroy();
    };
  }, []);
  
  useLayoutEffect(() => {
    // 更新数据
    if (chartInstance.current) {
      chartInstance.current.data = data;
      chartInstance.current.update();
    }
  }, [data]);
  
  return <canvas ref={chartRef} />;
}
```

---

## 问题 3：useLayoutEffect 有什么性能影响？

### 性能对比

```jsx
// useEffect：异步执行，不阻塞浏览器绘制
function WithUseEffect() {
  useEffect(() => {
    // 执行耗时操作
    heavyComputation(); // 不会阻塞绘制
  }, []);
  
  return <div>Content</div>;
}

// useLayoutEffect：同步执行，阻塞浏览器绘制
function WithUseLayoutEffect() {
  useLayoutEffect(() => {
    // 执行耗时操作
    heavyComputation(); // 会阻塞绘制，用户会感觉卡顿
  }, []);
  
  return <div>Content</div>;
}
```

### 性能优化建议

```jsx
// ❌ 不要在 useLayoutEffect 中执行耗时操作
function BadExample() {
  useLayoutEffect(() => {
    // 阻塞浏览器绘制
    for (let i = 0; i < 1000000; i++) {
      // 耗时计算
    }
  }, []);
}

// ✅ 只在必要时使用 useLayoutEffect
function GoodExample() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef();
  
  useLayoutEffect(() => {
    // 只做必要的 DOM 测量
    const { width, height } = ref.current.getBoundingClientRect();
    setSize({ width, height });
  }, []);
  
  useEffect(() => {
    // 耗时操作放在 useEffect 中
    heavyComputation(size);
  }, [size]);
  
  return <div ref={ref}>Content</div>;
}
```

---

## 问题 4：如何选择使用哪个 Hook？

### 决策流程

```javascript
// 选择 useEffect 还是 useLayoutEffect？

// 1. 默认使用 useEffect
//    - 大多数副作用不需要同步执行
//    - 性能更好，不阻塞绘制

// 2. 以下情况使用 useLayoutEffect：
//    - 需要读取 DOM 布局信息
//    - 需要在绘制前修改 DOM
//    - 避免视觉闪烁
//    - 同步第三方 DOM 库

// 3. 如果不确定，先用 useEffect
//    - 如果出现闪烁，再改用 useLayoutEffect
```

### 实际示例对比

```jsx
// 场景 1：数据获取 → useEffect
function DataFetching() {
  const [data, setData] = useState(null);
  
  // ✅ 使用 useEffect
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return <div>{data?.name}</div>;
}

// 场景 2：订阅事件 → useEffect
function EventListener() {
  // ✅ 使用 useEffect
  useEffect(() => {
    const handleResize = () => console.log('resized');
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <div>Content</div>;
}

// 场景 3：DOM 测量 → useLayoutEffect
function DomMeasurement() {
  const [height, setHeight] = useState(0);
  const ref = useRef();
  
  // ✅ 使用 useLayoutEffect
  useLayoutEffect(() => {
    setHeight(ref.current.offsetHeight);
  }, []);
  
  return <div ref={ref}>Content</div>;
}

// 场景 4：滚动到元素 → useLayoutEffect
function ScrollToElement() {
  const ref = useRef();
  
  // ✅ 使用 useLayoutEffect
  useLayoutEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  return <div ref={ref}>Target</div>;
}
```

### 服务端渲染（SSR）注意事项

```jsx
// ❌ SSR 会警告：useLayoutEffect does nothing on the server
function Component() {
  useLayoutEffect(() => {
    // 这在服务端不会执行
  }, []);
}

// ✅ 处理 SSR
function Component() {
  // 方案 1：使用 useEffect（如果可以）
  useEffect(() => {
    // 在客户端执行
  }, []);
  
  // 方案 2：条件使用
  const useIsomorphicLayoutEffect = 
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  
  useIsomorphicLayoutEffect(() => {
    // 在客户端使用 useLayoutEffect
    // 在服务端使用 useEffect
  }, []);
}
```

---

## 总结

**核心区别**：

### 1. 执行时机

- **useEffect**：DOM 更新后，浏览器绘制后，异步执行
- **useLayoutEffect**：DOM 更新后，浏览器绘制前，同步执行

### 2. 使用场景

**useEffect（默认选择）**：
- 数据获取
- 订阅事件
- 日志记录
- 大多数副作用

**useLayoutEffect（特殊场景）**：
- DOM 测量
- 避免视觉闪烁
- 同步动画
- 第三方 DOM 库

### 3. 性能影响

- useEffect：不阻塞绘制，性能更好
- useLayoutEffect：阻塞绘制，可能影响性能

### 4. 选择建议

- 默认使用 useEffect
- 出现闪烁时考虑 useLayoutEffect
- 避免在 useLayoutEffect 中执行耗时操作
- SSR 需要特殊处理

## 延伸阅读

- [React 官方文档 - useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
- [React 官方文档 - useEffect](https://react.dev/reference/react/useEffect)
- [useEffect vs useLayoutEffect](https://kentcdodds.com/blog/useeffect-vs-uselayouteffect)
- [Avoiding useLayoutEffect in SSR](https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85)
