---
title: 什么是 Webpack Pitch Loader？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack Loader 的 pitch 阶段，掌握 pitch 函数的执行时机和实际应用场景。
tags:
  - Webpack
  - Loader
  - pitch
  - 高级特性
estimatedTime: 15 分钟
keywords:
  - pitch loader
  - Loader 执行阶段
  - style-loader
highlight: Pitch 是 Loader 的前置阶段，从左到右执行，可以提前返回结果跳过后续 Loader。
order: 618
---

## 问题 1：什么是 Pitch？

**Pitch 是 Loader 的一个可选方法，在正常执行之前被调用**。

Loader 的完整执行分为两个阶段：

1. **Pitch 阶段**：从左到右执行每个 Loader 的 pitch 方法
2. **Normal 阶段**：从右到左执行每个 Loader 的 normal 方法

```javascript
// loader 可以同时有 pitch 和 normal 方法
module.exports = function (source) {
  // Normal 方法（从右到左执行）
  return source;
};

module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  // Pitch 方法（从左到右执行）
};
```

---

## 问题 2：执行顺序详解

假设配置了三个 Loader：

```javascript
use: ["loader-a", "loader-b", "loader-c"];
```

完整的执行顺序是：

```
→ loader-a pitch
→ loader-b pitch
→ loader-c pitch
→ 读取源文件
← loader-c normal
← loader-b normal
← loader-a normal
```

就像一个"回旋镖"：pitch 从左到右，normal 从右到左。

---

## 问题 3：Pitch 的熔断机制

**如果 pitch 方法返回了值，会跳过后续的 Loader**：

```javascript
// loader-b 的 pitch 返回了值
module.exports.pitch = function () {
  return "some result";
};
```

执行顺序变为：

```
→ loader-a pitch
→ loader-b pitch（返回值）
← loader-a normal（接收 loader-b pitch 的返回值）
```

loader-c 的 pitch 和 normal 都被跳过，loader-b 的 normal 也被跳过。

---

## 问题 4：Pitch 的实际应用

### style-loader 的实现原理

style-loader 就是利用 pitch 实现的：

```javascript
// style-loader 简化版
module.exports = function () {};

module.exports.pitch = function (remainingRequest) {
  // remainingRequest 是剩余的 loader 链
  // 例如：'css-loader!./style.css'

  // 返回一段 JS 代码，这段代码会：
  // 1. 使用内联 loader 语法请求 CSS
  // 2. 将 CSS 注入到 DOM
  return `
    var content = require(${JSON.stringify("!!" + remainingRequest)});
    var style = document.createElement('style');
    style.textContent = content;
    document.head.appendChild(style);
  `;
};
```

为什么用 pitch？因为 style-loader 需要：

1. 不处理 CSS 内容本身
2. 生成一段运行时代码来注入 CSS
3. 让 css-loader 在运行时被调用，而不是构建时

---

## 问题 5：Pitch 参数详解

```javascript
module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  // remainingRequest: 剩余的 loader + 资源路径
  // 例如：'css-loader!./style.css'

  // precedingRequest: 之前的 loader
  // 例如：'style-loader'

  // data: 可以在 pitch 和 normal 之间共享数据
  data.value = "shared data";
};

module.exports = function (source) {
  // 可以访问 pitch 阶段设置的 data
  console.log(this.data.value); // 'shared data'
  return source;
};
```

---

## 问题 6：何时使用 Pitch？

Pitch 适用于以下场景：

1. **需要跳过后续 Loader**：如 style-loader
2. **需要在 Loader 间共享数据**：通过 data 参数
3. **需要修改 Loader 链的行为**：根据条件决定是否继续

大多数 Loader 不需要 pitch，只有特殊场景才会用到。

## 延伸阅读

- [Pitching Loader](https://webpack.js.org/api/loaders/#pitching-loader)
- [style-loader 源码](https://github.com/webpack-contrib/style-loader)
