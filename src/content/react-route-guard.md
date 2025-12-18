---
title: React 如何实现路由守卫
category: React
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  探讨在 React 应用中实现路由守卫的多种方案，包括使用 React Router 的组件、高阶组件、自定义 Hook 等方法，实现权限控制和路由拦截。
tags:
  - React
  - React Router
  - 路由守卫
  - 权限控制
estimatedTime: 24 分钟
keywords:
  - React 路由守卫
  - React Router
  - 权限控制
  - 路由拦截
highlight: 路由守卫是前端权限控制的重要手段，掌握多种实现方式能够灵活应对不同的业务需求
order: 359
---

## 问题 1：什么是路由守卫？

### 基本概念

路由守卫（Route Guard）是在路由跳转前进行拦截和判断的机制，常用于：

- **权限验证**：检查用户是否有权限访问某个页面
- **登录状态检查**：未登录用户跳转到登录页
- **数据预加载**：在进入页面前加载必要数据
- **页面访问记录**：记录用户的访问轨迹

### Vue Router 的路由守卫

Vue Router 提供了内置的路由守卫：

```javascript
// Vue Router 示例（对比）
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next("/login");
  } else {
    next();
  }
});
```

### React Router 的情况

React Router 没有内置的路由守卫，需要自己实现。主要有以下几种方案：

1. 高阶组件（HOC）
2. 自定义路由组件
3. 使用 Hook
4. 路由配置拦截

---

## 问题 2：使用高阶组件实现路由守卫

### 基本实现

创建一个高阶组件来包装需要保护的路由。

```typescript
import { Navigate } from "react-router-dom";

// 权限检查的高阶组件
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const isAuthenticated = checkAuth(); // 检查登录状态

    if (!isAuthenticated) {
      // 未登录，重定向到登录页
      return <Navigate to="/login" replace />;
    }

    // 已登录，渲染组件
    return <Component {...props} />;
  };
}

// 使用
const ProtectedPage = withAuth(Dashboard);
```

### 完整示例

```typescript
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const location = useLocation();
  const user = getCurrentUser(); // 获取当前用户

  // 检查是否登录
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// 路由配置
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* 需要登录的路由 */}
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />

      {/* 需要管理员权限的路由 */}
      <Route
        path="/admin"
        element={
          <AuthGuard requiredRole="admin">
            <AdminPanel />
          </AuthGuard>
        }
      />
    </Routes>
  );
}
```

### 保存跳转前的路径

```typescript
// 登录组件
function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async () => {
    await loginUser();
    // 登录成功后跳转回原来的页面
    navigate(from, { replace: true });
  };

  return <form onSubmit={handleLogin}>{/* 登录表单 */}</form>;
}
```

---

## 问题 3：使用自定义 Hook 实现路由守卫

### 创建 useAuth Hook

```typescript
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function useAuth(requiredRole?: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  useEffect(() => {
    // 检查登录状态
    if (!user) {
      navigate("/login", {
        state: { from: location },
        replace: true,
      });
      return;
    }

    // 检查权限
    if (requiredRole && user.role !== requiredRole) {
      navigate("/403", { replace: true });
    }
  }, [user, requiredRole, navigate, location]);

  return user;
}

// 使用
function Dashboard() {
  const user = useAuth(); // 需要登录

  if (!user) return null; // 等待重定向

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}</p>
    </div>
  );
}

function AdminPanel() {
  const user = useAuth("admin"); // 需要管理员权限

  if (!user) return null;

  return <div>Admin Panel</div>;
}
```

### 优化：添加加载状态

```typescript
function useAuth(requiredRole?: string) {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();

        if (!user) {
          navigate("/login", {
            state: { from: location },
            replace: true,
          });
          return;
        }

        if (requiredRole && user.role !== requiredRole) {
          navigate("/403", { replace: true });
          return;
        }

        setIsChecking(false);
      } catch (error) {
        navigate("/login", { replace: true });
      }
    }

    checkAuth();
  }, [requiredRole, navigate, location]);

  return { isChecking };
}

// 使用
function Dashboard() {
  const { isChecking } = useAuth();

  if (isChecking) {
    return <Loading />;
  }

  return <div>Dashboard Content</div>;
}
```

---

## 问题 4：使用路由配置实现统一守卫

### 创建路由配置

```typescript
interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  requiredRole?: string;
  children?: RouteConfig[];
}

const routeConfig: RouteConfig[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    requiresAuth: true, // 需要登录
  },
  {
    path: "/admin",
    element: <AdminPanel />,
    requiresAuth: true,
    requiredRole: "admin", // 需要管理员权限
  },
];
```

