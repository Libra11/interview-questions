---
title: Webpack devtool 的不同配置有什么区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 Webpack devtool 的各种配置选项，掌握不同场景下的最佳选择。
tags:
  - Webpack
  - devtool
  - Source Map
  - 配置
estimatedTime: 15 分钟
keywords:
  - devtool
  - Source Map 配置
  - eval
  - cheap
highlight: devtool 配置决定 Source Map 的生成方式，不同配置在构建速度、调试质量、文件大小之间有不同权衡。
order: 673
---

## 问题 1：配置选项概览

| 配置                         | 构建速度 | 重建速度 | 质量 | 生产环境 |
| ---------------------------- | -------- | -------- | ---- | -------- |
| (none)                       | +++      | +++      | 无   | ✅       |
| eval                         | +++      | +++      | 差   | ❌       |
| eval-source-map              | --       | +        | 最好 | ❌       |
| eval-cheap-source-map        | +        | ++       | 中等 | ❌       |
| eval-cheap-module-source-map | o        | ++       | 好   | ❌       |
| source-map                   | --       | --       | 最好 | ✅       |
| cheap-source-map             | +        | o        | 中等 | ❌       |
| cheap-module-source-map      | o        | -        | 好   | ❌       |

---

## 问题 2：关键词含义

### eval

使用 `eval()` 执行模块代码，Source Map 内联在 eval 中：

```javascript
eval("console.log('hello');\n//# sourceURL=./src/index.js");
```

**优点**：速度最快
**缺点**：调试体验差

### cheap

只映射行号，不映射列号：

```javascript
// 完整映射：第 10 行第 15 列
// cheap 映射：第 10 行
```

**优点**：生成更快
**缺点**：无法精确定位到列

### module

包含 loader 转换前的源代码：

```javascript
// 没有 module：显示 babel 转换后的代码
// 有 module：显示原始 ES6+ 代码
```

### inline

Source Map 内联到 bundle 中（Base64）：

```javascript
//# sourceMappingURL=data:application/json;base64,...
```

### hidden

生成 Source Map 但不引用：

```javascript
// 不会有 sourceMappingURL 注释
// 适合上传到错误监控服务
```

---

## 问题 3：开发环境推荐

```javascript
// 推荐：平衡速度和质量
devtool: 'eval-cheap-module-source-map',

// 追求速度
devtool: 'eval',

// 追求质量
devtool: 'eval-source-map',
```

---

## 问题 4：生产环境推荐

```javascript
// 方案1：不生成 Source Map（最安全）
devtool: false,

// 方案2：生成但不引用（上传到错误监控）
devtool: 'hidden-source-map',

// 方案3：完整 Source Map（仅内部使用）
devtool: 'source-map',
```

---

## 问题 5：实际配置示例

```javascript
module.exports = (env, argv) => ({
  devtool:
    argv.mode === "production"
      ? "hidden-source-map" // 生产环境
      : "eval-cheap-module-source-map", // 开发环境
});
```

---

## 问题 6：选择决策树

```
需要调试吗？
├── 否 → devtool: false
└── 是 → 是开发环境吗？
    ├── 是 → 需要精确到列吗？
    │   ├── 是 → eval-source-map
    │   └── 否 → eval-cheap-module-source-map
    └── 否 → 需要公开 Source Map 吗？
        ├── 是 → source-map
        └── 否 → hidden-source-map
```

## 延伸阅读

- [Devtool](https://webpack.js.org/configuration/devtool/)
- [Source Map 类型对比](https://webpack.js.org/configuration/devtool/#qualities)
