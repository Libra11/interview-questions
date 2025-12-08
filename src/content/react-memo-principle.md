---
title: React.memo 的原理？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React.memo 的工作原理，掌握它如何通过浅比较避免不必要的渲染。
tags:
  - React
  - React.memo
  - 性能优化
  - 浅比较
estimatedTime: 12 分钟
keywords:
  - React.memo
  - shallow comparison
  - memoization
  - render optimization
highlight: React.memo 通过浅比较 props，如果 props 没变则跳过渲染，返回上次的渲染结果。
order: 245
---

## 问题 1：React.memo 是什么？

### 基本用法

```jsx
const MyComponent = React.memo(function MyComponent({ name, age }) {
  console.log("render");
  return (
    <div>
      {name} - {age}
    </div>
  );
});

// 等价于
const MyComponent = React.memo((props) => {
  return (
    <div>
      {props.name} - {props.age}
    </div>
  );
});
```

### 作用

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      {/* 没有 memo：每次都渲染 */}
      {/* 有 memo：props 不变则不渲染 */}
      <MyComponent name="John" age={25} />
    </div>
  );
}
```

---

## 问题 2：React.memo 的原理？

### 浅比较

```jsx
// React.memo 内部逻辑（简化）
function memo(Component) {
  let prevProps = null;
  let prevResult = null;

  return function MemoizedComponent(props) {
    // 浅比较 props
    if (prevProps !== null && shallowEqual(prevProps, props)) {
      // props 没变，返回上次结果
      return prevResult;
    }

    // props 变了，重新渲染
    prevProps = props;
    prevResult = <Component {...props} />;
    return prevResult;
  };
}

// 浅比较函数
function shallowEqual(objA, objB) {
  if (objA === objB) return true;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}
```

### 浅比较的含义

```jsx
// 基本类型：比较值
'hello' === 'hello'  // true
123 === 123          // true

// 引用类型：比较引用
{ a: 1 } === { a: 1 }  // false（不同对象）
[1, 2] === [1, 2]      // false（不同数组）

const obj = { a: 1 };
obj === obj            // true（同一引用）
```

---

## 问题 3：自定义比较函数？

### 第二个参数

```jsx
const MyComponent = React.memo(
  function MyComponent({ user }) {
    return <div>{user.name}</div>;
  },
  // 自定义比较函数
  (prevProps, nextProps) => {
    // 返回 true 表示 props 相等，不需要渲染
    // 返回 false 表示 props 不等，需要渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 使用场景

```jsx
// 场景：只关心某些属性
const UserCard = React.memo(
  ({ user, onClick }) => {
    return <div onClick={onClick}>{user.name}</div>;
  },
  (prev, next) => {
    // 只比较 user.id，忽略 onClick
    return prev.user.id === next.user.id;
  }
);
```

---

## 问题 4：React.memo 的陷阱？

### 陷阱 1：对象/数组 props

```jsx
const Child = React.memo(({ style }) => {
  console.log("render");
  return <div style={style}>Child</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染创建新对象，memo 失效
  return <Child style={{ color: "red" }} />;

  // ✅ 使用 useMemo
  const style = useMemo(() => ({ color: "red" }), []);
  return <Child style={style} />;
}
```

### 陷阱 2：函数 props

```jsx
const Child = React.memo(({ onClick }) => {
  console.log("render");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染创建新函数
  return <Child onClick={() => console.log("click")} />;

  // ✅ 使用 useCallback
  const handleClick = useCallback(() => console.log("click"), []);
  return <Child onClick={handleClick} />;
}
```

### 陷阱 3：children

```jsx
const Child = React.memo(({ children }) => {
  console.log("render");
  return <div>{children}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ children 是新的 React 元素
  return (
    <Child>
      <span>Hello</span>
    </Child>
  );
  // memo 失效！
}
```

## 总结

**React.memo 核心**：

| 方面 | 说明                    |
| ---- | ----------------------- |
| 原理 | 浅比较 props            |
| 相等 | 跳过渲染，返回缓存      |
| 不等 | 重新渲染                |
| 陷阱 | 对象/函数每次都是新引用 |

## 延伸阅读

- [React.memo 文档](https://react.dev/reference/react/memo)
- [何时使用 memo](https://react.dev/reference/react/memo#should-you-add-memo-everywhere)
