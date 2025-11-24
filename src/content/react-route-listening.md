---
title: React 如何监听路由变化
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Router 如何监听和响应路由变化。掌握路由监听的原理和方法，
  有助于实现路由守卫、数据预加载等功能。
tags:
  - React
  - React Router
  - 路由
  - 导航
estimatedTime: 20 分钟
keywords:
  - React Router
  - 路由监听
  - useLocation
  - 路由守卫
highlight: 通过 useLocation、useNavigate 和 history 监听路由变化
order: 114
---

## 问题 1：React Router 如何监听路由变化？

**使用 useLocation、useEffect 组合监听路由变化**。

### 基本监听

```jsx
import { useLocation, useEffect } from 'react-router-dom';

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log('路由变化:', location.pathname);
    
    // 可以在这里执行：
    // - 页面统计
    // - 数据预加载
    // - 权限检查
  }, [location]);

  return <div>当前路径: {location.pathname}</div>;
}
```

### 获取路由信息

```jsx
function RouteInfo() {
  const location = useLocation();

  return (
    <div>
      <p>路径: {location.pathname}</p>
      <p>查询参数: {location.search}</p>
      <p>Hash: {location.hash}</p>
      <p>State: {JSON.stringify(location.state)}</p>
    </div>
  );
}

// 访问 /users?page=1#top
// pathname: "/users"
// search: "?page=1"
// hash: "#top"
```

---

## 问题 2：如何实现路由守卫？

**通过监听路由变化，在导航前进行权限检查**。

### 路由守卫组件

```jsx
import { useLocation, Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = useAuth();

  if (!isAuthenticated) {
    // 未登录，重定向到登录页
    // 保存当前位置，登录后可以返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// 使用
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### 全局路由监听

```jsx
function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查权限
    const hasPermission = checkPermission(location.pathname);
    
    if (!hasPermission) {
      // 无权限，跳转到 403 页面
      navigate('/403', { replace: true });
    }
    
    // 页面访问统计
    trackPageView(location.pathname);
    
    // 滚动到顶部
    window.scrollTo(0, 0);
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <>
      <RouteGuard />
      <Routes>
        {/* 路由配置 */}
      </Routes>
    </>
  );
}
```

---

## 问题 3：如何监听路由参数变化？

**使用 useParams 和 useSearchParams 监听参数变化**。

### 监听路径参数

```jsx
import { useParams, useEffect } from 'react-router-dom';

function UserProfile() {
  const { userId } = useParams();

  useEffect(() => {
    console.log('用户 ID 变化:', userId);
    
    // 加载用户数据
    fetchUserData(userId);
  }, [userId]);

  return <div>用户 ID: {userId}</div>;
}

// 路由配置
<Route path="/users/:userId" element={<UserProfile />} />

// /users/123 -> userId = "123"
// /users/456 -> userId = "456"
```

### 监听查询参数

```jsx
import { useSearchParams, useEffect } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const page = searchParams.get('page') || '1';
    const category = searchParams.get('category') || 'all';
    
    console.log('查询参数变化:', { page, category });
    
    // 加载产品列表
    fetchProducts({ page, category });
  }, [searchParams]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage });
  };

  return (
    <div>
      <ProductGrid />
      <Pagination onChange={handlePageChange} />
    </div>
  );
}

// /products?page=1&category=electronics
```

---

## 问题 4：如何实现路由切换动画？

**结合 useLocation 和 CSS 过渡实现路由动画**。

### 使用 CSS 过渡

```jsx
import { useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="fade"
        timeout={300}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}
```

```css
/* 路由切换动画 */
.fade-enter {
  opacity: 0;
  transform: translateX(100%);
}

.fade-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 300ms ease-in;
}

.fade-exit {
  opacity: 1;
  transform: translateX(0);
}

