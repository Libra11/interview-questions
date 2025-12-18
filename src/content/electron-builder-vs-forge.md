---
title: Electron Builder 与 Electron Forge 的差别？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  对比 Electron Builder 和 Electron Forge 两个主流打包工具的特点、优缺点和适用场景。
tags:
  - Electron
  - 打包工具
  - Electron Builder
  - Electron Forge
estimatedTime: 10 分钟
keywords:
  - Electron Builder
  - Electron Forge
  - 打包对比
highlight: Electron Builder 功能全面适合复杂项目，Electron Forge 官方推荐更易上手
order: 236
---

## 问题 1：两者的基本区别

### Electron Builder

```
特点：
├── 第三方工具，社区维护
├── 功能丰富，配置灵活
├── 支持多种安装包格式
├── 内置 electron-updater
└── 文档完善，社区活跃
```

### Electron Forge

```
特点：
├── Electron 官方推荐
├── 集成开发工具链
├── 基于插件架构
├── 与 Webpack/Vite 集成
└── 更现代的项目结构
```

---

## 问题 2：配置方式对比

### Electron Builder

```javascript
// package.json 或 electron-builder.json
{
  "build": {
    "appId": "com.example.app",
    "productName": "MyApp",
    "directories": {
      "output": "dist"
    },
    "files": ["dist/**/*", "package.json"],
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns"
    },
    "win": {
      "target": ["nsis", "portable"],
      "icon": "build/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

### Electron Forge

```javascript
// forge.config.js
module.exports = {
  packagerConfig: {
    icon: "./assets/icon",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: { name: "my_app" },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: { format: "ULFO" },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        /* webpack 配置 */
      },
    },
  ],
};
```

---

## 问题 3：功能对比

| 功能         | Electron Builder      | Electron Forge |
| ------------ | --------------------- | -------------- |
| 自动更新     | 内置 electron-updater | 需要额外配置   |
| 代码签名     | 内置支持              | 内置支持       |
| 多平台打包   | 支持                  | 支持           |
| Webpack 集成 | 需要手动配置          | 插件支持       |
| Vite 集成    | 需要手动配置          | 插件支持       |
| 安装包格式   | 非常丰富              | 通过 makers    |
| 学习曲线     | 中等                  | 较低           |

---

## 问题 4：如何选择？

### 选择 Electron Builder

```
适合场景：
- 需要丰富的安装包格式
- 需要内置的自动更新
- 复杂的打包需求
- 已有项目迁移
```

### 选择 Electron Forge

```
适合场景：
- 新项目从零开始
- 需要与 Webpack/Vite 深度集成
- 偏好官方推荐方案
- 喜欢插件化架构
```

---

## 问题 5：快速开始

### Electron Builder

```bash
# 安装
npm install electron-builder --save-dev

# 打包
npx electron-builder

# 指定平台
npx electron-builder --mac --win --linux
```

### Electron Forge

```bash
# 创建新项目
npx create-electron-app my-app

# 或添加到现有项目
npx electron-forge import

# 开发
npm start

# 打包
npm run make
```

## 延伸阅读

- [Electron Builder 文档](https://www.electron.build/)
- [Electron Forge 文档](https://www.electronforge.io/)
- [Electron 打包指南](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
