---
title: 如何实现虚拟列表（virtual list）？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  掌握虚拟列表的原理和实现方法，优化大列表渲染性能。
tags:
  - React
  - 虚拟列表
  - 性能优化
  - 列表
estimatedTime: 15 分钟
keywords:
  - virtual list
  - virtualization
  - react-window
  - performance
highlight: 虚拟列表只渲染可视区域的元素，通过计算滚动位置动态更新显示内容，大幅提升性能。
order: 297
---

## 问题 1：虚拟列表的原理

### 核心思想

```jsx
// 传统列表：渲染所有元素
// 10000 条数据 → 10000 个 DOM 节点 → 卡顿

// 虚拟列表：只渲染可见元素
// 10000 条数据 → 只渲染可见的 20 个 → 流畅

// 原理：
// 1. 计算可视区域能显示多少条
// 2. 根据滚动位置计算显示哪些条目
// 3. 只渲染这些条目
// 4. 用 padding 或 transform 模拟完整高度
```

### 示意图

```
┌─────────────────┐
│   padding-top   │  ← 上方不可见区域的高度
├─────────────────┤
│    Item 10      │  ←
│    Item 11      │  ← 可视区域
│    Item 12      │  ← 只渲染这些
│    Item 13      │  ←
├─────────────────┤
│  padding-bottom │  ← 下方不可见区域的高度
└─────────────────┘
```

---

## 问题 2：简单实现

### 固定高度虚拟列表

```jsx
function VirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见范围
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  // 计算偏移
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  // 获取可见项
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 问题 3：使用 react-window

### 固定高度列表

```jsx
import { FixedSizeList } from "react-window";

function List({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 动态高度列表

```jsx
import { VariableSizeList } from "react-window";

function List({ items }) {
  const listRef = useRef();

  // 获取每项高度
  const getItemSize = (index) => {
    return items[index].height || 50;
  };

  const Row = ({ index, style }) => (
    <div style={style}>{items[index].content}</div>
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

---

## 问题 4：使用 react-virtualized

### AutoSizer + List

```jsx
import { AutoSizer, List } from "react-virtualized";

function VirtualizedList({ items }) {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      {items[index].name}
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={items.length}
          rowHeight={50}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
}
```

### 虚拟表格

```jsx
import { Table, Column, AutoSizer } from "react-virtualized";

function VirtualTable({ data }) {
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Table
          height={height}
          width={width}
          rowHeight={50}
          headerHeight={60}
          rowCount={data.length}
          rowGetter={({ index }) => data[index]}
        >
          <Column label="Name" dataKey="name" width={200} />
          <Column label="Email" dataKey="email" width={300} />
        </Table>
      )}
    </AutoSizer>
  );
}
```

---

## 问题 5：高级功能

### 无限滚动 + 虚拟列表

```jsx
import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

function InfiniteVirtualList({ items, loadMore, hasMore }) {
  const itemCount = hasMore ? items.length + 1 : items.length;

  const isItemLoaded = (index) => !hasMore || index < items.length;

  const Row = ({ index, style }) => {
    if (!isItemLoaded(index)) {
      return <div style={style}>Loading...</div>;
    }
    return <div style={style}>{items[index].name}</div>;
  };

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMore}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          ref={ref}
          height={400}
          itemCount={itemCount}
          itemSize={50}
          onItemsRendered={onItemsRendered}
        >
          {Row}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
}
```

### 动态测量高度

```jsx
import { VariableSizeList } from "react-window";

function DynamicList({ items }) {
  const listRef = useRef();
  const sizeMap = useRef({});

  const setSize = (index, size) => {
    sizeMap.current[index] = size;
    listRef.current?.resetAfterIndex(index);
  };

  const getSize = (index) => sizeMap.current[index] || 50;

  const Row = ({ index, style }) => {
    const rowRef = useRef();

    useEffect(() => {
      if (rowRef.current) {
        setSize(index, rowRef.current.getBoundingClientRect().height);
      }
    }, [index]);

    return (
      <div style={style}>
        <div ref={rowRef}>{items[index].content}</div>
      </div>
    );
  };

  return (
    <VariableSizeList
      ref={listRef}
      height={400}
      itemCount={items.length}
      itemSize={getSize}
    >
      {Row}
    </VariableSizeList>
  );
}
```

## 总结

| 库                | 特点             |
| ----------------- | ---------------- |
| react-window      | 轻量，推荐       |
| react-virtualized | 功能丰富，体积大 |
| 自己实现          | 完全可控，复杂   |

**选择建议**：大多数场景使用 react-window。

## 延伸阅读

- [react-window](https://github.com/bvaughn/react-window)
- [react-virtualized](https://github.com/bvaughn/react-virtualized)
