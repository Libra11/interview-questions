---
title: shallowReactive 与 reactive 区别？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 shallowReactive 和 reactive 的区别，掌握浅层响应式的使用场景。
tags:
  - Vue
  - shallowReactive
  - reactive
  - 响应式
estimatedTime: 10 分钟
keywords:
  - shallowReactive
  - 浅层响应式
  - reactive 区别
highlight: reactive 深层响应，shallowReactive 只有第一层是响应式的，嵌套对象不会被代理。
order: 500
---

## 问题 1：核心区别

- **reactive**：深层响应式，嵌套对象也会被转换为响应式
- **shallowReactive**：浅层响应式，只有第一层属性是响应式的

```javascript
import { reactive, shallowReactive, isReactive } from "vue";

// reactive：深层响应
const deep = reactive({
  nested: { count: 0 },
});
console.log(isReactive(deep.nested)); // true

// shallowReactive：浅层响应
const shallow = shallowReactive({
  nested: { count: 0 },
});
console.log(isReactive(shallow.nested)); // false
```

---

## 问题 2：响应式行为对比

### reactive

```javascript
const state = reactive({
  count: 0,
  nested: {
    value: 1,
  },
});

watchEffect(() => {
  console.log(state.nested.value);
});

// ✅ 触发更新
state.nested.value = 2; // 输出: 2
```

### shallowReactive

```javascript
const state = shallowReactive({
  count: 0,
  nested: {
    value: 1,
  },
});

watchEffect(() => {
  console.log(state.nested.value);
});

// ❌ 不触发更新（嵌套对象不是响应式的）
state.nested.value = 2; // 无输出

// ✅ 替换整个嵌套对象会触发更新
state.nested = { value: 3 }; // 输出: 3
```

---

## 问题 3：使用场景

### 场景一：大型对象优化

```javascript
// 当嵌套对象很大且不需要深层响应时
const state = shallowReactive({
  // 大型数据，不需要响应式
  rawData: fetchedBigData,

  // 只有这些需要响应式
  loading: false,
  error: null,
});

// 只追踪顶层属性变化
state.loading = true; // ✅ 响应式
state.rawData.items[0].name = "new"; // ❌ 不响应，但这是预期的
```

### 场景二：外部状态集成

```javascript
// 集成第三方库的状态
const state = shallowReactive({
  // 第三方库管理的对象，不应该被 Vue 代理
  chart: new Chart(),
  map: new MapInstance(),

  // Vue 管理的状态
  isReady: false,
});
```

### 场景三：避免不必要的代理

```javascript
// 组件内部状态
const state = shallowReactive({
  // DOM 引用，不需要响应式
  elements: [],

  // 配置对象，只关心整体替换
  config: defaultConfig,
});

// 整体替换配置
state.config = newConfig; // ✅ 触发更新
```

---

## 问题 4：与 ref 的对比

```javascript
// shallowRef：类似 shallowReactive，但用于单个值
import { shallowRef } from "vue";

const state = shallowRef({
  nested: { count: 0 },
});

// ❌ 不触发更新
state.value.nested.count = 1;

// ✅ 替换整个值才触发
state.value = { nested: { count: 2 } };
```

---

## 问题 5：注意事项

### 混合使用的陷阱

```javascript
const shallow = shallowReactive({
  nested: { count: 0 },
});

// 如果后来将嵌套对象替换为 reactive 对象
shallow.nested = reactive({ count: 0 });

// 现在 shallow.nested 是响应式的
// 但这可能导致行为不一致，不推荐
```

### 正确的做法

```javascript
// 如果需要部分深层响应，明确使用 reactive
const state = shallowReactive({
  // 明确标记需要深层响应的部分
  deepPart: reactive({ count: 0 }),

  // 不需要深层响应的部分
  shallowPart: { data: [] },
});
```

---

## 问题 6：何时选择哪个？

| 场景           | 推荐            |
| -------------- | --------------- |
| 一般状态管理   | reactive        |
| 大型嵌套对象   | shallowReactive |
| 外部库对象     | shallowReactive |
| 需要深层追踪   | reactive        |
| 只关心整体替换 | shallowReactive |

### 决策流程

```
需要深层响应吗？
  ├── 是 → reactive
  └── 否 → 嵌套对象很大或来自外部？
              ├── 是 → shallowReactive
              └── 否 → reactive（默认选择）
```

## 延伸阅读

- [Vue 官方文档 - shallowReactive](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive)
- [Vue 官方文档 - reactive](https://cn.vuejs.org/api/reactivity-core.html#reactive)
