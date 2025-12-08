---
title: Vue3 在多人团队协作中如何规范化？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 团队协作的规范化策略和工具配置。
tags:
  - Vue
  - 团队协作
  - 代码规范
  - 工程化
estimatedTime: 15 分钟
keywords:
  - 团队规范
  - ESLint
  - 代码风格
highlight: 通过 ESLint、Prettier、Git Hooks、TypeScript 等工具实现团队代码规范化。
order: 278
---

## 问题 1：代码风格统一

### ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
```

### Prettier 配置

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100
}
```

---

## 问题 2：Git Hooks

```json
// package.json
{
  "scripts": {
    "lint": "eslint . --ext .vue,.js,.ts --fix",
    "format": "prettier --write .",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{vue,js,ts}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx commitlint --edit $1
```

---

## 问题 3：Commit 规范

```javascript
// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复
        "docs", // 文档
        "style", // 格式
        "refactor", // 重构
        "perf", // 性能
        "test", // 测试
        "chore", // 构建/工具
        "revert", // 回滚
      ],
    ],
  },
};
```

```bash
# 正确的提交信息
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复表单验证问题"
git commit -m "docs: 更新 README"
```

---

## 问题 4：目录结构规范

```
src/
├── api/              # API 请求
│   └── modules/
├── assets/           # 静态资源
├── components/       # 公共组件
│   ├── common/       # 通用组件
│   └── business/     # 业务组件
├── composables/      # 组合式函数
├── directives/       # 自定义指令
├── layouts/          # 布局组件
├── router/           # 路由配置
├── stores/           # Pinia Store
├── styles/           # 全局样式
├── types/            # 类型定义
├── utils/            # 工具函数
└── views/            # 页面组件
    └── [module]/
        ├── components/  # 页面私有组件
        └── index.vue
```

---

## 问题 5：命名规范

```typescript
// 文件命名
// 组件：PascalCase
UserProfile.vue;
BaseButton.vue;

// 组合式函数：camelCase + use 前缀
useUser.ts;
usePermission.ts;

// 工具函数：camelCase
formatDate.ts;
validateEmail.ts;

// 类型定义：PascalCase
User.ts;
ApiResponse.ts;
```

```vue
<!-- 组件命名 -->
<script setup>
defineOptions({
  name: "UserProfile", // PascalCase
});
</script>

<!-- Props 命名 -->
<script setup>
defineProps<{
  userName: string      // camelCase
  isActive: boolean
}>()
</script>

<!-- 事件命名 -->
<script setup>
const emit = defineEmits<{
  'update:modelValue': [value: string]  // kebab-case
  'item-click': [id: number]
}>()
</script>
```

---

## 问题 6：TypeScript 规范

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

```typescript
// 类型定义规范
// ✅ 使用 interface 定义对象类型
interface User {
  id: number;
  name: string;
}

// ✅ 使用 type 定义联合类型
type Status = "pending" | "success" | "error";

// ✅ Props 类型定义
interface Props {
  title: string;
  count?: number;
}

// ❌ 避免使用 any
const data: any = {};

// ✅ 使用 unknown 或具体类型
const data: unknown = {};
```

---

## 问题 7：组件规范

```vue
<!-- 组件结构顺序 -->
<script setup lang="ts">
// 1. 导入
import { ref, computed } from "vue";
import type { User } from "@/types";

// 2. 类型定义
interface Props {
  user: User;
}

// 3. Props/Emits
const props = defineProps<Props>();
const emit = defineEmits<{
  update: [user: User];
}>();

// 4. 响应式数据
const count = ref(0);

// 5. 计算属性
const doubled = computed(() => count.value * 2);

// 6. 方法
function handleClick() {}

// 7. 生命周期
onMounted(() => {});

// 8. 暴露
defineExpose({ count });
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped lang="scss">
/* 样式 */
</style>
```

---

## 问题 8：文档规范

```typescript
/**
 * 用户服务
 * @description 处理用户相关的业务逻辑
 */
export const useUserService = () => {
  /**
   * 获取用户信息
   * @param id - 用户 ID
   * @returns 用户信息
   * @throws {Error} 用户不存在时抛出错误
   */
  async function getUser(id: number): Promise<User> {
    // ...
  }

  return { getUser };
};
```

### README 模板

```markdown
# 项目名称

## 技术栈

- Vue 3 + TypeScript
- Vite
- Pinia
- Vue Router

## 开发

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## 目录结构

...

## 开发规范

...
```

## 延伸阅读

- [Vue 风格指南](https://cn.vuejs.org/style-guide/)
- [ESLint Vue 插件](https://eslint.vuejs.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
