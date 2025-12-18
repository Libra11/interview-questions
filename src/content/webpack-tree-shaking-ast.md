---
title: Tree-shaking 在 AST 层面如何实现？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Tree-shaking 在 AST 层面的实现原理，掌握导出标记和死代码消除的过程。
tags:
  - Webpack
  - Tree-shaking
  - AST
  - 原理
estimatedTime: 15 分钟
keywords:
  - Tree-shaking AST
  - 导出分析
  - 死代码消除
  - 静态分析
highlight: Tree-shaking 通过 AST 分析 import/export 语句，标记未使用的导出，最后由压缩工具移除死代码。
order: 829
---

## 问题 1：整体流程

```
1. 解析阶段
   源代码 → AST → 识别 import/export
       │
       ↓
2. 标记阶段
   分析导出的使用情况 → 标记 used/unused
       │
       ↓
3. 消除阶段
   Terser 移除未使用的代码
```

---

## 问题 2：AST 中的 import/export

```javascript
// 源代码
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;

// AST 结构（简化）
{
  type: 'Program',
  body: [
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'VariableDeclaration',
        declarations: [{
          id: { name: 'add' },
          init: { type: 'ArrowFunctionExpression' }
        }]
      }
    },
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        id: { name: 'sub' },
        // ...
      }
    }
  ]
}
```

---

## 问题 3：导出收集

```javascript
// Webpack 解析模块时收集导出信息
class HarmonyExportDependencyParserPlugin {
  apply(parser) {
    parser.hooks.export.tap("Plugin", (statement) => {
      // 收集导出
      // export const add = ...
      // → 记录 'add' 为导出
    });

    parser.hooks.exportImport.tap("Plugin", (statement, source) => {
      // 收集重导出
      // export { foo } from './other'
    });
  }
}
```

---

## 问题 4：使用情况分析

```javascript
// 入口文件
import { add } from "./math";
console.log(add(1, 2));

// Webpack 分析：
// 1. 解析 import 语句
// 2. 记录 'add' 被使用
// 3. 'sub' 没有被导入，标记为 unused
```

在 ModuleGraph 中记录：

```javascript
// ExportsInfo 记录每个导出的使用状态
exportsInfo.setUsedInUnknownWay(); // 被使用
exportsInfo.setUsedConditionally(); // 条件使用
// 未调用任何方法 → 未使用
```

---

## 问题 5：标记未使用的导出

```javascript
// 开发模式下，Webpack 添加注释标记
// 打包结果：
/* unused harmony export sub */
const add = (a, b) => a + b;
const sub = (a, b) => a - b; // 被标记为未使用
```

---

## 问题 6：Terser 消除死代码

```javascript
// Terser 接收标记后的代码
// 识别 unused harmony export 注释
// 移除未使用的代码

// 输入
/* unused harmony export sub */
const add = (a, b) => a + b;
const sub = (a, b) => a - b;

// 输出
const add = (a, b) => a + b;
// sub 被移除
```

---

## 问题 7：为什么需要 ES Module？

```javascript
// ES Module 是静态的
import { add } from "./math"; // 编译时确定

// CommonJS 是动态的
const math = require("./math");
math[getMethod()](); // 运行时才知道用了什么

// AST 分析时：
// ES Module → 可以确定使用了哪些导出
// CommonJS → 无法静态分析
```

这就是为什么 Tree-shaking 只对 ES Module 有效。

## 延伸阅读

- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Terser](https://github.com/terser/terser)
