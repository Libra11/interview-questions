---
title: webpack 热更新原理是什么
category: Webpack
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 webpack HMR(Hot Module Replacement)的工作原理,掌握 WebSocket、文件监听、模块替换等核心机制,了解如何实现无刷新更新。
tags:
  - Webpack
  - HMR
  - 热更新
  - 开发体验
estimatedTime: 26 分钟
keywords:
  - webpack HMR
  - 热更新原理
  - WebSocket
  - 模块替换
highlight: HMR 通过 WebSocket 通信和模块热替换实现无刷新更新,极大提升开发体验
order: 15
---

## 问题 1:什么是热更新(HMR)?

### 基本概念

HMR (Hot Module Replacement) 允许在运行时更新模块,无需完全刷新页面。

```javascript
// 传统开发流程
修改代码 → 保存 → 刷新浏览器 → 页面重新加载 → 状态丢失

// HMR 流程
修改代码 → 保存 → 自动更新 → 保持页面状态

// 示例场景
// 表单填写到第 5 步
// 修改第 5 步的样式
// 传统: 刷新后回到第 1 步,需要重新填写
// HMR: 停留在第 5 步,只更新样式
```

### HMR 的价值

```javascript
// 1. 保持应用状态
// 2. 只更新变化的模块
// 3. 即时反馈
// 4. 提升开发效率
```

---

## 问题 2:HMR 的工作流程

### 整体流程

```javascript
// 1. 启动 webpack-dev-server
// 2. 建立 WebSocket 连接
// 3. 监听文件变化
// 4. 重新编译
// 5. 推送更新
// 6. 浏览器应用更新

// 详细步骤
[文件变化]
    ↓
[webpack 监听到变化]
    ↓
[重新编译模块]
    ↓
[生成 update manifest 和 chunk]
    ↓
[通过 WebSocket 推送 hash]
    ↓
[浏览器请求 update 文件]
    ↓
[HMR runtime 替换模块]
    ↓
[执行 module.hot.accept 回调]
```

---

## 问题 3:服务端实现

### 1. webpack-dev-server 启动

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    hot: true,  // 启用 HMR
    port: 3000
  }
};

// webpack-dev-server 做了什么:
// 1. 启动 Express 服务器
// 2. 启动 WebSocket 服务器
// 3. 使用 webpack 的 watch 模式
// 4. 注入 HMR runtime 代码
```

### 2. 文件监听

```javascript
// webpack 使用 chokidar 监听文件
const chokidar = require('chokidar');

const watcher = chokidar.watch('./src', {
  ignored: /node_modules/,
  persistent: true
});

watcher.on('change', (path) => {
  console.log(`File ${path} has been changed`);
  // 触发重新编译
  compiler.run();
});
```

### 3. 重新编译

```javascript
// webpack 编译流程
compiler.hooks.done.tap('webpack-dev-server', (stats) => {
  // 获取新的 hash
  const { hash } = stats;
  
  // 生成更新文件
  // 1. [hash].hot-update.json - 更新清单
  // 2. [hash].hot-update.js - 更新的模块代码
  
  // 通过 WebSocket 推送更新通知
  sendStats(socketServer, stats.toJson());
});
```

### 4. WebSocket 通信

```javascript
// 服务端
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // 发送初始 hash
  ws.send(JSON.stringify({
    type: 'hash',
    data: currentHash
  }));
  
  // 文件变化时发送更新
  compiler.hooks.done.tap('send-update', (stats) => {
    ws.send(JSON.stringify({
      type: 'hash',
      data: stats.hash
    }));
    
    ws.send(JSON.stringify({
      type: 'ok'
    }));
  });
});
```

---

## 问题 4:客户端实现

### 1. HMR Runtime 注入

```javascript
// webpack 自动注入 HMR runtime 代码
// 主要包含:
// 1. WebSocket 客户端
// 2. 模块更新逻辑
// 3. module.hot API

// 注入的代码(简化版)
if (module.hot) {
  const socket = new WebSocket('ws://localhost:8080');
  
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };
}
```

### 2. 接收更新通知

```javascript
// 客户端处理消息
function handleMessage(message) {
  switch (message.type) {
    case 'hash':
      // 保存新的 hash
      currentHash = message.data;
      break;
      
    case 'ok':
      // 开始更新
      reloadApp();
      break;
  }
}

function reloadApp() {
  if (isUpdateAvailable()) {
    // 检查是否有 HMR 处理
    if (module.hot) {
      // 执行热更新
      hotApply();
    } else {
      // 降级为完全刷新
      window.location.reload();
    }
  }
}
```

### 3. 下载更新文件

```javascript
// 请求更新清单
function hotCheck() {
  return fetch(`/${currentHash}.hot-update.json`)
    .then(res => res.json())
    .then(update => {
      // update 格式:
      // {
      //   h: "new-hash",
      //   c: {
      //     "main": true  // 需要更新的 chunk
      //   }
      // }
      
      const chunkIds = Object.keys(update.c);
      return Promise.all(
        chunkIds.map(chunkId => hotDownloadUpdateChunk(chunkId))
      );
    });
}

