---
title: Module Federation 用来解决什么问题？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Module Federation 要解决的核心问题，以及它相比传统方案的优势。
tags:
  - Webpack
  - Module Federation
  - 微前端
  - 代码共享
estimatedTime: 12 分钟
keywords:
  - Module Federation
  - 代码共享
  - 微前端
  - 独立部署
highlight: Module Federation 解决了多个独立应用之间的代码共享问题，实现运行时动态加载，支持独立开发和部署。
order: 797
---

## 问题 1：传统方案的问题

### NPM 包共享

```javascript
// 传统方式：通过 npm 包共享组件
npm install @company/shared-components

// 问题：
// 1. 更新组件需要重新发布 npm 包
// 2. 所有使用方都要更新依赖并重新部署
// 3. 版本管理复杂
```

### iframe 方案

```html
<!-- iframe 嵌入 -->
<iframe src="https://other-app.com/widget"></iframe>

<!-- 问题：
1. 样式隔离过度，难以统一
2. 通信复杂
3. 性能开销大
-->
```

---

## 问题 2：Module Federation 解决的问题

### 1. 运行时代码共享

```javascript
// 不需要重新打包，运行时动态加载
const RemoteButton = lazy(() => import("remoteApp/Button"));

// 远程应用更新后，主应用自动获取最新版本
```

### 2. 独立开发和部署

```
Team A → App A → 独立部署
Team B → App B → 独立部署
Team C → App C → 独立部署

各团队独立开发、测试、部署
不需要协调发布时间
```

### 3. 依赖共享

```javascript
// 多个应用共享 React，避免重复加载
shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
}
```

---

## 问题 3：典型应用场景

### 微前端架构

```
主应用 Shell
├── 导航（来自 nav-app）
├── 用户中心（来自 user-app）
├── 订单管理（来自 order-app）
└── 数据报表（来自 report-app）
```

### 跨团队组件共享

```javascript
// 设计系统团队维护组件库
// 业务团队直接使用，无需安装依赖
import Button from "designSystem/Button";
import Modal from "designSystem/Modal";
```

### 渐进式迁移

```javascript
// 老系统逐步迁移到新技术栈
// 新模块用 React，老模块保持 jQuery
// 通过 Module Federation 集成
```

---

## 问题 4：与其他方案对比

| 方案              | 构建时共享 | 运行时共享 | 独立部署 | 复杂度 |
| ----------------- | ---------- | ---------- | -------- | ------ |
| NPM 包            | ✅         | ❌         | ❌       | 低     |
| Monorepo          | ✅         | ❌         | ❌       | 中     |
| iframe            | ❌         | ✅         | ✅       | 中     |
| Module Federation | ❌         | ✅         | ✅       | 中     |

---

## 问题 5：Module Federation 的优势

```
1. 真正的运行时集成
   - 无需重新构建即可获取更新
   - 支持 A/B 测试和灰度发布

2. 共享依赖
   - 避免重复加载 React 等库
   - 减少总体积

3. 类型安全
   - 可以共享 TypeScript 类型
   - 开发体验好

4. 渐进式采用
   - 可以逐步迁移
   - 不需要一次性重构
```

## 延伸阅读

- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Micro Frontends](https://micro-frontends.org/)
