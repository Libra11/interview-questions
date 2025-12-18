---
title: readonly 与 shallowReadonly 区别？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 readonly 和 shallowReadonly 的区别，掌握只读响应式数据的使用场景。
tags:
  - Vue
  - readonly
  - shallowReadonly
  - 响应式
estimatedTime: 10 分钟
keywords:
  - readonly
  - shallowReadonly
  - 只读响应式
highlight: readonly 深层只读，shallowReadonly 只有第一层只读，嵌套对象仍可修改。
order: 496
---

## 问题 1：readonly 的作用

`readonly` 创建一个**深层只读**的响应式代理，所有层级的属性都不可修改。

```javascript
import { reactive, readonly } from "vue";

const original = reactive({
  count: 0,
  nested: {
    value: 1,
  },
});

const copy = readonly(original);

// ❌ 所有修改都会失败并警告
copy.count = 1; // 警告：Set operation on key "count" failed
copy.nested.value = 2; // 警告：Set operation on key "value" failed
```

---

## 问题 2：shallowReadonly 的作用

`shallowReadonly` 只让**第一层**属性只读，嵌套对象仍然可以修改。

```javascript
import { reactive, shallowReadonly } from "vue";

const original = reactive({
  count: 0,
  nested: {
    value: 1,
  },
});

const copy = shallowReadonly(original);

// ❌ 第一层只读
copy.count = 1; // 警告

// ✅ 嵌套对象可以修改
copy.nested.value = 2; // 成功，无警告
console.log(copy.nested.value); // 2
```

---

## 问题 3：核心区别对比

| 特性       | readonly | shallowReadonly |
| ---------- | -------- | --------------- |
| 第一层属性 | 只读     | 只读            |
| 嵌套属性   | 只读     | 可修改          |
| 递归处理   | 是       | 否              |

### 代码对比

```javascript
const state = {
  level1: {
    level2: {
      value: 0,
    },
  },
};

// readonly：所有层级只读
const deep = readonly(state);
deep.level1 = {}; // ❌
deep.level1.level2 = {}; // ❌
deep.level1.level2.value = 1; // ❌

// shallowReadonly：只有第一层只读
const shallow = shallowReadonly(state);
shallow.level1 = {}; // ❌
shallow.level1.level2 = {}; // ✅
shallow.level1.level2.value = 1; // ✅
```

---

## 问题 4：使用场景

### readonly 的场景

**1. 保护 props 不被意外修改**

```javascript
// 子组件
export default {
  props: ["config"],
  setup(props) {
    // props 本身就是只读的，但可以额外包装
    const safeConfig = readonly(props.config);

    // 传递给其他函数时，确保不会被修改
    processConfig(safeConfig);
  },
};
```

**2. 暴露只读状态**

```javascript
// store.js
const state = reactive({ count: 0 });

export const store = {
  // 只暴露只读版本
  state: readonly(state),

  // 修改只能通过方法
  increment() {
    state.count++;
  },
};
```

### shallowReadonly 的场景

**1. 大型对象的部分保护**

```javascript
const bigData = shallowReadonly({
  // 不允许替换整个 data
  data: hugeDataset,
  // 但允许修改 data 内部
  meta: { lastUpdated: null },
});

// ❌ 不能替换
bigData.data = newData;

// ✅ 可以修改内部
bigData.data.items.push(newItem);
```

---

## 问题 5：与原始对象的关系

```javascript
const original = reactive({ count: 0 });
const copy = readonly(original);

// readonly 代理的是原始对象
// 原始对象的修改会反映到 readonly 版本
original.count = 1;
console.log(copy.count); // 1

// 但不能通过 readonly 版本修改
copy.count = 2; // ❌ 警告
```

### 响应式仍然有效

```javascript
const original = reactive({ count: 0 });
const copy = readonly(original);

watchEffect(() => {
  // copy 仍然是响应式的，会追踪变化
  console.log(copy.count);
});

original.count = 1; // 触发 watchEffect
```

---

## 问题 6：isReadonly 检查

```javascript
import { readonly, shallowReadonly, isReadonly } from "vue";

const deep = readonly({ count: 0 });
const shallow = shallowReadonly({ count: 0 });

console.log(isReadonly(deep)); // true
console.log(isReadonly(shallow)); // true

// 检查嵌套对象
const nested = readonly({ inner: { value: 0 } });
console.log(isReadonly(nested.inner)); // true

const shallowNested = shallowReadonly({ inner: { value: 0 } });
console.log(isReadonly(shallowNested.inner)); // false
```

## 延伸阅读

- [Vue 官方文档 - readonly](https://cn.vuejs.org/api/reactivity-core.html#readonly)
- [Vue 官方文档 - shallowReadonly](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreadonly)
