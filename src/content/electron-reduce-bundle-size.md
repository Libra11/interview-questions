---
title: 如何减少 Electron 应用体积？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍减少 Electron 应用打包体积的各种方法，包括依赖优化、代码分割和打包配置。
tags:
  - Electron
  - 性能优化
  - 打包
  - 体积优化
estimatedTime: 12 分钟
keywords:
  - 应用体积
  - 打包优化
  - 依赖优化
highlight: 通过依赖精简、代码分割和正确的打包配置可以显著减少应用体积
order: 45
---

## 问题 1：Electron 应用为什么这么大？

### 体积组成

```
典型 Electron 应用体积分布：
├── Electron 运行时    ~150MB（压缩后 ~50MB）
├── Node.js 模块       ~10-100MB
├── 应用代码           ~1-10MB
└── 资源文件           ~1-50MB
```

### 主要原因

- Electron 包含完整的 Chromium 和 Node.js
- node_modules 中的冗余依赖
- 未优化的资源文件

---

## 问题 2：如何优化依赖？

### 分析依赖大小

```bash
# 使用 webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# 或使用 source-map-explorer
npx source-map-explorer dist/bundle.js
```

### 精简 dependencies

```javascript
// package.json
{
  // 只在 dependencies 中保留运行时必需的包
  "dependencies": {
    "electron-store": "^8.0.0"
  },
  // 开发依赖放在 devDependencies
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0",
    "webpack": "^5.0.0"
  }
}
```

### 使用更小的替代库

```javascript
// ❌ 大型库
import _ from "lodash"; // ~70KB
import moment from "moment"; // ~290KB

// ✅ 更小的替代
import debounce from "lodash/debounce"; // ~2KB
import dayjs from "dayjs"; // ~7KB
```

---

## 问题 3：如何配置打包工具？

### Electron Builder 配置

```javascript
// electron-builder.json
{
  "asar": true,
  "compression": "maximum",
  "files": [
    "dist/**/*",
    "!node_modules/**/*",
    "node_modules/electron-store/**/*"  // 只包含必要的模块
  ],
  "asarUnpack": [
    "**/*.node"  // 原生模块需要解包
  ]
}
```

### 排除不必要的文件

```javascript
// electron-builder.json
{
  "files": [
    "!**/*.map",
    "!**/*.md",
    "!**/test/**",
    "!**/tests/**",
    "!**/*.ts",
    "!**/tsconfig.json"
  ]
}
```

---

## 问题 4：如何优化前端代码？

### Webpack 优化

```javascript
// webpack.config.js
module.exports = {
  mode: "production",
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
    },
    usedExports: true, // Tree shaking
  },
  externals: {
    // 不打包 Electron 模块
    electron: "commonjs electron",
  },
};
```

### 代码分割

```javascript
// 动态导入大型模块
const loadEditor = () => import("./editor");

button.onclick = async () => {
  const { Editor } = await loadEditor();
  new Editor();
};
```

---

## 问题 5：其他优化技巧

### 压缩资源

```bash
# 压缩图片
npx imagemin src/images/* --out-dir=dist/images

# 使用 WebP 格式
npx cwebp input.png -o output.webp
```

### 使用 UPX 压缩（谨慎）

```javascript
// electron-builder.json
{
  "win": {
    "compression": "maximum"
  },
  // UPX 可能导致杀毒软件误报
  // "upx": true
}
```

### 按平台打包

```bash
# 只打包当前平台
electron-builder --dir

# 指定平台
electron-builder --win --x64
electron-builder --mac --arm64
```

## 延伸阅读

- [Electron Builder 配置](https://www.electron.build/configuration/configuration)
- [Webpack 优化指南](https://webpack.js.org/guides/production/)
- [减小 Node.js 应用体积](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
