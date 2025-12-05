---
title: provide/inject 在 Vue3 中的使用场景？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 provide/inject 的核心用法和适用场景，理解它如何解决深层组件通信问题。
tags:
  - Vue
  - provide
  - inject
  - 组件通信
estimatedTime: 15 分钟
keywords:
  - provide inject
  - 依赖注入
  - 跨层级通信
highlight: provide/inject 用于祖先组件向后代组件传递数据，避免 props 逐层传递。
order: 208
---

## 问题 1：什么是 provide/inject？

`provide/inject` 是 Vue 的**依赖注入**机制，允许祖先组件向所有后代组件提供数据，无论层级多深。

```
祖先组件 (provide)
    ├── 子组件
    │   └── 孙组件 (inject)  ← 可以直接获取
    └── 子组件
        └── 曾孙组件 (inject) ← 也可以直接获取
```

### 基本用法

```javascript
// 祖先组件
import { provide, ref } from 'vue'

setup() {
  const theme = ref('dark')
  provide('theme', theme)  // 提供响应式数据
}

// 后代组件（任意层级）
import { inject } from 'vue'

setup() {
  const theme = inject('theme')  // 注入数据
  console.log(theme.value)  // 'dark'
}
```

---

## 问题 2：主要使用场景

### 场景一：主题/配置传递

```javascript
// App.vue - 根组件
const theme = ref("light");
const locale = ref("zh-CN");

provide("theme", theme);
provide("locale", locale);

// 任意深层组件
const theme = inject("theme");
const locale = inject("locale");
```

### 场景二：共享服务/状态

```javascript
// 提供一个共享的 API 服务
const api = {
  async fetchUser(id) {
    /* ... */
  },
  async updateUser(data) {
    /* ... */
  },
};
provide("api", api);

// 后代组件使用
const api = inject("api");
const user = await api.fetchUser(1);
```

### 场景三：组件库开发

```javascript
// Form 组件
provide("form", {
  model: formData,
  rules: validationRules,
  validate: validateForm,
});

// FormItem 组件（Form 的后代）
const form = inject("form");
// 自动获取表单上下文，无需 props 传递
```

---

## 问题 3：响应式数据的注入

### 提供响应式数据

```javascript
// 祖先组件
const count = ref(0);
const state = reactive({ name: "Vue" });

// 提供响应式引用
provide("count", count);
provide("state", state);

// 后代组件
const count = inject("count");
const state = inject("state");

// 数据变化会自动更新
watchEffect(() => {
  console.log(count.value); // 响应式
});
```

### 提供修改方法

```javascript
// 祖先组件 - 推荐做法
const count = ref(0);

provide("count", readonly(count)); // 只读，防止意外修改
provide("increment", () => count.value++); // 提供修改方法

// 后代组件
const count = inject("count");
const increment = inject("increment");

// 通过方法修改，保持数据流清晰
increment();
```

---

## 问题 4：默认值和类型安全

### 设置默认值

```javascript
// 如果没有祖先提供，使用默认值
const theme = inject("theme", "light");
const config = inject("config", () => ({ debug: false })); // 工厂函数
```

### TypeScript 类型支持

```typescript
// 定义注入 key
import type { InjectionKey, Ref } from "vue";

interface UserContext {
  user: Ref<User | null>;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

// 使用 Symbol 作为 key，确保唯一性
export const UserKey: InjectionKey<UserContext> = Symbol("user");

// 提供
provide(UserKey, {
  user: ref(null),
  login: async (cred) => {
    /* ... */
  },
  logout: () => {
    /* ... */
  },
});

// 注入（自动获得类型推断）
const userContext = inject(UserKey);
userContext?.user.value; // 类型安全
```

---

## 问题 5：provide/inject vs 其他方案

### vs Props

```javascript
// Props：适合父子直接通信
// 问题：深层传递繁琐
<Parent :theme="theme">
  <Child :theme="theme">
    <GrandChild :theme="theme" />  // 逐层传递
  </Child>
</Parent>

// provide/inject：跨层级通信
// 祖先 provide，后代直接 inject
```

### vs Vuex/Pinia

```javascript
// 全局状态管理：适合应用级共享状态
// provide/inject：适合组件树局部共享

// 例如：表单组件内部状态用 provide/inject
// 用户登录状态用 Pinia
```

### vs Event Bus

```javascript
// Event Bus：已不推荐，难以追踪数据流
// provide/inject：数据流清晰，从祖先到后代
```

---

## 问题 6：注意事项

### 避免过度使用

```javascript
// ❌ 不好：所有数据都用 provide/inject
provide("user", user);
provide("posts", posts);
provide("comments", comments);
// ... 太多了

// ✅ 好：只用于真正需要跨层级的数据
provide("theme", theme); // 全局主题
provide("form", formContext); // 表单上下文
```

### 命名冲突

```javascript
// 使用 Symbol 避免冲突
const ThemeKey = Symbol("theme");
provide(ThemeKey, theme);
inject(ThemeKey);

// 或使用命名空间
provide("myLib:theme", theme);
```

## 延伸阅读

- [Vue 官方文档 - provide/inject](https://cn.vuejs.org/guide/components/provide-inject.html)
- [Vue 官方文档 - 依赖注入](https://cn.vuejs.org/api/composition-api-dependency-injection.html)
