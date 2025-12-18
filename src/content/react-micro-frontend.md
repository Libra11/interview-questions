---
title: 如何用 React 构建微前端架构？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  掌握 React 微前端架构的实现方案和最佳实践。
tags:
  - React
  - 微前端
  - 架构
  - Module Federation
estimatedTime: 15 分钟
keywords:
  - micro frontend
  - Module Federation
  - single-spa
  - qiankun
highlight: React 微前端可通过 Module Federation、single-spa、qiankun 等方案实现应用拆分和集成。
order: 674
---

## 问题 1：微前端是什么？

### 概念

```
微前端 = 微服务理念在前端的应用

将大型前端应用拆分为多个小型、独立的应用
每个应用可以独立开发、部署、运行
```

### 适用场景

```
1. 大型企业应用
2. 多团队协作
3. 渐进式重构（新旧技术栈共存）
4. 独立部署需求
```

---

## 问题 2：Module Federation

### Webpack 5 配置

```javascript
// 主应用 webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "host",
      remotes: {
        app1: "app1@http://localhost:3001/remoteEntry.js",
        app2: "app2@http://localhost:3002/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
};

// 子应用 webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "app1",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App",
      },
      shared: ["react", "react-dom"],
    }),
  ],
};
```

### 主应用使用

```jsx
// 动态加载远程组件
const RemoteApp = React.lazy(() => import("app1/App"));

function Host() {
  return (
    <div>
      <h1>主应用</h1>
      <Suspense fallback={<Loading />}>
        <RemoteApp />
      </Suspense>
    </div>
  );
}
```

---

## 问题 3：qiankun 方案

### 主应用配置

```jsx
// 主应用
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "app1",
    entry: "//localhost:3001",
    container: "#subapp-container",
    activeRule: "/app1",
  },
  {
    name: "app2",
    entry: "//localhost:3002",
    container: "#subapp-container",
    activeRule: "/app2",
  },
]);

start();

function App() {
  return (
    <div>
      <nav>
        <Link to="/app1">App1</Link>
        <Link to="/app2">App2</Link>
      </nav>
      <div id="subapp-container" />
    </div>
  );
}
```

### 子应用配置

```jsx
// 子应用入口
import { createRoot } from "react-dom/client";

let root = null;

function render(props = {}) {
  const { container } = props;
  const dom = container
    ? container.querySelector("#root")
    : document.getElementById("root");

  root = createRoot(dom);
  root.render(<App />);
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 生命周期
export async function bootstrap() {
  console.log("app bootstraped");
}

export async function mount(props) {
  render(props);
}

export async function unmount() {
  root.unmount();
}
```

---

## 问题 4：single-spa 方案

### 配置

```javascript
// 注册应用
import { registerApplication, start } from "single-spa";

registerApplication({
  name: "app1",
  app: () => import("./app1/main.js"),
  activeWhen: "/app1",
});

registerApplication({
  name: "app2",
  app: () => import("./app2/main.js"),
  activeWhen: "/app2",
});

start();
```

### 子应用

```jsx
import singleSpaReact from "single-spa-react";
import { createRoot } from "react-dom/client";
import App from "./App";

const lifecycles = singleSpaReact({
  React,
  ReactDOM: { createRoot },
  rootComponent: App,
  errorBoundary() {
    return <div>Error</div>;
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
```

---

## 问题 5：通信方案

### 全局状态

```javascript
// 使用 qiankun 的全局状态
import { initGlobalState } from "qiankun";

const actions = initGlobalState({ user: null });

// 主应用设置
actions.setGlobalState({ user: { name: "John" } });

// 子应用监听
export function mount(props) {
  props.onGlobalStateChange((state) => {
    console.log(state.user);
  });
}
```

### 自定义事件

```javascript
// 发送事件
window.dispatchEvent(
  new CustomEvent("micro-app-event", {
    detail: { type: "user-login", data: user },
  })
);

// 监听事件
window.addEventListener("micro-app-event", (e) => {
  console.log(e.detail);
});
```

---

## 问题 6：样式隔离

### CSS Modules

```jsx
import styles from "./App.module.css";

function App() {
  return <div className={styles.container}>...</div>;
}
```

### Shadow DOM

```javascript
// qiankun 配置
start({
  sandbox: {
    strictStyleIsolation: true, // 使用 Shadow DOM
  },
});
```

## 总结

| 方案              | 特点               |
| ----------------- | ------------------ |
| Module Federation | Webpack 5 原生支持 |
| qiankun           | 开箱即用，功能完善 |
| single-spa        | 灵活，需要更多配置 |

## 延伸阅读

- [qiankun](https://qiankun.umijs.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
