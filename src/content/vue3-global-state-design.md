---
title: 如何设计全局状态管理系统？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 全局状态管理的设计思路和最佳实践。
tags:
  - Vue
  - 状态管理
  - Pinia
  - 架构设计
estimatedTime: 15 分钟
keywords:
  - 状态管理
  - 全局状态
  - Store 设计
highlight: 通过模块化 Store、类型安全、持久化等策略设计可维护的状态管理系统。
order: 273
---

## 问题 1：Store 模块划分

```
stores/
├── index.ts           # 统一导出
├── modules/
│   ├── user.ts        # 用户状态
│   ├── app.ts         # 应用状态
│   ├── permission.ts  # 权限状态
│   └── settings.ts    # 设置状态
└── plugins/
    └── persist.ts     # 持久化插件
```

---

## 问题 2：Store 设计原则

```typescript
// stores/modules/user.ts
export const useUserStore = defineStore("user", () => {
  // 1. State：响应式数据
  const token = ref("");
  const userInfo = ref<UserInfo | null>(null);

  // 2. Getters：派生状态
  const isLoggedIn = computed(() => !!token.value);
  const userName = computed(() => userInfo.value?.name ?? "");

  // 3. Actions：业务逻辑
  async function login(credentials: LoginParams) {
    const { data } = await authApi.login(credentials);
    token.value = data.token;
    await fetchUserInfo();
  }

  async function fetchUserInfo() {
    const { data } = await userApi.getInfo();
    userInfo.value = data;
  }

  function logout() {
    token.value = "";
    userInfo.value = null;
  }

  // 4. 只暴露必要的接口
  return {
    token: readonly(token),
    userInfo: readonly(userInfo),
    isLoggedIn,
    userName,
    login,
    logout,
  };
});
```

---

## 问题 3：Store 组合

```typescript
// stores/modules/cart.ts
export const useCartStore = defineStore("cart", () => {
  const userStore = useUserStore();
  const items = ref<CartItem[]>([]);

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // 使用其他 store 的数据
  const finalPrice = computed(() => {
    let price = totalPrice.value;
    if (userStore.userInfo?.isVip) {
      price *= 0.9;
    }
    return price;
  });

  async function checkout() {
    if (!userStore.isLoggedIn) {
      throw new Error("请先登录");
    }
    // ...
  }

  return { items, totalPrice, finalPrice, checkout };
});
```

---

## 问题 4：持久化策略

```typescript
// stores/plugins/persist.ts
import { watch } from "vue";

export function createPersistPlugin(options: PersistOptions) {
  return ({ store }: PiniaPluginContext) => {
    const key = `pinia-${store.$id}`;

    // 恢复数据
    const saved = localStorage.getItem(key);
    if (saved) {
      store.$patch(JSON.parse(saved));
    }

    // 监听变化
    watch(
      () => store.$state,
      (state) => {
        const toSave = options.paths ? pick(state, options.paths) : state;
        localStorage.setItem(key, JSON.stringify(toSave));
      },
      { deep: true }
    );
  };
}

// 使用
const pinia = createPinia();
pinia.use(createPersistPlugin({ paths: ["token"] }));
```

---

## 问题 5：类型安全

```typescript
// stores/types.ts
export interface UserInfo {
  id: number;
  name: string;
  email: string;
  isVip: boolean;
}

export interface AppState {
  theme: "light" | "dark";
  locale: string;
  collapsed: boolean;
}

// stores/modules/app.ts
export const useAppStore = defineStore("app", () => {
  const state = reactive<AppState>({
    theme: "light",
    locale: "zh-CN",
    collapsed: false,
  });

  function setTheme(theme: AppState["theme"]) {
    state.theme = theme;
  }

  return { ...toRefs(state), setTheme };
});
```

---

## 问题 6：异步状态管理

```typescript
// 封装异步状态
function useAsyncState<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function execute() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fetcher();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, execute };
}

// 在 Store 中使用
export const useDataStore = defineStore("data", () => {
  const {
    data: list,
    loading,
    error,
    execute: fetchList,
  } = useAsyncState(() => api.getList());

  return { list, loading, error, fetchList };
});
```

---

## 问题 7：Store 重置

```typescript
export const useUserStore = defineStore("user", () => {
  const initialState = {
    token: "",
    userInfo: null,
  };

  const token = ref(initialState.token);
  const userInfo = ref(initialState.userInfo);

  function $reset() {
    token.value = initialState.token;
    userInfo.value = initialState.userInfo;
  }

  return { token, userInfo, $reset };
});

// 全局重置
function resetAllStores() {
  const userStore = useUserStore();
  const cartStore = useCartStore();

  userStore.$reset();
  cartStore.$reset();
}
```

---

## 问题 8：调试与监控

```typescript
// 开发环境日志
const pinia = createPinia();

if (import.meta.env.DEV) {
  pinia.use(({ store }) => {
    store.$subscribe((mutation, state) => {
      console.log(`[${store.$id}]`, mutation.type, mutation.payload);
    });

    store.$onAction(({ name, args, after, onError }) => {
      console.log(`[${store.$id}] Action: ${name}`, args);

      after((result) => {
        console.log(`[${store.$id}] Action ${name} finished`, result);
      });

      onError((error) => {
        console.error(`[${store.$id}] Action ${name} failed`, error);
      });
    });
  });
}
```

## 延伸阅读

- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [Vue 状态管理](https://cn.vuejs.org/guide/scaling-up/state-management.html)
