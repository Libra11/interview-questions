---
title: 为什么 Vue3 响应式不会像 Vue2 那样需要 Vue.set？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue3 使用 Proxy 替代 Object.defineProperty 后，为何不再需要 Vue.set。
tags:
  - Vue
  - Vue.set
  - Proxy
  - 响应式
estimatedTime: 12 分钟
keywords:
  - Vue.set
  - Proxy
  - defineProperty
highlight: Proxy 可以拦截所有对象操作，包括属性添加和删除，因此不再需要 Vue.set。
order: 503
---

## 问题 1：Vue2 为什么需要 Vue.set？

Vue2 使用 `Object.defineProperty` 实现响应式，它有一个根本限制：**只能拦截已存在的属性**。

```javascript
// Vue 2
const vm = new Vue({
  data: {
    obj: { existing: 1 },
  },
});

// ❌ 新增属性不是响应式的
vm.obj.newProp = 2; // 不会触发更新

// ✅ 必须使用 Vue.set
Vue.set(vm.obj, "newProp", 2); // 触发更新

// 数组也有问题
vm.arr[0] = "new"; // ❌ 不触发更新
vm.arr.length = 0; // ❌ 不触发更新
```

### Object.defineProperty 的限制

```javascript
const obj = { count: 0 };

// 只能为已存在的属性定义 getter/setter
Object.defineProperty(obj, "count", {
  get() {
    /* ... */
  },
  set() {
    /* ... */
  },
});

// 新增属性无法被拦截
obj.newProp = 1; // 没有 getter/setter
```

---

## 问题 2：Vue3 如何解决这个问题？

Vue3 使用 `Proxy` 替代 `Object.defineProperty`，Proxy 可以拦截**所有对象操作**。

```javascript
// Vue 3
const state = reactive({
  obj: { existing: 1 },
});

// ✅ 新增属性自动是响应式的
state.obj.newProp = 2; // 触发更新

// ✅ 数组操作也正常工作
state.arr[0] = "new"; // 触发更新
state.arr.length = 0; // 触发更新

// ✅ 删除属性也能检测
delete state.obj.existing; // 触发更新
```

---

## 问题 3：Proxy 为什么能做到？

Proxy 代理的是**整个对象**，而不是单个属性：

```javascript
const target = {};

const proxy = new Proxy(target, {
  // 拦截属性读取
  get(target, key) {
    console.log(`读取 ${key}`);
    return target[key];
  },

  // 拦截属性设置（包括新增）
  set(target, key, value) {
    console.log(`设置 ${key} = ${value}`);
    target[key] = value;
    return true;
  },

  // 拦截属性删除
  deleteProperty(target, key) {
    console.log(`删除 ${key}`);
    delete target[key];
    return true;
  },

  // 拦截 in 操作符
  has(target, key) {
    console.log(`检查 ${key}`);
    return key in target;
  },

  // 拦截 Object.keys 等
  ownKeys(target) {
    console.log("获取所有键");
    return Object.keys(target);
  },
});

// 所有操作都能被拦截
proxy.newProp = 1; // 设置 newProp = 1
delete proxy.newProp; // 删除 newProp
"key" in proxy; // 检查 key
```

---

## 问题 4：对比两种方案

| 特性        | Object.defineProperty | Proxy       |
| ----------- | --------------------- | ----------- |
| 新增属性    | ❌ 无法检测           | ✅ 可以检测 |
| 删除属性    | ❌ 无法检测           | ✅ 可以检测 |
| 数组索引    | ❌ 无法检测           | ✅ 可以检测 |
| 数组 length | ❌ 无法检测           | ✅ 可以检测 |
| 初始化      | 递归遍历所有属性      | 懒代理      |
| 浏览器支持  | IE9+                  | IE 不支持   |

---

## 问题 5：Vue3 中的数组操作

```javascript
const state = reactive({
  items: ["a", "b", "c"],
});

// 所有数组操作都是响应式的
state.items[0] = "x"; // ✅ 索引赋值
state.items.push("d"); // ✅ push
state.items.pop(); // ✅ pop
state.items.splice(1, 1); // ✅ splice
state.items.length = 0; // ✅ 修改 length
```

### Vue2 中需要特殊处理

```javascript
// Vue 2 中的数组操作
// ❌ 这些不会触发更新
vm.items[0] = "x";
vm.items.length = 0;

// ✅ 必须使用这些方式
Vue.set(vm.items, 0, "x");
vm.items.splice(0);

// Vue 2 重写了数组方法，这些可以触发更新
vm.items.push("d"); // ✅
vm.items.pop(); // ✅
```

---

## 问题 6：Vue3 还有 set 方法吗？

Vue3 仍然导出了 `set` 函数，但只是为了**兼容性**，实际上不需要使用：

```javascript
import { set } from "vue";

const state = reactive({ count: 0 });

// 不需要 set，直接赋值即可
state.newProp = 1; // ✅ 自动响应式

// set 仍然可用，但没必要
set(state, "anotherProp", 2); // 也可以，但多此一举
```

### 迁移建议

```javascript
// Vue 2
Vue.set(this.obj, "key", value);
this.$set(this.obj, "key", value);

// Vue 3 - 直接赋值
state.obj.key = value;
```

## 延伸阅读

- [Vue 官方文档 - 响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
