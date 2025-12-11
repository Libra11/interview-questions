---
title: asar 优势与劣势？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  分析 Electron ASAR 归档格式的优缺点，帮助决定是否使用 ASAR 打包。
tags:
  - Electron
  - ASAR
  - 打包
  - 性能
estimatedTime: 8 分钟
keywords:
  - ASAR优势
  - ASAR劣势
  - 打包选择
highlight: ASAR 提升性能和基本保护，但有原生模块和调试方面的限制
order: 62
---

## 问题 1：ASAR 的优势

### 性能提升

```
文件读取优化：
├── 减少系统调用次数
├── 文件索引在内存中
├── 随机访问无需解压
└── Windows 上效果尤为明显
```

### 路径问题解决

```
Windows 路径限制：
├── 最大路径长度 260 字符
├── node_modules 深度嵌套易超限
└── ASAR 打包后路径变短
```

### 基本源码保护

```
保护效果：
├── 用户无法直接浏览源文件
├── 增加逆向工程难度
└── 防止意外修改
```

### 分发简化

```
单文件优势：
├── 减少文件数量
├── 复制/移动更快
└── 校验更简单
```

---

## 问题 2：ASAR 的劣势

### 原生模块限制

```javascript
// .node 文件不能在 ASAR 中运行
// 必须解包
{
  "asarUnpack": ["**/*.node"]
}
```

### 子进程限制

```javascript
// 无法直接执行 ASAR 中的脚本
const { fork } = require('child_process');

// ❌ 不工作
fork(path.join(__dirname, 'worker.js'));

// ✅ 需要解包
{
  "asarUnpack": ["**/worker.js"]
}
```

### 调试困难

```
开发时问题：
├── 错误堆栈指向 ASAR 内部
├── 无法直接修改文件测试
└── 需要重新打包才能生效
```

### 某些 API 不兼容

```javascript
// 不支持的操作：
fs.access(); // 同步检查
fs.realpath(); // 获取真实路径
child_process.execFile(); // 执行文件
```

---

## 问题 3：何时使用 ASAR？

### 推荐使用

```
✅ 生产环境发布
✅ 有大量小文件
✅ 需要基本源码保护
✅ Windows 平台分发
```

### 考虑不使用

```
❌ 开发调试阶段
❌ 大量原生模块
❌ 需要动态修改文件
❌ 子进程密集使用
```

---

## 问题 4：混合策略

```json
// electron-builder.json
{
  "asar": true,
  "asarUnpack": ["**/*.node", "**/worker*.js", "resources/**", "**/ffmpeg*"]
}
```

### 目录结构

```
app.asar           # 主要代码
app.asar.unpacked/ # 解包的文件
├── node_modules/
│   └── native-module/
│       └── binding.node
└── resources/
    └── data.db
```

---

## 问题 5：性能对比

```
测试场景：1000 个小文件

不使用 ASAR：
├── 首次加载：~2000ms
├── 文件读取：~500ms
└── 安装时间：~30s

使用 ASAR：
├── 首次加载：~800ms
├── 文件读取：~200ms
└── 安装时间：~10s
```

## 延伸阅读

- [Electron ASAR 文档](https://www.electronjs.org/docs/latest/tutorial/asar-archives)
- [asarUnpack 配置](https://www.electron.build/configuration/configuration#asar)
