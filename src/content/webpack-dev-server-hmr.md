---
title: Webpack Dev Server 如何实现 HMR？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack Dev Server 实现 HMR 的原理，包括 WebSocket 通信和模块替换机制。
tags:
  - Webpack
  - HMR
  - Dev Server
  - WebSocket
estimatedTime: 15 分钟
keywords:
  - Dev Server
  - HMR 实现
  - WebSocket
  - 热更新原理
highlight: Dev Server 通过 WebSocket 与浏览器通信，当文件变化时发送更新信息，浏览器端运行时代码负责替换模块。
order: 642
---

## 问题 1：HMR 的整体架构

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Webpack Dev    │ ←───────────────→  │    浏览器        │
│    Server       │                    │  (HMR Runtime)  │
└─────────────────┘                    └─────────────────┘
        ↑                                      ↓
        │                              ┌─────────────────┐
   文件变化                             │   应用代码       │
                                       └─────────────────┘
```

核心组件：

- **Webpack Dev Server**：监听文件变化，触发编译
- **WebSocket**：服务端与浏览器的通信通道
- **HMR Runtime**：浏览器端的更新执行代码

---

## 问题 2：HMR 工作流程

### 1. 建立 WebSocket 连接

```javascript
// 浏览器端（简化）
const socket = new WebSocket("ws://localhost:8080");
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "hash") {
    // 收到新的编译 hash
  }
  if (message.type === "ok") {
    // 编译成功，检查更新
  }
};
```

### 2. 文件变化触发编译

```javascript
// 服务端监听文件变化
compiler.watch({}, (err, stats) => {
  // 编译完成，通知浏览器
  socket.send(
    JSON.stringify({
      type: "hash",
      hash: stats.hash,
    })
  );
});
```

### 3. 浏览器请求更新

```javascript
// 浏览器请求更新清单
fetch(`/${hash}.hot-update.json`)
  .then((res) => res.json())
  .then((update) => {
    // update 包含变化的 chunk 信息
  });

// 请求更新的模块代码
fetch(`/${chunkId}.${hash}.hot-update.js`);
```

### 4. 执行模块替换

```javascript
// HMR Runtime 执行替换
module.hot.accept("./App", () => {
  // 模块更新后的回调
  render(<App />);
});
```

---

## 问题 3：关键文件说明

HMR 过程中涉及的文件：

```
[hash].hot-update.json    # 更新清单，描述哪些 chunk 需要更新
[chunkId].[hash].hot-update.js  # 更新的模块代码
```

示例：

```json
// abc123.hot-update.json
{
  "c": ["main"], // 需要更新的 chunk
  "r": [], // 需要移除的 chunk
  "m": [] // 需要移除的模块
}
```

---

## 问题 4：module.hot API

```javascript
if (module.hot) {
  // 接受自身更新
  module.hot.accept();

  // 接受依赖更新
  module.hot.accept("./dep", () => {
    // 依赖更新后执行
  });

  // 拒绝更新（会触发页面刷新）
  module.hot.decline();

  // 模块被替换前执行
  module.hot.dispose((data) => {
    // 清理工作，data 可传递给新模块
  });
}
```

---

## 问题 5：为什么需要 accept？

```javascript
// 如果没有任何模块 accept 更新
// 更新会一直冒泡到入口
// 最终触发页面刷新

// 有 accept 时
// 更新在 accept 的模块处停止
// 只替换该模块及其依赖
```

React/Vue 的 HMR 插件会自动处理 accept 逻辑，开发者通常不需要手动编写。

## 延伸阅读

- [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)
- [HMR API](https://webpack.js.org/api/hot-module-replacement/)
