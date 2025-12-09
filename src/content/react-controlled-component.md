---
title: 什么是受控组件？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  理解 React 受控组件的概念，掌握表单元素的受控方式。
tags:
  - React
  - 受控组件
  - 表单
  - state
estimatedTime: 8 分钟
keywords:
  - controlled component
  - form control
  - React forms
  - input state
highlight: 受控组件是指表单元素的值由 React state 控制，通过 onChange 更新 state 来改变显示值。
order: 261
---

## 问题 1：受控组件的定义？

### 核心概念

表单元素的值由 **React state** 控制，而不是 DOM 自身管理。

```jsx
function ControlledInput() {
  const [value, setValue] = useState("");

  return (
    <input
      value={value} // 值由 state 控制
      onChange={(e) => setValue(e.target.value)} // 通过 onChange 更新
    />
  );
}
```

### 数据流

```
用户输入 → onChange 触发 → setState → 组件重新渲染 → input 显示新值
```

---

## 问题 2：常见受控组件示例？

### 文本输入

```jsx
function TextInput() {
  const [text, setText] = useState("");

  return (
    <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
  );
}
```

### 多行文本

```jsx
function TextArea() {
  const [content, setContent] = useState("");

  return (
    <textarea value={content} onChange={(e) => setContent(e.target.value)} />
  );
}
```

### 下拉选择

```jsx
function Select() {
  const [selected, setSelected] = useState("apple");

  return (
    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
      <option value="apple">苹果</option>
      <option value="banana">香蕉</option>
      <option value="orange">橙子</option>
    </select>
  );
}
```

### 复选框

```jsx
function Checkbox() {
  const [checked, setChecked] = useState(false);

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
    />
  );
}
```

---

## 问题 3：多个输入的处理？

### 使用对象 state

```jsx
function Form() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form>
      <input name="username" value={form.username} onChange={handleChange} />
      <input name="email" value={form.email} onChange={handleChange} />
      <input name="password" value={form.password} onChange={handleChange} />
    </form>
  );
}
```

---

## 问题 4：受控 vs 非受控？

### 对比

```jsx
// 受控组件：React 控制值
<input value={value} onChange={handleChange} />

// 非受控组件：DOM 控制值
<input ref={inputRef} defaultValue="initial" />
```

| 特性     | 受控组件     | 非受控组件 |
| -------- | ------------ | ---------- |
| 值存储   | React state  | DOM        |
| 获取值   | 直接读 state | 通过 ref   |
| 验证时机 | 实时         | 提交时     |
| 代码量   | 较多         | 较少       |

## 总结

**受控组件特点**：

- 值由 `value` 属性绑定到 state
- 通过 `onChange` 更新 state
- React 是"唯一数据源"

## 延伸阅读

- [React 表单](https://react.dev/reference/react-dom/components/input)
