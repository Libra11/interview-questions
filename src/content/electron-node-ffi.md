---
title: 如何使用 node-ffi？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中使用 node-ffi-napi 调用动态链接库的详细方法。
tags:
  - Electron
  - FFI
  - 原生模块
  - DLL
estimatedTime: 12 分钟
keywords:
  - node-ffi
  - FFI
  - 动态链接库
highlight: node-ffi-napi 允许在 Node.js 中直接调用 C 语言动态库函数
order: 78
---

## 问题 1：安装配置

### 安装依赖

```bash
npm install ffi-napi ref-napi ref-struct-napi ref-array-napi
npm install electron-rebuild -D

# 编译原生模块
npx electron-rebuild
```

---

## 问题 2：基本使用

### 加载库

```javascript
const ffi = require("ffi-napi");
const ref = require("ref-napi");

// Windows
const myLib = ffi.Library("mylib.dll", {
  add: ["int", ["int", "int"]],
  multiply: ["double", ["double", "double"]],
});

// macOS
const myLib = ffi.Library("libmylib.dylib", {
  /* ... */
});

// Linux
const myLib = ffi.Library("libmylib.so", {
  /* ... */
});
```

### 调用函数

```javascript
const result = myLib.add(10, 20);
console.log("10 + 20 =", result); // 30

const product = myLib.multiply(3.5, 2.0);
console.log("3.5 * 2.0 =", product); // 7.0
```

---

## 问题 3：处理指针

```javascript
const ref = require("ref-napi");

// 定义指针类型
const intPtr = ref.refType(ref.types.int);
const charPtr = ref.refType(ref.types.char);

const lib = ffi.Library("mylib", {
  getVersion: ["string", []],
  getValue: ["void", [intPtr]],
  processBuffer: ["int", ["pointer", "int"]],
});

// 使用指针
const valuePtr = ref.alloc("int");
lib.getValue(valuePtr);
console.log("值:", valuePtr.deref());

// 使用 Buffer
const buffer = Buffer.alloc(1024);
lib.processBuffer(buffer, buffer.length);
```

---

## 问题 4：处理结构体

```javascript
const StructType = require("ref-struct-napi");
const ArrayType = require("ref-array-napi");

// 定义结构体
const Point = StructType({
  x: ref.types.int,
  y: ref.types.int,
});

const Rect = StructType({
  left: ref.types.int,
  top: ref.types.int,
  right: ref.types.int,
  bottom: ref.types.int,
});

// 定义数组
const IntArray = ArrayType(ref.types.int);

const lib = ffi.Library("mylib", {
  getPoint: [Point, []],
  setRect: ["void", [ref.refType(Rect)]],
  sumArray: ["int", [IntArray, "int"]],
});

// 使用结构体
const point = lib.getPoint();
console.log(`Point: (${point.x}, ${point.y})`);

const rect = new Rect();
rect.left = 0;
rect.top = 0;
rect.right = 100;
rect.bottom = 100;
lib.setRect(rect.ref());

// 使用数组
const arr = new IntArray([1, 2, 3, 4, 5]);
const sum = lib.sumArray(arr, 5);
```

---

## 问题 5：回调函数

```javascript
// 定义回调类型
const Callback = ffi.Callback("void", ["int", "string"], (code, message) => {
  console.log(`回调: ${code} - ${message}`);
});

const lib = ffi.Library("mylib", {
  registerCallback: ["void", ["pointer"]],
  triggerCallback: ["void", []],
});

// 注册回调
lib.registerCallback(Callback);

// 触发回调
lib.triggerCallback();

// 重要：保持回调引用，防止被垃圾回收
process.on("exit", () => {
  Callback; // 保持引用
});
```

### 异步调用

```javascript
const lib = ffi.Library("mylib", {
  longOperation: ["int", ["int"]],
});

// 异步调用
lib.longOperation.async(100, (err, result) => {
  if (err) throw err;
  console.log("结果:", result);
});
```

## 延伸阅读

- [ffi-napi](https://github.com/nicedoc/node-ffi-napi)
- [ref-napi](https://github.com/nicedoc/ref-napi)
- [koffi（更现代的替代）](https://koffi.dev/)
