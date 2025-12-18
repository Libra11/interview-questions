---
title: React 中如何定义组件 Props 类型？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握在 TypeScript 中定义 React 组件 Props 类型的各种方式。
tags:
  - React
  - TypeScript
  - Props
  - 类型定义
estimatedTime: 10 分钟
keywords:
  - React Props type
  - TypeScript React
  - component props
  - type definition
highlight: 使用 interface 或 type 定义 Props 类型，通过泛型参数传递给组件。
order: 638
---

## 问题 1：基本定义方式

### 使用 interface

```tsx
interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean; // 可选属性
}

function Button({ text, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}
```

### 使用 type

```tsx
type ButtonProps = {
  text: string;
  onClick: () => void;
  disabled?: boolean;
};

function Button({ text, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}
```

---

## 问题 2：常见 Props 类型

### 基础类型

```tsx
interface Props {
  // 基础类型
  name: string;
  age: number;
  isActive: boolean;

  // 数组
  items: string[];
  users: User[];

  // 对象
  config: { theme: string; lang: string };

  // 联合类型
  size: "small" | "medium" | "large";
  status: "loading" | "success" | "error";
}
```

### 函数类型

```tsx
interface Props {
  // 无参数无返回值
  onClick: () => void;

  // 有参数
  onChange: (value: string) => void;

  // 有返回值
  validate: (input: string) => boolean;

  // 事件处理
  onSubmit: (e: React.FormEvent) => void;
}
```

### children 类型

```tsx
interface Props {
  // 任意 React 可渲染内容
  children: React.ReactNode;

  // 单个 React 元素
  child: React.ReactElement;

  // 函数作为 children（render props）
  children: (data: Data) => React.ReactNode;
}
```

---

## 问题 3：继承和组合

### 继承原生元素属性

```tsx
// 继承 button 的所有属性
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary";
}

function Button({ variant, children, ...rest }: ButtonProps) {
  return (
    <button className={variant} {...rest}>
      {children}
    </button>
  );
}

// 使用时可以传递 onClick、disabled 等原生属性
<Button variant="primary" onClick={handleClick} disabled>
  Click
</Button>;
```

### 组合类型

```tsx
type BaseProps = {
  id: string;
  className?: string;
};

type WithChildren = {
  children: React.ReactNode;
};

type CardProps = BaseProps &
  WithChildren & {
    title: string;
  };
```

---

## 问题 4：泛型 Props

### 列表组件

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// 使用
<List items={users} renderItem={(user) => <span>{user.name}</span>} />;
```

### 选择组件

```tsx
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
}

function Select<T>({ options, value, onChange, getLabel }: SelectProps<T>) {
  return (
    <select
      value={getLabel(value)}
      onChange={(e) => {
        const selected = options.find((o) => getLabel(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map((option) => (
        <option key={getLabel(option)}>{getLabel(option)}</option>
      ))}
    </select>
  );
}
```

---

## 问题 5：默认值

### 使用解构默认值

```tsx
interface Props {
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

function Button({ size = "medium", disabled = false }: Props) {
  return (
    <button className={size} disabled={disabled}>
      Click
    </button>
  );
}
```

### 使用 defaultProps（不推荐）

```tsx
// 不推荐，TypeScript 支持不好
Button.defaultProps = {
  size: "medium",
};
```

## 总结

| 方式      | 适用场景           |
| --------- | ------------------ |
| interface | 大多数情况         |
| type      | 联合类型、交叉类型 |
| extends   | 继承原生属性       |
| 泛型      | 通用组件           |

## 延伸阅读

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
