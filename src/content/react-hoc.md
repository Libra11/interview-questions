---
title: React 介绍一下 HOC（高阶组件）
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解高阶组件（HOC）的概念、实现模式和使用场景，掌握如何使用 HOC 实现代码复用和逻辑抽象，以及 HOC 的最佳实践和注意事项。
tags:
  - React
  - HOC
  - 高阶组件
  - 代码复用
estimatedTime: 25 分钟
keywords:
  - HOC
  - 高阶组件
  - React 模式
  - 代码复用
highlight: 掌握 HOC 的核心概念和实现模式，理解如何使用 HOC 实现逻辑复用
order: 9
---

## 问题 1：什么是高阶组件（HOC）？

### 基本概念

高阶组件（Higher-Order Component，HOC）是一个**接收组件并返回新组件的函数**。

```jsx
// HOC 的基本形式
function withEnhancement(WrappedComponent) {
  return function EnhancedComponent(props) {
    // 添加额外的逻辑或 props
    return <WrappedComponent {...props} extraProp="value" />;
  };
}

// 使用
const EnhancedButton = withEnhancement(Button);
```

### HOC 的本质

HOC 是一种基于 React 组合特性的**设计模式**，用于复用组件逻辑。

```jsx
// HOC 不是组件，而是函数
// 输入：组件
// 输出：新组件

// 示例：添加 loading 状态
function withLoading(WrappedComponent) {
  return function WithLoadingComponent({ isLoading, ...props }) {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    return <WrappedComponent {...props} />;
  };
}

// 使用
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

const UserListWithLoading = withLoading(UserList);

// 在父组件中使用
function App() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  return <UserListWithLoading isLoading={isLoading} users={users} />;
}
```

---

## 问题 2：HOC 有哪些常见的使用场景？

### 场景 1：权限控制

```jsx
// ✅ 权限检查 HOC
function withAuth(WrappedComponent) {
  return function WithAuthComponent(props) {
    const { user } = useAuth(); // 假设有这个 hook
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    return <WrappedComponent {...props} user={user} />;
  };
}

// 使用
function Dashboard({ user }) {
  return <div>Welcome, {user.name}!</div>;
}

const ProtectedDashboard = withAuth(Dashboard);

// 在路由中使用
<Route path="/dashboard" element={<ProtectedDashboard />} />
```

### 场景 2：数据获取

```jsx
// ✅ 数据获取 HOC
function withData(WrappedComponent, fetchData) {
  return function WithDataComponent(props) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
      fetchData()
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    return <WrappedComponent {...props} data={data} />;
  };
}

// 使用
function UserList({ data }) {
  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

const UserListWithData = withData(UserList, () => fetch('/api/users').then(r => r.json()));
```

### 场景 3：日志记录

```jsx
// ✅ 日志记录 HOC
function withLogging(WrappedComponent) {
  return function WithLoggingComponent(props) {
    useEffect(() => {
      console.log(`${WrappedComponent.name} mounted with props:`, props);
      
      return () => {
        console.log(`${WrappedComponent.name} unmounted`);
      };
    }, [props]);
    
    const handleClick = (...args) => {
      console.log(`${WrappedComponent.name} clicked`);
      props.onClick?.(...args);
    };
    
    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}

// 使用
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

const ButtonWithLogging = withLogging(Button);
```

### 场景 4：样式增强

```jsx
// ✅ 主题 HOC
function withTheme(WrappedComponent) {
  return function WithThemeComponent(props) {
    const theme = useContext(ThemeContext);
    
    return <WrappedComponent {...props} theme={theme} />;
  };
}

// 使用
function Button({ theme, children }) {
  return (
    <button style={{ 
      background: theme.primary,
      color: theme.text 
    }}>
      {children}
    </button>
  );
}

const ThemedButton = withTheme(Button);
```

---

## 问题 3：如何实现一个完整的 HOC？

### 基本实现模式

```jsx
// ✅ 完整的 HOC 实现
function withEnhancement(WrappedComponent) {
  // 1. 创建新组件
  function WithEnhancementComponent(props) {
    // 2. 添加额外的逻辑
    const [state, setState] = useState(initialState);
    
    // 3. 处理 props
    const enhancedProps = {
      ...props,
      extraProp: state,
      onExtraAction: () => setState(newState)
    };
    
    // 4. 渲染被包装的组件
    return <WrappedComponent {...enhancedProps} />;
  }
  
  // 5. 设置 displayName（便于调试）
  WithEnhancementComponent.displayName = 
    `WithEnhancement(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  // 6. 复制静态方法
  hoistNonReactStatics(WithEnhancementComponent, WrappedComponent);
  
  // 7. 返回新组件
  return WithEnhancementComponent;
}
```

### Props 代理模式

```jsx
// ✅ Props 代理：操作传入组件的 props
function withPropsProxy(WrappedComponent) {
  return function PropsProxyComponent(props) {
    // 1. 过滤 props
    const { internalProp, ...restProps } = props;
    
    // 2. 添加新 props
    const newProps = {
      ...restProps,
      injectedProp: 'injected value'
    };
    
    // 3. 修改 props
    const modifiedProps = {
      ...newProps,
      onClick: (e) => {
        console.log('Clicked!');
        props.onClick?.(e);
      }
    };
    
    return <WrappedComponent {...modifiedProps} />;
  };
}
```

### 反向继承模式

```jsx
// ✅ 反向继承：继承被包装的组件
function withInheritance(WrappedComponent) {
  return class InheritanceComponent extends WrappedComponent {
    componentDidMount() {
      console.log('Enhanced component mounted');
      // 调用原组件的生命周期
      super.componentDidMount?.();
    }
    
    render() {
      // 可以访问和修改 render 结果
      const renderTree = super.render();
      
      // 修改渲染树
      return (
        <div className="enhanced">
          {renderTree}
        </div>
      );
    }
  };
}

