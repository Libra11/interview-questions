---
title: 为什么 Webpack 打包报 "Module not found"？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  排查 Webpack "Module not found" 错误的常见原因，掌握解决模块解析问题的方法。
tags:
  - Webpack
  - 错误排查
  - Module not found
  - 调试
estimatedTime: 10 分钟
keywords:
  - Module not found
  - 模块未找到
  - 路径错误
  - 解析问题
highlight: Module not found 错误通常由路径拼写错误、缺少依赖、扩展名配置或别名配置问题导致。
order: 706
---

## 问题 1：检查路径拼写

```javascript
// ❌ 拼写错误
import { utils } from "./utlis"; // utlis 拼错了

// ✅ 正确拼写
import { utils } from "./utils";
```

注意大小写（Linux 系统区分大小写）：

```javascript
// ❌ 大小写错误
import Header from "./header"; // 文件是 Header.js

// ✅ 正确大小写
import Header from "./Header";
```

---

## 问题 2：检查依赖安装

```bash
# 检查 package.json 中是否有该依赖
# 检查 node_modules 中是否存在

# 重新安装依赖
rm -rf node_modules
npm install
```

---

## 问题 3：检查扩展名配置

```javascript
// 默认只解析 .js
// 如果使用其他扩展名，需要配置

module.exports = {
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },
};
```

```javascript
// ❌ 没有配置 .jsx 扩展名
import App from "./App"; // App.jsx

// ✅ 配置后可以省略扩展名
// 或显式写扩展名
import App from "./App.jsx";
```

---

## 问题 4：检查别名配置

```javascript
// 使用别名
import utils from "@/utils";

// 需要配置 resolve.alias
module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
```

---

## 问题 5：检查 node_modules 解析

```javascript
// 如果是 monorepo 或特殊目录结构
module.exports = {
  resolve: {
    modules: [
      path.resolve(__dirname, "src"),
      "node_modules",
      // 添加其他模块目录
    ],
  },
};
```

---

## 问题 6：检查 package.json 的 main/module 字段

```json
// 第三方库的 package.json
{
  "main": "lib/index.js",
  "module": "es/index.js"
}

// 如果这些文件不存在，会报错
// 检查库是否正确安装
```

---

## 问题 7：常见错误信息解读

```
Module not found: Error: Can't resolve './utils'
→ 相对路径文件不存在

Module not found: Error: Can't resolve 'lodash'
→ npm 包未安装

Module not found: Error: Can't resolve '@/utils'
→ 别名未配置

Module not found: Error: Can't resolve './App' in '/path/to/src'
→ 检查 src 目录下是否有 App.js/App.jsx 等
```

---

## 问题 8：排查清单

```
□ 检查路径拼写和大小写
□ 检查依赖是否安装（npm install）
□ 检查 resolve.extensions 配置
□ 检查 resolve.alias 配置
□ 检查文件是否真的存在
□ 检查 node_modules 是否完整
□ 尝试删除 node_modules 重新安装
```

## 延伸阅读

- [Module Resolution](https://webpack.js.org/concepts/module-resolution/)
- [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions)
