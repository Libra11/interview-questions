---
title: React memo 和 useMemo 有什么区别
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 React.memo 和 useMemo 的区别与使用场景。memo 用于优化组件渲染，
  useMemo 用于缓存计算结果，掌握它们的正确使用方式能够有效提升应用性能。
tags:
  - React
  - 性能优化
  - Hooks
  - Memoization
estimatedTime: 20 分钟
keywords:
  - React.memo
  - useMemo
  - 性能优化
  - 缓存
highlight: memo 缓存组件，useMemo 缓存值，两者解决不同层面的性能问题
order: 106
---

## 问题 1：React.memo 是什么？

**React.memo 是一个高阶组件，用于缓存组件的渲染结果**。

当组件的 props 没有变化时，React.memo 会跳过重新渲染，直接复用上次的渲染结果。

### 基本使用

```jsx
import { memo } from 'react';

// 普通组件
function Child({ name, age }) {
  console.log('Child 渲染');
  return (
    <div>
      <p>姓名: {name}</p>
      <p>年龄: {age}</p>
    </div>
  );
}

// 使用 memo 包裹
const MemoizedChild = memo(Child);

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        点击次数: {count}
      </button>
      {/* props 不变，不会重新渲染 */}
      <MemoizedChild name="张三" age={18} />
    </div>
  );
}
```

### 自定义比较函数

```jsx
const MemoizedChild = memo(Child, (prevProps, nextProps) => {
  // 返回 true 表示 props 相等，不重新渲染
  // 返回 false 表示 props 不等，需要重新渲染
  return prevProps.name === nextProps.name &&
         prevProps.age === nextProps.age;
});
```

---

## 问题 2：useMemo 是什么？

**useMemo 是一个 Hook，用于缓存计算结果**。

只有当依赖项发生变化时，才会重新计算值，否则返回缓存的值。

### 基本使用

```jsx
import { useMemo, useState } from 'react';

function ExpensiveComponent({ items }) {
  const [filter, setFilter] = useState('');

  // 缓存过滤后的结果
  const filteredItems = useMemo(() => {
    console.log('执行过滤计算');
    return items.filter(item => 
      item.name.includes(filter)
    );
  }, [items, filter]); // 依赖项

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 缓存对象引用

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新对象
  const config = { theme: 'dark', lang: 'zh' };

  // ✅ 使用 useMemo 缓存对象
  const config = useMemo(() => ({
    theme: 'dark',
    lang: 'zh'
  }), []); // 空依赖，永远返回同一个对象

  return <Child config={config} />;
}
```

---

## 问题 3：memo 和 useMemo 的核心区别是什么？

**memo 缓存组件，useMemo 缓存值**。

### 对比表格

| 特性 | React.memo | useMemo |
|------|-----------|---------|
| 类型 | 高阶组件 | Hook |
| 缓存对象 | 组件渲染结果 | 计算值 |
| 使用位置 | 组件外部 | 组件内部 |
| 返回值 | 组件 | 任意值 |
| 比较方式 | props 浅比较 | 依赖项比较 |

### 使用场景对比

```jsx
// React.memo - 缓存整个组件
const ExpensiveChild = memo(function Child({ data }) {
  // 复杂的渲染逻辑
  return <div>{/* ... */}</div>;
});

function Parent() {
  // useMemo - 缓存计算结果
  const processedData = useMemo(() => {
    // 复杂的计算
    return data.map(/* ... */);
  }, [data]);

  return <ExpensiveChild data={processedData} />;
}
```

---

## 问题 4：什么时候使用 React.memo？

**当组件经常因为父组件重新渲染而重新渲染，但 props 很少变化时使用**。

### 适合使用 memo 的场景

```jsx
// 列表项组件 - props 很少变化
const ListItem = memo(function ListItem({ item }) {
  return (
    <div className="item">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
});

function List({ items }) {
  const [filter, setFilter] = useState('');

  return (
    <div>
      <input onChange={e => setFilter(e.target.value)} />
      {items.map(item => (
        // 即使 List 重新渲染，ListItem 也不会重新渲染
        <ListItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### 不适合使用 memo 的场景

```jsx
// ❌ props 频繁变化，memo 没有意义
const Counter = memo(function Counter({ count }) {
  return <div>{count}</div>;
});

