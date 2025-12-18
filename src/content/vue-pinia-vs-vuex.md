---
title: 为什么 Vue3 推荐使用 Pinia 而不是 Vuex？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Pinia 相比 Vuex 的优势，掌握 Vue3 状态管理的最佳选择。
tags:
  - Vue
  - Pinia
  - Vuex
  - 状态管理
estimatedTime: 12 分钟
keywords:
  - Pinia
  - Vuex
  - 状态管理
highlight: Pinia 是 Vue 官方推荐的状态管理库，更简洁、更好的 TypeScript 支持、无 mutations。
order: 549
---

## 问题 1：Pinia 的主要优势

### 1. 更简洁的 API

```javascript
// Vuex
const store = createStore({
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
  actions: {
    asyncIncrement({ commit }) {
      setTimeout(() => commit("increment"), 1000);
    },
  },
});

// Pinia - 更简洁
const useCounterStore = defineStore("counter", {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++; // 直接修改，无需 mutations
    },
    async asyncIncrement() {
      await delay(1000);
      this.count++;
    },
  },
});
```

### 2. 移除 Mutations

Pinia 认为 mutations 是多余的概念：

```javascript
// Vuex：必须通过 mutation 修改状态
store.commit("increment");

// Pinia：直接修改或通过 action
const store = useCounterStore();
store.count++; // 直接修改
store.increment(); // 通过 action
store.$patch({ count: 10 }); // 批量修改
```

---

## 问题 2：更好的 TypeScript 支持

### Vuex 的类型问题

```typescript
// Vuex 需要大量类型声明
interface State {
  count: number;
}

const store = createStore<State>({
  state: () => ({ count: 0 }),
  mutations: {
    increment(state) {
      state.count++; // 类型推断有限
    },
  },
});

// 使用时类型不友好
store.commit("increment"); // 字符串，无类型检查
```

### Pinia 的类型推断

```typescript
// Pinia 自动推断类型
const useCounterStore = defineStore("counter", {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++; // 完整的类型推断
    },
  },
});

// 使用时类型安全
const store = useCounterStore();
store.count; // number
store.increment(); // 有类型提示
```

---

## 问题 3：模块化设计

### Vuex 的模块

```javascript
// Vuex：需要 modules 配置
const store = createStore({
  modules: {
    user: userModule,
    cart: cartModule,
  },
});

// 访问需要命名空间
store.state.user.name;
store.commit("user/setName", "Alice");
```

### Pinia 的 Store

```javascript
// Pinia：每个 store 独立
// stores/user.js
export const useUserStore = defineStore("user", {
  state: () => ({ name: "" }),
});

// stores/cart.js
export const useCartStore = defineStore("cart", {
  state: () => ({ items: [] }),
});

// 使用时直接导入
const userStore = useUserStore();
const cartStore = useCartStore();
```

---

## 问题 4：组合式 API 支持

```javascript
// Pinia 支持 setup 语法
export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);
  const double = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return { count, double, increment };
});
```

---

## 问题 5：开发体验

### DevTools 支持

- Pinia 有专门的 DevTools 插件
- 支持时间旅行调试
- 可以直接编辑状态

### 热更新

```javascript
// Pinia 支持 HMR
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot));
}
```

### 更小的包体积

- Pinia: ~1KB
- Vuex: ~10KB

---

## 问题 6：对比总结

| 特性       | Vuex         | Pinia      |
| ---------- | ------------ | ---------- |
| Mutations  | 必需         | 无         |
| TypeScript | 需要额外配置 | 开箱即用   |
| 模块化     | modules 配置 | 独立 store |
| 组合式 API | 有限支持     | 完整支持   |
| 包体积     | ~10KB        | ~1KB       |
| Vue 3 支持 | 需要 Vuex 4  | 原生支持   |
| 官方推荐   | Vue 2        | Vue 3      |

### 何时选择 Vuex？

- 维护 Vue 2 项目
- 团队熟悉 Vuex
- 需要严格的状态变更追踪（mutations）

### 何时选择 Pinia？

- Vue 3 新项目
- 需要更好的 TypeScript 支持
- 追求简洁的 API
- 需要更小的包体积

## 延伸阅读

- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [从 Vuex 迁移到 Pinia](https://pinia.vuejs.org/zh/cookbook/migration-vuex.html)
