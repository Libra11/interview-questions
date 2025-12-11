---
title: 如何使用 differential updates（差分更新）？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 差分更新的原理和配置方法，通过只下载变化的部分来减少更新包大小。
tags:
  - Electron
  - 差分更新
  - 自动更新
  - 性能优化
estimatedTime: 10 分钟
keywords:
  - 差分更新
  - blockmap
  - 增量更新
highlight: 差分更新通过 blockmap 文件只下载变化的数据块，大幅减少下载量
order: 56
---

## 问题 1：什么是差分更新？

### 原理

```
传统更新：
下载完整安装包 100MB

差分更新：
只下载变化的部分 5-20MB

实现方式：
1. 将文件分成固定大小的块
2. 计算每个块的哈希值
3. 比较新旧版本的块差异
4. 只下载变化的块
```

---

## 问题 2：如何启用差分更新？

### electron-builder 配置

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://updates.example.com"
    },
    // 默认已启用差分更新
    "differentialPackage": true
  }
}
```

### 生成的文件

```
打包后会生成：
├── MyApp-1.0.0.exe           # 完整安装包
├── MyApp-1.0.0.exe.blockmap  # 块映射文件
└── latest.yml                # 版本信息
```

---

## 问题 3：blockmap 文件结构

```json
{
  "version": 2,
  "files": [
    {
      "name": "MyApp.exe",
      "offset": 0,
      "checksums": [
        "abc123...", // 块1的哈希
        "def456...", // 块2的哈希
        "..."
      ],
      "sizes": [
        65536, // 块1大小
        65536, // 块2大小
        "..."
      ]
    }
  ]
}
```

---

## 问题 4：客户端如何工作？

```javascript
// electron-updater 自动处理差分更新
const { autoUpdater } = require("electron-updater");

// 更新流程：
// 1. 下载 latest.yml 获取新版本信息
// 2. 下载新版本的 .blockmap 文件
// 3. 比较本地 blockmap 和新 blockmap
// 4. 只下载变化的块
// 5. 合并成完整的安装包

autoUpdater.on("download-progress", (progress) => {
  // 差分更新时，total 是实际需要下载的大小
  console.log(`下载: ${progress.transferred}/${progress.total}`);
});
```

---

## 问题 5：注意事项

### 首次安装

```
首次安装或大版本更新时：
- 没有本地 blockmap 可比较
- 会下载完整安装包
- 这是正常行为
```

### 服务器配置

```nginx
# 确保 blockmap 文件可访问
location ~ \.blockmap$ {
    add_header Content-Type application/octet-stream;
    add_header Cache-Control "no-cache";
}
```

### 禁用差分更新

```javascript
// 如果遇到问题，可以禁用
// package.json
{
  "build": {
    "differentialPackage": false
  }
}
```

## 延伸阅读

- [electron-builder 差分更新](https://www.electron.build/auto-update#differential-update)
- [blockmap 格式](https://github.com/nicedoc/blockmap)
