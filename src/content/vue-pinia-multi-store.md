---
title: Pinia 多 store 如何交互？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Pinia 中多个 Store 之间相互调用和数据共享的方式。
tags:
  - Vue
  - Pinia
  - Store
  - 状态管理
estimatedTime: 10 分钟
keywords:
  - Pinia 多 store
  - Store 交互
  - 跨 store 调用
highlight: Pinia 中多个 Store 可以直接相互导入使用，在 actions、getters 中调用其他 Store。
order: 239
---

## 问题 1：基本交互方式

在 Pinia 中，Store 之间可以**直接导入并使用**：

```javascript
// stores/user.js
export const useUserStore = defineStore("user", {
  state: () => ({
    userId: null,
    name: "",
  }),
});

// stores/cart.js
import { useUserStore } from "./user";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),

  actions: {
    async checkout() {
      const userStore = useUserStore();

      // 使用 userStore 的数据
      if (!userStore.userId) {
        throw new Error("请先登录");
      }

      await api.checkout({
        userId: userStore.userId,
        items: this.items,
      });
    },
  },
});
```

---

## 问题 2：在 Getters 中使用其他 Store

```javascript
// stores/cart.js
import { useUserStore } from "./user";
import { useDiscountStore } from "./discount";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),

  getters: {
    totalPrice() {
      return this.items.reduce((sum, item) => sum + item.price, 0);
    },

    // 使用其他 store 的数据计算最终价格
    finalPrice() {
      const userStore = useUserStore();
      const discountStore = useDiscountStore();

      let price = this.totalPrice;

      // VIP 用户额外折扣
      if (userStore.isVip) {
        price *= 0.9;
      }

      // 应用优惠券
      price -= discountStore.couponValue;

      return Math.max(price, 0);
    },
  },
});
```

---

## 问题 3：Setup Store 中的交互

```javascript
// stores/cart.js
import { useUserStore } from "./user";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);
  const userStore = useUserStore();

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0)
  );

  // 使用其他 store 的响应式数据
  const finalPrice = computed(() => {
    let price = totalPrice.value;
    if (userStore.isVip) {
      price *= 0.9;
    }
    return price;
  });

  async function checkout() {
    if (!userStore.userId) {
      throw new Error("请先登录");
    }
    // ...
  }

  return { items, totalPrice, finalPrice, checkout };
});
```

---

## 问题 4：监听其他 Store 的变化

```javascript
export const useNotificationStore = defineStore("notification", () => {
  const userStore = useUserStore();
  const messages = ref([]);

  // 监听用户登录状态变化
  watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        fetchNotifications();
      } else {
        messages.value = [];
      }
    }
  );

  // 使用 $subscribe 监听 store 变化
  userStore.$subscribe((mutation, state) => {
    console.log("User store changed:", mutation.type);
  });

  return { messages };
});
```

---

## 问题 5：共享 Actions

```javascript
// stores/shared.js - 共享的 actions
export const useSharedStore = defineStore("shared", {
  state: () => ({
    loading: false,
    error: null,
  }),

  actions: {
    setLoading(value) {
      this.loading = value;
    },
    setError(error) {
      this.error = error;
    },
  },
});

// stores/user.js
import { useSharedStore } from "./shared";

export const useUserStore = defineStore("user", {
  actions: {
    async fetchUser() {
      const shared = useSharedStore();

      shared.setLoading(true);
      shared.setError(null);

      try {
        this.user = await api.getUser();
      } catch (e) {
        shared.setError(e.message);
      } finally {
        shared.setLoading(false);
      }
    },
  },
});
```

---

## 问题 6：避免循环依赖

```javascript
// ❌ 错误：循环依赖
// stores/a.js
import { useBStore } from "./b"; // A 依赖 B

// stores/b.js
import { useAStore } from "./a"; // B 依赖 A

// ✅ 正确：在函数内部导入
// stores/a.js
export const useAStore = defineStore("a", {
  actions: {
    someAction() {
      // 在需要时才导入
      const bStore = useBStore();
      bStore.doSomething();
    },
  },
});

// stores/b.js
export const useBStore = defineStore("b", {
  actions: {
    anotherAction() {
      const aStore = useAStore();
      aStore.doSomething();
    },
  },
});
```

### 使用组合函数解耦

```javascript
// composables/useCheckout.js
export function useCheckout() {
  const userStore = useUserStore();
  const cartStore = useCartStore();
  const orderStore = useOrderStore();

  async function checkout() {
    // 协调多个 store
    const order = await orderStore.create({
      userId: userStore.userId,
      items: cartStore.items,
    });

    cartStore.clear();
    return order;
  }

  return { checkout };
}
```

## 延伸阅读

- [Pinia 官方文档 - 组合 Stores](https://pinia.vuejs.org/zh/cookbook/composing-stores.html)
