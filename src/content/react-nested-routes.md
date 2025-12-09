---
title: 嵌套路由如何实现？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握 React Router v6 中嵌套路由的实现方式，理解 Outlet 的作用。
tags:
  - React
  - React Router
  - 嵌套路由
  - Outlet
estimatedTime: 10 分钟
keywords:
  - nested routes
  - Outlet
  - React Router
  - route nesting
highlight: 使用 Route 嵌套定义子路由，通过 Outlet 组件指定子路由的渲染位置。
order: 259
---

## 问题 1：基本嵌套路由？

### 路由配置

```jsx
import { Routes, Route, Outlet } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="users" element={<Users />}>
          <Route index element={<UserList />} />
          <Route path=":id" element={<UserDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

### Outlet 渲染子路由

```jsx
function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
        <Link to="/users">用户</Link>
      </nav>

      <main>
        <Outlet /> {/* 子路由渲染在这里 */}
      </main>
    </div>
  );
}

function Users() {
  return (
    <div>
      <h1>用户管理</h1>
      <Outlet /> {/* UserList 或 UserDetail 渲染在这里 */}
    </div>
  );
}
```

---

## 问题 2：index 路由是什么？

### 默认子路由

```jsx
<Route path="users" element={<Users />}>
  <Route index element={<UserList />} /> {/* /users */}
  <Route path=":id" element={<UserDetail />} /> {/* /users/123 */}
</Route>

// 访问 /users 时，显示 UserList
// 访问 /users/123 时，显示 UserDetail
```

### 等价于

```jsx
// index 相当于 path=""
<Route path="" element={<UserList />} />
```

---

## 问题 3：使用配置对象？

### useRoutes

```jsx
import { useRoutes } from "react-router-dom";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      {
        path: "users",
        element: <Users />,
        children: [
          { index: true, element: <UserList /> },
          { path: ":id", element: <UserDetail /> },
        ],
      },
    ],
  },
];

function App() {
  const element = useRoutes(routes);
  return element;
}
```

---

## 问题 4：传递数据给子路由？

### 使用 Outlet context

```jsx
function Users() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div>
      <h1>用户管理</h1>
      <Outlet context={{ selectedUser, setSelectedUser }} />
    </div>
  );
}

// 子路由中获取
import { useOutletContext } from "react-router-dom";

function UserDetail() {
  const { selectedUser, setSelectedUser } = useOutletContext();

  return <div>{selectedUser?.name}</div>;
}
```

## 总结

| 概念             | 说明                      |
| ---------------- | ------------------------- |
| Route 嵌套       | 在 Route 内部定义子 Route |
| Outlet           | 指定子路由渲染位置        |
| index            | 默认子路由                |
| useOutletContext | 父子路由传递数据          |

## 延伸阅读

- [React Router 嵌套路由](https://reactrouter.com/en/main/start/tutorial#nested-routes)
