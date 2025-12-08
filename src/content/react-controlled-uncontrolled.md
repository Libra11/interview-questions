---
title: 什么是受控组件和非受控组件？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 中受控组件和非受控组件的概念，掌握两种表单处理方式的使用场景和最佳实践。
tags:
  - React
  - 表单
  - 受控组件
  - 非受控组件
estimatedTime: 15 分钟
keywords:
  - controlled component
  - uncontrolled component
  - React form
  - useRef
highlight: 受控组件由 React 状态驱动，非受控组件由 DOM 自身管理状态，选择取决于具体场景。
order: 206
---

## 问题 1：什么是受控组件？

### 定义

受控组件的表单数据由 **React 状态**管理，输入值通过 `value` 属性绑定，变化通过 `onChange` 处理。

```jsx
function ControlledInput() {
  const [value, setValue] = useState("");

  return (
    <input
      type="text"
      value={value} // React 控制值
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### 数据流

```
用户输入 → onChange → setState → 新 value → 更新输入框
```

### 受控组件的特点

```jsx
function ControlledForm() {
  const [email, setEmail] = useState("");

  // 可以即时验证
  const isValid = email.includes("@");

  // 可以格式化输入
  const handleChange = (e) => {
    setEmail(e.target.value.toLowerCase());
  };

  return (
    <form>
      <input value={email} onChange={handleChange} />
      {!isValid && email && <span>请输入有效邮箱</span>}
      <button disabled={!isValid}>提交</button>
    </form>
  );
}
```

---

## 问题 2：什么是非受控组件？

### 定义

非受控组件的表单数据由 **DOM 自身**管理，通过 `ref` 获取值。

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };

  return (
    <>
      <input ref={inputRef} defaultValue="初始值" />
      <button onClick={handleSubmit}>提交</button>
    </>
  );
}
```

### 使用 FormData

```jsx
function UncontrolledForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log(Object.fromEntries(formData));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" defaultValue="" />
      <input name="email" defaultValue="" />
      <button type="submit">提交</button>
    </form>
  );
}
```

---

## 问题 3：如何选择使用哪种？

### 使用受控组件

- 需要即时验证
- 需要格式化输入
- 多个输入联动
- 条件性禁用按钮

```jsx
// 即时验证 + 格式化
function PhoneInput() {
  const [phone, setPhone] = useState("");

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPhone(digits.slice(0, 11));
  };

  return <input value={phone} onChange={handleChange} />;
}
```

### 使用非受控组件

- 简单表单，提交时获取值即可
- 集成第三方 DOM 库
- 文件上传

```jsx
// 文件上传必须用非受控
function FileUpload() {
  const fileRef = useRef();

  const handleUpload = () => {
    const file = fileRef.current.files[0];
    // 上传文件
  };

  return <input type="file" ref={fileRef} onChange={handleUpload} />;
}
```

## 总结

| 特性     | 受控组件      | 非受控组件   |
| -------- | ------------- | ------------ |
| 数据存储 | React state   | DOM          |
| 获取值   | 从 state 读取 | 通过 ref     |
| 初始值   | value         | defaultValue |
| 适用场景 | 复杂交互      | 简单表单     |

## 延伸阅读

- [React 官方文档 - 表单](https://react.dev/reference/react-dom/components/input)
- [受控与非受控组件](https://legacy.reactjs.org/docs/uncontrolled-components.html)