### 创建路由渲染函数

```typescript
import { Navigate } from "react-router-dom";

function renderRoutes(routes: RouteConfig[]) {
  return routes.map((route) => {
    let element = route.element;

    // 添加权限检查
    if (route.requiresAuth) {
      element = (
        <AuthGuard requiredRole={route.requiredRole}>{element}</AuthGuard>
      );
    }

    return (
      <Route key={route.path} path={route.path} element={element}>
        {route.children && renderRoutes(route.children)}
      </Route>
    );
  });
}

// 使用
function App() {
  return <Routes>{renderRoutes(routeConfig)}</Routes>;
}
```

### 完整的路由守卫系统

```typescript
// types.ts
interface User {
  id: string;
  name: string;
  role: string;
}

interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  requiredRole?: string;
  meta?: {
    title?: string;
    [key: string]: any;
  };
  children?: RouteConfig[];
}

// AuthGuard.tsx
function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// routeConfig.ts
export const routes: RouteConfig[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        requiresAuth: true,
        meta: { title: "Dashboard" },
      },
      {
        path: "profile",
        element: <Profile />,
        requiresAuth: true,
      },
      {
        path: "admin",
        element: <AdminLayout />,
        requiresAuth: true,
        requiredRole: "admin",
        children: [
          {
            path: "users",
            element: <UserManagement />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/403",
    element: <Forbidden />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

// renderRoutes.tsx
function renderRoutes(routes: RouteConfig[]): React.ReactElement[] {
  return routes.map((route) => {
    let element = route.element;

    // 应用路由守卫
    if (route.requiresAuth) {
      element = (
        <AuthGuard requiredRole={route.requiredRole}>{element}</AuthGuard>
      );
    }

    // 设置页面标题
    if (route.meta?.title) {
      element = <PageTitle title={route.meta.title}>{element}</PageTitle>;
    }

    return (
      <Route key={route.path} path={route.path} element={element}>
        {route.children && renderRoutes(route.children)}
      </Route>
    );
  });
}

// App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>{renderRoutes(routes)}</Routes>
    </BrowserRouter>
  );
}
```

---

## 问题 5：实现更复杂的权限控制

### 基于权限列表的守卫

```typescript
interface Permission {
  resource: string;
  action: "read" | "write" | "delete";
}

function PermissionGuard({
  children,
  required,
}: {
  children: React.ReactNode;
  required: Permission;
}) {
  const user = useAuthStore((state) => state.user);

  const hasPermission = user?.permissions.some(
    (p) => p.resource === required.resource && p.action === required.action
  );

  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

// 使用
<Route
  path="/users/edit"
  element={
    <PermissionGuard required={{ resource: "users", action: "write" }}>
      <UserEdit />
    </PermissionGuard>
  }
/>;
```

### 动态路由生成

```typescript
function useRoutes() {
  const user = useAuthStore((state) => state.user);

  // 根据用户权限过滤路由
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (!route.requiredRole) return true;
      return user?.role === route.requiredRole;
    });
  }, [user]);

  return filteredRoutes;
}

// 使用
function App() {
  const routes = useRoutes();

  return (
    <BrowserRouter>
      <Routes>{renderRoutes(routes)}</Routes>
    </BrowserRouter>
  );
}
```

---

## 总结

**核心概念总结**：

### 1. 实现方案

- **高阶组件**：包装组件，添加权限检查
- **自定义 Hook**：在组件内部进行权限检查
- **路由配置**：统一管理路由和权限
- **组件守卫**：包装路由组件

### 2. 推荐方案

- **简单场景**：使用 AuthGuard 组件包装
- **复杂场景**：使用路由配置 + 统一守卫
- **细粒度控制**：结合多种方案

### 3. 关键要点

- 保存跳转前的路径，登录后返回
- 处理加载状态，避免闪烁
- 支持多级权限控制
- 考虑路由懒加载

### 4. 最佳实践

- 使用 TypeScript 定义路由配置
- 集中管理权限逻辑
- 提供友好的错误页面
- 考虑 SEO 和首屏加载

## 延伸阅读

- [React Router 官方文档](https://reactrouter.com/)
- [React 权限控制最佳实践](https://kentcdodds.com/blog/authentication-in-react-applications)
- [前端路由权限控制](https://juejin.cn/post/6844904129261690894)
- [React Router v6 迁移指南](https://reactrouter.com/en/main/upgrading/v5)
