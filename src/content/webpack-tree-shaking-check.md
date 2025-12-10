---
title: 如何判断依赖是否可被 Tree-shaken？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握判断第三方库和自己代码是否支持 Tree-shaking 的方法，学会分析和验证 Tree-shaking 效果。
tags:
  - Webpack
  - Tree-shaking
  - 依赖分析
  - 打包优化
estimatedTime: 12 分钟
keywords:
  - Tree-shaking 判断
  - 依赖分析
  - ES Module
  - sideEffects
highlight: 通过检查 package.json 的 module 字段和 sideEffects 声明，结合打包分析工具，可以判断依赖是否支持 Tree-shaking。
order: 639
---

## 问题 1：检查 package.json 配置

查看第三方库的 package.json：

```json
{
  "name": "some-library",
  "main": "lib/index.js",
  "module": "es/index.js",
  "sideEffects": false
}
```

关键字段：

- **module**：指向 ES Module 版本，有此字段说明提供了 ESM
- **sideEffects**：声明是否有副作用，`false` 表示可以安全 Tree-shaking

---

## 问题 2：常见库的 Tree-shaking 支持

| 库        | 支持情况 | 说明                       |
| --------- | -------- | -------------------------- |
| lodash    | ❌       | CommonJS，需用 lodash-es   |
| lodash-es | ✅       | ES Module 版本             |
| antd      | ✅       | 需配合 babel-plugin-import |
| moment    | ❌       | 不支持，建议用 dayjs       |
| dayjs     | ✅       | 原生支持                   |
| rxjs      | ✅       | v6+ 支持                   |
| ramda     | ✅       | 原生支持                   |

---

## 问题 3：使用打包分析工具验证

### webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

plugins: [new BundleAnalyzerPlugin()];
```

可视化查看哪些代码被打包，判断 Tree-shaking 是否生效。

### 查看 Webpack 输出

```javascript
// webpack.config.js
stats: {
  usedExports: true,
  optimizationBailout: true,  // 显示未能优化的原因
}
```

---

## 问题 4：开发模式下的标记

在开发模式下，Webpack 会标记未使用的导出：

```javascript
// 打包后的代码中会有注释
/* unused harmony export unusedFunction */
```

如果看到这个标记，说明该导出会在生产模式下被移除。

---

## 问题 5：手动测试方法

```javascript
// 1. 只导入一个函数
import { debounce } from "lodash-es";

// 2. 打包后检查体积
// 如果体积明显小于整个库，说明 Tree-shaking 生效

// 3. 搜索未使用的函数名
// 如果打包结果中找不到 throttle，说明被移除了
```

快速验证脚本：

```bash
# 打包并查看体积
npm run build

# 搜索特定函数是否存在
grep -r "throttle" dist/
```

## 延伸阅读

- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
