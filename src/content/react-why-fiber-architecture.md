---
title: React Reconciler 为何要采用 Fiber 架构
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React 从 Stack Reconciler 迁移到 Fiber Reconciler 的原因。
  Fiber 架构解决了同步渲染的性能问题，为并发特性和更好的用户体验奠定了基础。
tags:
  - React
  - Fiber
  - 架构演进
  - 性能优化
estimatedTime: 22 分钟
keywords:
  - Fiber 架构
  - Stack Reconciler
  - 可中断渲染
  - 并发模式
highlight: Fiber 架构通过可中断的渲染解决了 Stack Reconciler 的性能瓶颈
order: 365
---

## 问题 1：Stack Reconciler 有什么问题？

**Stack Reconciler 使用递归更新，一旦开始就无法中断，导致长时间阻塞主线程**。

### Stack Reconciler 的工作方式

```javascript
// React 15 的递归更新（简化版）
function reconcile(element, container) {
  // 创建或更新 DOM
  const dom = createOrUpdateDOM(element);
  
  // 递归处理子元素
  element.props.children.forEach(child => {
    reconcile(child, dom);  // 必须处理完所有子元素
  });
  
  // 插入到容器
  container.appendChild(dom);
}
```

### 问题演示

```jsx
// 渲染一个大列表
function BigList() {
  const items = new Array(10000).fill(0);
  
  return (
    <ul>
      {items.map((_, i) => (
        <li key={i}>
          <span>Item {i}</span>
          <button>Delete</button>
        </li>
      ))}
    </ul>
  );
}

// 问题：
// 1. 递归创建 10000 个 li 元素
// 2. 整个过程不可中断
// 3. 主线程被阻塞，用户操作无响应
// 4. 可能导致掉帧，页面卡顿
```

### 性能问题

```
浏览器的一帧（16.6ms）：
[JS 执行] [样式计算] [布局] [绘制] [合成]

Stack Reconciler 的问题：
[======== JS 执行 100ms ========] 
                                 ↑ 超过一帧，导致掉帧
                                 ↑ 用户操作被阻塞
```

---

## 问题 2：为什么需要可中断的渲染？

**保持应用的响应性，避免长时间阻塞用户交互**。

### 用户体验的要求

```javascript
// 不同操作的响应时间要求
const ResponseTime = {
  立即响应: 100,      // 用户输入、点击
  流畅动画: 16.6,     // 60fps
  可接受延迟: 1000,   // 数据加载
  后台任务: Infinity  // 不重要的任务
};

// Stack Reconciler 无法区分优先级
// 所有更新都是同步执行，无法满足不同的响应时间要求
```

### 可中断渲染的好处

```jsx
// Fiber 可以中断低优先级任务，优先处理高优先级任务
function App() {
  const [text, setText] = useState('');
  const [list, setList] = useState([]);

  const handleInput = (e) => {
    // 高优先级：立即更新输入框
    setText(e.target.value);
    
    // 低优先级：可以延迟更新列表
    startTransition(() => {
      const newList = generateList(e.target.value);
      setList(newList);
    });
  };

  return (
    <>
      <input value={text} onChange={handleInput} />
      <List items={list} />
    </>
  );
}

// 输入时：
// 1. 立即更新 input（高优先级）
// 2. 如果列表更新还没完成，可以中断
// 3. 优先响应用户输入
// 4. 空闲时再继续更新列表
```

---

## 问题 3：Fiber 如何解决这些问题？

**Fiber 将渲染工作分割成小单元，可以暂停、恢复和优先级调度**。

### 工作单元化

```javascript
// Fiber 的工作方式
function workLoop(deadline) {
  let shouldYield = false;
  
  while (nextUnitOfWork && !shouldYield) {
    // 执行一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    // 检查是否需要让出控制权
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  if (nextUnitOfWork) {
    // 还有工作，继续调度
    requestIdleCallback(workLoop);
  } else {
    // 工作完成，提交更新
    commitRoot();
  }
}
```

### 时间切片

```
Fiber 的时间切片：
[工作5ms] [响应用户] [工作5ms] [响应用户] [工作5ms]
         ↑ 可以处理用户输入
                    ↑ 可以处理用户输入

Stack Reconciler：
[============ 工作 100ms ============]
                                     ↑ 用户操作被阻塞
```

---

## 问题 4：Fiber 如何实现优先级调度？

**通过 Lanes 模型标记不同优先级，高优先级任务可以打断低优先级任务**。

### 优先级分类

```javascript
// 优先级从高到低
const Priority = {
  ImmediatePriority: 1,      // 同步任务，立即执行
  UserBlockingPriority: 2,   // 用户交互，250ms 内执行
  NormalPriority: 3,         // 普通更新，5s 内执行
  LowPriority: 4,            // 低优先级，10s 内执行
  IdlePriority: 5            // 空闲时执行
};
```

### 优先级调度示例

