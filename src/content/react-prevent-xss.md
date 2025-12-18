---
title: React 如何避免 XSS？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 React 内置的 XSS 防护机制和安全最佳实践。
tags:
  - React
  - XSS
  - 安全
  - 防护
estimatedTime: 10 分钟
keywords:
  - React XSS
  - XSS prevention
  - security
  - escaping
highlight: React 默认对 JSX 中的值进行转义，自动防止大多数 XSS 攻击。
order: 648
---

## 问题 1：React 的默认防护

### 自动转义

```jsx
// React 自动转义 JSX 中的值
function Comment({ text }) {
  // 即使 text 包含恶意脚本，也会被转义
  return <div>{text}</div>;
}

// 输入：<script>alert('xss')</script>
// 输出：&lt;script&gt;alert('xss')&lt;/script&gt;
// 显示为文本，不会执行
```

### 原理

```jsx
// React 在渲染前将特殊字符转义
// < → &lt;
// > → &gt;
// & → &amp;
// " → &quot;
// ' → &#x27;

// 所以恶意代码变成了普通文本
```

---

## 问题 2：潜在的 XSS 风险

### dangerouslySetInnerHTML

```jsx
// ❌ 危险：直接插入 HTML
function Comment({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// 如果 htmlContent 来自用户输入，可能包含恶意脚本
```

### href 和 src 属性

```jsx
// ❌ 危险：javascript: 协议
const userUrl = 'javascript:alert("xss")';
<a href={userUrl}>Click</a>;

// ✅ 安全：验证 URL
function SafeLink({ url, children }) {
  const safeUrl = url.startsWith("http") ? url : "#";
  return <a href={safeUrl}>{children}</a>;
}
```

### 事件处理

```jsx
// ❌ 危险：动态创建事件处理
const userCode = 'alert("xss")';
<button onClick={new Function(userCode)}>Click</button>;

// ✅ 安全：不要执行用户提供的代码
```

---

## 问题 3：安全使用 dangerouslySetInnerHTML

### 使用 DOMPurify

```jsx
import DOMPurify from "dompurify";

function SafeHTML({ html }) {
  const cleanHTML = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}

// DOMPurify 会移除危险的标签和属性
// <script>、onerror、onclick 等
```

### 配置 DOMPurify

```jsx
const cleanHTML = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p"],
  ALLOWED_ATTR: ["href", "title"],
});
```

---

## 问题 4：URL 安全

### 验证 URL

```jsx
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function SafeLink({ url, children }) {
  if (!isValidUrl(url)) {
    return <span>{children}</span>;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

### 图片 URL

```jsx
function SafeImage({ src, alt }) {
  const safeSrc = isValidUrl(src) ? src : "/placeholder.png";
  return <img src={safeSrc} alt={alt} />;
}
```

---

## 问题 5：其他安全实践

### 1. 使用 CSP

```html
<!-- Content Security Policy -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'"
/>
```

### 2. 避免 eval

```jsx
// ❌ 危险
eval(userInput);
new Function(userInput);

// ✅ 安全
// 不要执行用户输入的代码
```

### 3. 安全的第三方库

```jsx
// 使用经过审计的库
// 定期更新依赖
// 检查 npm audit
npm audit
```

## 总结

| 风险点                  | 防护措施             |
| ----------------------- | -------------------- |
| JSX 内容                | 自动转义（默认安全） |
| dangerouslySetInnerHTML | 使用 DOMPurify       |
| URL 属性                | 验证协议             |
| 事件处理                | 不执行用户代码       |

## 延伸阅读

- [React 安全](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
