---
title: Pinia 如何支持 TypeScript 类型推导？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Pinia 与 TypeScript 的集成方式，实现完整的类型推导和类型安全。
tags:
  - Vue
  - Pinia
  - TypeScript
  - 类型推导
estimatedTime: 12 分钟
keywords:
  - Pinia TypeScript
  - 类型推导
  - 类型安全
highlight: Pinia 原生支持 TypeScript，Setup Store 自动推导类型，Options Store 需要少量类型标注。
order: 240
---

## 问题 1：Setup Store 自动类型推导

Setup Store 使用 Composition API，TypeScript 可以**自动推导**所有类型：

```typescript
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  // 自动推导为 Ref<string>
  const name = ref("");

  // 自动推导为 Ref<number>
  const age = ref(0);

  // 自动推导为 ComputedRef<boolean>
  const isAdult = computed(() => age.value >= 18);

  // 函数参数和返回值类型
  function setName(newName: string) {
    name.value = newName;
  }

  async function fetchUser(id: number): Promise<void> {
    const data = await api.getUser(id);
    name.value = data.name;
    age.value = data.age;
  }

  return { name, age, isAdult, setName, fetchUser };
});

// 使用时完全类型安全
const store = useUserStore();
store.name; // string
store.age; // number
store.isAdult; // boolean
store.setName("Alice"); // ✅
store.setName(123); // ❌ 类型错误
```

---

## 问题 2：Options Store 类型标注

Options Store 需要为 state 定义接口：

```typescript
interface UserState {
  name: string;
  age: number;
  email: string | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    name: "",
    age: 0,
    email: null,
  }),

  getters: {
    // 返回类型自动推导
    isAdult: (state) => state.age >= 18,

    // 使用 this 时需要标注返回类型
    displayName(): string {
      return `${this.name} (${this.age})`;
    },
  },

  actions: {
    setUser(name: string, age: number) {
      this.name = name;
      this.age = age;
    },
  },
});
```

---

## 问题 3：复杂类型定义

```typescript
// types.ts
interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  coupon: string | null;
}

// store
export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    items: [],
    coupon: null,
  }),

  getters: {
    totalPrice(): number {
      return this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    },

    // 返回函数的 getter
    getItemById(): (id: number) => CartItem | undefined {
      return (id) => this.items.find((item) => item.id === id);
    },
  },

  actions: {
    addItem(product: Product, quantity = 1) {
      const existing = this.items.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        this.items.push({ ...product, quantity });
      }
    },
  },
});
```

---

## 问题 4：泛型 Store

```typescript
// 通用的列表 Store
interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

function createListStore<T extends { id: number }>(name: string) {
  return defineStore(name, {
    state: (): ListState<T> => ({
      items: [],
      loading: false,
      error: null,
    }),

    getters: {
      getById(): (id: number) => T | undefined {
        return (id) => this.items.find((item) => item.id === id);
      },
    },

    actions: {
      setItems(items: T[]) {
        this.items = items;
      },

      addItem(item: T) {
        this.items.push(item);
      },

      removeItem(id: number) {
        const index = this.items.findIndex((item) => item.id === id);
        if (index > -1) {
          this.items.splice(index, 1);
        }
      },
    },
  });
}

// 使用
interface User {
  id: number;
  name: string;
}

export const useUsersStore = createListStore<User>("users");
```

---

## 问题 5：插件类型扩展

```typescript
// 扩展 Store 类型
import "pinia";

declare module "pinia" {
  export interface PiniaCustomProperties {
    // 添加自定义属性
    $api: typeof api;
  }

  export interface PiniaCustomStateProperties<S> {
    // 添加到所有 state 的属性
    lastUpdated: number;
  }
}

// 创建插件
const myPlugin: PiniaPlugin = ({ store }) => {
  store.$api = api;
  store.lastUpdated = Date.now();
};
```

---

## 问题 6：与组件集成

```vue
<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const userStore = useUserStore();

// 解构时保持响应式和类型
const { name, age, isAdult } = storeToRefs(userStore);
// name: Ref<string>
// age: Ref<number>
// isAdult: ComputedRef<boolean>

// actions 直接解构
const { setName, fetchUser } = userStore;

// 类型安全的调用
setName("Alice"); // ✅
fetchUser(1); // ✅
</script>
```

## 延伸阅读

- [Pinia 官方文档 - TypeScript](https://pinia.vuejs.org/zh/cookbook/typescript.html)
