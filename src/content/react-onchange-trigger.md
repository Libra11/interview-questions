---
title: onChange 如何触发？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  理解 React 中 onChange 事件的触发机制，与原生 change 事件的区别。
tags:
  - React
  - onChange
  - 事件
  - 表单
estimatedTime: 8 分钟
keywords:
  - onChange
  - input event
  - React event
  - form events
highlight: React 的 onChange 在每次输入时触发（类似原生 input 事件），而非失焦时触发。
order: 264
---

## 问题 1：React onChange vs 原生 change？

### 原生 change 事件

```html
<!-- 原生 HTML -->
<input type="text" onchange="handleChange()" />

<!-- change 事件：失去焦点且值改变时触发 -->
```

### React onChange

```jsx
// React 的 onChange：每次输入都触发
function Input() {
  const handleChange = (e) => {
    console.log(e.target.value); // 每次按键都打印
  };

  return <input onChange={handleChange} />;
}
```

### 区别

| 事件           | 触发时机     |
| -------------- | ------------ |
| 原生 change    | 失焦且值改变 |
| React onChange | 每次输入     |
| 原生 input     | 每次输入     |

**React 的 onChange 实际上类似原生的 input 事件。**

---

## 问题 2：不同输入类型的触发？

### 文本输入

```jsx
// 每次按键触发
<input type="text" onChange={(e) => console.log(e.target.value)} />
```

### 复选框

```jsx
// 每次点击触发
<input type="checkbox" onChange={(e) => console.log(e.target.checked)} />
```

### 单选框

```jsx
// 选中时触发
<input
  type="radio"
  name="option"
  onChange={(e) => console.log(e.target.value)}
/>
```

### 下拉选择

```jsx
// 选择改变时触发
<select onChange={(e) => console.log(e.target.value)}>
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

### 文件选择

```jsx
// 选择文件后触发
<input type="file" onChange={(e) => console.log(e.target.files[0])} />
```

---

## 问题 3：事件对象包含什么？

### 常用属性

```jsx
function handleChange(e) {
  // 事件目标
  console.log(e.target); // DOM 元素
  console.log(e.target.value); // 当前值
  console.log(e.target.name); // name 属性
  console.log(e.target.type); // 输入类型

  // 复选框
  console.log(e.target.checked); // 是否选中

  // 文件
  console.log(e.target.files); // 文件列表

  // 原生事件
  console.log(e.nativeEvent); // 原生 DOM 事件
}
```

---

## 问题 4：如何实现失焦触发？

### 使用 onBlur

```jsx
function Input() {
  const [value, setValue] = useState("");

  const handleBlur = () => {
    // 失焦时验证或提交
    validate(value);
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
```

### 防抖处理

```jsx
function SearchInput() {
  const [value, setValue] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((query) => search(query), 300),
    []
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue); // 防抖搜索
  };

  return <input value={value} onChange={handleChange} />;
}
```

## 总结

| 事件     | 用途             |
| -------- | ---------------- |
| onChange | 实时获取输入值   |
| onBlur   | 失焦时处理       |
| onFocus  | 获取焦点时处理   |
| onInput  | 与 onChange 类似 |

## 延伸阅读

- [React 表单事件](https://react.dev/reference/react-dom/components/input)
