---
title: Pinia 的持久化如何实现？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Pinia 状态持久化的实现方式，包括手动实现和使用插件两种方案。
tags:
  - Vue
  - Pinia
  - 持久化
  - localStorage
estimatedTime: 12 分钟
keywords:
  - Pinia 持久化
  - pinia-plugin-persistedstate
  - localStorage
highlight: Pinia 持久化可通过 pinia-plugin-persistedstate 插件实现，也可手动使用 localStorage + $subscribe 实现。
order: 237
---

## 问题 1：为什么需要持久化？

默认情况下，Pinia 的状态存储在内存中，页面刷新后会丢失：

```javascript
const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    userInfo: null,
  }),
});

// 用户登录后设置 token
store.token = "xxx";

// 刷新页面后，token 变回空字符串
```

---

## 问题 2：使用插件（推荐）

### 安装

```bash
npm install pinia-plugin-persistedstate
```

### 配置

```javascript
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

createApp(App).use(pinia).mount("#app");
```

### 使用

```javascript
export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    userInfo: null,
  }),

  // 开启持久化
  persist: true,
});
```

---

## 问题 3：插件高级配置

```javascript
export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    userInfo: null,
    tempData: "", // 不需要持久化
  }),

  persist: {
    // 自定义存储 key
    key: "my-user-store",

    // 选择存储方式
    storage: localStorage, // 默认，或 sessionStorage

    // 只持久化部分状态
    paths: ["token", "userInfo"], // tempData 不会被持久化

    // 序列化方法
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },

    // 恢复数据前的钩子
    beforeRestore: (ctx) => {
      console.log("即将恢复数据", ctx);
    },

    // 恢复数据后的钩子
    afterRestore: (ctx) => {
      console.log("数据已恢复", ctx);
    },
  },
});
```

---

## 问题 4：手动实现持久化

### 方式一：使用 $subscribe

```javascript
export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    userInfo: null,
  }),

  actions: {
    // 初始化时从 localStorage 恢复
    initFromStorage() {
      const saved = localStorage.getItem("user-store");
      if (saved) {
        this.$patch(JSON.parse(saved));
      }
    },
  },
});

// 在 main.js 中设置
const userStore = useUserStore();

// 恢复数据
userStore.initFromStorage();

// 监听变化并保存
userStore.$subscribe((mutation, state) => {
  localStorage.setItem("user-store", JSON.stringify(state));
});
```

### 方式二：Setup Store + watch

```javascript
import { ref, watch } from "vue";

export const useUserStore = defineStore("user", () => {
  // 从 localStorage 初始化
  const saved = localStorage.getItem("user-token");
  const token = ref(saved || "");

  // 监听变化并保存
  watch(token, (newToken) => {
    localStorage.setItem("user-token", newToken);
  });

  return { token };
});
```

---

## 问题 5：使用 VueUse

```javascript
import { useLocalStorage } from "@vueuse/core";

export const useUserStore = defineStore("user", () => {
  // 自动同步到 localStorage
  const token = useLocalStorage("user-token", "");
  const theme = useLocalStorage("user-theme", "light");

  return { token, theme };
});
```

---

## 问题 6：多个持久化配置

```javascript
export const useStore = defineStore("main", {
  state: () => ({
    token: "",
    settings: {},
    cache: {},
  }),

  persist: [
    {
      // token 存到 localStorage
      paths: ["token"],
      storage: localStorage,
    },
    {
      // settings 存到 sessionStorage
      paths: ["settings"],
      storage: sessionStorage,
    },
    // cache 不持久化
  ],
});
```

## 延伸阅读

- [pinia-plugin-persistedstate 文档](https://prazdevs.github.io/pinia-plugin-persistedstate/zh/)
- [Pinia 官方文档 - 插件](https://pinia.vuejs.org/zh/core-concepts/plugins.html)
