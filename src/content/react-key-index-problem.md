---
title: React 循环渲染中为什么推荐不用 index 做 key
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入探讨 React 中使用 index 作为 key 的问题，理解 key 的作用机制，以及如何选择合适的 key 值来优化列表渲染性能和避免潜在的 bug。
tags:
  - React
  - Key
  - 列表渲染
  - Diff 算法
estimatedTime: 20 分钟
keywords:
  - React key
  - index 作为 key
  - 列表渲染
  - Diff 算法
highlight: 理解 key 在 React Diff 算法中的核心作用，掌握正确使用 key 的最佳实践
order: 5
---

## 问题 1：React 中 key 的作用是什么？

### key 是 React 识别元素的唯一标识

在 React 中，`key` 是一个特殊的属性，用于帮助 React 识别哪些元素发生了变化、被添加或被移除。它主要在列表渲染时使用。

```jsx
// 列表渲染示例
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### key 在 Diff 算法中的作用

React 使用 Diff 算法来比较新旧虚拟 DOM 树，决定如何高效地更新真实 DOM。key 在这个过程中扮演着关键角色：

1. **快速定位**：通过 key，React 可以快速找到对应的旧节点
2. **复用节点**：相同 key 的节点会被认为是同一个元素，可以复用
3. **减少操作**：避免不必要的 DOM 创建和销毁

```javascript
// React Diff 算法的简化逻辑
function reconcileChildren(oldChildren, newChildren) {
  // 将旧子节点按 key 建立映射
  const oldKeyMap = new Map();
  oldChildren.forEach((child, index) => {
    const key = child.key || index;
    oldKeyMap.set(key, child);
  });
  
  // 遍历新子节点，尝试复用旧节点
  newChildren.forEach(newChild => {
    const oldChild = oldKeyMap.get(newChild.key);
    if (oldChild) {
      // 复用并更新节点
      updateElement(oldChild, newChild);
    } else {
      // 创建新节点
      createElement(newChild);
    }
  });
}
```

---

## 问题 2：使用 index 作为 key 会导致什么问题？

### 问题 1：列表项顺序变化时的错误复用

当列表项的顺序发生变化（如排序、插入、删除）时，使用 index 作为 key 会导致 React 错误地复用组件。

```jsx
// ❌ 使用 index 作为 key
function BadExample() {
  const [items, setItems] = useState(['A', 'B', 'C']);
  
  const handleReverse = () => {
    setItems([...items].reverse());
  };
  
  return (
    <div>
      {items.map((item, index) => (
        // 使用 index 作为 key
        <input key={index} defaultValue={item} />
      ))}
      <button onClick={handleReverse}>反转</button>
    </div>
  );
}

// 问题：点击反转后，input 的值不会跟着变化
// 因为 React 认为 key=0 的元素还是原来那个，只是 props 变了
```

**发生了什么？**

1. 初始渲染：`key=0` 对应 'A'，`key=1` 对应 'B'，`key=2` 对应 'C'
2. 反转后：`key=0` 对应 'C'，`key=1` 对应 'B'，`key=2` 对应 'A'
3. React 认为 `key=0` 的元素没变，只是 `defaultValue` 从 'A' 变成了 'C'
4. 但 `defaultValue` 只在初始化时生效，所以输入框的值不会更新

### 问题 2：组件状态混乱

使用 index 作为 key 时，组件的内部状态可能会被错误地保留或丢失。

```jsx
// ❌ 状态混乱示例
function Counter({ name }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <span>{name}: {count}</span>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

function BadList() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ]);
  
  const removeFirst = () => {
    setUsers(users.slice(1));
  };
  
  return (
    <div>
      {users.map((user, index) => (
        <Counter key={index} name={user.name} />
      ))}
      <button onClick={removeFirst}>删除第一个</button>
    </div>
  );
}

