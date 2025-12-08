---
title: componentDidMount 与 componentDidUpdate 的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 componentDidMount 和 componentDidUpdate 的执行时机和使用场景，理解两者在数据获取和副作用处理中的差异。
tags:
  - React
  - 生命周期
  - componentDidMount
  - componentDidUpdate
estimatedTime: 12 分钟
keywords:
  - componentDidMount
  - componentDidUpdate
  - lifecycle methods
  - side effects
highlight: componentDidMount 只在首次挂载后执行一次，componentDidUpdate 在每次更新后执行。
order: 208
---

## 问题 1：执行时机有什么不同？

### componentDidMount

**只执行一次**，在组件首次渲染并插入 DOM 后调用。

```jsx
class UserProfile extends React.Component {
  componentDidMount() {
    console.log("组件已挂载");
    // 适合：初始数据获取、订阅、DOM 操作
    this.fetchUser(this.props.userId);
  }
}
```

### componentDidUpdate

**每次更新后执行**，首次渲染不会调用。

```jsx
class UserProfile extends React.Component {
  componentDidUpdate(prevProps, prevState) {
    console.log("组件已更新");
    // 适合：响应 props/state 变化
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser(this.props.userId);
    }
  }
}
```

---

## 问题 2：参数有什么不同？

### componentDidMount

没有参数，因为是首次渲染，没有"之前"的状态。

```jsx
componentDidMount() {
  // 直接使用 this.props 和 this.state
}
```

### componentDidUpdate

接收三个参数：

```jsx
componentDidUpdate(prevProps, prevState, snapshot) {
  // prevProps: 更新前的 props
  // prevState: 更新前的 state
  // snapshot: getSnapshotBeforeUpdate 的返回值

  if (prevProps.id !== this.props.id) {
    // props 变化了
  }

  if (prevState.count !== this.state.count) {
    // state 变化了
  }
}
```

---

## 问题 3：常见使用模式？

### 数据获取

```jsx
class UserProfile extends React.Component {
  state = { user: null };

  componentDidMount() {
    // 首次加载
    this.fetchUser(this.props.userId);
  }

  componentDidUpdate(prevProps) {
    // userId 变化时重新获取
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser(this.props.userId);
    }
  }

  fetchUser(id) {
    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then((user) => this.setState({ user }));
  }
}
```

### 函数组件等价写法

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 同时处理 mount 和 update
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setUser);
  }, [userId]); // userId 变化时重新执行
}
```

---

## 问题 4：componentDidUpdate 的注意事项？

### 避免无限循环

```jsx
// ❌ 错误：会无限循环
componentDidUpdate() {
  this.setState({ count: this.state.count + 1 });
}

// ✅ 正确：添加条件判断
componentDidUpdate(prevProps) {
  if (prevProps.id !== this.props.id) {
    this.setState({ data: null });
    this.fetchData();
  }
}
```

### 与 getSnapshotBeforeUpdate 配合

```jsx
class ScrollingList extends React.Component {
  listRef = React.createRef();

  getSnapshotBeforeUpdate(prevProps) {
    // 在 DOM 更新前捕获滚动位置
    if (prevProps.items.length < this.props.items.length) {
      return this.listRef.current.scrollHeight;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 使用 snapshot 恢复滚动位置
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }
}
```

## 总结

| 特性     | componentDidMount | componentDidUpdate             |
| -------- | ----------------- | ------------------------------ |
| 执行次数 | 一次              | 每次更新                       |
| 首次渲染 | ✅ 执行           | ❌ 不执行                      |
| 参数     | 无                | prevProps, prevState, snapshot |
| 用途     | 初始化            | 响应变化                       |

## 延伸阅读

- [React 生命周期图谱](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)
- [componentDidUpdate 文档](https://legacy.reactjs.org/docs/react-component.html#componentdidupdate)
