---
title: React 在安全方面比 Vue/Angular 好在哪里？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  对比 React、Vue、Angular 在安全方面的设计差异。
tags:
  - React
  - Vue
  - Angular
  - 安全
estimatedTime: 10 分钟
keywords:
  - React security
  - framework security
  - XSS comparison
  - security design
highlight: 三大框架都有 XSS 防护，React 的显式 dangerouslySetInnerHTML 命名更能提醒开发者注意安全。
order: 650
---

## 问题 1：默认转义机制

### 三大框架都有默认转义

```jsx
// React
<div>{userInput}</div>  // 自动转义

// Vue
<div>{{ userInput }}</div>  // 自动转义

// Angular
<div>{{ userInput }}</div>  // 自动转义
```

### 结论

```jsx
// 在默认转义方面，三者都做得很好
// 都能防止基本的 XSS 攻击
```

---

## 问题 2：插入原始 HTML 的方式

### React

```jsx
// 名字明确警告危险
<div dangerouslySetInnerHTML={{ __html: html }} />

// 优点：
// 1. 名字包含 "dangerously"，提醒开发者
// 2. 需要传递对象 { __html: ... }，增加摩擦
// 3. 不容易误用
```

### Vue

```vue
<!-- v-html 指令 -->
<div v-html="html"></div>

<!-- 名字不包含警告 -->
<!-- 相对容易误用 -->
```

### Angular

```typescript
// 需要使用 DomSanitizer
import { DomSanitizer } from "@angular/platform-browser";

this.sanitizer.bypassSecurityTrustHtml(html);

// 优点：默认会报错，需要显式绕过
// 缺点：API 较复杂
```

---

## 问题 3：URL 安全

### React

```jsx
// React 17+ 会警告 javascript: URL
<a href="javascript:alert(1)">Click</a>
// Warning: A future version of React will block javascript: URLs

// 但目前不会阻止
```

### Vue

```vue
<!-- Vue 不会特别处理 javascript: URL -->
<a :href="userUrl">Click</a>
<!-- 需要开发者自己验证 -->
```

### Angular

```typescript
// Angular 默认会清理不安全的 URL
// javascript: 会被移除
```

---

## 问题 4：模板注入

### React

```jsx
// React 使用 JSX，是 JavaScript
// 不存在模板注入问题

// 用户输入不会被解析为 JSX
const userInput = "<div onClick={alert(1)}>Click</div>";
<div>{userInput}</div>; // 只是字符串
```

### Vue

```vue
<!-- Vue 模板是字符串，理论上可能被注入 -->
<!-- 但 Vue 的编译器会处理 -->

<!-- 不要这样做 -->
<component :is="userInput" />
```

### Angular

```typescript
// Angular 模板也是字符串
// AOT 编译可以防止运行时模板注入
```

---

## 问题 5：实际安全性对比

### 相似之处

```jsx
// 1. 都有默认转义
// 2. 都需要开发者注意原始 HTML
// 3. 都需要验证 URL
// 4. 都需要使用 CSP
```

### 差异

| 方面           | React          | Vue    | Angular           |
| -------------- | -------------- | ------ | ----------------- |
| 原始 HTML 命名 | dangerously... | v-html | bypassSecurity... |
| 警告程度       | 高             | 中     | 高                |
| URL 处理       | 警告           | 无     | 清理              |
| 学习曲线       | 低             | 低     | 高                |

### 结论

```jsx
// React 的优势：
// 1. dangerouslySetInnerHTML 名字明确警告
// 2. JSX 是 JavaScript，不存在模板注入
// 3. 社区安全意识强

// 但实际上：
// 三大框架的安全性都足够好
// 关键在于开发者的安全意识
```

---

## 问题 6：安全最佳实践

### 通用建议

```jsx
// 1. 永远不信任用户输入
// 2. 使用 DOMPurify 消毒 HTML
// 3. 验证 URL 协议
// 4. 使用 CSP
// 5. 定期更新依赖
// 6. 使用 npm audit
```

## 总结

| 框架    | 安全设计                |
| ------- | ----------------------- |
| React   | 显式警告，JSX 安全      |
| Vue     | 简洁 API，需注意 v-html |
| Angular | 严格模式，API 复杂      |

**结论**：三者安全性相当，React 的命名更能提醒开发者。

## 延伸阅读

- [React 安全](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [Vue 安全](https://vuejs.org/guide/best-practices/security.html)
- [Angular 安全](https://angular.io/guide/security)
