---
title: 如何实现前端缓存系统？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  掌握前端缓存系统的设计和实现方法。
tags:
  - React
  - 缓存
  - 性能
  - 架构
estimatedTime: 15 分钟
keywords:
  - frontend cache
  - caching strategy
  - React Query
  - SWR
highlight: 前端缓存可通过内存缓存、localStorage、IndexedDB 实现，配合过期策略和更新机制。
order: 657
---

## 问题 1：简单内存缓存

### 基本实现

```typescript
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expireAt: number }>();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expireAt: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new MemoryCache();
```

### 使用

```typescript
async function fetchUser(id: string) {
  const cacheKey = `user-${id}`;

  // 检查缓存
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // 请求数据
  const data = await api.getUser(id);

  // 存入缓存
  cache.set(cacheKey, data, 5 * 60 * 1000); // 5分钟

  return data;
}
```

---

## 问题 2：封装缓存 Hook

### useCachedQuery

```typescript
function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; staleTime?: number } = {}
) {
  const { ttl = 5 * 60 * 1000, staleTime = 0 } = options;

  const [data, setData] = useState<T | null>(() => cache.get(key));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    const cached = cache.get(key);

    if (!cached) {
      fetchData();
    } else if (staleTime > 0) {
      // 后台刷新
      const timer = setTimeout(fetchData, staleTime);
      return () => clearTimeout(timer);
    }
  }, [key, fetchData, staleTime]);

  return { data, loading, error, refetch: fetchData };
}

// 使用
function UserProfile({ id }) {
  const { data, loading } = useCachedQuery(
    `user-${id}`,
    () => api.getUser(id),
    { ttl: 5 * 60 * 1000 }
  );
}
```

---

## 问题 3：持久化缓存

### localStorage 缓存

```typescript
class StorageCache<T> {
  private prefix: string;

  constructor(prefix: string = "cache") {
    this.prefix = prefix;
  }

  private getKey(key: string) {
    return `${this.prefix}:${key}`;
  }

  set(key: string, data: T, ttl: number) {
    const item = {
      data,
      expireAt: Date.now() + ttl,
    };
    localStorage.setItem(this.getKey(key), JSON.stringify(item));
  }

  get(key: string): T | null {
    const raw = localStorage.getItem(this.getKey(key));
    if (!raw) return null;

    try {
      const item = JSON.parse(raw);
      if (Date.now() > item.expireAt) {
        this.delete(key);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  }

  delete(key: string) {
    localStorage.removeItem(this.getKey(key));
  }
}
```

### IndexedDB 缓存（大数据）

```typescript
import { openDB } from "idb";

const dbPromise = openDB("cache-db", 1, {
  upgrade(db) {
    db.createObjectStore("cache");
  },
});

async function setCache(key: string, data: any, ttl: number) {
  const db = await dbPromise;
  await db.put("cache", { data, expireAt: Date.now() + ttl }, key);
}

async function getCache(key: string) {
  const db = await dbPromise;
  const item = await db.get("cache", key);

  if (!item) return null;
  if (Date.now() > item.expireAt) {
    await db.delete("cache", key);
    return null;
  }

  return item.data;
}
```

---

## 问题 4：使用 React Query

### 内置缓存

```typescript
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
      cacheTime: 30 * 60 * 1000, // 缓存保留30分钟
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfile />
    </QueryClientProvider>
  );
}

function UserProfile({ id }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
  });
}
```

### 持久化缓存

```typescript
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24小时
});
```

---

## 问题 5：缓存策略

### SWR 策略

```typescript
// Stale-While-Revalidate
// 1. 先返回缓存（可能过期）
// 2. 后台请求新数据
// 3. 更新缓存和 UI

function useSWR(key, fetcher) {
  const [data, setData] = useState(() => cache.get(key));

  useEffect(() => {
    // 立即返回缓存
    const cached = cache.get(key);
    if (cached) setData(cached);

    // 后台刷新
    fetcher().then((newData) => {
      cache.set(key, newData);
      setData(newData);
    });
  }, [key]);

  return data;
}
```

## 总结

| 方案         | 适用场景     |
| ------------ | ------------ |
| 内存缓存     | 会话内缓存   |
| localStorage | 小数据持久化 |
| IndexedDB    | 大数据持久化 |
| React Query  | 完整解决方案 |

## 延伸阅读

- [React Query](https://tanstack.com/query/latest)
- [SWR](https://swr.vercel.app/)
