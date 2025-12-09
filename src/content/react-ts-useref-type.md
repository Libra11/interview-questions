---
title: useRef 在 TS 中如何声明类型？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握 useRef 在 TypeScript 中的类型声明，区分 DOM ref 和可变值 ref。
tags:
  - React
  - TypeScript
  - useRef
  - 类型定义
estimatedTime: 10 分钟
keywords:
  - useRef TypeScript
  - ref type
  - DOM ref
  - mutable ref
highlight: DOM ref 使用 useRef<HTMLElement>(null)，可变值 ref 使用 useRef<T>(initialValue)。
order: 283
---

## 问题 1：DOM 元素 ref

### 基本用法

```tsx
function TextInput() {
  // 声明 DOM ref 类型
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus(); // 需要可选链，因为可能是 null
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}
```

### 常见 DOM 元素类型

```tsx
// 输入框
const inputRef = useRef<HTMLInputElement>(null);

// 按钮
const buttonRef = useRef<HTMLButtonElement>(null);

// div
const divRef = useRef<HTMLDivElement>(null);

// canvas
const canvasRef = useRef<HTMLCanvasElement>(null);

// video
const videoRef = useRef<HTMLVideoElement>(null);

// form
const formRef = useRef<HTMLFormElement>(null);
```

---

## 问题 2：可变值 ref

### 存储任意值

```tsx
function Timer() {
  // 存储定时器 ID
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      console.log("tick");
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </>
  );
}
```

### 存储前一个值

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 使用
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      Now: {count}, Before: {prevCount}
    </div>
  );
}
```

---

## 问题 3：null vs undefined 初始值

### DOM ref：使用 null

```tsx
// DOM ref 必须用 null 初始化
const inputRef = useRef<HTMLInputElement>(null);

// 类型是 RefObject<HTMLInputElement>
// current 是只读的
inputRef.current = document.createElement("input"); // ❌ 错误
```

### 可变 ref：使用具体值

```tsx
// 可变 ref 用具体值初始化
const countRef = useRef<number>(0);

// 类型是 MutableRefObject<number>
// current 可以修改
countRef.current = 10; // ✅ 正确
```

### 区别

```tsx
// 传入 null 且类型不包含 null → RefObject（只读）
const ref1 = useRef<HTMLInputElement>(null);
// ref1.current 是只读的

// 传入 null 且类型包含 null → MutableRefObject
const ref2 = useRef<HTMLInputElement | null>(null);
// ref2.current 可以修改

// 传入非 null 值 → MutableRefObject
const ref3 = useRef<number>(0);
// ref3.current 可以修改
```

---

## 问题 4：泛型组件中的 ref

### forwardRef 类型

```tsx
interface InputProps {
  label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label }, ref) => {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
});

// 使用
function Parent() {
  const inputRef = useRef<HTMLInputElement>(null);

  return <Input ref={inputRef} label="Name" />;
}
```

---

## 问题 5：回调 ref

### 类型定义

```tsx
function MeasureExample() {
  const [height, setHeight] = useState(0);

  // 回调 ref 类型
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return <div ref={measuredRef}>Height: {height}</div>;
}
```

## 总结

| 场景     | 类型声明                    | 初始值 |
| -------- | --------------------------- | ------ |
| DOM ref  | `useRef<HTMLElement>(null)` | null   |
| 可变值   | `useRef<T>(value)`          | 具体值 |
| 可空可变 | `useRef<T \| null>(null)`   | null   |

## 延伸阅读

- [useRef TypeScript](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks#useref)
