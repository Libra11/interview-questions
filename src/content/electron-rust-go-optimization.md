---
title: 如何使用 Rust 或 Go 优化耗时任务？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍在 Electron 中集成 Rust 或 Go 编写的原生模块来优化 CPU 密集型任务，
  包括 NAPI、WebAssembly 以及子进程调用等方案。
tags:
  - Electron
  - Rust
  - Go
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - electron rust
  - electron go
  - 原生模块优化
highlight: 了解如何用 Rust/Go 编写高性能原生模块，大幅提升 Electron 应用性能。
order: 93
---

## 问题 1：为什么要用 Rust/Go 优化？

JavaScript 在处理 CPU 密集型任务时有性能瓶颈：

- **图像/视频处理** - 像素级操作
- **加密算法** - 复杂数学运算  
- **数据压缩** - 大量循环计算
- **文件解析** - 二进制处理

Rust/Go 的优势：

- 编译为原生代码，性能远超 JS
- 内存安全（Rust）或 GC 高效（Go）
- 可直接调用系统 API

---

## 问题 2：如何使用 NAPI-RS（Rust）？

```rust
// Cargo.toml
[package]
name = "my-native"
version = "0.1.0"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = "2"
napi-derive = "2"

// src/lib.rs
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub fn compute_hash(data: Buffer) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(&data);
    format!("{:x}", hasher.finalize())
}

#[napi]
pub async fn process_image(path: String) -> Result<Buffer> {
    // 图像处理逻辑
    Ok(Buffer::from(processed_data))
}
```

在 Electron 中使用：

```javascript
// main.js
const native = require('./native/index.node')

const hash = native.computeHash(Buffer.from('hello'))
const result = await native.processImage('/path/to/image.png')
```

---

## 问题 3：如何使用 WebAssembly？

```rust
// Rust -> WASM
// lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2)
    }
}
```

```javascript
// 在渲染进程中使用
import init, { fibonacci } from './pkg/my_wasm.js'

await init()
const result = fibonacci(40) // WASM 比 JS 快很多
```

---

## 问题 4：如何使用子进程调用 Go？

```go
// processor.go
package main

import (
    "encoding/json"
    "os"
)

type Input struct {
    Data []byte `json:"data"`
}

type Output struct {
    Result string `json:"result"`
}

func main() {
    var input Input
    json.NewDecoder(os.Stdin).Decode(&input)
    
    // 处理数据
    result := processData(input.Data)
    
    output := Output{Result: result}
    json.NewEncoder(os.Stdout).Encode(output)
}
```

```javascript
// main.js
const { spawn } = require('child_process')

function callGoProcessor(data) {
  return new Promise((resolve, reject) => {
    const proc = spawn('./processor')
    
    let output = ''
    proc.stdout.on('data', (chunk) => output += chunk)
    proc.on('close', () => resolve(JSON.parse(output)))
    
    proc.stdin.write(JSON.stringify({ data }))
    proc.stdin.end()
  })
}
```

---

## 延伸阅读

- [NAPI-RS 文档](https://napi.rs/)
- [wasm-bindgen 指南](https://rustwasm.github.io/wasm-bindgen/)
- [Electron 原生模块](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