// 问题：删除第一个用户后，原本 Bob 的计数会显示在 Alice 的位置
```

### 问题 3：性能问题

在某些场景下，使用 index 作为 key 反而会导致性能下降。

```jsx
// 在列表头部插入新元素
function insertAtBeginning() {
  // 使用 index 作为 key
  // 旧列表: [A(0), B(1), C(2)]
  // 新列表: [D(0), A(1), B(2), C(3)]
  
  // React 会认为：
  // - key=0: A -> D (需要更新)
  // - key=1: B -> A (需要更新)
  // - key=2: C -> B (需要更新)
  // - key=3: 新建 C
  
  // 实际上只需要新建一个 D 节点即可
}
```

---

## 问题 3：什么时候可以使用 index 作为 key？

虽然不推荐使用 index 作为 key，但在某些特定场景下是可以接受的：

### 安全使用 index 的条件

1. **列表是静态的**：列表项不会被重新排序、添加或删除
2. **列表项没有 id**：数据本身没有唯一标识符
3. **列表项不包含状态**：列表项是纯展示组件，没有内部状态

```jsx
// ✅ 可以使用 index 的场景
function StaticList() {
  // 固定的、不会变化的列表
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  return (
    <ul>
      {weekdays.map((day, index) => (
        <li key={index}>{day}</li>
      ))}
    </ul>
  );
}

// ✅ 纯展示组件
function DisplayList({ items }) {
  return (
    <div>
      {items.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </div>
  );
}
```

---

## 问题 4：如何选择合适的 key 值？

### 最佳实践：使用稳定的唯一标识符

```jsx
// ✅ 使用数据的唯一 ID
function GoodExample({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}

// ✅ 如果没有 ID，可以使用其他唯一属性的组合
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={`${user.email}-${user.name}`}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

### 生成稳定的 key

如果数据本身没有唯一标识符，可以在数据加载时生成：

```javascript
// ✅ 在数据处理时添加唯一 ID
import { nanoid } from 'nanoid';

function processData(rawData) {
  return rawData.map(item => ({
    ...item,
    // 生成唯一 ID
    id: item.id || nanoid()
  }));
}

// 或者使用简单的计数器
let idCounter = 0;
function addId(item) {
  return {
    ...item,
    _id: item.id || `generated-${idCounter++}`
  };
}
```

### 避免在 render 中生成 key

```jsx
// ❌ 不要在 render 中生成随机 key
function BadExample({ items }) {
  return (
    <ul>
      {items.map(item => (
        // 每次渲染都会生成新的 key，导致组件重新创建
        <li key={Math.random()}>{item}</li>
      ))}
    </ul>
  );
}

// ✅ 在数据处理阶段生成稳定的 key
function GoodExample({ items }) {
  // 使用 useMemo 确保 key 稳定
  const itemsWithKeys = useMemo(
    () => items.map((item, index) => ({
      ...item,
      _key: item.id || `item-${index}`
    })),
    [items]
  );
  
  return (
    <ul>
      {itemsWithKeys.map(item => (
        <li key={item._key}>{item.text}</li>
      ))}
    </ul>
  );
}
```

---

## 总结

**核心要点**：

### 1. key 的作用

- 帮助 React 识别元素的唯一性
- 在 Diff 算法中用于快速定位和复用节点
- 提高列表渲染的性能

### 2. 使用 index 的问题

- 列表顺序变化时会导致错误的节点复用
- 组件状态可能会混乱
- 某些场景下反而降低性能

### 3. 选择 key 的原则

- 优先使用数据的唯一 ID
- key 必须在兄弟节点中唯一
- key 应该是稳定的、可预测的
- 避免使用随机数或在 render 中生成 key

### 4. 可以使用 index 的场景

- 列表是静态的，不会改变
- 列表项没有唯一标识符
- 列表项是纯展示组件，无内部状态

## 延伸阅读

- [React 官方文档 - 列表 & Key](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [React 官方文档 - Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [深入理解 React 的 key](https://kentcdodds.com/blog/understanding-reacts-key-prop)
- [为什么不要使用索引作为 key](https://robinpokorny.com/blog/index-as-a-key-is-an-anti-pattern/)
