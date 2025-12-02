---
title: 浏览器 DOM Tree 是如何构建的
category: 浏览器
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  深入理解浏览器如何将 HTML 文档解析并构建成 DOM 树的过程，包括词法分析、语法分析、树构建等步骤。
tags:
  - 浏览器
  - DOM
  - 渲染原理
  - HTML解析
estimatedTime: 20 分钟
keywords:
  - DOM Tree
  - HTML 解析
  - 浏览器渲染
highlight: 理解 DOM 树的构建过程是优化页面性能的基础
order: 112
---

## 问题 1：DOM 树构建的基本流程

### 整体流程

```
HTML 字节流 → 字符 → Token → 节点 → DOM 树
```

1. **字节流转换**：将 HTML 文件转换为字符
2. **词法分析**：将字符转换为 Token
3. **语法分析**：将 Token 转换为节点
4. **树构建**：组织成 DOM 树

### 示例

```html
<html>
  <body>
    <div>Hello</div>
  </body>
</html>
```

生成的 DOM 树：

```
Document
└── html
    └── body
        └── div
            └── "Hello"
```

---

## 问题 2：Token 化过程

### Token 类型

- StartTag: `<div>`
- EndTag: `</div>`
- Character: 文本内容
- Comment: 注释

### 状态机

HTML 解析器使用状态机进行 Token 化，遇到不同字符会切换状态。

---

## 问题 3：DOM 树的构建规则

### 构建过程

1. 遇到 StartTag 创建元素节点
2. 遇到 Character 创建文本节点
3. 遇到 EndTag 关闭当前元素

### 容错机制

浏览器会自动修复不规范的 HTML。

---

## 问题 4：影响 DOM 构建的因素

### JavaScript 阻塞

```html
<script src="app.js"></script>
<!-- DOM 构建会暂停，等待脚本执行 -->
```

### CSS 不阻塞

CSS 不会阻塞 DOM 构建，但会阻塞渲染。

---

## 总结

**核心要点**：

1. DOM 树构建经过：字节流 → Token → 节点 → 树
2. 使用状态机进行词法分析
3. JavaScript 会阻塞 DOM 构建
4. 浏览器有容错机制

## 延伸阅读

- [MDN - 浏览器工作原理](https://developer.mozilla.org/zh-CN/docs/Web/Performance/How_browsers_work)
- [HTML 解析规范](https://html.spec.whatwg.org/multipage/parsing.html)
