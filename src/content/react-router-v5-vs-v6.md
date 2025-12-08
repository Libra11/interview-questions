---
title: React Router v5 与 v6 的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 React Router v5 和 v6 的主要差异，掌握 v6 的新特性和迁移要点。
tags:
  - React
  - React Router
  - 路由
  - 版本对比
estimatedTime: 15 分钟
keywords:
  - React Router v6
  - React Router v5
  - routing changes
  - migration
highlight: v6 使用 Routes 替代 Switch，引入相对路由、Outlet 嵌套、Hooks API 等重大改进。
order: 256
---

## 问题 1：路由配置的变化？

### Switch → Routes

```jsx
// v5
import { Switch, Route } from "react-router-dom";

<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/users/:id" component={User} />
</Switch>;

// v6
import { Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/users/:id" element={<User />} />
</Routes>;
```

### 主要变化

```jsx
// 1. component → element
// v5: component={Home}
// v6: element={<Home />}

// 2. 不再需要 exact
// v6 默认精确匹配

// 3. 路由排序自动优化
// v6 自动选择最佳匹配，无需手动排序
```

---

## 问题 2：嵌套路由的变化？

### v5：手动嵌套

```jsx
// v5
function App() {
  return (
    <Switch>
      <Route path="/users" component={Users} />
    </Switch>
  );
}

function Users({ match }) {
  return (
    <div>
      <h1>Users</h1>
      <Switch>
        <Route path={`${match.path}/:id`} component={UserDetail} />
        <Route path={match.path} component={UserList} />
      </Switch>
    </div>
  );
}
```

### v6：Outlet 嵌套

```jsx
// v6
function App() {
  return (
    <Routes>
      <Route path="/users" element={<Users />}>
        <Route index element={<UserList />} />
        <Route path=":id" element={<UserDetail />} />
      </Route>
    </Routes>
  );
}

function Users() {
  return (
    <div>
      <h1>Users</h1>
      <Outlet /> {/* 子路由渲染位置 */}
    </div>
  );
}
```

---

## 问题 3：Hooks API 的变化？

### 获取参数

```jsx
// v5
import { useParams, useLocation, useHistory } from "react-router-dom";

function User() {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();

  history.push("/home");
}

// v6
import { useParams, useLocation, useNavigate } from "react-router-dom";

function User() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  navigate("/home");
  navigate(-1); // 后退
}
```

### useHistory → useNavigate

```jsx
// v5
history.push("/path");
history.replace("/path");
history.go(-1);

// v6
navigate("/path");
navigate("/path", { replace: true });
navigate(-1);
```

---

## 问题 4：其他重要变化？

### 相对路由

```jsx
// v6 支持相对路径
<Routes>
  <Route path="/users" element={<Users />}>
    {/* 相对于 /users */}
    <Route path="new" element={<NewUser />} /> {/* /users/new */}
    <Route path=":id" element={<UserDetail />} /> {/* /users/:id */}
  </Route>
</Routes>;

// Link 也支持相对路径
function Users() {
  return (
    <div>
      <Link to="new">New User</Link> {/* 相对路径 */}
      <Link to="../">Back</Link> {/* 上级路径 */}
    </div>
  );
}
```

### 路由配置对象

```jsx
// v6 支持配置对象
import { useRoutes } from "react-router-dom";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "users/:id", element: <User /> },
    ],
  },
];

function App() {
  const element = useRoutes(routes);
  return element;
}
```

### 移除的功能

```jsx
// v6 移除了：
// - <Redirect /> → 使用 <Navigate />
// - useRouteMatch → 使用 useMatch
// - 渲染 props（render, children）→ 使用 element
// - exact, strict, sensitive → 默认行为改变
```

---

## 问题 5：迁移示例？

### 完整对比

```jsx
// v5
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
  useHistory,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route
          path="/users/:id"
          render={({ match }) => <User id={match.params.id} />}
        />
        <Redirect from="/old" to="/new" />
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
  );
}

// v6
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<User />} />
        <Route path="/old" element={<Navigate to="/new" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 总结

| 特性     | v5               | v6          |
| -------- | ---------------- | ----------- |
| 路由容器 | Switch           | Routes      |
| 组件传递 | component/render | element     |
| 嵌套路由 | 手动             | Outlet      |
| 导航     | useHistory       | useNavigate |
| 重定向   | Redirect         | Navigate    |
| 相对路径 | 不支持           | 支持        |

## 延伸阅读

- [React Router v6 文档](https://reactrouter.com/)
- [v5 到 v6 迁移指南](https://reactrouter.com/en/main/upgrading/v5)
