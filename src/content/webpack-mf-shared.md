---
title: Module Federation Shared 是如何共享依赖的？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Module Federation 的 shared 配置，掌握依赖共享的机制和最佳实践。
tags:
  - Webpack
  - Module Federation
  - Shared
  - 依赖共享
estimatedTime: 15 分钟
keywords:
  - shared
  - 依赖共享
  - singleton
  - 版本协商
highlight: Shared 配置让多个应用共享同一份依赖，通过版本协商机制选择合适的版本，避免重复加载。
order: 669
---

## 问题 1：Shared 的作用

**Shared 让多个应用共享同一份依赖**，避免重复加载：

```javascript
// 没有 shared：
// Host 加载 React (100KB)
// Remote 加载 React (100KB)
// 总共 200KB

// 有 shared：
// Host 和 Remote 共享一份 React (100KB)
// 总共 100KB
```

---

## 问题 2：基本配置

```javascript
// 简单配置
new ModuleFederationPlugin({
  shared: ["react", "react-dom", "lodash"],
});

// 详细配置
new ModuleFederationPlugin({
  shared: {
    react: {
      singleton: true,
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

## 问题 3：配置选项详解

```javascript
shared: {
  react: {
    // 只允许一个版本（重要！）
    singleton: true,

    // 如果版本不兼容，是否报错
    strictVersion: true,

    // 要求的版本范围
    requiredVersion: '^18.0.0',

    // 是否立即加载（而非按需）
    eager: false,

    // 共享的包名
    packageName: 'react',

    // 共享范围
    shareScope: 'default',
  },
}
```

---

## 问题 4：版本协商机制

```
Host: React 18.2.0
Remote A: React 18.1.0
Remote B: React 18.0.0

协商过程：
1. 收集所有应用的 React 版本
2. 选择满足所有 requiredVersion 的最高版本
3. 所有应用使用 React 18.2.0
```

如果版本不兼容：

```javascript
// strictVersion: true 时会报错
// strictVersion: false 时会加载多个版本（不推荐）
```

---

## 问题 5：Singleton 的重要性

**React 必须使用 singleton**：

```javascript
// ❌ 没有 singleton
// Host 使用 React 18.2.0
// Remote 使用 React 18.1.0
// 两个 React 实例，Hooks 会报错！

// ✅ 使用 singleton
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
}
// 只有一个 React 实例，正常工作
```

---

## 问题 6：Eager 加载

```javascript
// eager: false（默认）
// 按需加载，首次使用时才加载

// eager: true
// 立即加载，打包到入口 chunk
shared: {
  react: {
    singleton: true,
    eager: true,  // 适合 Host 应用
  },
}
```

通常 Host 使用 `eager: true`，Remote 使用 `eager: false`。

---

## 问题 7：最佳实践配置

```javascript
// 推荐的 shared 配置
const sharedConfig = {
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
  // 其他共享库
  "react-router-dom": {
    singleton: true,
    requiredVersion: "^6.0.0",
  },
};

// Host
new ModuleFederationPlugin({
  shared: {
    ...sharedConfig,
    react: { ...sharedConfig.react, eager: true },
  },
});

// Remote
new ModuleFederationPlugin({
  shared: sharedConfig,
});
```

## 延伸阅读

- [Shared Modules](https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)
