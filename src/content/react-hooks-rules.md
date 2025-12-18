---
title: React 为什么不能在循环、条件或嵌套函数中调用 Hooks
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Hooks 的调用规则。Hooks 必须在组件顶层调用，不能在循环、条件或嵌套函数中使用，
  这是由 Hooks 的底层实现机制决定的。
tags:
  - React
  - Hooks
  - 规则
  - 最佳实践
estimatedTime: 20 分钟
keywords:
  - Hooks 规则
  - 调用顺序
  - Hooks 链表
  - ESLint
highlight: Hooks 依赖调用顺序来匹配状态，必须保证每次渲染的调用顺序一致
order: 386
---

## 问题 1：Hooks 的调用规则是什么？

**Hooks 必须在组件顶层调用，不能在循环、条件或嵌套函数中使用**。

### 两条规则

```javascript
// 规则 1：只在 React 函数组件或自定义 Hook 中调用 Hooks
// ✅ 正确
function Component() {
  const [state, setState] = useState(0);
}

// ✅ 正确
function useCustomHook() {
  const [state, setState] = useState(0);
}

// ❌ 错误：在普通函数中调用
function normalFunction() {
  const [state, setState] = useState(0);  // 错误！
}

// 规则 2：只在函数顶层调用 Hooks
// ✅ 正确
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  useEffect(() => {}, []);
}

// ❌ 错误：在条件语句中调用
function Component({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);  // 错误！
  }
}

// ❌ 错误：在循环中调用
function Component() {
  for (let i = 0; i < 3; i++) {
    const [count, setCount] = useState(0);  // 错误！
  }
}

// ❌ 错误：在嵌套函数中调用
function Component() {
  const handleClick = () => {
    const [count, setCount] = useState(0);  // 错误！
  };
}
```

---

## 问题 2：为什么有这些规则？

**因为 Hooks 依赖调用顺序来匹配状态**。

### Hooks 的存储机制

```javascript
// React 内部使用链表存储 Hooks
function Component() {
  const [count, setCount] = useState(0);      // Hook 1
  const [name, setName] = useState('React');  // Hook 2
  useEffect(() => {}, []);                    // Hook 3
  
  // Fiber.memoizedState -> Hook1 -> Hook2 -> Hook3 -> null
}

// 首次渲染：
// 1. 调用 useState(0)     -> 创建 Hook1，保存 count
// 2. 调用 useState('React') -> 创建 Hook2，保存 name
// 3. 调用 useEffect       -> 创建 Hook3，保存 effect

// 更新时：
// 1. 调用 useState(0)     -> 读取 Hook1，获取 count
// 2. 调用 useState('React') -> 读取 Hook2，获取 name
// 3. 调用 useEffect       -> 读取 Hook3，获取 effect
```

### 顺序变化导致的问题

```javascript
// ❌ 错误示例
function Component({ showName }) {
  const [count, setCount] = useState(0);  // Hook 1
  
  if (showName) {
    const [name, setName] = useState('React');  // 有时是 Hook 2
  }
  
  useEffect(() => {}, []);  // 有时是 Hook 2，有时是 Hook 3
}

// 首次渲染（showName = true）：
// Hook1: count
// Hook2: name
// Hook3: effect

// 第二次渲染（showName = false）：
// Hook1: count ✓
// Hook2: effect ✗  期望 name，实际是 effect
// Hook3: 不存在 ✗  期望 effect，但链表已结束

// 结果：状态错乱！
```

---

## 问题 3：具体会出现什么问题？

**状态错乱、类型错误、React 报错**。

### 状态错乱示例

```jsx
function BadComponent({ condition }) {
  const [count, setCount] = useState(0);
  
  // ❌ 条件调用
  if (condition) {
    const [name, setName] = useState('React');
  }
  
  const [age, setAge] = useState(18);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Age: {age}</p>
    </div>
  );
}

// 当 condition 从 true 变为 false：
// 第一次渲染（condition = true）：
// Hook1: count = 0
// Hook2: name = 'React'
// Hook3: age = 18

// 第二次渲染（condition = false）：
// Hook1: count = 0 ✓
// Hook2: age = ??? ✗  期望读取 name，实际读取 age
// Hook3: 不存在 ✗  期望 age，但链表结束

// React 会报错：
// "Rendered fewer hooks than expected"
```

### React 的错误提示

```javascript
// React 会检测 Hooks 数量变化
if (workInProgressHook === null) {
  // 首次渲染
  currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
} else {
  // 更新渲染
  workInProgressHook = workInProgressHook.next = hook;
}

// 如果 Hooks 数量不一致，React 会抛出错误：
// "Rendered more hooks than during the previous render"
// "Rendered fewer hooks than expected"
```

---

## 问题 4：如何正确处理条件逻辑？

