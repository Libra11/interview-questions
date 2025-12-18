---
title: React.FC 的缺点？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  了解 React.FC 类型的缺点，掌握更好的组件类型定义方式。
tags:
  - React
  - TypeScript
  - React.FC
  - 类型定义
estimatedTime: 10 分钟
keywords:
  - React.FC drawbacks
  - FunctionComponent
  - TypeScript React
  - component typing
highlight: React.FC 的缺点：隐式 children、泛型支持差、defaultProps 问题。推荐直接声明 props 类型。
order: 641
---

## 问题 1：什么是 React.FC？

### 基本用法

```tsx
import { FC } from "react";

interface Props {
  name: string;
}

const Greeting: FC<Props> = ({ name }) => {
  return <h1>Hello, {name}</h1>;
};
```

### FC 的定义

```tsx
type FC<P = {}> = FunctionComponent<P>;

interface FunctionComponent<P = {}> {
  (props: P): ReactElement | null;
  displayName?: string;
  defaultProps?: Partial<P>;
}
```

---

## 问题 2：缺点一：隐式 children

### 问题

```tsx
// React 17 及之前，FC 自动包含 children
interface Props {
  name: string;
}

const Greeting: FC<Props> = ({ name, children }) => {
  return <h1>Hello, {name}</h1>;
};

// 即使没有声明 children，也可以传递
<Greeting name="John">
  <span>这不应该被允许</span>
</Greeting>;
```

### React 18 的改变

```tsx
// React 18 移除了隐式 children
// 现在需要显式声明
interface Props {
  name: string;
  children?: React.ReactNode; // 需要显式声明
}
```

---

## 问题 3：缺点二：泛型组件支持差

### 问题

```tsx
// ❌ 使用 FC 无法创建泛型组件
const List: FC<ListProps<T>> = ({ items }) => {
  // T 从哪来？
  // ...
};

// ✅ 不使用 FC，可以正常创建泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

---

## 问题 4：缺点三：defaultProps 问题

### 问题

```tsx
interface Props {
  name: string;
  age?: number;
}

// FC 与 defaultProps 配合不好
const Person: FC<Props> = ({ name, age }) => {
  return (
    <div>
      {name} - {age}
    </div>
  );
};

Person.defaultProps = {
  age: 18,
};

// TypeScript 仍然认为 age 可能是 undefined
```

### 推荐方式

```tsx
// 使用解构默认值
function Person({ name, age = 18 }: Props) {
  return (
    <div>
      {name} - {age}
    </div>
  );
}
// age 的类型是 number，不是 number | undefined
```

---

## 问题 5：推荐的写法

### 直接声明 props 类型

```tsx
interface Props {
  name: string;
  age?: number;
  children?: React.ReactNode;
}

// ✅ 推荐：直接声明 props 类型
function Greeting({ name, age = 18, children }: Props) {
  return (
    <div>
      <h1>Hello, {name}</h1>
      <p>Age: {age}</p>
      {children}
    </div>
  );
}

// 或者使用箭头函数
const Greeting = ({ name, age = 18, children }: Props) => {
  return (
    <div>
      <h1>Hello, {name}</h1>
      <p>Age: {age}</p>
      {children}
    </div>
  );
};
```

### 需要返回类型时

```tsx
// 如果需要显式返回类型
function Greeting({ name }: Props): JSX.Element {
  return <h1>Hello, {name}</h1>;
}

// 或
function Greeting({ name }: Props): React.ReactElement {
  return <h1>Hello, {name}</h1>;
}
```

---

## 问题 6：FC 的优点

### 仍然有用的场景

```tsx
// 1. 需要 displayName
const Greeting: FC<Props> = ({ name }) => <h1>{name}</h1>;
Greeting.displayName = "Greeting";

// 2. 团队规范要求
// 有些团队仍然使用 FC 保持一致性

// 3. 明确表示是 React 组件
// FC 类型让代码意图更清晰
```

## 总结

| 方面         | React.FC                 | 直接声明       |
| ------------ | ------------------------ | -------------- |
| children     | 需要显式声明（React 18） | 需要显式声明   |
| 泛型         | 不支持                   | 支持           |
| defaultProps | 支持差                   | 使用解构默认值 |
| 简洁性       | 稍繁琐                   | 简洁           |

**推荐**：直接声明 props 类型，不使用 React.FC。

## 延伸阅读

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components)