```jsx
function App() {
  const [urgent, setUrgent] = useState(0);
  const [normal, setNormal] = useState(0);

  const handleClick = () => {
    // 高优先级更新（用户交互）
    setUrgent(u => u + 1);
    
    // 低优先级更新
    startTransition(() => {
      setNormal(n => n + 1);
    });
  };

  return (
    <div>
      <button onClick={handleClick}>点击</button>
      <div>紧急: {urgent}</div>
      <div>普通: {normal}</div>
    </div>
  );
}

// 执行过程：
// 1. 点击按钮
// 2. 开始渲染 urgent 更新（高优先级）
// 3. 同时开始渲染 normal 更新（低优先级）
// 4. 如果再次点击，会中断 normal 更新
// 5. 优先完成新的 urgent 更新
// 6. 然后重新开始 normal 更新
```

---

## 问题 5：Fiber 架构带来了哪些新特性？

**并发渲染、Suspense、过渡更新等**。

### Concurrent Mode（并发模式）

```jsx
// 启用并发特性
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### Suspense 数据获取

```jsx
// 组件可以"暂停"等待数据
function ProfilePage({ userId }) {
  const user = use(fetchUser(userId));  // 可能会暂停
  
  return (
    <div>
      <h1>{user.name}</h1>
      <ProfileDetails userId={userId} />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage userId={123} />
    </Suspense>
  );
}

// Stack Reconciler 无法实现这个特性
// 因为无法中断和恢复渲染
```

### useTransition

```jsx
function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    
    // 立即更新输入框
    setQuery(value);
    
    // 延迟更新搜索结果
    startTransition(() => {
      setResults(search(value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results data={results} />
    </>
  );
}
```

### useDeferredValue

```jsx
function App() {
  const [text, setText] = useState('');
  
  // 延迟更新的值
  const deferredText = useDeferredValue(text);

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      {/* 使用延迟的值渲染，不会阻塞输入 */}
      <SlowList text={deferredText} />
    </>
  );
}
```

---

## 问题 6：Fiber 架构的代价是什么？

**增加了复杂度，但带来的收益远大于成本**。

### 复杂度增加

```javascript
// Stack Reconciler：简单的递归
function reconcile(element) {
  // 直接递归处理
  updateDOM(element);
  element.children.forEach(reconcile);
}

// Fiber Reconciler：复杂的状态机
function workLoop() {
  // 需要维护工作状态
  while (workInProgress && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
  
  // 需要处理中断和恢复
  if (workInProgress) {
    scheduleCallback(workLoop);
  } else {
    commitRoot();
  }
}
```

### 内存开销

```javascript
// 双缓存机制需要维护两棵树
const fiberRoot = {
  current: currentTree,        // 当前树
  finishedWork: workInProgressTree  // 工作树
};

// 每个 Fiber 节点都有 alternate 指针
fiber.alternate = otherFiber;

// 但这个开销是值得的：
// 1. 可以快速切换
// 2. 可以复用节点
// 3. 支持中断和恢复
```

### 收益远大于成本

```
成本：
- 代码复杂度增加
- 内存开销增加（双缓存）
- 学习曲线变陡

收益：
- 更好的用户体验
- 支持并发特性
- 更细粒度的控制
- 为未来特性奠定基础
```

---

## 问题 7：Fiber 架构的演进方向是什么？

**持续优化并发能力，探索更多可能性**。

### 已实现的特性

```jsx
// React 18 的并发特性
import {
  useTransition,
  useDeferredValue,
  Suspense,
  startTransition
} from 'react';

// 自动批处理
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 自动合并为一次更新
}

// Streaming SSR
// 服务端可以流式渲染，不需要等待所有数据
```

### 未来的方向

```jsx
// 1. Server Components
// 在服务端渲染，减少客户端 bundle

// 2. Offscreen 组件
// 预渲染不可见的内容
<Offscreen mode="hidden">
  <ExpensiveComponent />
</Offscreen>

// 3. 更智能的调度
// 根据设备性能、网络状况动态调整策略
```

---

## 总结

**核心原因**：

### 1. Stack Reconciler 的问题
- 递归更新，不可中断
- 长时间阻塞主线程
- 无法区分优先级
- 用户体验差

### 2. Fiber 的解决方案
- 工作单元化
- 可中断和恢复
- 优先级调度
- 时间切片

### 3. 带来的新特性
- 并发模式
- Suspense
- useTransition
- useDeferredValue

### 4. 架构优势
- 更好的响应性
- 更流畅的用户体验
- 为未来特性奠定基础

### 5. 演进方向
- Server Components
- Streaming SSR
- Offscreen 渲染
- 更智能的调度

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [React 18 并发特性](https://react.dev/blog/2022/03/29/react-v18)
- [为什么需要 Fiber](https://react.iamkasong.com/preparation/idea.html)
- [Concurrent React 深入解析](https://17.reactjs.org/docs/concurrent-mode-intro.html)
