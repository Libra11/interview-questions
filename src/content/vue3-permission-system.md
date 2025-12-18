---
title: 如何设计可扩展的权限系统？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 中权限系统的设计思路和实现方案。
tags:
  - Vue
  - 权限系统
  - RBAC
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 权限系统
  - RBAC
  - 路由权限
  - 按钮权限
highlight: 通过 RBAC 模型、路由守卫、指令和组件实现多层次的权限控制。
order: 623
---

## 问题 1：权限模型设计

```typescript
// RBAC 模型
interface User {
  id: number;
  roles: string[];
}

interface Role {
  name: string;
  permissions: string[];
}

interface Permission {
  code: string; // 权限码
  name: string; // 权限名称
  type: "menu" | "button" | "api";
}

// 权限数据示例
const permissions = [
  { code: "user:list", name: "用户列表", type: "menu" },
  { code: "user:create", name: "创建用户", type: "button" },
  { code: "user:delete", name: "删除用户", type: "button" },
];
```

---

## 问题 2：权限 Store

```typescript
// stores/permission.ts
export const usePermissionStore = defineStore("permission", () => {
  const permissions = ref<string[]>([]);
  const roles = ref<string[]>([]);

  // 设置权限
  function setPermissions(perms: string[]) {
    permissions.value = perms;
  }

  // 检查权限
  function hasPermission(code: string | string[]) {
    if (Array.isArray(code)) {
      return code.some((c) => permissions.value.includes(c));
    }
    return permissions.value.includes(code);
  }

  // 检查角色
  function hasRole(role: string | string[]) {
    if (Array.isArray(role)) {
      return role.some((r) => roles.value.includes(r));
    }
    return roles.value.includes(role);
  }

  return { permissions, roles, setPermissions, hasPermission, hasRole };
});
```

---

## 问题 3：路由权限

```typescript
// router/index.ts
const routes = [
  {
    path: "/user",
    component: UserLayout,
    meta: { permission: "user:list" },
    children: [
      {
        path: "create",
        component: UserCreate,
        meta: { permission: "user:create" },
      },
    ],
  },
];

// 路由守卫
router.beforeEach((to, from, next) => {
  const permissionStore = usePermissionStore();

  if (to.meta.permission) {
    if (!permissionStore.hasPermission(to.meta.permission)) {
      return next("/403");
    }
  }

  next();
});
```

### 动态路由

```typescript
// 根据权限动态添加路由
async function generateRoutes() {
  const permissionStore = usePermissionStore();
  const asyncRoutes = await fetchAsyncRoutes();

  const accessedRoutes = filterRoutes(asyncRoutes, (route) => {
    if (route.meta?.permission) {
      return permissionStore.hasPermission(route.meta.permission);
    }
    return true;
  });

  accessedRoutes.forEach((route) => {
    router.addRoute(route);
  });
}
```

---

## 问题 4：按钮权限指令

```typescript
// directives/permission.ts
export const vPermission: Directive = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore();
    const { value } = binding;

    if (!permissionStore.hasPermission(value)) {
      el.parentNode?.removeChild(el);
    }
  },
};

// 使用
app.directive("permission", vPermission);
```

```vue
<template>
  <button v-permission="'user:create'">创建用户</button>
  <button v-permission="['user:edit', 'user:delete']">编辑</button>
</template>
```

---

## 问题 5：权限组件

```vue
<!-- components/Permission.vue -->
<script setup lang="ts">
const props = defineProps<{
  code: string | string[];
  mode?: "remove" | "disable";
}>();

const permissionStore = usePermissionStore();
const hasPermission = computed(() => permissionStore.hasPermission(props.code));
</script>

<template>
  <template v-if="mode === 'disable'">
    <div :class="{ disabled: !hasPermission }">
      <slot />
    </div>
  </template>
  <template v-else>
    <slot v-if="hasPermission" />
  </template>
</template>
```

```vue
<!-- 使用 -->
<Permission code="user:delete">
  <button>删除</button>
</Permission>

<Permission code="user:edit" mode="disable">
  <button>编辑</button>
</Permission>
```

---

## 问题 6：Composable 封装

```typescript
// composables/usePermission.ts
export function usePermission() {
  const permissionStore = usePermissionStore();

  const hasPermission = (code: string | string[]) => {
    return permissionStore.hasPermission(code);
  };

  const hasRole = (role: string | string[]) => {
    return permissionStore.hasRole(role);
  };

  const checkAccess = (options: {
    permission?: string | string[];
    role?: string | string[];
  }) => {
    if (options.permission && !hasPermission(options.permission)) {
      return false;
    }
    if (options.role && !hasRole(options.role)) {
      return false;
    }
    return true;
  };

  return { hasPermission, hasRole, checkAccess };
}
```

```vue
<script setup>
const { hasPermission } = usePermission();

const canEdit = computed(() => hasPermission("user:edit"));
</script>
```

---

## 问题 7：菜单权限

```typescript
// 根据权限过滤菜单
function filterMenus(menus: MenuItem[]): MenuItem[] {
  const permissionStore = usePermissionStore();

  return menus.filter((menu) => {
    if (menu.permission && !permissionStore.hasPermission(menu.permission)) {
      return false;
    }

    if (menu.children) {
      menu.children = filterMenus(menu.children);
    }

    return true;
  });
}
```

---

## 问题 8：权限缓存与刷新

```typescript
// 登录时获取权限
async function login(credentials) {
  const { token, user } = await authApi.login(credentials);

  // 获取用户权限
  const permissions = await authApi.getPermissions();

  const permissionStore = usePermissionStore();
  permissionStore.setPermissions(permissions);

  // 生成动态路由
  await generateRoutes();
}

// 权限变更时刷新
async function refreshPermissions() {
  const permissions = await authApi.getPermissions();
  const permissionStore = usePermissionStore();
  permissionStore.setPermissions(permissions);

  // 重新生成路由
  router.getRoutes().forEach((route) => {
    if (route.meta?.dynamic) {
      router.removeRoute(route.name);
    }
  });
  await generateRoutes();
}
```

## 延伸阅读

- [RBAC 权限模型](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Vue Router 导航守卫](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html)
