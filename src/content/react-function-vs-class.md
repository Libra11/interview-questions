---
title: 函数组件与类组件的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 React 函数组件和类组件的差异，理解为什么函数组件成为主流，以及两者在心智模型上的本质区别。
tags:
  - React
  - 函数组件
  - 类组件
  - Hooks
estimatedTime: 15 分钟
keywords:
  - function component
  - class component
  - React hooks
  - component comparison
highlight: 函数组件捕获渲染时的值，类组件总是读取最新的值，这是两者最本质的区别。
order: 463
---

## 问题 1：语法层面有什么区别？

### 类组件

```jsx
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return <button onClick={this.increment}>Count: {this.state.count}</button>;
  }
}
```

### 函数组件

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return <button onClick={increment}>Count: {count}</button>;
}
```

### 对比

| 特性     | 类组件       | 函数组件  |
| -------- | ------------ | --------- |
| 语法     | ES6 class    | 普通函数  |
| 状态     | this.state   | useState  |
| 生命周期 | 生命周期方法 | useEffect |
| this     | 需要绑定     | 不需要    |
| 代码量   | 较多         | 较少      |

---

## 问题 2：心智模型有什么不同？

### 类组件：面向对象

类组件是一个**实例**，有自己的状态和方法。

```jsx
class ProfilePage extends React.Component {
  showMessage = () => {
    // this.props 总是指向最新的 props
    alert("Followed " + this.props.user);
  };

  handleClick = () => {
    setTimeout(this.showMessage, 3000);
  };

  render() {
    return <button onClick={this.handleClick}>Follow</button>;
  }
}
```

### 函数组件：快照

函数组件每次渲染都是一次**函数调用**，捕获当时的 props 和 state。

```jsx
function ProfilePage({ user }) {
  const showMessage = () => {
    // user 是渲染时的值，不会变
    alert("Followed " + user);
  };

  const handleClick = () => {
    setTimeout(showMessage, 3000);
  };

  return <button onClick={handleClick}>Follow</button>;
}
```

### 关键区别演示

```jsx
// 场景：点击按钮后，3秒内切换用户

// 类组件：显示新用户（Dan → Sophie，显示 Sophie）
// 函数组件：显示点击时的用户（Dan → Sophie，显示 Dan）
```

这是因为：

- 类组件通过 `this.props` 读取，`this` 是可变的
- 函数组件通过闭包捕获，值是不变的

---

## 问题 3：生命周期如何对应？

### 类组件生命周期

```jsx
class Example extends React.Component {
  componentDidMount() {
    // 组件挂载后
  }

  componentDidUpdate(prevProps, prevState) {
    // 组件更新后
  }

  componentWillUnmount() {
    // 组件卸载前
  }

  render() {
    return <div />;
  }
}
```

### 函数组件 useEffect

```jsx
function Example() {
  // componentDidMount + componentDidUpdate
  useEffect(() => {
    // 副作用逻辑

    // componentWillUnmount
    return () => {
      // 清理逻辑
    };
  }, [dependencies]);

  return <div />;
}
```

### 对应关系

```jsx
// componentDidMount
useEffect(() => {
  // 只在挂载时执行
}, []);

// componentDidUpdate（监听特定值）
useEffect(() => {
  // props.id 变化时执行
}, [props.id]);

// componentWillUnmount
useEffect(() => {
  return () => {
    // 清理
  };
}, []);
```

---

## 问题 4：为什么函数组件成为主流？

### 1. 代码更简洁

```jsx
// 类组件：需要很多样板代码
class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { on: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState((state) => ({ on: !state.on }));
  }

  render() {
    return (
      <button onClick={this.toggle}>{this.state.on ? "ON" : "OFF"}</button>
    );
  }
}

// 函数组件：简洁明了
function Toggle() {
  const [on, setOn] = useState(false);
  return <button onClick={() => setOn(!on)}>{on ? "ON" : "OFF"}</button>;
}
```

### 2. 逻辑复用更容易

```jsx
// 类组件：需要 HOC 或 render props
const EnhancedComponent = withWindowSize(withTheme(MyComponent));

// 函数组件：自定义 Hook
function MyComponent() {
  const size = useWindowSize();
  const theme = useTheme();
  // ...
}
```

### 3. 避免 this 的困扰

```jsx
// 类组件：this 绑定问题
class Button extends React.Component {
  handleClick() {
    console.log(this); // 可能是 undefined
  }

  render() {
    // 需要绑定 this
    return <button onClick={this.handleClick.bind(this)}>Click</button>;
    // 或使用箭头函数
    return <button onClick={() => this.handleClick()}>Click</button>;
  }
}

// 函数组件：没有 this
function Button() {
  const handleClick = () => {
    console.log("clicked");
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### 4. 更好的代码组织

```jsx
// 类组件：相关逻辑分散在不同生命周期
class ChatRoom extends React.Component {
  componentDidMount() {
    this.subscribe();
    this.fetchMessages();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      this.unsubscribe();
      this.subscribe();
      this.fetchMessages();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }
}

// 函数组件：相关逻辑放在一起
function ChatRoom({ roomId }) {
  // 订阅逻辑
  useEffect(() => {
    const connection = subscribe(roomId);
    return () => connection.unsubscribe();
  }, [roomId]);

  // 获取消息逻辑
  useEffect(() => {
    fetchMessages(roomId);
  }, [roomId]);
}
```

---

## 问题 5：什么时候还需要类组件？

### Error Boundaries

目前只能用类组件实现：

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### 维护旧代码

已有的类组件代码不需要强制迁移，可以逐步重构。

## 总结

**函数组件 vs 类组件**：

### 1. 本质区别

- 类组件：实例，this 可变
- 函数组件：快照，闭包捕获值

### 2. 函数组件优势

- 代码更简洁
- 逻辑复用更容易（自定义 Hook）
- 没有 this 困扰
- 更好的代码组织

### 3. 现状

- 新代码推荐使用函数组件
- Error Boundaries 仍需类组件
- 旧代码可逐步迁移

## 延伸阅读

- [React 官方文档 - 组件](https://react.dev/learn/your-first-component)
- [How Are Function Components Different from Classes?](https://overreacted.io/how-are-function-components-different-from-classes/)
- [React Hooks 介绍](https://react.dev/reference/react/hooks)
