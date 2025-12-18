---
title: Pinia 中 getters 与 computed 的区别？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 Pinia getters 和 Vue computed 的关系，掌握在 Store 中使用计算属性的方式。
tags:
  - Vue
  - Pinia
  - getters
  - computed
estimatedTime: 8 分钟
keywords:
  - Pinia getters
  - computed
  - 计算属性
highlight: Pinia 的 getters 本质上就是 computed，在 Setup Store 中可以直接使用 computed。
order: 555
---

## 问题 1：getters 的本质

Pinia 的 **getters 就是 computed**，它们具有相同的特性：

- 基于依赖缓存
- 依赖变化时自动重新计算
- 返回值是响应式的

```javascript
// Options Store
export const useCounterStore = defineStore("counter", {
  state: () => ({ count: 0 }),

  getters: {
    // getter 本质是 computed
    double: (state) => state.count * 2,
  },
});

// 等价于 Setup Store
export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);

  // 直接使用 computed
  const double = computed(() => count.value * 2);

  return { count, double };
});
```

---

## 问题 2：Options Store 中的 getters

```javascript
export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    discount: 0.1,
  }),

  getters: {
    // 基本用法：接收 state 参数
    itemCount: (state) => state.items.length,

    // 访问其他 getter：使用 this
    totalPrice() {
      return this.items.reduce((sum, item) => sum + item.price, 0);
    },

    // 组合多个值
    finalPrice() {
      return this.totalPrice * (1 - this.discount);
    },

    // 返回函数（带参数的 getter）
    getItemById: (state) => {
      return (id) => state.items.find((item) => item.id === id);
    },
  },
});
```

---

## 问题 3：Setup Store 中的 computed

```javascript
export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const discount = ref(0.1);

  // 使用 computed
  const itemCount = computed(() => items.value.length);

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  );

  const finalPrice = computed(() => totalPrice.value * (1 - discount.value));

  // 带参数的计算
  const getItemById = (id) => items.value.find((item) => item.id === id);

  return { items, discount, itemCount, totalPrice, finalPrice, getItemById };
});
```

---

## 问题 4：主要区别

| 特性            | Options getters | Setup computed  |
| --------------- | --------------- | --------------- |
| 语法            | 对象属性        | computed() 函数 |
| 访问 state      | 通过参数或 this | 直接访问 ref    |
| 访问其他 getter | 通过 this       | 直接访问变量    |
| TypeScript      | 需要类型标注    | 自动推断        |

### 访问方式对比

```javascript
// Options Store
getters: {
  double(state) {
    return state.count * 2  // 通过 state 参数
  },
  quadruple() {
    return this.double * 2  // 通过 this 访问其他 getter
  }
}

// Setup Store
const count = ref(0)
const double = computed(() => count.value * 2)  // 直接访问
const quadruple = computed(() => double.value * 2)  // 直接访问
```

---

## 问题 5：使用其他 Store 的 getter

```javascript
// Options Store
import { useOtherStore } from "./other";

export const useMainStore = defineStore("main", {
  getters: {
    combined() {
      const otherStore = useOtherStore();
      return this.value + otherStore.otherValue;
    },
  },
});

// Setup Store
export const useMainStore = defineStore("main", () => {
  const otherStore = useOtherStore();

  const combined = computed(() => value.value + otherStore.otherValue);

  return { combined };
});
```

---

## 问题 6：选择建议

```javascript
// 简单场景：Options Store 更直观
export const useSimpleStore = defineStore("simple", {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
});

// 复杂场景：Setup Store 更灵活
export const useComplexStore = defineStore("complex", () => {
  const count = ref(0);

  // 可以使用 watchEffect、watch 等
  const double = computed(() => count.value * 2);

  watchEffect(() => {
    console.log("count changed:", count.value);
  });

  return { count, double };
});
```

## 延伸阅读

- [Pinia 官方文档 - Getters](https://pinia.vuejs.org/zh/core-concepts/getters.html)
