---
title: React Fiber 数据结构能否简单画出来？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  通过图示理解 Fiber 节点的数据结构和树形关系。
tags:
  - React
  - Fiber
  - 数据结构
  - 源码
estimatedTime: 12 分钟
keywords:
  - Fiber structure
  - Fiber tree
  - Fiber node
  - React internals
highlight: Fiber 是链表结构，每个节点包含 child、sibling、return 指针，形成可遍历的树。
order: 662
---

## 问题 1：Fiber 节点结构

### 核心属性图示

```
┌─────────────────────────────────────────┐
│              FiberNode                   │
├─────────────────────────────────────────┤
│  tag: number          // 节点类型        │
│  type: any            // 组件类型        │
│  key: string | null   // key 属性        │
├─────────────────────────────────────────┤
│  child: Fiber | null  // 第一个子节点    │
│  sibling: Fiber | null // 下一个兄弟     │
│  return: Fiber | null // 父节点          │
├─────────────────────────────────────────┤
│  stateNode: any       // DOM 节点/实例   │
│  memoizedState: any   // 当前 state      │
│  memoizedProps: any   // 当前 props      │
├─────────────────────────────────────────┤
│  flags: number        // 副作用标记      │
│  alternate: Fiber     // 双缓冲对应节点  │
└─────────────────────────────────────────┘
```

---

## 问题 2：Fiber 树结构

### 组件树示例

```jsx
function App() {
  return (
    <div>
      <Header />
      <Main>
        <Article />
        <Sidebar />
      </Main>
    </div>
  );
}
```

### 对应的 Fiber 树

```
                    ┌─────────┐
                    │   App   │
                    └────┬────┘
                         │ child
                    ┌────▼────┐
                    │   div   │
                    └────┬────┘
                         │ child
                    ┌────▼────┐         ┌─────────┐
                    │ Header  │─sibling─▶│  Main   │
                    └─────────┘         └────┬────┘
                                             │ child
                                        ┌────▼────┐         ┌─────────┐
                                        │ Article │─sibling─▶│ Sidebar │
                                        └─────────┘         └─────────┘
```

### 链表关系

```
App
 │
 ├── child ──────▶ div
 │                  │
 │                  ├── child ──────▶ Header
 │                  │                   │
 │                  │                   └── sibling ──▶ Main
 │                  │                                    │
 │                  │                                    ├── child ──▶ Article
 │                  │                                    │              │
 │                  │                                    │              └── sibling ──▶ Sidebar
 │                  │                                    │
 │                  │                                    └── return ──▶ div
 │                  │
 │                  └── return ──▶ App
 │
 └── return ──▶ null (根节点)
```

---

## 问题 3：双缓冲结构

### current 和 workInProgress

```
        current 树                    workInProgress 树
        (当前显示)                      (正在构建)

     ┌─────────┐                    ┌─────────┐
     │   App   │◄───alternate──────▶│   App   │
     └────┬────┘                    └────┬────┘
          │                              │
     ┌────▼────┐                    ┌────▼────┐
     │   div   │◄───alternate──────▶│   div   │
     └────┬────┘                    └────┬────┘
          │                              │
     ┌────▼────┐                    ┌────▼────┐
     │ Header  │◄───alternate──────▶│ Header  │
     └─────────┘                    └─────────┘
```

### 更新流程

```
1. 基于 current 构建 workInProgress
2. 在 workInProgress 上进行修改
3. 完成后，workInProgress 变成新的 current
4. 原 current 变成下次的 workInProgress 基础
```

---

## 问题 4：遍历顺序

### 深度优先遍历

```
遍历顺序：App → div → Header → Main → Article → Sidebar

     ┌─────────┐
  1  │   App   │
     └────┬────┘
          │
     ┌────▼────┐
  2  │   div   │
     └────┬────┘
          │
     ┌────▼────┐         ┌─────────┐
  3  │ Header  │────────▶│  Main   │ 4
     └─────────┘         └────┬────┘
                              │
                         ┌────▼────┐         ┌─────────┐
                      5  │ Article │────────▶│ Sidebar │ 6
                         └─────────┘         └─────────┘
```

### 遍历代码

```javascript
function traverse(fiber) {
  // 1. 处理当前节点
  console.log(fiber.type);

  // 2. 有子节点，先处理子节点
  if (fiber.child) {
    traverse(fiber.child);
  }

  // 3. 有兄弟节点，处理兄弟
  if (fiber.sibling) {
    traverse(fiber.sibling);
  }
}
```

---

## 问题 5：Hooks 链表

### useState 链表结构

```jsx
function Component() {
  const [count, setCount] = useState(0); // Hook 1
  const [name, setName] = useState(""); // Hook 2
  const ref = useRef(null); // Hook 3

  useEffect(() => {}, []); // Hook 4
}
```

### 链表图示

```
Fiber.memoizedState
        │
        ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ useState│────▶│ useState│────▶│  useRef │────▶│useEffect│
   │ count=0 │     │ name='' │     │ ref=null│     │ effect  │
   └─────────┘     └─────────┘     └─────────┘     └─────────┘
       next            next            next            next
```

## 总结

| 结构          | 说明               |
| ------------- | ------------------ |
| child         | 指向第一个子节点   |
| sibling       | 指向下一个兄弟节点 |
| return        | 指向父节点         |
| alternate     | 指向双缓冲对应节点 |
| memoizedState | Hooks 链表头       |

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
