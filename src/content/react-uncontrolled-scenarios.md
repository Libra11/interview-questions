---
title: 非受控组件适用场景？
category: React
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  了解非受控组件的适用场景，掌握何时选择非受控方式。
tags:
  - React
  - 非受控组件
  - 表单
  - ref
estimatedTime: 8 分钟
keywords:
  - uncontrolled component
  - form ref
  - file input
  - defaultValue
highlight: 非受控组件适合文件上传、简单表单、第三方库集成等不需要实时控制的场景。
order: 263
---

## 问题 1：非受控组件是什么？

### 基本概念

表单元素的值由 **DOM 自身管理**，通过 ref 获取值。

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    console.log(inputRef.current.value); // 提交时获取值
  };

  return (
    <div>
      <input ref={inputRef} defaultValue="初始值" />
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
}
```

---

## 问题 2：适用场景有哪些？

### 1. 文件上传

```jsx
// 文件输入只能是非受控的
function FileUpload() {
  const fileRef = useRef(null);

  const handleUpload = () => {
    const file = fileRef.current.files[0];
    uploadFile(file);
  };

  return (
    <div>
      <input type="file" ref={fileRef} />
      <button onClick={handleUpload}>上传</button>
    </div>
  );
}
```

### 2. 简单表单

```jsx
// 只需要提交时获取值，不需要实时验证
function SimpleForm() {
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    console.log(Object.fromEntries(formData));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input name="username" defaultValue="" />
      <input name="email" defaultValue="" />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 3. 第三方库集成

```jsx
// 集成 jQuery 插件或其他 DOM 库
function DatePicker() {
  const inputRef = useRef(null);

  useEffect(() => {
    // 第三方库直接操作 DOM
    $(inputRef.current).datepicker();
  }, []);

  return <input ref={inputRef} />;
}
```

### 4. 性能敏感场景

```jsx
// 大量输入框，避免频繁渲染
function LargeForm() {
  const refs = useRef({});

  const handleSubmit = () => {
    const values = {};
    Object.keys(refs.current).forEach((key) => {
      values[key] = refs.current[key].value;
    });
    console.log(values);
  };

  return (
    <form>
      {Array(100)
        .fill(0)
        .map((_, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[`field${i}`] = el)}
            defaultValue=""
          />
        ))}
      <button onClick={handleSubmit}>提交</button>
    </form>
  );
}
```

### 5. 一次性读取

```jsx
// 只在特定时机读取值
function SearchBox() {
  const inputRef = useRef(null);

  const handleSearch = () => {
    const query = inputRef.current.value;
    search(query);
  };

  return (
    <div>
      <input ref={inputRef} placeholder="搜索..." />
      <button onClick={handleSearch}>搜索</button>
    </div>
  );
}
```

---

## 问题 3：受控 vs 非受控选择？

| 场景       | 推荐方式 |
| ---------- | -------- |
| 实时验证   | 受控     |
| 格式化输入 | 受控     |
| 条件禁用   | 受控     |
| 文件上传   | 非受控   |
| 简单表单   | 非受控   |
| 第三方库   | 非受控   |
| 性能优先   | 非受控   |

## 总结

**非受控组件适合**：

- 文件上传（必须）
- 简单表单（不需要实时反馈）
- 第三方 DOM 库集成
- 性能敏感的大表单

**记住**：优先考虑受控组件，特定场景使用非受控。

## 延伸阅读

- [非受控组件](https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form)
