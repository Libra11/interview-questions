---
title: 受控组件的优缺点？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  分析受控组件的优势和劣势，帮助选择合适的表单处理方式。
tags:
  - React
  - 受控组件
  - 表单
  - 优缺点
estimatedTime: 8 分钟
keywords:
  - controlled component pros cons
  - form validation
  - React forms
highlight: 受控组件提供实时验证和完全控制，但代码量较多；适合需要即时反馈的复杂表单。
order: 602
---

## 问题 1：受控组件的优点？

### 1. 实时验证

```jsx
function EmailInput() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // 实时验证
    if (value && !value.includes("@")) {
      setError("请输入有效的邮箱");
    } else {
      setError("");
    }
  };

  return (
    <div>
      <input value={email} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### 2. 格式化输入

```jsx
function PhoneInput() {
  const [phone, setPhone] = useState("");

  const handleChange = (e) => {
    // 只允许数字，自动格式化
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    setPhone(formatted);
  };

  return <input value={phone} onChange={handleChange} />;
}
```

### 3. 条件禁用

```jsx
function Form() {
  const [form, setForm] = useState({ name: '', email: '' });

  const isValid = form.name.length > 0 && form.email.includes('@');

  return (
    <form>
      <input value={form.name} onChange={...} />
      <input value={form.email} onChange={...} />
      <button disabled={!isValid}>提交</button>
    </form>
  );
}
```

### 4. 联动控制

```jsx
function AddressForm() {
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  // 省份变化时，清空城市
  const handleProvinceChange = (e) => {
    setProvince(e.target.value);
    setCity('');  // 联动清空
  };

  return (
    <>
      <select value={province} onChange={handleProvinceChange}>...</select>
      <select value={city} onChange={e => setCity(e.target.value)}>
        {getCities(province).map(...)}
      </select>
    </>
  );
}
```

---

## 问题 2：受控组件的缺点？

### 1. 代码量多

```jsx
// 每个输入都需要 state 和 handler
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");
// ... 更多字段
```

### 2. 频繁渲染

```jsx
// 每次输入都触发渲染
function Form() {
  const [value, setValue] = useState("");

  console.log("render"); // 每次输入都打印

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

### 3. 性能问题

```jsx
// 大表单可能有性能问题
function BigForm() {
  const [form, setForm] = useState({
    // 50+ 个字段
  });

  // 每次输入都更新整个 form 对象
  // 导致整个表单重新渲染
}
```

---

## 问题 3：如何缓解缺点？

### 使用表单库

```jsx
// React Hook Form
import { useForm } from "react-hook-form";

function Form() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      <input {...register("email")} />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 防抖处理

```jsx
function SearchInput() {
  const [value, setValue] = useState("");

  const debouncedSearch = useMemo(() => debounce((v) => search(v), 300), []);

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return <input value={value} onChange={handleChange} />;
}
```

## 总结

| 优点       | 缺点           |
| ---------- | -------------- |
| 实时验证   | 代码量多       |
| 格式化输入 | 频繁渲染       |
| 条件控制   | 大表单性能问题 |
| 数据联动   | 需要更多 state |

**建议**：复杂表单使用 React Hook Form 等库。

## 延伸阅读

- [React Hook Form](https://react-hook-form.com/)
- [Formik](https://formik.org/)
