---
title: 当路由变化时如何取消上一次请求？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握在路由切换时取消未完成请求的方法，避免竞态条件和内存泄漏。
tags:
  - Vue
  - Vue Router
  - AbortController
  - 请求取消
estimatedTime: 12 分钟
keywords:
  - 取消请求
  - AbortController
  - 路由切换
highlight: 使用 AbortController 配合路由守卫或组件卸载钩子，在路由变化时取消未完成的请求。
order: 234
---

## 问题 1：为什么需要取消请求？

路由切换时，如果上一个页面的请求还未完成：

1. **竞态条件**：旧请求的响应可能覆盖新数据
2. **内存泄漏**：组件已卸载但回调仍在执行
3. **不必要的网络消耗**：请求结果已无用

```javascript
// 问题示例
// 用户快速切换：/user/1 → /user/2 → /user/3
// 请求返回顺序可能是：user/2 → user/3 → user/1
// 最终显示的是 user/1 的数据（错误！）
```

---

## 问题 2：使用 AbortController

### 基本用法

```javascript
const controller = new AbortController();

fetch("/api/data", {
  signal: controller.signal,
})
  .then((res) => res.json())
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("请求被取消");
    }
  });

// 取消请求
controller.abort();
```

### 在组件中使用

```vue
<script setup>
import { ref, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const data = ref(null);
let controller = null;

async function fetchData(id) {
  // 取消之前的请求
  if (controller) {
    controller.abort();
  }

  // 创建新的 controller
  controller = new AbortController();

  try {
    const res = await fetch(`/api/user/${id}`, {
      signal: controller.signal,
    });
    data.value = await res.json();
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err);
    }
  }
}

// 监听路由参数变化
watch(
  () => route.params.id,
  (id) => fetchData(id),
  { immediate: true }
);

// 组件卸载时取消请求
onUnmounted(() => {
  if (controller) {
    controller.abort();
  }
});
</script>
```

---

## 问题 3：封装成 Composable

```javascript
// useCancelableFetch.js
import { ref, onUnmounted } from "vue";

export function useCancelableFetch() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  let controller = null;

  async function execute(url, options = {}) {
    // 取消之前的请求
    cancel();

    controller = new AbortController();
    loading.value = true;
    error.value = null;

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      data.value = await res.json();
    } catch (err) {
      if (err.name !== "AbortError") {
        error.value = err;
      }
    } finally {
      loading.value = false;
    }
  }

  function cancel() {
    if (controller) {
      controller.abort();
      controller = null;
    }
  }

  onUnmounted(cancel);

  return { data, loading, error, execute, cancel };
}
```

### 使用

```vue
<script setup>
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useCancelableFetch } from "./useCancelableFetch";

const route = useRoute();
const { data, loading, execute } = useCancelableFetch();

watch(
  () => route.params.id,
  (id) => execute(`/api/user/${id}`),
  { immediate: true }
);
</script>
```

---

## 问题 4：使用路由守卫

```javascript
// 在路由离开时取消请求
import { onBeforeRouteLeave } from "vue-router";

let controller = null;

async function fetchData() {
  controller = new AbortController();
  // ...
}

onBeforeRouteLeave(() => {
  if (controller) {
    controller.abort();
  }
});
```

---

## 问题 5：配合 Axios

```javascript
import axios from "axios";

// 创建取消令牌
const controller = new AbortController();

axios.get("/api/data", {
  signal: controller.signal,
});

// 取消请求
controller.abort();
```

### 封装 Axios 实例

```javascript
// api.js
import axios from "axios";

export function createCancelableRequest() {
  let controller = null;

  const instance = axios.create({
    baseURL: "/api",
  });

  // 请求拦截器
  instance.interceptors.request.use((config) => {
    // 取消之前的请求
    if (controller) {
      controller.abort();
    }

    controller = new AbortController();
    config.signal = controller.signal;

    return config;
  });

  return {
    instance,
    cancel: () => controller?.abort(),
  };
}
```

---

## 问题 6：全局请求管理

```javascript
// requestManager.js
class RequestManager {
  constructor() {
    this.controllers = new Map();
  }

  // 添加请求
  add(key) {
    this.cancel(key); // 取消同 key 的旧请求
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }

  // 取消请求
  cancel(key) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  // 取消所有请求
  cancelAll() {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }
}

export const requestManager = new RequestManager();

// 在路由守卫中使用
router.beforeEach(() => {
  requestManager.cancelAll();
});
```

## 延伸阅读

- [MDN - AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [Axios - 取消请求](https://axios-http.com/zh/docs/cancellation)
