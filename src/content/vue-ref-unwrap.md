---
title: ref 是如何"解包"的？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue ref 的自动解包机制，掌握在不同场景下 ref 的行为差异。
tags:
  - Vue
  - ref
  - 解包
  - 响应式
estimatedTime: 12 分钟
keywords:
  - ref 解包
  - ref unwrap
  - 自动解包
highlight: ref 在模板和 reactive 对象中会自动解包，无需 .value；但在数组和 Map 中不会自动解包。
order: 212
---

## 问题 1：什么是 ref 解包？

**解包**是指访问 ref 时自动获取其 `.value`，无需手动写 `.value`。

```javascript
const count = ref(0)

// 需要 .value
console.log(count.value)  // 0

// 模板中自动解包
<template>
  <div>{{ count }}</div>  <!-- 不需要 .value -->
</template>
```

---

## 问题 2：模板中的自动解包

在模板中，顶层的 ref 会自动解包：

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
const obj = { nested: ref(1) };
</script>

<template>
  <!-- ✅ 顶层 ref 自动解包 -->
  <div>{{ count }}</div>

  <!-- ✅ 嵌套 ref 也会解包 -->
  <div>{{ obj.nested }}</div>

  <!-- ⚠️ 但在表达式中需要注意 -->
  <div>{{ count + 1 }}</div>
  <!-- ✅ 正确 -->
</template>
```

### 注意：非顶层 ref 的解包

```vue
<script setup>
const object = { id: ref(1) };
</script>

<template>
  <!-- ❌ 这样不会解包 -->
  {{ object.id + 1 }}
  <!-- 输出: [object Object]1 -->

  <!-- ✅ 解构后使用 -->
  {{ object.id.value + 1 }}
  <!-- 输出: 2 -->
</template>
```

---

## 问题 3：reactive 中的自动解包

当 ref 作为 reactive 对象的属性时，会自动解包：

```javascript
const count = ref(0);
const state = reactive({
  count, // ref 作为属性
});

// 自动解包，不需要 .value
console.log(state.count); // 0
state.count++; // 直接操作
console.log(state.count); // 1

// 原始 ref 也同步更新
console.log(count.value); // 1
```

### 解包的原理

```javascript
// reactive 的 get 拦截器中处理解包
new Proxy(target, {
  get(target, key, receiver) {
    const result = Reflect.get(target, key, receiver);

    // 如果值是 ref，返回其 .value
    if (isRef(result)) {
      return result.value;
    }

    return result;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];

    // 如果旧值是 ref，更新其 .value
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    }

    return Reflect.set(target, key, value, receiver);
  },
});
```

---

## 问题 4：数组和 Map 中不会解包

```javascript
const books = reactive([ref("Vue Guide")]);

// ❌ 数组中的 ref 不会自动解包
console.log(books[0]); // Ref 对象
console.log(books[0].value); // 'Vue Guide'

// Map 同理
const map = reactive(new Map([["count", ref(0)]]));
console.log(map.get("count")); // Ref 对象
console.log(map.get("count").value); // 0
```

### 为什么数组不解包？

因为数组索引访问的语义与对象属性不同，自动解包可能导致意外行为：

```javascript
const arr = reactive([ref(1), ref(2)]);

// 如果自动解包，这些操作会变得混乱
arr.push(ref(3)); // 应该保持 ref
arr[0] = 10; // 应该替换还是更新 .value？
```

---

## 问题 5：toRef 和 toRefs

### toRef：创建指向属性的 ref

```javascript
const state = reactive({ count: 0 });

// 创建一个 ref，指向 state.count
const countRef = toRef(state, "count");

countRef.value++;
console.log(state.count); // 1
```

### toRefs：将 reactive 对象的所有属性转为 ref

```javascript
const state = reactive({ name: "Vue", version: 3 });

// 解构时保持响应性
const { name, version } = toRefs(state);

name.value = "Vue.js";
console.log(state.name); // 'Vue.js'
```

### 常见用途：从 composable 返回

```javascript
function useFeature() {
  const state = reactive({
    x: 0,
    y: 0,
  });

  // 返回 toRefs，让调用者可以解构
  return toRefs(state);
}

// 使用时可以解构，保持响应性
const { x, y } = useFeature();
```

---

## 问题 6：unref 工具函数

```javascript
import { ref, unref } from "vue";

const count = ref(0);
const plain = 10;

// unref：如果是 ref 返回 .value，否则返回原值
console.log(unref(count)); // 0
console.log(unref(plain)); // 10

// 常用于处理可能是 ref 也可能是普通值的参数
function useFeature(maybeRef) {
  const value = unref(maybeRef);
  // ...
}
```

## 延伸阅读

- [Vue 官方文档 - ref](https://cn.vuejs.org/api/reactivity-core.html#ref)
- [Vue 官方文档 - 响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
