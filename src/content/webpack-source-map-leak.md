---
title: Source Map 如何泄露源代码？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  了解 Source Map 泄露源代码的风险，掌握生产环境的安全配置方案。
tags:
  - Webpack
  - Source Map
  - 安全
  - 生产环境
estimatedTime: 10 分钟
keywords:
  - Source Map 泄露
  - 源代码安全
  - 生产环境配置
  - 代码保护
highlight: Source Map 文件包含完整的源代码映射，如果在生产环境暴露，任何人都可以通过浏览器开发者工具查看原始代码。
order: 806
---

## 问题 1：泄露方式

### 1. 直接引用 Source Map

```javascript
// bundle.js 末尾
//# sourceMappingURL=bundle.js.map
```

浏览器会自动请求 `bundle.js.map`，在 DevTools 中显示源代码。

### 2. 内联 Source Map

```javascript
// inline-source-map 配置
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLC...
```

Source Map 直接嵌入在 bundle 中，无需额外请求。

---

## 问题 2：泄露的内容

Source Map 文件包含：

```json
{
  "sources": ["src/api/auth.js", "src/utils/crypto.js"],
  "sourcesContent": [
    "// 完整的源代码",
    "const API_SECRET = 'xxx';",
    "function encryptData(data) { ... }"
  ]
}
```

**泄露风险**：

- 业务逻辑和算法
- API 密钥和配置
- 代码结构和架构
- 注释中的敏感信息

---

## 问题 3：如何查看泄露的源码

```
1. 打开 Chrome DevTools
2. 切换到 Sources 面板
3. 在 webpack:// 目录下查看源代码
4. 可以看到完整的、未压缩的源代码
```

---

## 问题 4：安全配置方案

### 方案 1：不生成 Source Map

```javascript
// 最安全
devtool: false,
```

### 方案 2：hidden-source-map

```javascript
// 生成但不引用
devtool: 'hidden-source-map',

// 配合错误监控服务使用
// 上传到 Sentry 等平台
```

### 方案 3：nosources-source-map

```javascript
// 不包含源代码内容
devtool: 'nosources-source-map',

// 只有文件名和行号
// 无法看到具体代码
```

### 方案 4：服务器限制访问

```nginx
# Nginx 配置：禁止外部访问 .map 文件
location ~* \.map$ {
  deny all;
  # 或只允许内网访问
  allow 10.0.0.0/8;
  deny all;
}
```

---

## 问题 5：推荐配置

```javascript
module.exports = {
  devtool:
    process.env.NODE_ENV === "production"
      ? "hidden-source-map" // 生产环境
      : "eval-cheap-module-source-map", // 开发环境
};
```

配合 CI/CD 上传 Source Map 到监控服务，然后删除：

```bash
# 构建后上传到 Sentry
sentry-cli releases files upload-sourcemaps ./dist

# 删除 .map 文件
rm -f ./dist/*.map
```

## 延伸阅读

- [Devtool](https://webpack.js.org/configuration/devtool/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
