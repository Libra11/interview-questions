---
title: React 为什么引入 Hooks？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 引入 Hooks 的动机，掌握 Hooks 如何解决类组件的痛点问题。
tags:
  - React
  - Hooks
  - 函数组件
  - 代码复用
estimatedTime: 15 分钟
keywords:
  - React Hooks
  - why hooks
  - class component problems
  - logic reuse
highlight: Hooks 解决了类组件中逻辑复用困难、代码分散、this 绑定等问题。
order: 209
---

## 问题 1：类组件有什么痛点？

### 1. 逻辑复用困难

类组件复用逻辑需要 HOC 或 render props，导致"嵌套地狱"。

```jsx
// HOC 嵌套
export default withRouter(withTheme(withAuth(withLoading(MyComponent))));

// DevTools 中的组件树
<WithRouter>
  <WithTheme>
    <WithAuth>
      <WithLoading>
        <MyComponent />
      </WithLoading>
    </WithAuth>
  </WithTheme>
</WithRouter>;
```

### 2. 相关逻辑被分散

同一个功能的代码分散在不同生命周期中。

```jsx
class ChatRoom extends React.Component {
  componentDidMount() {
    this.subscribe(); // 订阅
    this.fetchMessages(); // 获取消息
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      this.unsubscribe(); // 取消订阅
      this.subscribe(); // 重新订阅
      this.fetchMessages();
    }
  }

  componentWillUnmount() {
    this.unsubscribe(); // 清理
  }
}
```

### 3. this 绑定问题

```jsx
class Button extends React.Component {
  handleClick() {
    console.log(this); // undefined
  }

  render() {
    // 需要手动绑定
    return <button onClick={this.handleClick.bind(this)}>Click</button>;
  }
}
```

---

## 问题 2：Hooks 如何解决这些问题？

### 1. 自定义 Hook 实现逻辑复用

```jsx
// 自定义 Hook
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// 使用：简单直接
function MyComponent() {
  const { width, height } = useWindowSize();
  return (
    <div>
      {width} x {height}
    </div>
  );
}
```

### 2. 相关逻辑放在一起

```jsx
function ChatRoom({ roomId }) {
  // 订阅逻辑集中在一起
  useEffect(() => {
    const connection = subscribe(roomId);
    return () => connection.unsubscribe();
  }, [roomId]);

  // 消息获取逻辑集中在一起
  useEffect(() => {
    fetchMessages(roomId);
  }, [roomId]);
}
```

### 3. 没有 this 问题

```jsx
function Button() {
  const handleClick = () => {
    console.log("clicked"); // 正常工作
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 问题 3：Hooks 带来了哪些新能力？

### 状态逻辑共享

```jsx
// 共享表单逻辑
function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const reset = () => setValues(initialValues);

  return { values, handleChange, reset };
}

// 任何组件都可以使用
function LoginForm() {
  const { values, handleChange } = useForm({ email: "", password: "" });
  // ...
}
```

### 更细粒度的代码组织

```jsx
function UserProfile({ userId }) {
  // 用户数据
  const user = useUser(userId);

  // 权限检查
  const canEdit = usePermission("edit", userId);

  // 主题
  const theme = useTheme();

  // 每个关注点独立管理
}
```

## 总结

**Hooks 解决的问题**：

| 问题      | 类组件                | Hooks        |
| --------- | --------------------- | ------------ |
| 逻辑复用  | HOC/render props 嵌套 | 自定义 Hook  |
| 代码组织  | 按生命周期分散        | 按功能聚合   |
| this 绑定 | 需要手动处理          | 不存在       |
| 学习成本  | 需要理解 class        | 只需理解函数 |

## 延伸阅读

- [React Hooks 介绍](https://react.dev/reference/react/hooks)
- [Hooks 动机](https://legacy.reactjs.org/docs/hooks-intro.html#motivation)
