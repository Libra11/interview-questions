---
title: Webpack Prefetch 与 Preload 的区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 中 Prefetch 和 Preload 的区别，掌握它们的使用场景和配置方式。
tags:
  - Webpack
  - Prefetch
  - Preload
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - Prefetch
  - Preload
  - 预加载
  - 预获取
highlight: Preload 是高优先级加载当前页面需要的资源，Prefetch 是低优先级预获取未来可能需要的资源。
order: 779
---

## 问题 1：Preload 是什么？

**Preload 是高优先级的资源加载**，用于当前页面立即需要的资源。

```javascript
// 使用魔法注释
import(/* webpackPreload: true */ "./critical-module");
```

生成的 HTML：

```html
<link rel="preload" href="critical-module.js" as="script" />
```

特点：

- **立即加载**：与父 chunk 并行加载
- **高优先级**：浏览器优先下载
- **当前页面**：用于当前路由需要的资源

---

## 问题 2：Prefetch 是什么？

**Prefetch 是低优先级的资源预获取**，用于未来可能需要的资源。

```javascript
// 使用魔法注释
import(/* webpackPrefetch: true */ "./future-module");
```

生成的 HTML：

```html
<link rel="prefetch" href="future-module.js" />
```

特点：

- **空闲加载**：浏览器空闲时才加载
- **低优先级**：不影响当前页面
- **未来使用**：用于用户可能访问的页面

---

## 问题 3：核心区别对比

| 特性     | Preload         | Prefetch        |
| -------- | --------------- | --------------- |
| 加载时机 | 立即            | 浏览器空闲时    |
| 优先级   | 高              | 低              |
| 使用场景 | 当前页面需要    | 未来可能需要    |
| 并行加载 | 与父 chunk 并行 | 父 chunk 加载后 |
| 缓存     | 立即缓存        | 预缓存          |

---

## 问题 4：使用场景示例

### Preload：当前页面的关键资源

```javascript
// 首页需要的图表库，但不想阻塞首屏
const Chart = () => import(/* webpackPreload: true */ "chart.js");

// 页面加载时就开始下载 chart.js
// 用户看到图表区域时，库已经准备好了
```

### Prefetch：未来可能访问的页面

```javascript
// 用户在首页，可能会点击"关于"
const About = () => import(/* webpackPrefetch: true */ "./pages/About");

// 浏览器空闲时预下载 About 页面
// 用户点击时，页面秒开
```

---

## 问题 5：实际应用建议

```javascript
// 路由配置示例
const routes = [
  {
    path: "/",
    component: () => import("./Home"), // 首页，正常加载
  },
  {
    path: "/dashboard",
    // 用户登录后很可能访问，预获取
    component: () => import(/* webpackPrefetch: true */ "./Dashboard"),
  },
  {
    path: "/settings",
    // 访问频率低，不预获取
    component: () => import("./Settings"),
  },
];
```

注意事项：

- **不要滥用 Preload**：会占用带宽，影响关键资源
- **合理使用 Prefetch**：只预获取用户很可能访问的资源
- **移动端谨慎**：考虑用户的流量消耗

## 延伸阅读

- [Prefetching/Preloading modules](https://webpack.js.org/guides/code-splitting/#prefetchingpreloading-modules)
- [Preload, Prefetch And Priorities in Chrome](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf)
