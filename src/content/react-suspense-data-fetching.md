---
title: Suspense for Data Fetching 如何工作？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 Suspense 数据获取的工作原理，掌握它与传统数据获取方式的区别。
tags:
  - React
  - Suspense
  - 数据获取
  - 异步
estimatedTime: 15 分钟
keywords:
  - Suspense data fetching
  - React use
  - async rendering
  - streaming
highlight: Suspense 数据获取通过"抛出 Promise"机制，让 React 知道组件正在等待数据。
order: 536
---

## 问题 1：传统数据获取的问题？

### Fetch-on-Render（渲染时获取）

```jsx
function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  if (!user) return <Loading />;
  return <div>{user.name}</div>;
}

// 问题：瀑布式加载
// 1. 渲染 Profile
// 2. 发起请求
// 3. 显示 Loading
// 4. 数据返回
// 5. 重新渲染
```

### 嵌套组件的瀑布问题

```jsx
function App() {
  return (
    <Profile>
      {" "}
      {/* 先加载 */}
      <Posts /> {/* 等 Profile 完成后才开始 */}
    </Profile>
  );
}

// 时间线：
// [===Profile===][===Posts===]
// 而不是：
// [===Profile===]
// [===Posts===]  （并行）
```

---

## 问题 2：Suspense 如何解决？

### 工作原理

组件在数据未就绪时**抛出 Promise**，Suspense 捕获并显示 fallback。

```jsx
// 简化的实现原理
function fetchData(url) {
  let status = "pending";
  let result;

  const promise = fetch(url).then((data) => {
    status = "success";
    result = data;
  });

  return {
    read() {
      if (status === "pending") {
        throw promise; // 抛出 Promise！
      }
      return result;
    },
  };
}

function Profile({ resource }) {
  const user = resource.read(); // 可能抛出 Promise
  return <div>{user.name}</div>;
}
```

### 使用方式

```jsx
// 在渲染之前开始获取
const resource = fetchProfileData();

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Profile resource={resource} />
    </Suspense>
  );
}
```

---

## 问题 3：React 19 的 use Hook？

### use 的用法

```jsx
import { use, Suspense } from "react";

async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function Profile({ userPromise }) {
  const user = use(userPromise); // 等待 Promise
  return <div>{user.name}</div>;
}

function App() {
  const userPromise = fetchUser(1);

  return (
    <Suspense fallback={<Loading />}>
      <Profile userPromise={userPromise} />
    </Suspense>
  );
}
```

### use 的特点

```jsx
// 1. 可以在条件语句中使用
function Component({ shouldFetch, promise }) {
  if (shouldFetch) {
    const data = use(promise); // ✅ 可以
  }
}

// 2. 可以读取 Context
function Component() {
  const theme = use(ThemeContext); // 替代 useContext
}
```

---

## 问题 4：实际框架如何支持？

### React Query / TanStack Query

```jsx
import { useSuspenseQuery } from "@tanstack/react-query";

function Profile({ userId }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Profile userId={1} />
    </Suspense>
  );
}
```

### Next.js

```jsx
// app/page.js (Server Component)
async function Profile() {
  const user = await fetchUser(); // 直接 await
  return <div>{user.name}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Profile />
    </Suspense>
  );
}
```

---

## 问题 5：并行数据获取？

### 避免瀑布

```jsx
// ❌ 瀑布式
function App() {
  return (
    <Suspense>
      <Profile /> {/* 先加载 */}
      <Suspense>
        <Posts /> {/* 等 Profile 完成 */}
      </Suspense>
    </Suspense>
  );
}

// ✅ 并行
const profilePromise = fetchProfile();
const postsPromise = fetchPosts();

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Profile promise={profilePromise} />
      <Posts promise={postsPromise} />
    </Suspense>
  );
}
```

## 总结

| 方面         | 传统方式 | Suspense    |
| ------------ | -------- | ----------- |
| 加载状态     | 手动管理 | 声明式      |
| 数据获取时机 | 渲染后   | 渲染前/并行 |
| 嵌套加载     | 瀑布式   | 可并行      |
| 代码复杂度   | 高       | 低          |

## 延伸阅读

- [use Hook 文档](https://react.dev/reference/react/use)
- [Suspense 数据获取](https://react.dev/blog/2022/03/29/react-v18#suspense-in-data-frameworks)
