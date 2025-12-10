---
title: Module Federation 如何避免多版本 React 冲突？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  掌握在 Module Federation 中避免 React 多版本冲突的方法，确保 Hooks 正常工作。
tags:
  - Webpack
  - Module Federation
  - React
  - 版本冲突
estimatedTime: 12 分钟
keywords:
  - React 冲突
  - 多版本
  - singleton
  - Hooks 报错
highlight: 通过 singleton 配置确保只加载一个 React 实例，配合 strictVersion 和 requiredVersion 保证版本兼容。
order: 670
---

## 问题 1：为什么会有冲突？

**React Hooks 要求整个应用只有一个 React 实例**：

```javascript
// 如果存在多个 React 实例
// Host: React 18.2.0
// Remote: React 18.1.0

// 使用 Hooks 时会报错：
// "Invalid hook call. Hooks can only be called inside of the body of a function component."
```

这是因为 Hooks 的状态存储在 React 内部，多个实例无法共享状态。

---

## 问题 2：使用 Singleton

**singleton: true 确保只加载一个 React 版本**：

```javascript
// Host 和 Remote 都配置
new ModuleFederationPlugin({
  shared: {
    react: {
      singleton: true, // 关键配置
      requiredVersion: "^18.0.0",
    },
    "react-dom": {
      singleton: true,
      requiredVersion: "^18.0.0",
    },
  },
});
```

---

## 问题 3：版本兼容性检查

```javascript
shared: {
  react: {
    singleton: true,
    // 严格版本检查
    strictVersion: true,
    // 要求的版本范围
    requiredVersion: '^18.0.0',
  },
}
```

如果版本不兼容：

- `strictVersion: true`：构建时报错
- `strictVersion: false`：运行时警告，可能出问题

---

## 问题 4：统一版本管理

### 方案 1：统一 package.json

```json
// 所有应用使用相同版本
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

### 方案 2：使用版本范围

```javascript
// 允许小版本差异
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0',  // 18.x.x 都可以
  },
}
```

### 方案 3：固定版本

```javascript
// 严格固定版本
shared: {
  react: {
    singleton: true,
    strictVersion: true,
    requiredVersion: '18.2.0',  // 必须是 18.2.0
  },
}
```

---

## 问题 5：调试版本问题

```javascript
// 检查加载了哪些版本
console.log("React version:", React.version);

// 检查是否是同一个实例
// 在 Host 和 Remote 中分别执行
console.log("React:", React);
// 如果是同一个对象，说明共享成功
```

---

## 问题 6：完整配置示例

```javascript
// shared-config.js（所有应用共用）
module.exports = {
  react: {
    singleton: true,
    strictVersion: true,
    requiredVersion: "^18.0.0",
  },
  "react-dom": {
    singleton: true,
    strictVersion: true,
    requiredVersion: "^18.0.0",
  },
  "react-router-dom": {
    singleton: true,
    requiredVersion: "^6.0.0",
  },
};

// webpack.config.js
const sharedConfig = require("./shared-config");

new ModuleFederationPlugin({
  // ...其他配置
  shared: sharedConfig,
});
```

**关键点**：

1. 所有应用使用相同的 shared 配置
2. React 相关包都设置 singleton: true
3. 使用 strictVersion 在开发时发现问题

## 延伸阅读

- [Shared Modules](https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints)
- [React Hooks Rules](https://react.dev/warnings/invalid-hook-call-warning)
