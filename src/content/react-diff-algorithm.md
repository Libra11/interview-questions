---
title: React Diff 算法
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Diff 算法的工作原理和优化策略。Diff 算法是 React 高效更新 DOM 的核心，
  通过三个策略将复杂度从 O(n³) 降低到 O(n)。
tags:
  - React
  - Diff 算法
  - 虚拟 DOM
  - 性能优化
estimatedTime: 26 分钟
keywords:
  - React Diff
  - 虚拟 DOM
  - key 属性
  - 协调算法
highlight: React Diff 通过树层级、组件类型和 key 三个策略实现 O(n) 复杂度
order: 351
---

## 问题 1：什么是 Diff 算法？

**Diff 算法用于比较新旧虚拟 DOM 树，找出需要更新的最小变更集**。

传统的树 diff 算法复杂度是 O(n³)，React 通过三个策略将复杂度降低到 O(n)。

### 三大策略

```
1. 树层级策略（Tree Diff）
   - 只比较同层级节点
   - 跨层级移动视为删除+创建

2. 组件策略（Component Diff）
   - 相同类型组件，继续比较虚拟 DOM
   - 不同类型组件，直接替换

3. 元素策略（Element Diff）
   - 使用 key 标识元素
   - 优化列表渲染
```

---

## 问题 2：树层级 Diff 如何工作？

**React 只比较同层级的节点，不会跨层级比较**。

### 同层级比较

```jsx
// 旧树
<div>
  <A />
  <B />
</div>

// 新树
<div>
  <B />
  <C />
</div>

// Diff 过程：
// 1. 比较 div 节点 - 相同，保留
// 2. 比较第一个子节点：A vs B - 不同，删除 A，创建 B
// 3. 比较第二个子节点：B vs C - 不同，删除 B，创建 C
```

### 跨层级移动的处理

```jsx
// 旧树
<div>
  <A>
    <B />
  </A>
</div>

// 新树
<div>
  <B />
</div>

// React 的处理：
// 1. 删除 A 及其子树（包括 B）
// 2. 创建新的 B

// 注意：不会识别出 B 只是移动了位置
// 这是为了保持算法简单和高效
```

---

## 问题 3：组件 Diff 如何工作？

**相同类型的组件继续比较，不同类型的组件直接替换**。

### 相同类型组件

```jsx
// 旧组件
<Counter count={1} />

// 新组件
<Counter count={2} />

// Diff 过程：
// 1. 组件类型相同（都是 Counter）
// 2. 保留组件实例
// 3. 更新 props（count: 1 -> 2）
// 4. 触发组件更新
```

### 不同类型组件

```jsx
// 旧组件
<div>
  <A />
</div>

// 新组件
<div>
  <B />
</div>

// Diff 过程：
// 1. 组件类型不同（A vs B）
// 2. 卸载 A 组件
// 3. 挂载 B 组件
// 4. 不会比较 A 和 B 的子树
```

### shouldComponentUpdate 优化

```jsx
class MyComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 返回 false 可以跳过 diff
    return this.props.value !== nextProps.value;
  }

  render() {
    return <div>{this.props.value}</div>;
  }
}

// 使用 React.memo 实现相同效果
const MyComponent = React.memo(function MyComponent({ value }) {
  return <div>{value}</div>;
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});
```

---

## 问题 4：元素 Diff（列表 Diff）如何工作？

**使用 key 来标识列表中的元素，优化插入、删除和移动操作**。

### 没有 key 的情况

```jsx
// 旧列表
<ul>
  <li>A</li>
  <li>B</li>
</ul>

// 新列表
<ul>
  <li>C</li>
  <li>A</li>
  <li>B</li>
</ul>

// 没有 key 的 Diff：
// 1. 第一个 li: A -> C（更新文本）
// 2. 第二个 li: B -> A（更新文本）
// 3. 新增第三个 li: B
// 结果：3 次操作（2 次更新 + 1 次插入）
```

### 有 key 的情况

```jsx
// 旧列表
<ul>
  <li key="a">A</li>
  <li key="b">B</li>
</ul>

// 新列表
<ul>
  <li key="c">C</li>
  <li key="a">A</li>
  <li key="b">B</li>
</ul>

// 有 key 的 Diff：
// 1. 识别出 key="a" 和 key="b" 的元素已存在，移动位置
// 2. 新增 key="c" 的元素
// 结果：1 次操作（1 次插入）
```

---

## 问题 5：Diff 算法的具体实现是什么？

**React 使用双指针和 Map 来高效地进行列表 Diff**。

### 简化的 Diff 实现

