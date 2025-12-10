---
title: 动态导入 import() 的作用？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解动态导入 import() 的语法和作用，掌握它在代码分割和按需加载中的应用。
tags:
  - Webpack
  - 动态导入
  - import()
  - 代码分割
estimatedTime: 12 分钟
keywords:
  - 动态导入
  - import()
  - 按需加载
  - 异步加载
highlight: import() 是动态导入语法，返回 Promise，Webpack 会将其自动分割成单独的 chunk，实现按需加载。
order: 646
---

## 问题 1：import() 的基本用法

**import() 是动态导入语法，返回一个 Promise**：

```javascript
// 静态导入（编译时确定）
import { add } from "./math";

// 动态导入（运行时加载）
const math = await import("./math");
math.add(1, 2);

// 或使用 .then
import("./math").then((math) => {
  math.add(1, 2);
});
```

---

## 问题 2：Webpack 如何处理 import()？

Webpack 遇到 import() 会自动进行代码分割：

```javascript
// 源代码
button.onclick = () => import("./heavy-module");

// Webpack 处理后
// 1. heavy-module 被分割成单独的 chunk
// 2. 点击按钮时才会请求这个 chunk
```

生成的文件：

```
dist/
├── main.js           # 主 bundle
└── heavy-module.js   # 动态导入的 chunk
```

---

## 问题 3：魔法注释

使用注释控制 chunk 的行为：

```javascript
// 指定 chunk 名称
import(/* webpackChunkName: "lodash" */ "lodash");

// 预加载（高优先级，立即加载）
import(/* webpackPreload: true */ "./critical-module");

// 预获取（低优先级，空闲时加载）
import(/* webpackPrefetch: true */ "./future-module");

// 指定加载模式
import(/* webpackMode: "lazy" */ `./locale/${lang}`);

// 组合使用
import(
  /* webpackChunkName: "my-chunk" */
  /* webpackPrefetch: true */
  "./module"
);
```

---

## 问题 4：常见使用场景

### 1. 路由懒加载

```javascript
const routes = [
  {
    path: "/dashboard",
    component: () => import("./pages/Dashboard"),
  },
  {
    path: "/settings",
    component: () => import("./pages/Settings"),
  },
];
```

### 2. 条件加载

```javascript
if (user.isAdmin) {
  const adminModule = await import("./admin");
  adminModule.init();
}
```

### 3. 按需加载大型库

```javascript
button.onclick = async () => {
  const { Chart } = await import("chart.js");
  new Chart(canvas, config);
};
```

### 4. 国际化

```javascript
async function loadLocale(lang) {
  const messages = await import(`./locales/${lang}.json`);
  return messages.default;
}
```

---

## 问题 5：与 React.lazy 配合

```javascript
import React, { Suspense, lazy } from "react";

// lazy 内部使用 import()
const LazyComponent = lazy(() => import("./LazyComponent"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

注意：`React.lazy` 只支持默认导出：

```javascript
// ✅ 正确
export default function Component() {}

// ❌ 需要额外处理
export function Component() {}
// 解决方案
const Component = lazy(() =>
  import("./Component").then((module) => ({ default: module.Component }))
);
```

## 延伸阅读

- [Dynamic Imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)
- [Magic Comments](https://webpack.js.org/api/module-methods/#magic-comments)
