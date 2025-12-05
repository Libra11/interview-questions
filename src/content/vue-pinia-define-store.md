---
title: Pinia 中 defineStore 的两种写法？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Pinia defineStore 的 Options 和 Setup 两种写法，理解各自的特点和适用场景。
tags:
  - Vue
  - Pinia
  - defineStore
  - 状态管理
estimatedTime: 10 分钟
keywords:
  - defineStore
  - Options Store
  - Setup Store
highlight: defineStore 支持 Options（对象）和 Setup（函数）两种写法，Setup 写法更灵活，Options 写法更直观。
order: 236
---

## 问题 1：Options Store（对象写法）

类似 Vue 的 Options API，使用对象定义 state、getters、actions：

```javascript
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", {
  // state 必须是函数
  state: () => ({
    count: 0,
    name: "Counter",
  }),

  // getters 类似 computed
  getters: {
    double: (state) => state.count * 2,

    // 使用 this 访问其他 getter
    doubleWithName() {
      return `${this.name}: ${this.double}`;
    },
  },

  // actions 可以是同步或异步
  actions: {
    increment() {
      this.count++;
    },

    async fetchAndSet() {
      const data = await fetchData();
      this.count = data.count;
    },
  },
});
```

---

## 问题 2：Setup Store（函数写法）

类似 Vue 的 Composition API，使用函数定义：

```javascript
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCounterStore = defineStore("counter", () => {
  // ref 相当于 state
  const count = ref(0);
  const name = ref("Counter");

  // computed 相当于 getters
  const double = computed(() => count.value * 2);
  const doubleWithName = computed(() => `${name.value}: ${double.value}`);

  // 函数相当于 actions
  function increment() {
    count.value++;
  }

  async function fetchAndSet() {
    const data = await fetchData();
    count.value = data.count;
  }

  // 必须返回所有需要暴露的内容
  return {
    count,
    name,
    double,
    doubleWithName,
    increment,
    fetchAndSet,
  };
});
```

---

## 问题 3：两种写法对比

| 特性             | Options Store | Setup Store              |
| ---------------- | ------------- | ------------------------ |
| 语法风格         | 对象配置      | 函数组合                 |
| 学习曲线         | 更直观        | 需要熟悉 Composition API |
| 灵活性           | 结构固定      | 更灵活                   |
| 使用 Composables | 不方便        | 方便                     |
| TypeScript       | 需要额外类型  | 自动推断                 |
| this 访问        | 支持          | 不使用 this              |

---

## 问题 4：Setup Store 的优势

### 1. 使用 Composables

```javascript
import { useLocalStorage } from "@vueuse/core";

export const useSettingsStore = defineStore("settings", () => {
  // 直接使用 composable
  const theme = useLocalStorage("theme", "light");
  const language = useLocalStorage("language", "zh-CN");

  return { theme, language };
});
```

### 2. 更好的代码组织

```javascript
export const useUserStore = defineStore("user", () => {
  // 用户信息相关
  const user = ref(null);
  const isLoggedIn = computed(() => !!user.value);

  // 认证相关
  async function login(credentials) {
    /* ... */
  }
  async function logout() {
    /* ... */
  }

  // 可以按功能分组，更清晰
  return {
    user,
    isLoggedIn,
    login,
    logout,
  };
});
```

### 3. 使用 watch

```javascript
export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  );

  // 可以使用 watch
  watch(
    items,
    (newItems) => {
      localStorage.setItem("cart", JSON.stringify(newItems));
    },
    { deep: true }
  );

  return { items, total };
});
```

---

## 问题 5：Options Store 的优势

### 1. 结构清晰

```javascript
// 一眼就能看出 store 的结构
export const useStore = defineStore("main", {
  state: () => ({
    /* 状态 */
  }),
  getters: {
    /* 计算属性 */
  },
  actions: {
    /* 方法 */
  },
});
```

### 2. 使用 this

```javascript
export const useStore = defineStore("main", {
  state: () => ({
    items: [],
  }),
  getters: {
    count() {
      return this.items.length; // 使用 this
    },
  },
  actions: {
    addItem(item) {
      this.items.push(item); // 使用 this
    },
  },
});
```

---

## 问题 6：使用建议

### 简单 Store：Options 写法

```javascript
// 结构简单，Options 更直观
export const useCounterStore = defineStore("counter", {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++;
    },
  },
});
```

### 复杂 Store：Setup 写法

```javascript
// 需要使用 composables 或复杂逻辑
export const useComplexStore = defineStore('complex', () => {
  // 使用外部 composable
  const { data, loading } = useFetch('/api/data')

  // 复杂的响应式逻辑
  const processed = computed(() => /* ... */)

  // watch 监听
  watch(data, () => /* ... */)

  return { data, loading, processed }
})
```

### 团队统一

```javascript
// 建议团队统一使用一种风格
// 新项目推荐 Setup 写法，与 Composition API 保持一致
```

## 延伸阅读

- [Pinia 官方文档 - 定义 Store](https://pinia.vuejs.org/zh/core-concepts/)
- [Pinia 官方文档 - Setup Stores](https://pinia.vuejs.org/zh/core-concepts/#setup-stores)
