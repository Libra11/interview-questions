---
title: Webpack 与 Vite 的最大区别是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  对比 Webpack 和 Vite 的核心差异，理解 Bundle-based 和 Native ESM 两种不同的开发模式。
tags:
  - Webpack
  - Vite
  - ESM
  - 构建工具
estimatedTime: 15 分钟
keywords:
  - Webpack vs Vite
  - Bundle
  - Native ESM
  - 开发服务器
highlight: Webpack 是 Bundle-based，启动时需要打包所有模块；Vite 利用浏览器原生 ESM，按需编译，启动极快。
order: 603
---

## 问题 1：最核心的区别是什么？

**开发模式下的模块处理方式完全不同**：

- **Webpack**：Bundle-based，启动时需要分析并打包所有模块
- **Vite**：Native ESM，利用浏览器原生 ES Module，按需编译

```
Webpack 开发模式：
源代码 → 打包所有模块 → Bundle → 浏览器

Vite 开发模式：
源代码 → 浏览器请求时按需编译 → 浏览器（原生 ESM）
```

这导致了**启动速度的巨大差异**：Webpack 项目越大启动越慢，Vite 几乎秒启动。

---

## 问题 2：为什么 Vite 开发时这么快？

Vite 的快主要体现在两个方面：

### 1. 冷启动快

Vite 不需要预先打包，直接启动开发服务器：

```javascript
// Vite 启动时
// 1. 预构建依赖（node_modules，使用 esbuild，极快）
// 2. 源代码不打包，等浏览器请求时再处理
```

### 2. 热更新快

Vite 的 HMR 是基于原生 ESM 的：

```javascript
// 修改一个文件时
// Webpack：可能需要重新构建整个依赖链
// Vite：只需要精确地让浏览器重新请求该模块
```

Vite 的热更新速度与项目规模无关，始终保持极快。

---

## 问题 3：生产构建有什么区别？

**生产环境下，两者都需要打包**：

- **Webpack**：使用自己的打包能力
- **Vite**：使用 Rollup 进行打包

```javascript
// Vite 生产构建
// 虽然开发时用原生 ESM，但生产环境仍然打包
// 原因：
// 1. 减少 HTTP 请求数量
// 2. 更好的代码压缩和 tree-shaking
// 3. 兼容不支持 ESM 的旧浏览器
```

所以生产构建的速度差异没有开发时那么明显。

---

## 问题 4：各自的优缺点？

### Webpack

**优点**：

- 生态成熟，插件丰富
- 高度可配置，适应复杂场景
- 社区庞大，问题容易解决

**缺点**：

- 配置复杂
- 大项目开发体验差（启动慢、HMR 慢）

### Vite

**优点**：

- 开发体验极佳（秒启动、快速 HMR）
- 配置简单，开箱即用
- 基于 ESM，更现代

**缺点**：

- 生态相对较新
- 某些复杂场景可能需要额外配置
- 开发和生产使用不同工具，可能有一致性问题

---

## 问题 5：如何选择？

```
新项目 + 现代浏览器 → Vite（更好的开发体验）
老项目 + 复杂配置 → Webpack（迁移成本高）
需要极致定制 → Webpack（生态更完善）
追求开发效率 → Vite（启动和 HMR 更快）
```

理解 Webpack 原理仍然很重要，因为 Vite 的很多概念（loader、plugin 等）都源自 Webpack。

## 延伸阅读

- [Vite 为什么快](https://cn.vitejs.dev/guide/why.html)
- [Webpack 官方文档](https://webpack.js.org/)
- [Vite 官方文档](https://vitejs.dev/)
