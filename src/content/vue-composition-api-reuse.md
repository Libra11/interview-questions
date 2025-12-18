---
title: Composition API 如何实现逻辑复用？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Composables 的设计模式，理解如何通过组合式函数实现逻辑复用。
tags:
  - Vue
  - Composition API
  - Composables
  - 逻辑复用
estimatedTime: 15 分钟
keywords:
  - composables
  - 逻辑复用
  - use 函数
highlight: 通过 Composables（组合式函数）封装和复用有状态逻辑，是 Composition API 的核心优势。
order: 480
---

## 问题 1：什么是 Composables？

Composables 是利用 Composition API 封装的**可复用函数**，通常以 `use` 开头命名。

```javascript
// useMouse.js - 追踪鼠标位置
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}

// 组件中使用
import { useMouse } from './useMouse'

setup() {
  const { x, y } = useMouse()
  return { x, y }
}
```

---

## 问题 2：Composables vs Mixins

### Mixins 的问题

```javascript
// mixin.js
export const searchMixin = {
  data() {
    return { query: "", results: [] };
  },
  methods: {
    search() {
      /* ... */
    },
  },
};

// 组件中
export default {
  mixins: [searchMixin, sortMixin],
  data() {
    return { query: "" }; // ❌ 命名冲突！
  },
};
```

Mixins 的缺陷：

- **命名冲突**：多个 mixin 可能有同名属性
- **来源不清**：不知道属性来自哪个 mixin
- **隐式依赖**：mixin 之间可能相互依赖

### Composables 的优势

```javascript
// useSearch.js
export function useSearch() {
  const query = ref('')
  const results = ref([])
  const search = () => { /* ... */ }
  return { query, results, search }
}

// 组件中
setup() {
  // ✅ 来源清晰
  const { query: searchQuery, results } = useSearch()
  const { query: filterQuery } = useFilter()

  // ✅ 可以重命名避免冲突
  return { searchQuery, filterQuery, results }
}
```

---

## 问题 3：常见的 Composable 模式

### 模式一：状态封装

```javascript
// useCounter.js
export function useCounter(initialValue = 0) {
  const count = ref(initialValue);

  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => (count.value = initialValue);

  return { count, increment, decrement, reset };
}
```

### 模式二：异步数据获取

```javascript
// useFetch.js
export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(true);

  fetch(url)
    .then((res) => res.json())
    .then((json) => (data.value = json))
    .catch((err) => (error.value = err))
    .finally(() => (loading.value = false));

  return { data, error, loading };
}

// 使用
const { data: user, loading } = useFetch("/api/user");
```

### 模式三：副作用管理

```javascript
// useEventListener.js
export function useEventListener(target, event, callback) {
  onMounted(() => target.addEventListener(event, callback));
  onUnmounted(() => target.removeEventListener(event, callback));
}

// useInterval.js
export function useInterval(callback, delay) {
  const id = ref(null);

  onMounted(() => {
    id.value = setInterval(callback, delay);
  });

  onUnmounted(() => {
    clearInterval(id.value);
  });
}
```

### 模式四：响应式转换

```javascript
// useLocalStorage.js
export function useLocalStorage(key, defaultValue) {
  const data = ref(JSON.parse(localStorage.getItem(key)) ?? defaultValue);

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  return data;
}

// 使用
const settings = useLocalStorage("settings", { theme: "dark" });
settings.value.theme = "light"; // 自动同步到 localStorage
```

---

## 问题 4：Composables 的组合

```javascript
// 组合多个 composables
export function useUserDashboard(userId) {
  // 复用其他 composables
  const { data: user, loading: userLoading } = useFetch(`/api/users/${userId}`);
  const { data: posts, loading: postsLoading } = useFetch(
    `/api/users/${userId}/posts`
  );

  const loading = computed(() => userLoading.value || postsLoading.value);

  return { user, posts, loading };
}
```

---

## 问题 5：接收响应式参数

```javascript
// 支持 ref 或普通值作为参数
export function useFetch(url) {
  const data = ref(null);

  // 使用 watchEffect 自动追踪 url 变化
  watchEffect(async () => {
    // toValue 处理 ref 或 getter
    const response = await fetch(toValue(url));
    data.value = await response.json();
  });

  return { data };
}

// 使用方式
const userId = ref(1);
const { data } = useFetch(() => `/api/users/${userId.value}`);

// userId 变化时自动重新请求
userId.value = 2;
```

---

## 问题 6：最佳实践

### 命名规范

```javascript
// ✅ 以 use 开头
useCounter();
useFetch();
useLocalStorage();

// ❌ 不推荐
counter();
fetchData();
```

### 返回值规范

```javascript
// ✅ 返回对象，方便解构和重命名
return { count, increment, decrement };

// ✅ 如果只有一个值，也可以直接返回
return count;
```

### 保持单一职责

```javascript
// ❌ 功能太多
function useEverything() {
  // 用户、权限、主题、路由...
}

// ✅ 职责单一
function useAuth() {
  /* 只处理认证 */
}
function useTheme() {
  /* 只处理主题 */
}
```

## 延伸阅读

- [Vue 官方文档 - 组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)
- [VueUse](https://vueuse.org/) - 实用的 Composables 集合
