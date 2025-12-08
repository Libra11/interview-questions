---
title: React 组件的生命周期有哪些阶段？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 组件生命周期的三个阶段：挂载、更新和卸载，掌握各阶段的执行时机和常用方法。
tags:
  - React
  - 生命周期
  - Lifecycle
  - 类组件
estimatedTime: 15 分钟
keywords:
  - React lifecycle
  - componentDidMount
  - componentDidUpdate
  - componentWillUnmount
highlight: React 生命周期分为挂载、更新、卸载三个阶段，函数组件用 useEffect 统一处理。
order: 207
---

## 问题 1：生命周期有哪三个阶段？

### 1. 挂载阶段（Mounting）

组件被创建并插入 DOM。

```jsx
class Example extends React.Component {
  constructor(props) {
    super(props);
    // 1. 初始化 state
    this.state = { count: 0 };
  }

  static getDerivedStateFromProps(props, state) {
    // 2. 根据 props 更新 state（少用）
    return null;
  }

  componentDidMount() {
    // 3. 组件已挂载，可以操作 DOM、发请求
    this.fetchData();
  }

  render() {
    // 渲染 UI
    return <div>{this.state.count}</div>;
  }
}
```

### 2. 更新阶段（Updating）

props 或 state 变化时触发。

```jsx
class Example extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 1. 决定是否重新渲染（性能优化）
    return nextState.count !== this.state.count;
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 2. 在 DOM 更新前获取信息（如滚动位置）
    return this.listRef.scrollHeight;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 3. 组件已更新
    if (prevProps.id !== this.props.id) {
      this.fetchData();
    }
  }
}
```

### 3. 卸载阶段（Unmounting）

组件从 DOM 中移除。

```jsx
class Example extends React.Component {
  componentWillUnmount() {
    // 清理工作：取消订阅、清除定时器
    clearInterval(this.timer);
    this.subscription.unsubscribe();
  }
}
```

---

## 问题 2：函数组件如何处理生命周期？

### useEffect 统一处理

```jsx
function Example({ id }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // componentDidMount + componentDidUpdate
    fetchData(id).then(setData);

    // componentWillUnmount
    return () => {
      // 清理
    };
  }, [id]); // 依赖数组

  return <div>{data}</div>;
}
```

### 对应关系

```jsx
// componentDidMount
useEffect(() => {
  console.log("mounted");
}, []);

// componentDidUpdate（监听特定值）
useEffect(() => {
  console.log("id changed");
}, [id]);

// componentWillUnmount
useEffect(() => {
  return () => console.log("unmounted");
}, []);
```

---

## 问题 3：常见的生命周期使用场景？

### 数据获取

```jsx
// 类组件
componentDidMount() {
  fetch('/api/data').then(res => this.setState({ data: res }));
}

// 函数组件
useEffect(() => {
  fetch('/api/data').then(res => setData(res));
}, []);
```

### 订阅与清理

```jsx
// 类组件
componentDidMount() {
  this.subscription = eventBus.subscribe(this.handleEvent);
}
componentWillUnmount() {
  this.subscription.unsubscribe();
}

// 函数组件
useEffect(() => {
  const subscription = eventBus.subscribe(handleEvent);
  return () => subscription.unsubscribe();
}, []);
```

### 监听 props 变化

```jsx
// 类组件
componentDidUpdate(prevProps) {
  if (prevProps.userId !== this.props.userId) {
    this.fetchUser(this.props.userId);
  }
}

// 函数组件
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

## 总结

| 阶段 | 类组件方法           | 函数组件                    |
| ---- | -------------------- | --------------------------- |
| 挂载 | componentDidMount    | useEffect(() => {}, [])     |
| 更新 | componentDidUpdate   | useEffect(() => {}, [deps]) |
| 卸载 | componentWillUnmount | useEffect 返回的清理函数    |

## 延伸阅读

- [React 生命周期图谱](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)
- [useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
