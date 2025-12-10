---
title: Webpack Tapable 的 Hook 类型有哪些？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Tapable 的各种 Hook 类型，掌握同步、异步、串行、并行等不同钩子的使用场景。
tags:
  - Webpack
  - Tapable
  - Hook
  - 插件系统
estimatedTime: 15 分钟
keywords:
  - Tapable
  - Hook 类型
  - 同步钩子
  - 异步钩子
highlight: Tapable 提供 9 种 Hook 类型，按同步/异步、串行/并行、是否有返回值等维度分类，满足不同的插件需求。
order: 695
---

## 问题 1：Hook 类型概览

| Hook 类型                | 同步/异步 | 执行方式 | 返回值处理        |
| ------------------------ | --------- | -------- | ----------------- |
| SyncHook                 | 同步      | 串行     | 忽略              |
| SyncBailHook             | 同步      | 串行     | 非 undefined 停止 |
| SyncWaterfallHook        | 同步      | 串行     | 传递给下一个      |
| SyncLoopHook             | 同步      | 循环     | 非 undefined 重复 |
| AsyncParallelHook        | 异步      | 并行     | 忽略              |
| AsyncParallelBailHook    | 异步      | 并行     | 非 undefined 停止 |
| AsyncSeriesHook          | 异步      | 串行     | 忽略              |
| AsyncSeriesBailHook      | 异步      | 串行     | 非 undefined 停止 |
| AsyncSeriesWaterfallHook | 异步      | 串行     | 传递给下一个      |

---

## 问题 2：同步钩子

### SyncHook

```javascript
const { SyncHook } = require("tapable");

const hook = new SyncHook(["arg1", "arg2"]);

hook.tap("Plugin1", (arg1, arg2) => {
  console.log("Plugin1:", arg1, arg2);
});

hook.tap("Plugin2", (arg1, arg2) => {
  console.log("Plugin2:", arg1, arg2);
});

hook.call("hello", "world");
// Plugin1: hello world
// Plugin2: hello world
```

### SyncBailHook

```javascript
const { SyncBailHook } = require("tapable");

const hook = new SyncBailHook(["arg"]);

hook.tap("Plugin1", (arg) => {
  if (arg === "stop") return "stopped";
});

hook.tap("Plugin2", (arg) => {
  console.log("Plugin2 执行"); // 如果 Plugin1 返回值，这里不执行
});

hook.call("stop"); // Plugin2 不会执行
```

### SyncWaterfallHook

```javascript
const { SyncWaterfallHook } = require("tapable");

const hook = new SyncWaterfallHook(["value"]);

hook.tap("Plugin1", (value) => value + 1);
hook.tap("Plugin2", (value) => value + 2);

console.log(hook.call(0)); // 3
```

---

## 问题 3：异步钩子

### AsyncSeriesHook

```javascript
const { AsyncSeriesHook } = require("tapable");

const hook = new AsyncSeriesHook(["arg"]);

hook.tapAsync("Plugin1", (arg, callback) => {
  setTimeout(() => {
    console.log("Plugin1");
    callback();
  }, 1000);
});

hook.tapPromise("Plugin2", (arg) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Plugin2");
      resolve();
    }, 1000);
  });
});

hook.callAsync("arg", () => {
  console.log("Done");
});
// 1秒后: Plugin1
// 2秒后: Plugin2
// 2秒后: Done
```

### AsyncParallelHook

```javascript
const { AsyncParallelHook } = require("tapable");

const hook = new AsyncParallelHook(["arg"]);

hook.tapAsync("Plugin1", (arg, callback) => {
  setTimeout(() => callback(), 1000);
});

hook.tapAsync("Plugin2", (arg, callback) => {
  setTimeout(() => callback(), 1000);
});

hook.callAsync("arg", () => {
  console.log("Done"); // 1秒后（并行执行）
});
```

---

## 问题 4：注册方式

```javascript
// 同步注册
hook.tap("PluginName", (arg) => {});

// 异步回调注册
hook.tapAsync("PluginName", (arg, callback) => {
  callback();
});

// 异步 Promise 注册
hook.tapPromise("PluginName", (arg) => {
  return Promise.resolve();
});
```

---

## 问题 5：Webpack 中的使用

```javascript
class MyPlugin {
  apply(compiler) {
    // SyncHook
    compiler.hooks.compile.tap("MyPlugin", (params) => {
      console.log("编译开始");
    });

    // AsyncSeriesHook
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      // 异步操作
      setTimeout(callback, 1000);
    });

    // AsyncSeriesHook (Promise)
    compiler.hooks.emit.tapPromise("MyPlugin", (compilation) => {
      return fetch("/api/notify");
    });
  }
}
```

## 延伸阅读

- [Tapable](https://github.com/webpack/tapable)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
