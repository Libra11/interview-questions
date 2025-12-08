---
title: 如何保证组件库 Tree-shaking？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握组件库 Tree-shaking 的实现原理和最佳实践。
tags:
  - Vue
  - Tree-shaking
  - 组件库
  - 打包优化
estimatedTime: 12 分钟
keywords:
  - Tree-shaking
  - 按需加载
  - ESM
highlight: 通过 ESM 格式、sideEffects 配置、具名导出实现有效的 Tree-shaking。
order: 271
---

## 问题 1：Tree-shaking 原理

Tree-shaking 依赖 **ES Module 的静态分析**：

```javascript
// ✅ ESM：可静态分析
import { Button } from "my-ui"; // 只打包 Button

// ❌ CommonJS：无法静态分析
const { Button } = require("my-ui"); // 可能打包全部
```

---

## 问题 2：ESM 格式输出

```javascript
// vite.config.ts
export default {
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        // 保持模块结构
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
  },
};
```

### 输出结构

```
es/
├── index.mjs
├── button/
│   └── index.mjs
├── table/
│   └── index.mjs
└── utils/
    └── index.mjs
```

---

## 问题 3：sideEffects 配置

```json
// package.json
{
  "sideEffects": false
}

// 或指定有副作用的文件
{
  "sideEffects": [
    "**/*.css",
    "**/*.scss",
    "./src/polyfill.js"
  ]
}
```

### 副作用示例

```javascript
// ❌ 有副作用：修改全局
Array.prototype.myMethod = function () {};

// ❌ 有副作用：立即执行
console.log("loaded");

// ✅ 无副作用：纯导出
export const add = (a, b) => a + b;
```

---

## 问题 4：具名导出

```typescript
// ❌ 默认导出对象：无法 tree-shake
export default {
  Button,
  Table,
  Input,
};

// ✅ 具名导出：可以 tree-shake
export { Button } from "./button";
export { Table } from "./table";
export { Input } from "./input";
```

---

## 问题 5：样式分离

```typescript
// 组件不直接引入样式
// button/index.ts
export { default as Button } from "./Button.vue";

// 样式单独导出
// button/style/index.ts
import "./index.scss";

// 使用时按需引入
import { Button } from "my-ui";
import "my-ui/es/button/style";
```

### 自动引入样式

```typescript
// unplugin-vue-components resolver
export function MyUIResolver() {
  return {
    resolve: (name: string) => {
      if (name.startsWith("My")) {
        return {
          name,
          from: "my-ui",
          sideEffects: `my-ui/es/${kebabCase(name)}/style`,
        };
      }
    },
  };
}
```

---

## 问题 6：避免循环依赖

```typescript
// ❌ 循环依赖影响 tree-shaking
// a.ts
import { b } from "./b";
export const a = () => b();

// b.ts
import { a } from "./a";
export const b = () => a();

// ✅ 提取公共依赖
// shared.ts
export const shared = () => {};

// a.ts
import { shared } from "./shared";
export const a = () => shared();
```

---

## 问题 7：验证 Tree-shaking

```javascript
// 使用 rollup-plugin-visualizer
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
    }),
  ],
};
```

### 检查打包结果

```bash
# 查看打包后是否包含未使用的代码
npx source-map-explorer dist/bundle.js
```

---

## 问题 8：最佳实践总结

| 实践            | 说明                |
| --------------- | ------------------- |
| ESM 格式        | 使用 ES Module 输出 |
| sideEffects     | 正确配置副作用      |
| 具名导出        | 避免默认导出对象    |
| 样式分离        | 样式按需加载        |
| 避免副作用      | 模块顶层不执行代码  |
| preserveModules | 保持模块结构        |

```typescript
// 完整配置示例
// vite.config.ts
export default {
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        preserveModules: true,
        exports: "named",
      },
    },
  },
};
```

## 延伸阅读

- [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
