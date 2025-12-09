---
title: 如何为事件定义类型？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握在 TypeScript 中为 React 事件处理函数定义正确的类型。
tags:
  - React
  - TypeScript
  - 事件
  - 类型定义
estimatedTime: 10 分钟
keywords:
  - React event type
  - TypeScript event
  - event handler type
  - SyntheticEvent
highlight: React 事件使用 React.XXXEvent 类型，事件处理函数使用 React.XXXEventHandler 类型。
order: 282
---

## 问题 1：常见事件类型

### 鼠标事件

```tsx
// 事件对象类型
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e.clientX, e.clientY);
}

// 事件处理函数类型
const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  console.log(e.clientX, e.clientY);
};

<button onClick={handleClick}>Click</button>;
```

### 键盘事件

```tsx
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    console.log("Enter pressed");
  }
}

<input onKeyDown={handleKeyDown} />;
```

### 表单事件

```tsx
// onChange
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value);
}

// onSubmit
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // 处理提交
}

<input onChange={handleChange} />
<form onSubmit={handleSubmit}>...</form>
```

---

## 问题 2：完整事件类型列表

### 常用事件类型

```tsx
// 鼠标事件
React.MouseEvent<HTMLElement>;
React.MouseEventHandler<HTMLElement>;

// 键盘事件
React.KeyboardEvent<HTMLElement>;
React.KeyboardEventHandler<HTMLElement>;

// 表单事件
React.ChangeEvent<HTMLInputElement>;
React.FormEvent<HTMLFormElement>;

// 焦点事件
React.FocusEvent<HTMLInputElement>;
React.FocusEventHandler<HTMLInputElement>;

// 触摸事件
React.TouchEvent<HTMLElement>;

// 滚动事件
React.UIEvent<HTMLElement>;

// 拖拽事件
React.DragEvent<HTMLElement>;
```

---

## 问题 3：不同元素的事件类型

### input 元素

```tsx
// 文本输入
function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value: string = e.target.value;
}

// 复选框
function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
  const checked: boolean = e.target.checked;
}

// 文件选择
function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const files: FileList | null = e.target.files;
}
```

### select 元素

```tsx
function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
  const value: string = e.target.value;
}
```

### textarea 元素

```tsx
function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  const value: string = e.target.value;
}
```

---

## 问题 4：自定义事件处理

### 带参数的事件处理

```tsx
interface Props {
  onItemClick: (id: string, e: React.MouseEvent) => void;
}

function List({ onItemClick }: Props) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={(e) => onItemClick(item.id, e)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 泛型事件处理

```tsx
interface Props<T> {
  items: T[];
  onSelect: (item: T) => void;
}

function Select<T>({ items, onSelect }: Props<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index} onClick={() => onSelect(item)}>
          {String(item)}
        </li>
      ))}
    </ul>
  );
}
```

---

## 问题 5：内联定义 vs 单独定义

### 内联定义

```tsx
// 类型自动推断
<button
  onClick={(e) => {
    // e 自动推断为 React.MouseEvent<HTMLButtonElement>
    console.log(e.clientX);
  }}
>
  Click
</button>
```

### 单独定义

```tsx
// 需要显式声明类型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.clientX);
};

<button onClick={handleClick}>Click</button>;
```

### 使用 EventHandler 类型

```tsx
// 更简洁的写法
const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  console.log(e.clientX);
};
```

## 总结

| 事件类型      | 元素类型          | 示例       |
| ------------- | ----------------- | ---------- |
| MouseEvent    | HTMLButtonElement | 点击按钮   |
| ChangeEvent   | HTMLInputElement  | 输入框变化 |
| FormEvent     | HTMLFormElement   | 表单提交   |
| KeyboardEvent | HTMLInputElement  | 键盘输入   |

## 延伸阅读

- [React TypeScript 事件](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events)
