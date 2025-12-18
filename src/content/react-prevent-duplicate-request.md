---
title: 如何处理用户快速点击按钮导致重复请求？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握防止重复请求的多种方法，提升用户体验和系统稳定性。
tags:
  - React
  - 请求
  - 防抖
  - 用户体验
estimatedTime: 12 分钟
keywords:
  - duplicate request
  - debounce
  - loading state
  - request deduplication
highlight: 防止重复请求的方法：loading 状态禁用、防抖、请求取消、请求去重。
order: 656
---

## 问题 1：使用 loading 状态

### 基本实现

```jsx
function SubmitButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return; // 防止重复点击

    setLoading(true);
    try {
      await submitData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "提交中..." : "提交"}
    </button>
  );
}
```

### 封装 Hook

```jsx
function useAsyncCallback(callback) {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      if (loading) return;

      setLoading(true);
      try {
        return await callback(...args);
      } finally {
        setLoading(false);
      }
    },
    [callback, loading]
  );

  return [execute, loading];
}

// 使用
function Component() {
  const [submit, loading] = useAsyncCallback(async () => {
    await api.submit();
  });

  return (
    <button onClick={submit} disabled={loading}>
      提交
    </button>
  );
}
```

---

## 问题 2：使用防抖

### 防抖实现

```jsx
import { useMemo } from "react";
import { debounce } from "lodash";

function SearchInput() {
  const [query, setQuery] = useState("");

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        api.search(value);
      }, 300),
    []
  );

  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

### 按钮防抖

```jsx
function SubmitButton() {
  const handleClick = useMemo(
    () =>
      debounce(
        async () => {
          await submitData();
        },
        1000,
        { leading: true, trailing: false }
      ),
    []
  );

  return <button onClick={handleClick}>提交</button>;
}
```

---

## 问题 3：取消前一个请求

### 使用 AbortController

```jsx
function SearchComponent() {
  const [results, setResults] = useState([]);
  const abortControllerRef = useRef(null);

  const search = async (query) => {
    // 取消前一个请求
    abortControllerRef.current?.abort();

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: abortControllerRef.current.signal,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
      }
    }
  };

  return <input onChange={(e) => search(e.target.value)} />;
}
```

### 封装 Hook

```jsx
function useCancelableRequest() {
  const abortControllerRef = useRef(null);

  const request = useCallback(async (url, options = {}) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    return fetch(url, {
      ...options,
      signal: abortControllerRef.current.signal,
    });
  }, []);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return request;
}
```

---

## 问题 4：请求去重

### 相同请求只发一次

```jsx
const pendingRequests = new Map();

async function dedupedFetch(url, options) {
  const key = `${options?.method || "GET"}-${url}`;

  // 如果有相同的请求正在进行，返回同一个 Promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fetch(url, options).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}
```

### React Query 自动去重

```jsx
import { useQuery } from "@tanstack/react-query";

function Component() {
  // React Query 自动处理重复请求
  const { data } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
  });
}

// 多个组件使用相同的 queryKey
// 只会发送一次请求
```

---

## 问题 5：乐观更新 + 回滚

### 实现

```jsx
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending) return;

    // 乐观更新
    const previousLiked = liked;
    setLiked(!liked);
    setPending(true);

    try {
      await api.toggleLike(postId);
    } catch (error) {
      // 失败时回滚
      setLiked(previousLiked);
    } finally {
      setPending(false);
    }
  };

  return <button onClick={handleClick}>{liked ? "❤️" : "🤍"}</button>;
}
```

## 总结

| 方法         | 适用场景         |
| ------------ | ---------------- |
| loading 状态 | 表单提交         |
| 防抖         | 搜索输入         |
| 取消请求     | 快速切换         |
| 请求去重     | 多处调用同一接口 |
| 乐观更新     | 点赞、收藏       |

## 延伸阅读

- [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React Query](https://tanstack.com/query/latest)
