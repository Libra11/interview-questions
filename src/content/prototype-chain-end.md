---
title: 原型链的终点是什么？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 原型链的完整结构，掌握原型链的终点和查找机制，理解 Object.prototype 的特殊地位。
tags:
  - 原型链
  - Object.prototype
  - 继承机制
  - 原型查找
estimatedTime: 25 分钟
keywords:
  - 原型链
  - Object.prototype
  - 'null'
  - 原型查找
highlight: 理解原型链的完整结构和终点，掌握原型查找机制，深入理解 JavaScript 的继承本质
order: 237
---

## 问题 1：原型链的终点是什么？

**答案：原型链的终点是 `null`**

具体来说，原型链的完整路径是：
**实例对象 → 构造函数.prototype → Object.prototype → null**

### 基本原型链结构

```javascript
// 创建一个简单对象
const obj = { name: "Alice" };

// 查看原型链
console.log(obj.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__ === null); // true

// 完整的原型链路径
console.log("obj:", obj);
console.log("obj.__proto__:", obj.__proto__); // Object.prototype
console.log("obj.__proto__.__proto__:", obj.__proto__.__proto__); // null

// 使用 Object.getPrototypeOf() 查看（推荐方式）
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype) === null); // true
```
