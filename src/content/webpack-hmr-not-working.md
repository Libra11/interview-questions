---
title: 为什么 Webpack 热更新不工作？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  排查 Webpack HMR 不工作的常见原因，掌握调试和解决问题的方法。
tags:
  - Webpack
  - HMR
  - 问题排查
  - 调试
estimatedTime: 12 分钟
keywords:
  - HMR 不工作
  - 热更新失败
  - 问题排查
  - 调试
highlight: HMR 不工作通常由配置缺失、没有 accept 处理、WebSocket 连接问题或浏览器缓存导致。
order: 704
---

## 问题 1：检查配置

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    hot: true, // 必须开启
  },
};

// 如果使用 webpack-dev-middleware
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // 需要添加插件
  ],
};
```

---

## 问题 2：检查 module.hot.accept

```javascript
// 如果没有任何模块 accept 更新
// HMR 会回退到整页刷新

// 需要在入口或组件中添加
if (module.hot) {
  module.hot.accept();
}

// React 项目需要 react-refresh
// Vue 项目 vue-loader 自动处理
```

---

## 问题 3：检查 WebSocket 连接

```
打开浏览器 DevTools → Network → WS

应该看到 WebSocket 连接：
ws://localhost:8080/ws

如果没有连接，检查：
1. devServer 端口是否正确
2. 是否有代理阻止 WebSocket
3. 防火墙设置
```

---

## 问题 4：检查控制台错误

```
常见错误：

1. "[HMR] Waiting for update signal from WDS..."
   → WebSocket 连接正常，等待更新

2. "[HMR] Cannot apply update. Need to do a full reload!"
   → 没有模块 accept 更新，需要添加 accept

3. "[HMR] Update failed: Error: ..."
   → 更新过程出错，查看具体错误信息
```

---

## 问题 5：React 项目配置

```javascript
// 使用 react-refresh-webpack-plugin
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  plugins: [new ReactRefreshWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: ["react-refresh/babel"],
          },
        },
      },
    ],
  },
};
```

---

## 问题 6：Vue 项目配置

```javascript
// vue-loader 自动支持 HMR
// 确保使用正确版本

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
    ],
  },
};
```

---

## 问题 7：排查清单

```
□ devServer.hot: true
□ 使用了 HotModuleReplacementPlugin（或 hot: true 自动添加）
□ WebSocket 连接正常
□ 有模块 accept 更新（或使用框架插件）
□ 没有语法错误导致编译失败
□ 浏览器没有禁用 JavaScript
□ 没有强缓存问题（Ctrl+Shift+R 强制刷新）
```

---

## 问题 8：强制整页刷新的情况

以下情况会触发整页刷新而非 HMR：

```javascript
// 1. 修改了入口文件的导出
// 2. 修改了 Hooks 的顺序（React）
// 3. 没有任何模块 accept
// 4. accept 的模块抛出错误
```

## 延伸阅读

- [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)
- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
