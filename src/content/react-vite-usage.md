---
title: React 如何使用 Vite？
category: 工程化
difficulty: 入门
updatedAt: 2025-12-09
summary: >-
  掌握使用 Vite 创建和配置 React 项目的方法。
tags:
  - React
  - Vite
  - 工程化
  - 开发工具
estimatedTime: 10 分钟
keywords:
  - React Vite
  - Vite setup
  - Vite configuration
  - fast development
highlight: Vite 提供极快的开发服务器启动和热更新，是 React 项目的现代化构建工具选择。
order: 289
---

## 问题 1：创建 React + Vite 项目

### 使用模板创建

```bash
# npm
npm create vite@latest my-react-app -- --template react

# TypeScript 模板
npm create vite@latest my-react-app -- --template react-ts

# pnpm
pnpm create vite my-react-app --template react-ts

# yarn
yarn create vite my-react-app --template react-ts
```

### 项目结构

```
my-react-app/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 问题 2：基础配置

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // 路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 开发服务器
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
```

### tsconfig.json 路径别名

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 问题 3：常用插件

### 自动导入

```typescript
// vite.config.ts
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  plugins: [
    react(),
    AutoImport({
      imports: ["react", "react-router-dom"],
      dts: "src/auto-imports.d.ts",
    }),
  ],
});

// 使用时无需手动导入
// const [count, setCount] = useState(0);  // 自动导入 useState
```

### SVG 组件

```typescript
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
});

// 使用
import { ReactComponent as Logo } from "./logo.svg";
<Logo />;
```

---

## 问题 4：生产构建配置

### 构建优化

```typescript
export default defineConfig({
  build: {
    // 输出目录
    outDir: "dist",

    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },

    // 压缩
    minify: "esbuild", // 或 'terser'

    // 生成 sourcemap
    sourcemap: false,
  },
});
```

### 环境变量

```bash
# .env
VITE_API_URL=http://localhost:8080

# .env.production
VITE_API_URL=https://api.example.com
```

```typescript
// 使用
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 问题 5：与 Webpack 对比

### 开发体验

| 方面       | Vite           | Webpack      |
| ---------- | -------------- | ------------ |
| 启动速度   | 极快（毫秒级） | 较慢（秒级） |
| 热更新     | 极快           | 较慢         |
| 配置复杂度 | 简单           | 复杂         |
| 生态       | 较新           | 成熟         |

### 原理差异

```javascript
// Webpack：打包所有模块后启动
// 项目越大，启动越慢

// Vite：利用浏览器原生 ES Modules
// 按需编译，启动极快
```

---

## 问题 6：迁移现有项目

### 从 CRA 迁移

```bash
# 1. 安装依赖
npm install vite @vitejs/plugin-react -D

# 2. 创建 vite.config.ts

# 3. 移动 index.html 到根目录

# 4. 修改 index.html
<script type="module" src="/src/main.tsx"></script>

# 5. 更新 package.json scripts
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}

# 6. 删除 react-scripts
npm uninstall react-scripts
```

## 总结

| 特性       | 说明         |
| ---------- | ------------ |
| 快速启动   | 毫秒级冷启动 |
| 热更新     | 极快的 HMR   |
| 简单配置   | 开箱即用     |
| TypeScript | 原生支持     |

## 延伸阅读

- [Vite 官方文档](https://vitejs.dev/)
- [Vite React 插件](https://github.com/vitejs/vite-plugin-react)