**将条件逻辑放在 Hook 内部，而不是 Hook 外部**。

### 错误做法

```jsx
// ❌ 在 Hook 外部使用条件
function Component({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null);  // 错误！
  }
}
```

### 正确做法

```jsx
// ✅ 在 Hook 内部使用条件
function Component({ isLoggedIn }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (isLoggedIn) {
      // 条件逻辑在 Hook 内部
      fetchUser().then(setUser);
    }
  }, [isLoggedIn]);
  
  return (
    <div>
      {isLoggedIn && user && <p>Welcome, {user.name}</p>}
    </div>
  );
}

// ✅ 使用条件渲染
function Component({ showCounter }) {
  return (
    <div>
      {showCounter && <Counter />}
    </div>
  );
}

function Counter() {
  // Counter 组件内部可以自由使用 Hooks
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
}
```

---

## 问题 5：如何处理动态数量的状态？

**使用对象或数组存储，而不是动态创建 Hooks**。

### 错误做法

```jsx
// ❌ 在循环中调用 Hooks
function Form({ fields }) {
  const states = [];
  
  for (const field of fields) {
    const [value, setValue] = useState('');  // 错误！
    states.push([value, setValue]);
  }
}
```

### 正确做法

```jsx
// ✅ 使用对象存储多个状态
function Form({ fields }) {
  const [values, setValues] = useState({});
  
  const handleChange = (fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };
  
  return (
    <form>
      {fields.map(field => (
        <input
          key={field.name}
          value={values[field.name] || ''}
          onChange={e => handleChange(field.name, e.target.value)}
        />
      ))}
    </form>
  );
}

// ✅ 使用 useReducer
function Form({ fields }) {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'UPDATE_FIELD':
        return {
          ...state,
          [action.field]: action.value
        };
      default:
        return state;
    }
  }, {});
  
  return (
    <form>
      {fields.map(field => (
        <input
          key={field.name}
          value={state[field.name] || ''}
          onChange={e => dispatch({
            type: 'UPDATE_FIELD',
            field: field.name,
            value: e.target.value
          })}
        />
      ))}
    </form>
  );
}
```

---

## 问题 6：如何使用 ESLint 检查 Hooks 规则？

**使用 eslint-plugin-react-hooks 插件**。

### 安装和配置

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',      // 检查 Hooks 规则
    'react-hooks/exhaustive-deps': 'warn'       // 检查依赖项
  }
};
```

### 检查示例

```jsx
// ESLint 会报错
function Component({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);
    // Error: React Hook "useState" is called conditionally.
    // React Hooks must be called in the exact same order
    // in every component render.
  }
}

// ESLint 会警告
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(count);
  }, []);  // Warning: React Hook useEffect has a missing dependency: 'count'
}
```

---

## 问题 7：自定义 Hook 也要遵守这些规则吗？

**是的，自定义 Hook 必须遵守相同的规则**。

### 自定义 Hook 规则

```javascript
// ✅ 正确的自定义 Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);
  
  return { count, increment, decrement };
}

// ❌ 错误：条件调用
function useBadHook(condition) {
  if (condition) {
    const [state, setState] = useState(0);  // 错误！
  }
}

// ✅ 正确：条件逻辑在内部
function useGoodHook(condition) {
  const [state, setState] = useState(0);
  
  useEffect(() => {
    if (condition) {
      // 条件逻辑在 Hook 内部
      setState(1);
    }
  }, [condition]);
  
  return state;
}
```

### 命名规范

```javascript
// ✅ 自定义 Hook 必须以 use 开头
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // ...
  return size;
}

// ❌ 不以 use 开头，ESLint 不会检查 Hooks 规则
function getWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });  // 可能被误用
  // ...
  return size;
}
```

---

## 总结

**核心原因**：

### 1. Hooks 的实现机制
- 使用链表存储状态
- 依赖调用顺序匹配状态
- 每次渲染必须保持顺序一致

### 2. 违反规则的后果
- 状态错乱
- 类型错误
- React 报错
- 应用崩溃

### 3. 正确的做法
- 只在顶层调用 Hooks
- 条件逻辑放在 Hook 内部
- 使用对象/数组存储动态状态
- 使用条件渲染替代条件 Hook

### 4. 工具支持
- eslint-plugin-react-hooks
- 自动检查规则违反
- 检查依赖项完整性

### 5. 自定义 Hook
- 遵守相同规则
- 以 use 开头命名
- 可以调用其他 Hooks

## 延伸阅读

- [Hooks 规则官方文档](https://react.dev/reference/rules/rules-of-hooks)
- [Hooks FAQ](https://react.dev/learn/hooks-faq)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [深入理解 Hooks 规则](https://overreacted.io/why-do-hooks-rely-on-call-order/)