```javascript
function reconcileChildrenArray(
  returnFiber,
  currentFirstChild,
  newChildren
) {
  let resultingFirstChild = null;
  let previousNewFiber = null;
  
  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  
  // 第一轮遍历：处理更新的节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    
    // 尝试复用节点
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx]
    );
    
    if (newFiber === null) {
      // key 不同，跳出第一轮遍历
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    
    if (oldFiber && newFiber.alternate === null) {
      // 没有复用，删除旧节点
      deleteChild(returnFiber, oldFiber);
    }
    
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }
  
  // 新节点已经遍历完，删除剩余的旧节点
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }
  
  // 旧节点已经遍历完，创建剩余的新节点
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }
  
  // 将剩余的旧节点放入 Map
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
  
  // 第二轮遍历：处理移动的节点
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx]
    );
    
    if (newFiber !== null) {
      if (newFiber.alternate !== null) {
        // 复用了节点，从 Map 中删除
        existingChildren.delete(
          newFiber.key === null ? newIdx : newFiber.key
        );
      }
      
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }
  
  // 删除 Map 中剩余的节点
  existingChildren.forEach(child => deleteChild(returnFiber, child));
  
  return resultingFirstChild;
}
```

---

## 问题 6：为什么不建议用 index 作为 key？

**使用 index 作为 key 会导致性能问题和状态错乱**。

### 性能问题

```jsx
// 使用 index 作为 key
const list = ['A', 'B', 'C'];

// 旧列表
{list.map((item, index) => (
  <li key={index}>{item}</li>
))}
// <li key="0">A</li>
// <li key="1">B</li>
// <li key="2">C</li>

// 在头部插入 'D'
const newList = ['D', 'A', 'B', 'C'];

// 新列表
{newList.map((item, index) => (
  <li key={index}>{item}</li>
))}
// <li key="0">D</li>
// <li key="1">A</li>
// <li key="2">B</li>
// <li key="3">C</li>

// Diff 结果：
// key="0": A -> D（更新）
// key="1": B -> A（更新）
// key="2": C -> B（更新）
// key="3": 新增 C
// 结果：4 次操作（3 次更新 + 1 次插入）

// 如果使用唯一 ID 作为 key：
// 只需要 1 次操作（1 次插入）
```

### 状态错乱问题

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false },
    { id: 2, text: 'Learn Vue', done: false }
  ]);

  // ❌ 使用 index 作为 key
  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem key={index} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <li>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => setChecked(e.target.checked)}
      />
      {todo.text}
    </li>
  );
}

// 问题：
// 1. 勾选第一项
// 2. 删除第一项
// 3. 第二项会被勾选（因为它现在的 key 是 0）
```

---

## 问题 7：Diff 算法的优化建议有哪些？

**合理使用 key、避免跨层级移动、使用 memo 等**。

### 使用稳定的 key

```jsx
// ✅ 使用唯一 ID
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ 使用 index
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ❌ 使用随机值
{items.map(item => (
  <Item key={Math.random()} data={item} />
))}
```

### 避免跨层级移动

```jsx
// ❌ 跨层级移动
<div>
  {showA && <A><B /></A>}
  {!showA && <B />}
</div>

// ✅ 保持层级稳定
<div>
  {showA ? (
    <A><B /></A>
  ) : (
    <div><B /></div>
  )}
</div>
```

### 使用 React.memo

```jsx
// 避免不必要的 diff
const ListItem = React.memo(function ListItem({ item }) {
  return <div>{item.name}</div>;
});

function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
```

---

## 总结

**核心策略**：

### 1. 树层级策略
- 只比较同层级节点
- 跨层级移动视为删除+创建
- 复杂度从 O(n³) 降到 O(n)

### 2. 组件策略
- 相同类型组件继续 diff
- 不同类型组件直接替换
- 使用 shouldComponentUpdate 优化

### 3. 元素策略
- 使用 key 标识元素
- 优化列表的插入、删除、移动
- 双指针 + Map 实现

### 4. key 的使用
- 使用稳定的唯一 ID
- 不使用 index
- 不使用随机值

### 5. 优化建议
- 保持 DOM 结构稳定
- 避免跨层级移动
- 使用 memo 减少 diff

## 延伸阅读

- [React Reconciliation 官方文档](https://react.dev/learn/preserving-and-resetting-state)
- [React Diff 算法详解](https://react.iamkasong.com/diff/prepare.html)
- [深入理解 React Diff](https://zhuanlan.zhihu.com/p/20346379)
- [React 源码 - Diff 实现](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.js)