.fade-exit-active {
  opacity: 0;
  transform: translateX(-100%);
  transition: all 300ms ease-out;
}
```

---

## 问题 5：如何阻止路由跳转？

**使用 useBlocker 或 beforeunload 事件阻止导航**。

### 使用 useBlocker（React Router v6.4+）

```jsx
import { useBlocker } from 'react-router-dom';

function EditForm() {
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // 阻止导航
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        '有未保存的更改，确定要离开吗？'
      );
      
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  return (
    <form>
      <input
        onChange={(e) => {
          setFormData({ ...formData, name: e.target.value });
          setIsDirty(true);
        }}
      />
      <button type="submit">保存</button>
    </form>
  );
}
```

### 阻止页面关闭

```jsx
function UnsavedChangesWarning({ hasUnsavedChanges }) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return null;
}
```

---

## 问题 6：如何实现路由懒加载监听？

**监听懒加载组件的加载状态**。

### 懒加载监听

```jsx
import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Dashboard = lazy(() => import('./Dashboard'));
const Profile = lazy(() => import('./Profile'));

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // 模拟加载完成
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      {isLoading && <LoadingBar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </>
  );
}
```

### 预加载路由

```jsx
import { lazy } from 'react';

// 创建懒加载组件
const Dashboard = lazy(() => import('./Dashboard'));

// 预加载函数
const preloadDashboard = () => {
  import('./Dashboard');
};

function Navigation() {
  return (
    <nav>
      <Link
        to="/dashboard"
        onMouseEnter={preloadDashboard}  // 鼠标悬停时预加载
      >
        Dashboard
      </Link>
    </nav>
  );
}
```

---

## 问题 7：如何实现路由历史记录监听？

**使用 useNavigate 和 history 对象监听历史记录**。

### 监听前进/后退

```jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function HistoryListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 监听浏览器的前进/后退按钮
    const handlePopState = (event) => {
      console.log('历史记录变化:', event.state);
      
      // 可以在这里执行清理或恢复操作
      if (event.state?.scrollPosition) {
        window.scrollTo(0, event.state.scrollPosition);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 保存滚动位置
  useEffect(() => {
    const saveScrollPosition = () => {
      window.history.replaceState(
        { ...window.history.state, scrollPosition: window.scrollY },
        ''
      );
    };

    window.addEventListener('scroll', saveScrollPosition);

    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, [location]);

  return null;
}
```

### 自定义导航钩子

```jsx
function useRouteChange(callback) {
  const location = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current.pathname !== location.pathname) {
      callback({
        from: prevLocation.current,
        to: location
      });
      prevLocation.current = location;
    }
  }, [location, callback]);
}

// 使用
function App() {
  useRouteChange(({ from, to }) => {
    console.log(`从 ${from.pathname} 导航到 ${to.pathname}`);
    
    // 页面统计
    analytics.track('page_view', {
      from: from.pathname,
      to: to.pathname
    });
  });

  return <Routes>{/* ... */}</Routes>;
}
```

---

## 总结

**核心方法**：

### 1. 基本监听
- useLocation 获取当前路由
- useEffect 监听路由变化
- useParams 监听路径参数
- useSearchParams 监听查询参数

### 2. 路由守卫
- 权限检查
- 登录验证
- 重定向处理

### 3. 高级功能
- 路由动画
- 阻止导航
- 懒加载监听
- 历史记录监听

### 4. 实用场景
- 页面统计
- 数据预加载
- 滚动位置恢复
- 表单未保存提示

### 5. 最佳实践
- 使用 Hooks 而非 withRouter
- 合理使用 useEffect 依赖
- 注意清理副作用
- 避免过度监听

## 延伸阅读

- [React Router 官方文档](https://reactrouter.com/)
- [useLocation Hook](https://reactrouter.com/en/main/hooks/use-location)
- [useNavigate Hook](https://reactrouter.com/en/main/hooks/use-navigate)
- [路由守卫最佳实践](https://reactrouter.com/en/main/start/concepts#navigation)
