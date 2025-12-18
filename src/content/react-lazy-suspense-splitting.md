---
title: React.lazy 与 Suspense 如何实现代码分割？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握 React.lazy 和 Suspense 实现代码分割的原理和最佳实践。
tags:
  - React
  - 代码分割
  - React.lazy
  - Suspense
estimatedTime: 12 分钟
keywords:
  - code splitting
  - React.lazy
  - Suspense
  - dynamic import
highlight: React.lazy 配合动态 import 实现组件级代码分割，Suspense 处理加载状态。
order: 616
---

## 问题 1：基本原理？

### 动态 import

```javascript
// 静态导入：打包时包含
import Component from "./Component";

// 动态导入：运行时加载
const Component = import("./Component");
// 返回 Promise
```

### React.lazy

```jsx
// React.lazy 包装动态导入
const LazyComponent = React.lazy(() => import("./Component"));

// 使用时
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

---

## 问题 2：Suspense 的作用？

### 处理加载状态

```jsx
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// 加载过程：
// 1. 渲染 App
// 2. 遇到 LazyComponent，开始加载
// 3. 显示 fallback
// 4. 加载完成，显示 LazyComponent
```

### 嵌套 Suspense

```jsx
function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Header />

      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </Suspense>
  );
}
```

---

## 问题 3：路由级代码分割？

### 按路由分割

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### 打包结果

```
dist/
  main.js        # 主包
  Home.chunk.js  # Home 页面
  About.chunk.js # About 页面
  Dashboard.chunk.js # Dashboard 页面
```

---

## 问题 4：预加载策略？

### 鼠标悬停预加载

```jsx
const About = lazy(() => import("./pages/About"));

// 预加载函数
const preloadAbout = () => import("./pages/About");

function Nav() {
  return (
    <Link to="/about" onMouseEnter={preloadAbout}>
      关于
    </Link>
  );
}
```

### 空闲时预加载

```jsx
// 页面加载完成后预加载
useEffect(() => {
  const timer = setTimeout(() => {
    import("./pages/About");
    import("./pages/Dashboard");
  }, 3000);

  return () => clearTimeout(timer);
}, []);
```

### 使用 Webpack magic comments

```jsx
const About = lazy(() =>
  import(
    /* webpackPrefetch: true */
    "./pages/About"
  )
);

// 生成 <link rel="prefetch" href="About.chunk.js">
```

---

## 问题 5：错误处理？

### 错误边界

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          加载失败，
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>;
```

---

## 问题 6：命名导出处理？

```jsx
// 组件使用命名导出
// Component.jsx
export function MyComponent() { ... }

// 懒加载命名导出
const MyComponent = lazy(() =>
  import('./Component').then(module => ({
    default: module.MyComponent
  }))
);
```

## 总结

| 技术          | 作用           |
| ------------- | -------------- |
| React.lazy    | 懒加载组件     |
| Suspense      | 显示加载状态   |
| 动态 import   | 运行时加载模块 |
| ErrorBoundary | 处理加载错误   |
| prefetch      | 预加载资源     |

## 延伸阅读

- [React.lazy 文档](https://react.dev/reference/react/lazy)
- [代码分割](https://react.dev/learn/code-splitting)
