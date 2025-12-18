---
title: React Hooks 有哪些
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  全面介绍 React 内置的所有 Hooks 及其使用场景。掌握这些 Hooks 能够帮助我们更好地
  管理组件状态、副作用和性能优化。
tags:
  - React
  - Hooks
  - 状态管理
  - 副作用
estimatedTime: 24 分钟
keywords:
  - React Hooks
  - useState
  - useEffect
  - useContext
highlight: React 提供了 15+ 个内置 Hooks，涵盖状态、副作用、性能优化等场景
order: 373
---

## 问题 1：基础 Hooks 有哪些？

**useState、useEffect、useContext 是最常用的三个基础 Hooks**。

### useState - 状态管理

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(c => c + 1)}>+1 (函数式)</button>
    </div>
  );
}
```

### useEffect - 副作用

```jsx
function DataFetcher({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 副作用：数据获取
    fetchUser(userId).then(setData);

    // 清理函数
    return () => {
      cancelRequest();
    };
  }, [userId]);  // 依赖数组

  return <div>{data?.name}</div>;
}
```

### useContext - 上下文

```jsx
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Toolbar</div>;
}
```

---

## 问题 2：性能优化 Hooks 有哪些？

**useMemo、useCallback、useTransition、useDeferredValue**。

### useMemo - 缓存计算结果

```jsx
function ExpensiveList({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log('执行过滤');
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  return <ul>{filteredItems.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

### useCallback - 缓存函数

```jsx
function TodoList({ todos }) {
  const handleToggle = useCallback((id) => {
    toggleTodo(id);
  }, []);

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
      ))}
    </ul>
  );
}
```

### useTransition - 并发更新

```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value);
    
    startTransition(() => {
      // 低优先级更新
      setResults(search(e.target.value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results data={results} />
    </>
  );
}
```

### useDeferredValue - 延迟值

```jsx
function App() {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <SlowList text={deferredText} />
    </>
  );
}
```

---

## 问题 3：Ref 相关 Hooks 有哪些？

**useRef、useImperativeHandle**。

### useRef - 引用值

```jsx
function TextInput() {
  const inputRef = useRef(null);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>聚焦</button>
      <p>渲染次数: {renderCount.current}</p>
    </>
  );
}
```

### useImperativeHandle - 自定义 ref

```jsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    getValue: () => {
      return inputRef.current.value;
    }
  }));

  return <input ref={inputRef} />;
});

function Parent() {
  const fancyInputRef = useRef();

  const handleClick = () => {
    fancyInputRef.current.focus();
    console.log(fancyInputRef.current.getValue());
  };

  return (
    <>
      <FancyInput ref={fancyInputRef} />
      <button onClick={handleClick}>操作</button>
    </>
  );
}
```

---

## 问题 4：布局和副作用 Hooks 有哪些？

**useLayoutEffect、useInsertionEffect**。

### useLayoutEffect - 同步副作用

```jsx
function Tooltip() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef();

  useLayoutEffect(() => {
    // 在浏览器绘制前执行
    const rect = tooltipRef.current.getBoundingClientRect();
    
    // 调整位置，避免溢出
    if (rect.right > window.innerWidth) {
      setPosition({ x: window.innerWidth - rect.width, y: rect.top });
    }
  }, []);

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      Tooltip
    </div>
  );
}
```

### useInsertionEffect - CSS-in-JS

```jsx
function useCSS(rule) {
  useInsertionEffect(() => {
    // 在 DOM 变更前插入样式
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [rule]);
}

function Component() {
  useCSS('.my-class { color: red; }');
  return <div className="my-class">Text</div>;
}
```

---

## 问题 5：状态管理 Hooks 有哪些？

**useReducer、useSyncExternalStore**。

### useReducer - 复杂状态

```jsx
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </>
  );
}
```

### useSyncExternalStore - 外部状态

```jsx
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    // subscribe
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    // getSnapshot
    () => navigator.onLine,
    // getServerSnapshot
    () => true
  );

  return isOnline;
}

function App() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? '在线' : '离线'}</div>;
}
```

---

## 问题 6：调试 Hooks 有哪些？

**useDebugValue、useId**。

### useDebugValue - 调试信息

```jsx
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  // 在 React DevTools 中显示
  useDebugValue(isOnline ? 'Online' : 'Offline');

  useEffect(() => {
    const handleStatusChange = (status) => {
      setIsOnline(status.isOnline);
    };

    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  }, [friendID]);

  return isOnline;
}
```

### useId - 唯一 ID

```jsx
function NameFields() {
  const id = useId();

  return (
    <>
      <label htmlFor={`${id}-firstName`}>First Name</label>
      <input id={`${id}-firstName`} type="text" />
      
      <label htmlFor={`${id}-lastName`}>Last Name</label>
      <input id={`${id}-lastName`} type="text" />
    </>
  );
}

// 多个实例会有不同的 ID
function App() {
  return (
    <>
      <NameFields />  {/* id: :r1: */}
      <NameFields />  {/* id: :r2: */}
    </>
  );
}
```

---

## 问题 7：如何自定义 Hooks？

**提取可复用的逻辑到自定义 Hook**。

### 自定义 Hook 示例

```jsx
// 窗口尺寸 Hook
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();
  return <div>窗口尺寸: {width} x {height}</div>;
}
```

### 数据获取 Hook

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setError(error);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <div>{data.name}</div>;
}
```

### 本地存储 Hook

```jsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', '');
  
  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}
```

---

## 总结

**React Hooks 完整列表**：

### 1. 基础 Hooks
- `useState` - 状态管理
- `useEffect` - 副作用
- `useContext` - 上下文

### 2. 性能优化
- `useMemo` - 缓存值
- `useCallback` - 缓存函数
- `useTransition` - 并发更新
- `useDeferredValue` - 延迟值

### 3. Ref 相关
- `useRef` - 引用值
- `useImperativeHandle` - 自定义 ref

### 4. 布局和副作用
- `useLayoutEffect` - 同步副作用
- `useInsertionEffect` - CSS-in-JS

### 5. 状态管理
- `useReducer` - 复杂状态
- `useSyncExternalStore` - 外部状态

### 6. 调试工具
- `useDebugValue` - 调试信息
- `useId` - 唯一 ID

### 7. 自定义 Hooks
- 提取可复用逻辑
- 遵循命名规范（use 开头）
- 可以组合其他 Hooks

## 延伸阅读

- [React Hooks 官方文档](https://react.dev/reference/react)
- [Hooks API 参考](https://react.dev/reference/react/hooks)
- [自定义 Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Hooks 最佳实践](https://react.dev/learn/hooks-faq)
