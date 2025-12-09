---
title: useNavigate、useParams、useLocation 的功能？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握 React Router 中三个常用 Hooks 的功能和使用方法。
tags:
  - React
  - React Router
  - Hooks
  - 路由
estimatedTime: 10 分钟
keywords:
  - useNavigate
  - useParams
  - useLocation
  - React Router Hooks
highlight: useNavigate 用于编程式导航，useParams 获取路由参数，useLocation 获取当前位置信息。
order: 258
---

## 问题 1：useNavigate 的功能？

### 编程式导航

```jsx
import { useNavigate } from "react-router-dom";

function LoginButton() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate("/dashboard"); // 跳转到 dashboard
  };

  return <button onClick={handleLogin}>登录</button>;
}
```

### 常用方法

```jsx
const navigate = useNavigate();

// 跳转到指定路径
navigate("/users");

// 带参数跳转
navigate("/users/123");

// 带 state 跳转
navigate("/users", { state: { from: "home" } });

// 替换当前历史记录（不能后退）
navigate("/users", { replace: true });

// 前进/后退
navigate(-1); // 后退
navigate(1); // 前进
navigate(-2); // 后退两步
```

---

## 问题 2：useParams 的功能？

### 获取路由参数

```jsx
import { useParams } from 'react-router-dom';

// 路由配置
<Route path="/users/:id" element={<UserDetail />} />
<Route path="/posts/:category/:postId" element={<Post />} />

// 组件中使用
function UserDetail() {
  const { id } = useParams();
  // 访问 /users/123 时，id = "123"

  return <div>User ID: {id}</div>;
}

function Post() {
  const { category, postId } = useParams();
  // 访问 /posts/tech/456 时
  // category = "tech", postId = "456"

  return <div>{category} - {postId}</div>;
}
```

### 注意事项

```jsx
// 参数始终是字符串
const { id } = useParams();
console.log(typeof id); // "string"

// 需要数字时要转换
const numId = Number(id);

// 可选参数
<Route path="/users/:id?" element={<Users />} />;
// id 可能是 undefined
```

---

## 问题 3：useLocation 的功能？

### 获取当前位置信息

```jsx
import { useLocation } from "react-router-dom";

function CurrentPage() {
  const location = useLocation();

  console.log(location);
  // {
  //   pathname: "/users/123",
  //   search: "?tab=profile",
  //   hash: "#section1",
  //   state: { from: "home" },
  //   key: "abc123"
  // }

  return <div>当前路径: {location.pathname}</div>;
}
```

### 常用场景

```jsx
// 1. 获取查询参数
function SearchPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q");

  return <div>搜索: {query}</div>;
}

// 2. 获取传递的 state
function Dashboard() {
  const location = useLocation();
  const from = location.state?.from;

  return <div>来自: {from}</div>;
}

// 3. 监听路由变化
function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // 路由变化时上报
    trackPageView(location.pathname);
  }, [location]);
}
```

---

## 问题 4：三者的对比？

| Hook        | 功能         | 返回值        |
| ----------- | ------------ | ------------- |
| useNavigate | 编程式导航   | navigate 函数 |
| useParams   | 获取路由参数 | 参数对象      |
| useLocation | 获取位置信息 | location 对象 |

### 组合使用

```jsx
function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const handleEdit = () => {
    navigate(`/users/${id}/edit`, {
      state: { from: location.pathname },
    });
  };

  return (
    <div>
      <h1>User {id}</h1>
      <button onClick={handleEdit}>编辑</button>
    </div>
  );
}
```

## 总结

- **useNavigate**：跳转页面、前进后退
- **useParams**：获取 URL 中的动态参数
- **useLocation**：获取完整的位置信息（路径、查询、state）

## 延伸阅读

- [React Router Hooks](https://reactrouter.com/en/main/hooks/use-navigate)
