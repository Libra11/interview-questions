---
title: 如何构建多租户 Vue3 应用？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 多租户应用的架构设计和实现方案。
tags:
  - Vue
  - 多租户
  - SaaS
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 多租户
  - SaaS
  - 租户隔离
highlight: 通过租户识别、配置隔离、主题定制实现多租户 SaaS 应用。
order: 275
---

## 问题 1：多租户架构模式

```
┌─────────────────────────────────────┐
│           Vue3 应用                  │
├─────────────────────────────────────┤
│  租户 A  │  租户 B  │  租户 C       │
├──────────┴──────────┴───────────────┤
│           共享代码库                 │
├─────────────────────────────────────┤
│     租户配置  │  主题  │  权限       │
└─────────────────────────────────────┘
```

---

## 问题 2：租户识别

```typescript
// 方式一：子域名
// tenant-a.example.com
function getTenantFromSubdomain() {
  const host = window.location.host;
  const subdomain = host.split(".")[0];
  return subdomain;
}

// 方式二：路径
// example.com/tenant-a/
function getTenantFromPath() {
  const path = window.location.pathname;
  const tenant = path.split("/")[1];
  return tenant;
}

// 方式三：请求头
// X-Tenant-ID: tenant-a
async function getTenantFromHeader() {
  const response = await fetch("/api/tenant");
  return response.headers.get("X-Tenant-ID");
}
```

---

## 问题 3：租户 Store

```typescript
// stores/tenant.ts
export const useTenantStore = defineStore("tenant", () => {
  const tenantId = ref("");
  const config = ref<TenantConfig | null>(null);
  const theme = ref<TenantTheme | null>(null);

  async function init() {
    tenantId.value = getTenantId();

    // 加载租户配置
    const [configData, themeData] = await Promise.all([
      api.getTenantConfig(tenantId.value),
      api.getTenantTheme(tenantId.value),
    ]);

    config.value = configData;
    theme.value = themeData;

    // 应用主题
    applyTheme(themeData);
  }

  return { tenantId, config, theme, init };
});

// main.ts
const tenantStore = useTenantStore();
await tenantStore.init();
app.mount("#app");
```

---

## 问题 4：主题定制

```typescript
// 租户主题配置
interface TenantTheme {
  primaryColor: string;
  logo: string;
  favicon: string;
  title: string;
}

function applyTheme(theme: TenantTheme) {
  // CSS 变量
  document.documentElement.style.setProperty(
    "--primary-color",
    theme.primaryColor
  );

  // Logo
  const logoEl = document.querySelector(".logo img");
  if (logoEl) logoEl.src = theme.logo;

  // Favicon
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) favicon.href = theme.favicon;

  // Title
  document.title = theme.title;
}
```

```vue
<!-- 组件中使用 -->
<template>
  <header :style="{ backgroundColor: tenantStore.theme?.primaryColor }">
    <img :src="tenantStore.theme?.logo" />
  </header>
</template>
```

---

## 问题 5：功能开关

```typescript
// 租户功能配置
interface TenantFeatures {
  enableAnalytics: boolean;
  enableExport: boolean;
  maxUsers: number;
  modules: string[];
}

// composables/useFeature.ts
export function useFeature() {
  const tenantStore = useTenantStore();

  function isEnabled(feature: keyof TenantFeatures) {
    return tenantStore.config?.features?.[feature] ?? false;
  }

  function hasModule(module: string) {
    return tenantStore.config?.features?.modules?.includes(module) ?? false;
  }

  return { isEnabled, hasModule };
}
```

```vue
<script setup>
const { isEnabled, hasModule } = useFeature();
</script>

<template>
  <ExportButton v-if="isEnabled('enableExport')" />
  <AnalyticsDashboard v-if="hasModule('analytics')" />
</template>
```

---

## 问题 6：API 请求拦截

```typescript
// 自动添加租户标识
axios.interceptors.request.use((config) => {
  const tenantStore = useTenantStore();

  // 添加租户 ID 到请求头
  config.headers["X-Tenant-ID"] = tenantStore.tenantId;

  // 或添加到 URL
  config.baseURL = `/api/${tenantStore.tenantId}`;

  return config;
});
```

---

## 问题 7：路由配置

```typescript
// 动态路由前缀
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/:tenant",
      component: TenantLayout,
      children: [
        { path: "dashboard", component: Dashboard },
        { path: "users", component: Users },
      ],
    },
  ],
});

// 路由守卫验证租户
router.beforeEach(async (to) => {
  const tenantStore = useTenantStore();
  const tenantParam = to.params.tenant as string;

  if (tenantParam !== tenantStore.tenantId) {
    // 切换租户
    await tenantStore.switchTenant(tenantParam);
  }
});
```

---

## 问题 8：数据隔离

```typescript
// 所有 API 请求自动带租户上下文
class TenantApi {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async getUsers() {
    return axios.get("/users", {
      headers: { "X-Tenant-ID": this.tenantId },
    });
  }
}

// Store 中使用
export const useUserStore = defineStore("user", () => {
  const tenantStore = useTenantStore();
  const api = computed(() => new TenantApi(tenantStore.tenantId));

  async function fetchUsers() {
    const { data } = await api.value.getUsers();
    users.value = data;
  }

  return { fetchUsers };
});
```

### 缓存隔离

```typescript
// 按租户隔离缓存
function getCacheKey(key: string) {
  const tenantStore = useTenantStore();
  return `${tenantStore.tenantId}:${key}`;
}

localStorage.setItem(getCacheKey("user"), JSON.stringify(user));
```

## 延伸阅读

- [SaaS 多租户架构](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [Vue 企业级应用架构](https://cn.vuejs.org/guide/scaling-up/ssr.html)
