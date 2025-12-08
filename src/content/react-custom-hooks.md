---
title: 自定义 Hook 如何实现？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握自定义 Hook 的实现方法和设计原则，学会封装可复用的状态逻辑。
tags:
  - React
  - Hooks
  - 自定义Hook
  - 代码复用
estimatedTime: 15 分钟
keywords:
  - custom hooks
  - hook composition
  - reusable logic
  - React patterns
highlight: 自定义 Hook 是以 use 开头的函数，内部可以调用其他 Hook，用于封装可复用的状态逻辑。
order: 215
---

## 问题 1：什么是自定义 Hook？

### 定义

自定义 Hook 是一个**以 `use` 开头的函数**，内部可以调用其他 Hook。

```jsx
// 自定义 Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// 使用
function Counter() {
  const { count, increment, decrement } = useCounter(10);

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### 为什么要以 use 开头？

1. React 通过命名约定识别 Hook
2. ESLint 插件可以检查 Hook 规则
3. 代码可读性更好

---

## 问题 2：常见的自定义 Hook 示例？

### useLocalStorage

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// 使用
function App() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
}
```

### useFetch

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
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
function UserList() {
  const { data, loading, error } = useFetch("/api/users");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

### useDebounce

```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

---

## 问题 3：自定义 Hook 的设计原则？

### 1. 单一职责

```jsx
// ✅ 好：职责单一
function useWindowSize() {
  /* 只处理窗口尺寸 */
}
function useOnlineStatus() {
  /* 只处理在线状态 */
}

// ❌ 差：职责混乱
function useWindowSizeAndOnlineStatus() {
  /* 混合多个功能 */
}
```

### 2. 返回值设计

```jsx
// 单个值
function useOnline() {
  return isOnline; // 直接返回
}

// 多个值
function useCounter() {
  return { count, increment, decrement }; // 返回对象
}

// 类似 useState
function useToggle(initial) {
  return [value, toggle]; // 返回数组
}
```

### 3. 参数设计

```jsx
// 支持配置
function useFetch(url, options = {}) {
  const {
    immediate = true, // 是否立即请求
    initialData = null,
  } = options;
  // ...
}
```

---

## 问题 4：Hook 之间如何组合？

### 组合多个 Hook

```jsx
function useUser(userId) {
  // 组合 useFetch
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  // 组合 useLocalStorage
  const [favorites, setFavorites] = useLocalStorage("favorites", []);

  const isFavorite = favorites.includes(userId);
  const toggleFavorite = () => {
    setFavorites((prev) =>
      isFavorite ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return { user, loading, error, isFavorite, toggleFavorite };
}
```

## 总结

**自定义 Hook 要点**：

1. **命名**：以 `use` 开头
2. **内部**：可以调用其他 Hook
3. **目的**：封装可复用的状态逻辑
4. **原则**：单一职责、清晰的返回值

## 延伸阅读

- [自定义 Hook 文档](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useHooks 库](https://usehooks.com/)
- [ahooks 库](https://ahooks.js.org/)