// 注意：反向继承只适用于类组件
```

---

## 问题 4：HOC 的最佳实践和注意事项有哪些？

### 1. 不要在 render 中使用 HOC

```jsx
// ❌ 错误：在 render 中创建 HOC
function Parent() {
  // 每次渲染都会创建新组件，导致整个子树卸载重新挂载
  const EnhancedComponent = withEnhancement(MyComponent);
  return <EnhancedComponent />;
}

// ✅ 正确：在组件外部创建
const EnhancedComponent = withEnhancement(MyComponent);

function Parent() {
  return <EnhancedComponent />;
}
```

### 2. 复制静态方法

```jsx
import hoistNonReactStatics from 'hoist-non-react-statics';

// ❌ 静态方法会丢失
function withEnhancement(WrappedComponent) {
  function Enhanced(props) {
    return <WrappedComponent {...props} />;
  }
  return Enhanced;
}

MyComponent.staticMethod = function() {};
const Enhanced = withEnhancement(MyComponent);
Enhanced.staticMethod; // undefined

// ✅ 复制静态方法
function withEnhancement(WrappedComponent) {
  function Enhanced(props) {
    return <WrappedComponent {...props} />;
  }
  
  hoistNonReactStatics(Enhanced, WrappedComponent);
  return Enhanced;
}
```

### 3. 传递 ref

```jsx
// ❌ ref 不会被传递
const Enhanced = withEnhancement(MyComponent);
<Enhanced ref={ref} /> // ref 指向 Enhanced，而不是 MyComponent

// ✅ 使用 forwardRef
function withEnhancement(WrappedComponent) {
  function Enhanced(props, ref) {
    return <WrappedComponent {...props} ref={ref} />;
  }
  
  return forwardRef(Enhanced);
}
```

### 4. 设置 displayName

```jsx
// ✅ 设置有意义的 displayName
function withEnhancement(WrappedComponent) {
  function Enhanced(props) {
    return <WrappedComponent {...props} />;
  }
  
  Enhanced.displayName = `WithEnhancement(${
    WrappedComponent.displayName || 
    WrappedComponent.name || 
    'Component'
  })`;
  
  return Enhanced;
}

// 在 React DevTools 中会显示为：
// WithEnhancement(MyComponent)
```

### 5. 组合多个 HOC

```jsx
// ✅ 使用 compose 组合多个 HOC
import { compose } from 'redux'; // 或自己实现

const enhance = compose(
  withAuth,
  withLoading,
  withTheme,
  withLogging
);

const EnhancedComponent = enhance(MyComponent);

// 等价于：
const EnhancedComponent = withAuth(
  withLoading(
    withTheme(
      withLogging(MyComponent)
    )
  )
);

// compose 的简单实现
function compose(...funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
```

### 6. 避免 props 命名冲突

```jsx
// ❌ 可能的命名冲突
function withUser(WrappedComponent) {
  return function(props) {
    const user = useCurrentUser();
    // 如果 props 中已经有 user，会被覆盖
    return <WrappedComponent {...props} user={user} />;
  };
}

// ✅ 使用命名空间
function withUser(WrappedComponent) {
  return function(props) {
    const currentUser = useCurrentUser();
    return <WrappedComponent {...props} currentUser={currentUser} />;
  };
}

// ✅ 或者使用对象包装
function withUser(WrappedComponent) {
  return function(props) {
    const user = useCurrentUser();
    return <WrappedComponent {...props} injected={{ user }} />;
  };
}
```

---

## 总结

**核心要点**：

### 1. HOC 的定义

- 接收组件并返回新组件的函数
- 用于复用组件逻辑的设计模式
- 不修改原组件，而是通过组合创建新组件

### 2. 常见使用场景

- 权限控制
- 数据获取
- 日志记录
- 样式增强
- 条件渲染

### 3. 实现模式

- Props 代理：操作 props
- 反向继承：继承组件（仅类组件）
- 组合多个 HOC

### 4. 最佳实践

- 不要在 render 中使用 HOC
- 复制静态方法
- 使用 forwardRef 传递 ref
- 设置 displayName
- 避免 props 命名冲突
- 使用 compose 组合多个 HOC

### 5. HOC vs Hooks

- Hooks 是更现代的代码复用方式
- HOC 仍然有其使用场景
- 可以根据具体情况选择

## 延伸阅读

- [React 官方文档 - Higher-Order Components](https://legacy.reactjs.org/docs/higher-order-components.html)
- [hoist-non-react-statics 库](https://github.com/mridgway/hoist-non-react-statics)
- [Recompose 库](https://github.com/acdlite/recompose)
- [HOC vs Render Props vs Hooks](https://kentcdodds.com/blog/when-to-use-render-props)
