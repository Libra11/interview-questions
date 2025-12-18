---
title: 如何分析 Webpack Bundle 结构？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握分析 Webpack 打包结果的方法和工具，了解 bundle 的组成和优化方向。
tags:
  - Webpack
  - Bundle 分析
  - 性能优化
  - 工具
estimatedTime: 12 分钟
keywords:
  - Bundle 分析
  - webpack-bundle-analyzer
  - 体积优化
  - 依赖分析
highlight: 使用 webpack-bundle-analyzer 可视化分析 bundle 组成，找出体积大的模块和重复依赖，指导优化方向。
order: 838
---

## 问题 1：使用 webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "server", // 启动服务器
      analyzerPort: 8888,
      openAnalyzer: true,
    }),
  ],
};
```

或只生成报告：

```javascript
new BundleAnalyzerPlugin({
  analyzerMode: "static",
  reportFilename: "bundle-report.html",
  openAnalyzer: false,
});
```

---

## 问题 2：分析报告解读

```
可视化报告显示：
├── 每个 chunk 的大小
├── chunk 内每个模块的大小
├── 模块之间的包含关系
└── 三种大小：
    - stat: 原始大小
    - parsed: 解析后大小
    - gzip: 压缩后大小
```

关注点：

- 哪些模块最大？
- 是否有重复的依赖？
- 第三方库占比多少？

---

## 问题 3：使用 source-map-explorer

```bash
# 安装
npm install source-map-explorer -D

# 使用（需要有 source map）
npx source-map-explorer dist/*.js
```

更精确地分析代码来源。

---

## 问题 4：使用 stats.json

```bash
# 生成 stats 文件
webpack --json > stats.json
```

使用在线工具分析：

- [Webpack Analyse](https://webpack.github.io/analyse/)
- [Webpack Visualizer](https://chrisbateman.github.io/webpack-visualizer/)
- [Webpack Chart](https://alexkuz.github.io/webpack-chart/)

---

## 问题 5：分析脚本

```javascript
// scripts/analyze-bundle.js
const fs = require("fs");
const stats = require("../dist/stats.json");

// 按大小排序模块
const modules = stats.modules
  .map((m) => ({
    name: m.name,
    size: m.size,
  }))
  .sort((a, b) => b.size - a.size);

console.log("最大的 10 个模块：");
modules.slice(0, 10).forEach((m, i) => {
  console.log(`${i + 1}. ${(m.size / 1024).toFixed(2)}KB - ${m.name}`);
});

// 分析 node_modules 占比
const nodeModulesSize = modules
  .filter((m) => m.name.includes("node_modules"))
  .reduce((sum, m) => sum + m.size, 0);

const totalSize = modules.reduce((sum, m) => sum + m.size, 0);

console.log(
  `\nnode_modules 占比: ${((nodeModulesSize / totalSize) * 100).toFixed(1)}%`
);
```

---

## 问题 6：常见优化方向

```
分析结果 → 优化方向

1. 某个库很大
   → 寻找更小的替代库
   → 按需引入

2. 重复的依赖
   → 检查版本冲突
   → 使用 resolve.alias 统一

3. node_modules 占比过高
   → 代码分割
   → 使用 CDN externals

4. 业务代码过大
   → 路由懒加载
   → 组件按需加载
```

---

## 问题 7：npm scripts 配置

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:analyze": "webpack --mode production --env analyze",
    "build:stats": "webpack --mode production --json > stats.json"
  }
}
```

```javascript
// webpack.config.js
module.exports = (env) => ({
  plugins: [env.analyze && new BundleAnalyzerPlugin()].filter(Boolean),
});
```

## 延伸阅读

- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [source-map-explorer](https://github.com/danvk/source-map-explorer)
