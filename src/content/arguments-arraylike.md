---
id: arguments-arraylike
title: 为什么函数里的 arguments 只是“类数组”？
category: JavaScript
difficulty: 入门
updatedAt: 2025-02-15
summary: 拆开 arguments 对象的设计历史、内部结构与现代替代方案，理解它为何不像真正的 Array。
tags:
  - 函数
  - arguments
  - 类数组
  - Rest 参数
  - 作用域
estimatedTime: 20 分钟
keywords:
  - arguments
  - array-like
  - rest parameters
  - call stack
highlight: arguments 是早期补丁，出于性能与兼容保留为类数组，现代写法优先使用 ...rest。
order: 120
---

## 问题一：arguments 到底长什么样？

在普通函数里，JavaScript 会自动放进一个叫 `arguments` 的对象。它具备：

- `length` 表示传入实参个数；
- 类似数组的数字索引（`arguments[0]` 等）；
- 历史遗留的 `callee`、`caller` 属性（严格模式已禁止）。

但它**没有**真正数组的方法（`map`、`slice` 等），原型链也不指向 `Array.prototype`，因此只被称为 *array-like*。

```js
function demo(a) {
  console.log(arguments.length); // 实参个数
  console.log(Array.isArray(arguments)); // false
}
```

## 问题二：为什么当年不用“真·数组”？

1. **实现简单**：在 90 年代的浏览器里，构造数组成本高。设计者只想提供“能按下标读写”的最小能力，避免复制一份真实数组。
2. **与形参保持同一份存储**：在非严格模式下，`arguments[i]` 与对应形参共享同一个槽位，修改一个会影响另一个——用对象引用更容易实现；若换成数组，复制/同步都更复杂。
3. **历史兼容**：大量旧代码默认 arguments 是可写的对象。贸然改成数组会破坏行为，于是规范干脆维持 array-like 设定。

> 结论：`arguments` 是一块“轻量映射表”，为的是快而且兼容，而不是为了好用。

## 问题三：现代代码该怎么替代？

自 ES6 起，推荐直接使用 **rest 参数**：

```js
function demo(...args) {
  console.log(args instanceof Array); // true
  console.log(args.map((x) => x * 2));
}
```

优势：

- `args` 就是标准数组，可直接使用所有方法；
- 与形参完全独立，没有早期 `arguments` 那种“互相污染”；
- 在箭头函数里没有 `arguments`，但可以使用 rest 覆盖这一点。

## 问题四：遇到旧代码如何兼容？

1. 需要数组方法时，用浅复制：

   ```js
   const arr = Array.prototype.slice.call(arguments);
   // 或 [...arguments]
   ```

2. 严格模式会断开 `arguments` 与形参的联动，避免“改一个全变”；老代码依赖这种联动时要注意切换成本。
3. 框架内部如果还依赖 `arguments.callee`，应尽快替换为命名函数或函数引用，否则在严格模式/打包优化下会直接抛错。

## 小结

- `arguments` 是历史补丁：为了省成本、维护形参与实参的映射，只实现了“像数组”但不是数组的对象。
- 现代写法优先使用 `...rest`，既安全又与数组 API 完全兼容。
- 遇到遗留代码时，记住它与形参共享内存、缺少数组方法这两个特性，才能正确迁移和调试。
