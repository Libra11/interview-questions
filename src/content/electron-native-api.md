---
title: 如何调用原生系统 API（如 DLL / dylib）？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中调用原生系统库（DLL、dylib、so）的方法。
tags:
  - Electron
  - 原生模块
  - FFI
  - 系统API
estimatedTime: 12 分钟
keywords:
  - DLL调用
  - dylib
  - 原生API
  - FFI
highlight: 使用 node-ffi-napi 或 koffi 可以直接调用系统动态链接库
order: 76
---

## 问题 1：调用原生库的方式

### 方式对比

```
node-ffi-napi / koffi：
├── 直接调用 DLL/dylib/so
├── 无需编写 C++ 代码
├── 动态绑定
└── 适合简单调用

N-API 原生模块：
├── 编写 C++ 扩展
├── 性能最好
├── 需要编译
└── 适合复杂场景

edge-js：
├── 调用 .NET 程序集
├── Windows 专用
└── 适合 .NET 集成
```

---

## 问题 2：使用 koffi（推荐）

### 安装

```bash
npm install koffi
```

### 调用 Windows API

```javascript
const koffi = require("koffi");

// 加载 user32.dll
const user32 = koffi.load("user32.dll");

// 定义函数
const MessageBoxW = user32.func("int MessageBoxW(void*, str16, str16, int)");

// 调用
MessageBoxW(null, "内容", "标题", 0);
```

### 调用 macOS API

```javascript
const koffi = require("koffi");

// 加载 CoreFoundation
const cf = koffi.load(
  "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation"
);

// 定义并调用函数
```

---

## 问题 3：使用 node-ffi-napi

### 安装

```bash
npm install ffi-napi ref-napi
```

### 示例

```javascript
const ffi = require("ffi-napi");
const ref = require("ref-napi");

// Windows: 调用 kernel32.dll
const kernel32 = ffi.Library("kernel32", {
  GetSystemTime: ["void", ["pointer"]],
  Beep: ["bool", ["int", "int"]],
});

// 发出蜂鸣声
kernel32.Beep(750, 300);

// macOS: 调用系统库
const libc = ffi.Library("libc", {
  getpid: ["int", []],
  getuid: ["int", []],
});

console.log("PID:", libc.getpid());
```

---

## 问题 4：处理复杂类型

```javascript
const ffi = require("ffi-napi");
const ref = require("ref-napi");
const StructType = require("ref-struct-napi");

// 定义结构体
const SYSTEMTIME = StructType({
  wYear: ref.types.uint16,
  wMonth: ref.types.uint16,
  wDayOfWeek: ref.types.uint16,
  wDay: ref.types.uint16,
  wHour: ref.types.uint16,
  wMinute: ref.types.uint16,
  wSecond: ref.types.uint16,
  wMilliseconds: ref.types.uint16,
});

const kernel32 = ffi.Library("kernel32", {
  GetSystemTime: ["void", [ref.refType(SYSTEMTIME)]],
});

// 调用
const time = new SYSTEMTIME();
kernel32.GetSystemTime(time.ref());
console.log(`${time.wYear}-${time.wMonth}-${time.wDay}`);
```

---

## 问题 5：打包配置

### electron-builder 配置

```json
{
  "asarUnpack": [
    "**/ffi-napi/**",
    "**/ref-napi/**",
    "**/koffi/**",
    "**/*.node",
    "**/*.dll",
    "**/*.dylib",
    "**/*.so"
  ],
  "extraResources": [
    {
      "from": "native/",
      "to": "native/"
    }
  ]
}
```

### 加载自定义库

```javascript
const path = require("path");
const { app } = require("electron");

function getLibraryPath(name) {
  const platform = process.platform;
  const ext =
    platform === "win32" ? ".dll" : platform === "darwin" ? ".dylib" : ".so";

  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, "native")
    : path.join(__dirname, "native");

  return path.join(basePath, name + ext);
}

const myLib = koffi.load(getLibraryPath("mylib"));
```

## 延伸阅读

- [koffi](https://koffi.dev/)
- [node-ffi-napi](https://github.com/nicedoc/node-ffi-napi)
- [N-API 文档](https://nodejs.org/api/n-api.html)
