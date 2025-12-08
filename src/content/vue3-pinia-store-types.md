---
title: 如何为 Pinia Store 提供类型支持？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握为 Pinia Store 提供完整 TypeScript 类型支持的方法。
tags:
  - Vue
  - Pinia
  - TypeScript
  - 类型支持
estimatedTime: 12 分钟
keywords:
  - Pinia 类型
  - Store 类型
  - TypeScript
highlight: Pinia 原生支持 TypeScript，Setup Store 自动推导类型，Options Store 需要定义 State 接口。
order: 256
---

## 问题 1：Setup Store 自动类型推导

Setup Store 使用 Composition API，TypeScript 自动推导所有类型：

```typescript
// stores/user.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUserStore = defineStore("user", () => {
  // 自动推导为 Ref<string>
  const name = ref("");

  // 自动推导为 Ref<number>
  const age = ref(0);

  // 自动推导为 ComputedRef<boolean>
  const isAdult = computed(() => age.value >= 18);

  // 函数类型自动推导
  function setName(newName: string) {
    name.value = newName;
  }

  async function fetchUser(id: number): Promise<void> {
    const data = await api.getUser(id);
    name.value = data.name;
  }

  return { name, age, isAdult, setName, fetchUser };
});

// 使用时完全类型安全
const store = useUserStore();
store.name; // string
store.setName("Alice"); // ✅
store.setName(123); // ❌ 类型错误
```

---

## 问题 2：Options Store 类型定义

Options Store 需要为 state 定义接口：

```typescript
// stores/counter.ts
import { defineStore } from "pinia";

// 定义 State 接口
interface CounterState {
  count: number;
  name: string;
  items: string[];
}

export const useCounterStore = defineStore("counter", {
  state: (): CounterState => ({
    count: 0,
    name: "Counter",
    items: [],
  }),

  getters: {
    // 返回类型自动推导
    double: (state) => state.count * 2,

    // 使用 this 时需要标注返回类型
    displayName(): string {
      return `${this.name}: ${this.count}`;
    },
  },

  actions: {
    increment() {
      this.count++; // this 有正确类型
    },

    addItem(item: string) {
      this.items.push(item);
    },
  },
});
```

---

## 问题 3：复杂 State 类型

```typescript
// types/store.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface AppState {
  user: User | null;
  cart: CartItem[];
  settings: {
    theme: "light" | "dark";
    locale: string;
  };
  loading: boolean;
  error: string | null;
}

// stores/app.ts
import { defineStore } from "pinia";
import type { AppState, User, CartItem } from "@/types/store";

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    user: null,
    cart: [],
    settings: {
      theme: "light",
      locale: "en",
    },
    loading: false,
    error: null,
  }),

  actions: {
    setUser(user: User) {
      this.user = user;
    },

    addToCart(item: CartItem) {
      this.cart.push(item);
    },
  },
});
```

---

## 问题 4：Getters 返回函数

```typescript
export const useUserStore = defineStore("user", {
  state: () => ({
    users: [] as User[],
  }),

  getters: {
    // 返回函数的 getter 需要标注类型
    getUserById(): (id: number) => User | undefined {
      return (id) => this.users.find((u) => u.id === id);
    },

    // 或使用箭头函数
    getUserByEmail: (state) => {
      return (email: string): User | undefined => {
        return state.users.find((u) => u.email === email);
      };
    },
  },
});

// 使用
const store = useUserStore();
const user = store.getUserById(1); // User | undefined
```

---

## 问题 5：Actions 异步类型

```typescript
export const useDataStore = defineStore("data", {
  state: () => ({
    items: [] as Item[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    // 异步 action 返回 Promise
    async fetchItems(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.getItems();
        this.items = response.data;
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },

    // 返回数据的异步 action
    async createItem(data: CreateItemDto): Promise<Item> {
      const response = await api.createItem(data);
      this.items.push(response.data);
      return response.data;
    },
  },
});
```

---

## 问题 6：Store 类型导出

```typescript
// stores/user.ts
export const useUserStore = defineStore("user", () => {
  // ...
});

// 导出 Store 类型
export type UserStore = ReturnType<typeof useUserStore>;

// 导出 State 类型
export type UserState = UserStore["$state"];

// 在其他地方使用
import type { UserStore, UserState } from "@/stores/user";

function processUser(store: UserStore) {
  console.log(store.name);
}
```

---

## 问题 7：插件类型扩展

```typescript
// types/pinia.d.ts
import "pinia";

declare module "pinia" {
  // 扩展 Store 属性
  export interface PiniaCustomProperties {
    $api: typeof api;
    $router: Router;
  }

  // 扩展 State 属性
  export interface PiniaCustomStateProperties<S> {
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

## 问题 8：storeToRefs 类型

```vue
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";

const store = useUserStore();

// storeToRefs 保持响应式和类型
const { name, age, isAdult } = storeToRefs(store);
// name: Ref<string>
// age: Ref<number>
// isAdult: ComputedRef<boolean>

// actions 直接解构（不需要 storeToRefs）
const { setName, fetchUser } = store;
</script>
```

## 延伸阅读

- [Pinia 官方文档 - TypeScript](https://pinia.vuejs.org/zh/cookbook/typescript.html)
- [Pinia 官方文档 - 插件](https://pinia.vuejs.org/zh/core-concepts/plugins.html)
