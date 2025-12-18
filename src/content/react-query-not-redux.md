---
title: React Query 为什么不是 Redux 替代品？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React Query 和 Redux 解决的是不同问题，掌握服务端状态和客户端状态的区别。
tags:
  - React
  - React Query
  - Redux
  - 状态管理
estimatedTime: 12 分钟
keywords:
  - React Query
  - TanStack Query
  - server state
  - client state
highlight: React Query 管理服务端状态（异步数据），Redux 管理客户端状态，两者解决不同问题。
order: 552
---

## 问题 1：两者解决什么问题？

### Redux：客户端状态

```jsx
// 客户端状态：完全由前端控制
- UI 状态（modal 开关、tab 选中）
- 用户输入（表单数据）
- 本地设置（主题、语言）
```

### React Query：服务端状态

```jsx
// 服务端状态：来自服务器的异步数据
-用户列表 - 文章详情 - 订单数据;
```

---

## 问题 2：服务端状态有什么特点？

### 服务端状态的挑战

```jsx
// 1. 异步获取
const users = await fetch("/api/users");

// 2. 可能过期
// 数据在服务器上可能已经变化

// 3. 需要缓存
// 避免重复请求

// 4. 需要同步
// 多个组件使用同一数据

// 5. 需要处理加载/错误状态
```

### React Query 的解决方案

```jsx
function UserList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
  });

  // 自动处理：缓存、去重、后台刷新、错误重试
}
```

---

## 问题 3：为什么不用 Redux 管理服务端状态？

### Redux 管理服务端状态的问题

```jsx
// 需要手动处理很多事情
function usersReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, data: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    // 还需要处理：缓存、过期、去重、重试...
  }
}

// 每个数据类型都要写一遍
// users、products、orders...
```

### React Query 自动处理

```jsx
// 一行代码搞定
const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

// 自动处理：
// ✅ 缓存
// ✅ 去重（多个组件同时请求只发一次）
// ✅ 后台刷新
// ✅ 过期重新获取
// ✅ 错误重试
// ✅ 窗口聚焦刷新
// ✅ 分页/无限滚动
```

---

## 问题 4：两者如何配合使用？

### 各司其职

```jsx
// React Query：服务端状态
const { data: users } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});

// Redux/Zustand：客户端状态
const useStore = create((set) => ({
  selectedUserId: null,
  setSelectedUser: (id) => set({ selectedUserId: id }),

  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// 组件中组合使用
function UserPage() {
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  const { selectedUserId, setSelectedUser } = useStore();

  return (
    <div>
      <UserList users={users} onSelect={setSelectedUser} />
      <UserDetail userId={selectedUserId} />
    </div>
  );
}
```

---

## 问题 5：什么时候只用 React Query？

### 很多应用不需要 Redux

```jsx
// 如果你的"全局状态"主要是：
// - 用户信息 → React Query
// - 列表数据 → React Query
// - 详情数据 → React Query

// 剩下的客户端状态可能只需要：
// - useState（组件状态）
// - Context（主题、语言）
// - URL（路由状态）

// 不一定需要 Redux
```

### 需要 Redux 的场景

```jsx
// 复杂的客户端状态逻辑
// - 多步骤表单
// - 复杂的 UI 状态机
// - 需要时间旅行调试
// - 离线优先应用
```

## 总结

| 方面     | React Query | Redux      |
| -------- | ----------- | ---------- |
| 解决问题 | 服务端状态  | 客户端状态 |
| 数据来源 | 服务器      | 前端       |
| 缓存     | 内置        | 手动       |
| 同步     | 自动        | 手动       |
| 关系     | 互补        | 互补       |

**结论**：React Query 不是 Redux 替代品，而是补充品。

## 延伸阅读

- [TanStack Query 文档](https://tanstack.com/query)
- [Does React Query replace Redux?](https://tanstack.com/query/latest/docs/react/guides/does-this-replace-client-state)
