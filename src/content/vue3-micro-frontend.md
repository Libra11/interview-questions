---
title: 如何让 Vue3 项目支持微前端？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 微前端的实现方案和最佳实践。
tags:
  - Vue
  - 微前端
  - qiankun
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 微前端
  - qiankun
  - 子应用
highlight: 通过 qiankun、Module Federation 等方案实现 Vue3 微前端架构。
order: 276
---

## 问题 1：微前端方案选择

| 方案              | 特点               | 适用场景     |
| ----------------- | ------------------ | ------------ |
| qiankun           | 成熟稳定，沙箱隔离 | 大型企业应用 |
| micro-app         | 轻量，WebComponent | 中小型项目   |
| Module Federation | Webpack 5 原生     | 模块共享     |
| iframe            | 完全隔离           | 简单集成     |

---

## 问题 2：qiankun 主应用配置

```typescript
// main-app/src/main.ts
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "vue-sub-app",
    entry: "//localhost:8081",
    container: "#sub-container",
    activeRule: "/sub-app",
    props: {
      // 传递给子应用的数据
      token: getToken(),
      userInfo: getUserInfo(),
    },
  },
  {
    name: "react-sub-app",
    entry: "//localhost:8082",
    container: "#sub-container",
    activeRule: "/react-app",
  },
]);

start({
  sandbox: {
    strictStyleIsolation: true, // 样式隔离
  },
});
```

```vue
<!-- 主应用布局 -->
<template>
  <div id="main-app">
    <header>主应用导航</header>
    <main>
      <router-view />
      <!-- 子应用容器 -->
      <div id="sub-container"></div>
    </main>
  </div>
</template>
```

---

## 问题 3：Vue3 子应用配置

```typescript
// sub-app/src/main.ts
import { createApp, App } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import AppComponent from "./App.vue";
import routes from "./routes";

let app: App | null = null;
let router: Router | null = null;

function render(props: any = {}) {
  const { container } = props;

  router = createRouter({
    history: createWebHistory(
      window.__POWERED_BY_QIANKUN__ ? "/sub-app/" : "/"
    ),
    routes,
  });

  app = createApp(AppComponent);
  app.use(router);

  const mountEl = container
    ? container.querySelector("#app")
    : document.getElementById("app");

  app.mount(mountEl);
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 生命周期钩子
export async function bootstrap() {
  console.log("子应用 bootstrap");
}

export async function mount(props: any) {
  console.log("子应用 mount", props);
  render(props);
}

export async function unmount() {
  console.log("子应用 unmount");
  app?.unmount();
  app = null;
  router = null;
}
```

---

## 问题 4：Vite 子应用配置

```typescript
// vite.config.ts
import qiankun from "vite-plugin-qiankun";

export default defineConfig({
  plugins: [
    vue(),
    qiankun("vue-sub-app", {
      useDevMode: true,
    }),
  ],
  server: {
    port: 8081,
    cors: true,
    origin: "http://localhost:8081",
  },
});
```

---

## 问题 5：应用间通信

```typescript
// 方式一：props 传递
// 主应用
registerMicroApps([
  {
    props: { token, onLogout: handleLogout },
  },
]);

// 子应用
export async function mount(props) {
  console.log(props.token);
  props.onLogout();
}

// 方式二：全局状态
import { initGlobalState } from "qiankun";

const actions = initGlobalState({
  user: null,
  token: "",
});

// 主应用监听
actions.onGlobalStateChange((state, prev) => {
  console.log("状态变化", state);
});

// 子应用修改
actions.setGlobalState({ user: newUser });

// 方式三：自定义事件
window.dispatchEvent(
  new CustomEvent("micro-app-event", {
    detail: { type: "logout" },
  })
);
```

---

## 问题 6：样式隔离

```typescript
// qiankun 配置
start({
  sandbox: {
    // 严格样式隔离（Shadow DOM）
    strictStyleIsolation: true,
    // 或实验性样式隔离
    experimentalStyleIsolation: true
  }
})

// 子应用 CSS 命名空间
// 使用 BEM 或 CSS Modules
.sub-app {
  &__header { }
  &__content { }
}
```

---

## 问题 7：共享依赖

```typescript
// Module Federation 方式
// webpack.config.js (主应用)
new ModuleFederationPlugin({
  name: "main_app",
  shared: {
    vue: { singleton: true },
    "vue-router": { singleton: true },
    pinia: { singleton: true },
  },
});

// webpack.config.js (子应用)
new ModuleFederationPlugin({
  name: "sub_app",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/App.vue",
  },
  shared: {
    vue: { singleton: true },
  },
});
```

---

## 问题 8：路由处理

```typescript
// 主应用路由
const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  // 子应用路由通配
  { path: "/sub-app/:pathMatch(.*)*", component: SubAppContainer },
];

// 子应用路由
const routes = [
  { path: "/", component: SubHome },
  { path: "/list", component: SubList },
];

// 路由同步
// 子应用
router.afterEach((to) => {
  // 通知主应用
  window.history.pushState(null, "", "/sub-app" + to.fullPath);
});
```

### 部署配置

```nginx
# nginx 配置
location /sub-app {
  proxy_pass http://sub-app-server;
  add_header Access-Control-Allow-Origin *;
}
```

## 延伸阅读

- [qiankun 官方文档](https://qiankun.umijs.org/zh)
- [micro-app](https://micro-zoe.github.io/micro-app/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