// 下载更新的 chunk
function hotDownloadUpdateChunk(chunkId) {
  const script = document.createElement('script');
  script.src = `/${chunkId}.${currentHash}.hot-update.js`;
  document.head.appendChild(script);
  
  return new Promise((resolve) => {
    // chunk 加载完成后会调用 webpackHotUpdate
    window.webpackHotUpdate = (chunkId, moreModules) => {
      hotAddUpdateChunk(chunkId, moreModules);
      resolve();
    };
  });
}
```

### 4. 应用更新

```javascript
// 更新模块
function hotAddUpdateChunk(chunkId, moreModules) {
  for (const moduleId in moreModules) {
    // 保存旧模块
    const oldModule = installedModules[moduleId];
    
    // 更新模块代码
    modules[moduleId] = moreModules[moduleId];
    
    // 删除缓存
    delete installedModules[moduleId];
    
    // 执行新模块
    __webpack_require__(moduleId);
    
    // 调用 accept 回调
    if (oldModule && oldModule.hot && oldModule.hot._acceptedDependencies) {
      oldModule.hot._acceptedDependencies[moduleId]();
    }
  }
}
```

---

## 问题 5:module.hot API

### 1. accept - 接受更新

```javascript
// 接受自身更新
if (module.hot) {
  module.hot.accept((err) => {
    if (err) {
      console.error('Cannot apply HMR update', err);
    }
  });
}

// 接受依赖更新
if (module.hot) {
  module.hot.accept('./dependency.js', () => {
    // 依赖更新时的回调
    console.log('Dependency updated');
  });
}

// 实际应用
// React 组件
if (module.hot) {
  module.hot.accept('./App.js', () => {
    const NextApp = require('./App.js').default;
    ReactDOM.render(<NextApp />, document.getElementById('root'));
  });
}
```

### 2. dispose - 清理资源

```javascript
// 模块被替换前调用
if (module.hot) {
  module.hot.dispose((data) => {
    // 保存状态
    data.state = currentState;
    
    // 清理副作用
    clearInterval(timer);
    removeEventListener();
  });
}

// 新模块中恢复状态
if (module.hot) {
  const data = module.hot.data;
  if (data) {
    currentState = data.state;
  }
}
```

### 3. decline - 拒绝更新

```javascript
// 拒绝自身更新
if (module.hot) {
  module.hot.decline();
  // 此模块更新时会刷新页面
}

// 拒绝依赖更新
if (module.hot) {
  module.hot.decline('./dependency.js');
}
```

---

## 问题 6:不同类型文件的 HMR

### 1. JavaScript 模块

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

if (module.hot) {
  module.hot.accept();
}

// main.js
import { add } from './utils';

if (module.hot) {
  module.hot.accept('./utils', () => {
    // utils 更新时重新导入
    const { add } = require('./utils');
    console.log('Utils updated');
  });
}
```

### 2. CSS 模块

```javascript
// style-loader 自动处理 CSS HMR
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};

// style-loader 内部实现
if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // 移除旧样式
    removeStyle();
  });
}
```

### 3. Vue 组件

```javascript
// vue-loader 处理 Vue 组件的 HMR
// Button.vue
<template>
  <button>{{ text }}</button>
</template>

<script>
export default {
  data() {
    return { text: 'Click me' };
  }
};
</script>

// vue-loader 生成的代码
if (module.hot) {
  module.hot.accept();
  
  // 模板更新
  module.hot.accept('./Button.vue?vue&type=template', () => {
    api.rerender('Button', render);
  });
  
  // 脚本更新
  module.hot.accept('./Button.vue?vue&type=script', () => {
    api.reload('Button', script);
  });
  
  // 样式更新
  module.hot.accept('./Button.vue?vue&type=style', () => {
    api.update('Button', styles);
  });
}
```

### 4. React 组件

```javascript
// React Fast Refresh
// App.jsx
import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;

// @pmmmwh/react-refresh-webpack-plugin 处理 HMR
// 自动保持组件状态
```

---

## 问题 7:HMR 的边界和降级

### 1. HMR 边界

```javascript
// 什么是 HMR 边界?
// 能够处理自身或依赖更新的模块

// 例子:
// A.js (没有 accept)
export const a = 1;

// B.js (有 accept)
import { a } from './A';

if (module.hot) {
  module.hot.accept('./A', () => {
    // B 是 A 的 HMR 边界
  });
}

// C.js (没有 accept)
import './B';

// 更新 A.js:
// 1. 检查 A 是否 accept 自己 - 否
// 2. 向上查找,B accept A - 是
// 3. 在 B 处应用更新

// 更新 C.js:
// 1. 检查 C 是否 accept 自己 - 否
// 2. 向上查找,没有模块 accept C
// 3. 降级为完全刷新
```

### 2. 降级策略

```javascript
// HMR 失败时的降级
if (module.hot) {
  module.hot.accept((err) => {
    if (err) {
      // HMR 失败,刷新页面
      console.error('HMR update failed', err);
      window.location.reload();
    }
  });
  
  // 监听 HMR 状态
  module.hot.addStatusHandler((status) => {
    if (status === 'fail') {
      window.location.reload();
    }
  });
}
```

---

## 总结

**核心概念总结**:

### 1. HMR 流程

- 文件监听 → 重新编译
- WebSocket 推送更新
- 下载更新文件
- 应用模块替换

### 2. 关键技术

- **WebSocket**: 实时通信
- **文件监听**: chokidar
- **模块替换**: HMR runtime
- **状态保持**: module.hot API

### 3. module.hot API

- **accept**: 接受更新
- **dispose**: 清理资源
- **decline**: 拒绝更新
- **data**: 保存状态

### 4. 实现要点

- HMR 边界识别
- 降级策略
- 不同文件类型处理
- 错误处理

## 延伸阅读

- [Webpack HMR 官方文档](https://webpack.js.org/concepts/hot-module-replacement/)
- [HMR API](https://webpack.js.org/api/hot-module-replacement/)
- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
- [Vue HMR](https://github.com/vuejs/vue-loader/blob/master/docs/hot-reload.md)
- [webpack-dev-server](https://github.com/webpack/webpack-dev-server)