function App() {
  const [count, setCount] = useState(0);

  // count 每次都变化，memo 无效
  return <Counter count={count} />;
}
```

---

## 问题 5：什么时候使用 useMemo？

**当计算开销大，且依赖项不常变化时使用**。

### 适合使用 useMemo 的场景

```jsx
function DataTable({ data }) {
  // 复杂的数据处理
  const processedData = useMemo(() => {
    console.log('处理数据');
    return data
      .filter(item => item.active)
      .map(item => ({
        ...item,
        displayName: `${item.firstName} ${item.lastName}`
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [data]); // 只有 data 变化时才重新计算

  return (
    <table>
      {processedData.map(item => (
        <tr key={item.id}>
          <td>{item.displayName}</td>
        </tr>
      ))}
    </table>
  );
}
```

### 不适合使用 useMemo 的场景

```jsx
// ❌ 简单计算，不需要 useMemo
function Component({ a, b }) {
  // 过度优化
  const sum = useMemo(() => a + b, [a, b]);
  
  // 直接计算即可
  const sum = a + b;
  
  return <div>{sum}</div>;
}
```

---

## 问题 6：memo 和 useMemo 如何配合使用？

**配合使用可以实现更好的性能优化**。

### 完整示例

```jsx
import { memo, useMemo, useState } from 'react';

// 使用 memo 缓存组件
const ExpensiveChild = memo(function Child({ config, data }) {
  console.log('Child 渲染');
  
  return (
    <div style={{ color: config.color }}>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});

function Parent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', active: true },
    { id: 2, name: 'Item 2', active: false },
    { id: 3, name: 'Item 3', active: true }
  ]);

  // 使用 useMemo 缓存配置对象
  const config = useMemo(() => ({
    color: 'blue',
    fontSize: 14
  }), []); // 配置不变

  // 使用 useMemo 缓存过滤后的数据
  const activeItems = useMemo(() => {
    console.log('过滤数据');
    return items.filter(item => item.active);
  }, [items]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        点击次数: {count}
      </button>
      {/* 
        count 变化时，Parent 重新渲染
        但 config 和 activeItems 没变，Child 不会重新渲染
      */}
      <ExpensiveChild config={config} data={activeItems} />
    </div>
  );
}
```

---

## 问题 7：使用时需要注意什么？

**不要过度优化，要权衡优化成本和收益**。

### 常见陷阱

```jsx
// ❌ 陷阱1：传递新的对象/函数
const MemoChild = memo(Child);

function Parent() {
  return (
    <MemoChild
      // 每次都是新对象，memo 失效
      config={{ theme: 'dark' }}
      // 每次都是新函数，memo 失效
      onClick={() => console.log('click')}
    />
  );
}

// ✅ 正确做法
function Parent() {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return (
    <MemoChild config={config} onClick={handleClick} />
  );
}
```

### 何时不需要优化

```jsx
// 不需要优化的情况：
// 1. 组件很简单
function Simple({ text }) {
  return <div>{text}</div>; // 不需要 memo
}

// 2. props 总是变化
function Counter({ count }) {
  return <div>{count}</div>; // 不需要 memo
}

// 3. 计算很简单
function Component({ a, b }) {
  const sum = a + b; // 不需要 useMemo
  return <div>{sum}</div>;
}
```

---

## 总结

**核心区别**：

### 1. 本质不同
- `React.memo`: 高阶组件，缓存组件
- `useMemo`: Hook，缓存值

### 2. 使用位置
- `React.memo`: 包裹组件外部
- `useMemo`: 在组件内部使用

### 3. 使用场景
- `React.memo`: 避免不必要的组件渲染
- `useMemo`: 避免重复的复杂计算

### 4. 配合使用
- 用 `useMemo` 缓存传给 `memo` 组件的 props
- 避免引用类型 props 导致 memo 失效

### 5. 注意事项
- 不要过度优化
- 简单组件和计算不需要优化
- 注意对象和函数的引用问题

## 延伸阅读

- [React.memo 官方文档](https://react.dev/reference/react/memo)
- [useMemo 官方文档](https://react.dev/reference/react/useMemo)
- [React 性能优化指南](https://react.dev/learn/render-and-commit)
- [何时使用 useMemo](https://kentcdodds.com/blog/usememo-and-usecallback)
