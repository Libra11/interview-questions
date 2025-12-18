---
title: Webpack vs ESBuild？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  对比 Webpack 和 ESBuild 的特点，了解各自的适用场景。
tags:
  - Webpack
  - ESBuild
  - 构建工具
  - 对比
estimatedTime: 12 分钟
keywords:
  - ESBuild
  - 构建速度
  - 工具对比
  - 选型
highlight: ESBuild 用 Go 编写，速度极快但功能有限；Webpack 功能全面但较慢。可以结合使用，用 esbuild-loader 加速 Webpack。
order: 816
---

## 问题 1：核心差异

| 特性       | Webpack    | ESBuild         |
| ---------- | ---------- | --------------- |
| 语言       | JavaScript | Go              |
| 速度       | 慢         | 极快（10-100x） |
| 插件生态   | 丰富       | 有限            |
| 配置复杂度 | 高         | 低              |
| 功能完整性 | 全面       | 基础            |
| HMR        | 成熟       | 基础支持        |

---

## 问题 2：速度对比

```
构建 10000 个模块：
Webpack:  30-60 秒
ESBuild:  0.3-0.5 秒
```

ESBuild 快的原因：

- Go 语言编写，编译为原生代码
- 并行处理
- 内存高效
- 从零设计，无历史包袱

---

## 问题 3：ESBuild 的限制

```javascript
// ❌ ESBuild 不支持或支持有限
// 1. 某些 Babel 插件功能
// 2. CSS Modules 的某些特性
// 3. 复杂的代码分割策略
// 4. 某些 TypeScript 特性（const enum）
// 5. 成熟的 HMR 生态
```

---

## 问题 4：结合使用

在 Webpack 中使用 esbuild-loader：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "jsx",
          target: "es2015",
        },
      },
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2015",
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new EsbuildPlugin({
        target: "es2015",
      }),
    ],
  },
};
```

获得 ESBuild 的速度 + Webpack 的功能。

---

## 问题 5：选择建议

### 选择 Webpack

- 大型企业级项目
- 需要复杂的代码分割
- 依赖特定 Webpack 插件
- 需要成熟的 HMR

### 选择 ESBuild

- 小型项目或库
- 追求极致构建速度
- 简单的打包需求
- 作为其他工具的底层（如 Vite）

### 结合使用

- 用 esbuild-loader 替代 babel-loader
- 用 ESBuild 做压缩
- 保留 Webpack 的其他功能

---

## 问题 6：未来趋势

```
Webpack → 功能全面，生态成熟
ESBuild → 速度标杆，功能在完善
Vite    → 开发用 ESBuild，生产用 Rollup
Turbopack → Webpack 团队的下一代工具
```

## 延伸阅读

- [ESBuild](https://esbuild.github.io/)
- [esbuild-loader](https://github.com/privatenumber/esbuild-loader)
