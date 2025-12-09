---
title: 路由懒加载如何实现？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握 React 路由懒加载的实现方式，优化首屏加载性能。
tags:
  - React
  - React Router
  - 懒加载
  - 性能优化
estimatedTime: 10 分钟
keywords:
  - route lazy loading
  - React.lazy
  - Suspense
  - code splitting
highlight: 使用 React.lazy 动态导入组件，配合 Suspense 显示加载状态，实现路由级别的代码分割。
order: 260
---

## 问题 1：基本实现？

### React.lazy + Suspense

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// 懒加载组件
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const UserDetail = lazy(() => import("./pages/UserDetail"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<UserDetail />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 问题 2：每个路由单独 Suspense？

### 更细粒度的加载状态

```jsx
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<HomeSkeleton />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path="/about"
        element={
          <Suspense fallback={<AboutSkeleton />}>
            <About />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

### 封装懒加载组件

```jsx
function LazyLoad({ component: Component, fallback }) {
  return (
    <Suspense fallback={fallback || <Loading />}>
      <Component />
    </Suspense>
  );
}

// 使用
const Home = lazy(() => import("./pages/Home"));

<Route path="/" element={<LazyLoad component={Home} />} />;
```

---

## 问题 3：预加载路由？

### 鼠标悬停时预加载

```jsx
const About = lazy(() => import("./pages/About"));

// 预加载函数
const preloadAbout = () => import("./pages/About");

function Nav() {
  return (
    <nav>
      <Link to="/">首页</Link>
      <Link
        to="/about"
        onMouseEnter={preloadAbout} // 悬停时预加载
      >
        关于
      </Link>
    </nav>
  );
}
```

### 路由配置中预加载

```jsx
const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: lazy(() => import("./pages/About")),
    preload: () => import("./pages/About"),
  },
];

// 预加载所有路由
function preloadAllRoutes() {
  routes.forEach((route) => route.preload?.());
}
```

---

## 问题 4：命名导出的懒加载？

### 默认只支持默认导出

```jsx
// ✅ 默认导出
// pages/Home.jsx
export default function Home() { ... }

const Home = lazy(() => import('./pages/Home'));
```

### 命名导出的处理

```jsx
// pages/User.jsx
export function UserList() { ... }
export function UserDetail() { ... }

// 懒加载命名导出
const UserList = lazy(() =>
  import('./pages/User').then(module => ({
    default: module.UserList
  }))
);

const UserDetail = lazy(() =>
  import('./pages/User').then(module => ({
    default: module.UserDetail
  }))
);
```

---

## 问题 5：加载失败处理？

### 错误边界

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>加载失败，请刷新重试</div>;
    }
    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  </Suspense>
</ErrorBoundary>;
```

## 总结

| 技术          | 作用                   |
| ------------- | ---------------------- |
| React.lazy    | 动态导入组件           |
| Suspense      | 显示加载状态           |
| 预加载        | 提前加载即将访问的路由 |
| ErrorBoundary | 处理加载失败           |

## 延伸阅读

- [React.lazy 文档](https://react.dev/reference/react/lazy)
- [代码分割](https://react.dev/learn/code-splitting)
