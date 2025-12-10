---
title: 为什么生产环境不推荐用 inline-source-map？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 inline-source-map 的问题，掌握生产环境 Source Map 的最佳实践。
tags:
  - Webpack
  - Source Map
  - 生产环境
  - 安全
estimatedTime: 10 分钟
keywords:
  - inline-source-map
  - 生产环境
  - 文件体积
  - 安全风险
highlight: inline-source-map 将 Source Map 内联到 bundle 中，导致文件体积大幅增加，且暴露源代码，不适合生产环境。
order: 674
---

## 问题 1：inline-source-map 是什么？

**inline-source-map 将 Source Map 以 Base64 编码内联到 bundle 文件中**：

```javascript
// bundle.js 末尾
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6W119
```

---

## 问题 2：文件体积问题

```
没有 Source Map：
bundle.js: 100KB

使用 source-map：
bundle.js: 100KB
bundle.js.map: 300KB（单独文件，按需加载）

使用 inline-source-map：
bundle.js: 400KB（Source Map 内联）
```

**inline-source-map 让 bundle 体积增加 3-4 倍**，所有用户都要下载这些额外数据。

---

## 问题 3：安全风险

Source Map 包含完整的源代码：

```json
{
  "sourcesContent": [
    "// 你的业务逻辑代码",
    "// API 密钥、算法实现等",
    "// 都会暴露给用户"
  ]
}
```

使用 inline-source-map，任何人都能看到你的源代码。

---

## 问题 4：生产环境的正确做法

### 方案 1：不生成 Source Map

```javascript
// 最安全，但无法调试线上问题
devtool: false,
```

### 方案 2：hidden-source-map

```javascript
// 生成 Source Map 但不引用
devtool: 'hidden-source-map',

// bundle.js 中没有 sourceMappingURL
// 但会生成 bundle.js.map 文件
```

配合错误监控服务（如 Sentry）：

```javascript
// 上传 Source Map 到 Sentry
// 用户看不到，但 Sentry 可以解析错误堆栈
```

### 方案 3：nosources-source-map

```javascript
// 生成 Source Map 但不包含源代码
devtool: 'nosources-source-map',

// 可以看到文件名和行号
// 但看不到具体代码
```

---

## 问题 5：配置示例

```javascript
module.exports = {
  mode: "production",

  // 生产环境推荐配置
  devtool: process.env.UPLOAD_SOURCEMAP
    ? "hidden-source-map" // 需要上传到监控服务
    : false, // 不需要 Source Map

  // 配合 Sentry 等服务
  plugins: [
    process.env.UPLOAD_SOURCEMAP &&
      new SentryWebpackPlugin({
        include: "./dist",
        ignore: ["node_modules"],
      }),
  ].filter(Boolean),
};
```

---

## 问题 6：总结

| 配置                 | 文件体积 | 安全性 | 调试能力 | 推荐场景 |
| -------------------- | -------- | ------ | -------- | -------- |
| inline-source-map    | 大       | 低     | 好       | 仅开发   |
| source-map           | 正常     | 低     | 好       | 内部项目 |
| hidden-source-map    | 正常     | 高     | 好       | 配合监控 |
| nosources-source-map | 正常     | 中     | 中       | 折中方案 |
| false                | 最小     | 最高   | 无       | 最安全   |

## 延伸阅读

- [Devtool](https://webpack.js.org/configuration/devtool/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
