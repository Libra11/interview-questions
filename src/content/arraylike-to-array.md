---
id: arraylike-to-array
title: 类数组如何转换成真正的数组？
category: JavaScript
difficulty: 入门
updatedAt: 2025-02-15
summary: 梳理常见的 array-like（NodeList、arguments 等）转数组方法，解释语法、兼容性与最佳实践。
tags:
  - 类数组
  - Array
  - DOM
  - arguments
  - ES6
estimatedTime: 15 分钟
keywords:
  - Array.from
  - 扩展运算符
  - slice.call
  - NodeList
highlight: Array.from 是现代首选，旧方案基于原型借用，选择取决于语法支持与性能权衡。
order: 405
---

## 问题一：什么叫“类数组”？

只要满足 **有 length + 可按数字索引访问**，但原型链不指向 `Array.prototype` 的对象都被称为 array-like，例如：

- `arguments`
- DOM API 的 `NodeList` / `HTMLCollection`
- 字符串（可当作按下标访问的字符列表）

这些对象无法直接使用 `map`、`filter` 等数组方法，所以需要先转换成真正的数组。

## 问题二：现代首选方案是什么？

### 1. `Array.from(arrayLike, mapFn?)`

```js
const divs = document.querySelectorAll("div");
const list = Array.from(divs);
```

优点：

- 内置处理 `length` 和稀疏位置；
- 可选第二个参数直接做映射，省去额外 `map`；
- Node >= 4 / 现代浏览器均原生支持。

### 2. 扩展运算符 `[...]`

```js
const args = (...rest) => [...rest];
```

可读性好，但依赖迭代协议：需要对象实现 `@@iterator`（`NodeList`、`arguments` 在 ES6 后都实现了）。旧环境 polyfill 成本略高。

## 问题三：旧环境如何兼容？

### 1. `Array.prototype.slice.call`

```js
function demo() {
  const arr = Array.prototype.slice.call(arguments);
}
```

原理：借用数组原型的 `slice`，让它基于 `this` 的 `length` 和索引复制出新数组。IE9+ 可用。

### 2. `Array.prototype.concat.apply([], arrayLike)`

```js
const arr = Array.prototype.concat.apply([], arrayLike);
```

利用 `concat` 把类数组当作“可连接对象”，常用于需要追加多个 NodeList 的场景，但语义较晦涩，且 `apply` 的实参数量过大会触发栈限制。

### 3. 手写循环

```js
const arrLikeToArray = (list) => {
  const result = new Array(list.length);
  for (let i = 0; i < list.length; i += 1) {
    result[i] = list[i];
  }
  return result;
};
```

在极端性能敏感、运行时环境很老（如 IE8）时仍然可靠。

## 问题四：选型建议是什么？

1. **默认用 `Array.from`**，配合可选的映射函数即可覆盖绝大多数场景。
2. **需要短写 / 借助迭代协议** 时用 `[...]`，例如函数的 rest、解构等语法靠它更顺手。
3. **兼容老旧环境** 时再考虑 `slice.call` 或自定义循环，并保证 polyfill 大小可控。

> 口诀：新项目 `Array.from`，想写短就 `[...obj]`，兼容老浏览器再回退到 `slice.call` / for 循环。
