---
title: 如何打包不同平台？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 应用跨平台打包的方法，包括本地打包和 CI/CD 自动化打包。
tags:
  - Electron
  - 跨平台打包
  - CI/CD
  - 应用分发
estimatedTime: 10 分钟
keywords:
  - 跨平台打包
  - 多平台构建
  - CI/CD
highlight: 可以在本地打包当前平台，或使用 CI/CD 服务实现真正的跨平台打包
order: 251
---

## 问题 1：本地打包

### 打包当前平台

```bash
# 打包当前平台
npx electron-builder

# 只生成目录，不打包安装程序
npx electron-builder --dir
```

### 指定平台

```bash
# macOS
npx electron-builder --mac

# Windows
npx electron-builder --win

# Linux
npx electron-builder --linux

# 多平台
npx electron-builder --mac --win --linux
```

### 指定架构

```bash
# x64
npx electron-builder --x64

# arm64
npx electron-builder --arm64

# 组合
npx electron-builder --mac --x64 --arm64
```

---

## 问题 2：跨平台打包限制

### 限制说明

```
在 macOS 上：
✅ 可以打包 macOS
✅ 可以打包 Windows（需要 Wine）
✅ 可以打包 Linux

在 Windows 上：
❌ 无法打包 macOS（需要签名）
✅ 可以打包 Windows
✅ 可以打包 Linux

在 Linux 上：
❌ 无法打包 macOS（需要签名）
✅ 可以打包 Windows（需要 Wine）
✅ 可以打包 Linux
```

---

## 问题 3：使用 GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    tags:
      - "v*"

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --mac
      - uses: actions/upload-artifact@v3
        with:
          name: mac-build
          path: release/*.dmg

  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --win
      - uses: actions/upload-artifact@v3
        with:
          name: win-build
          path: release/*.exe

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-build
          path: release/*.AppImage
```

---

## 问题 4：自动发布

```yaml
# 带发布的完整配置
jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run build

      - name: Build and Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx electron-builder --publish always
```

---

## 问题 5：package.json 脚本

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux",
    "dist:all": "electron-builder --mac --win --linux",
    "release": "electron-builder --publish always"
  }
}
```

## 延伸阅读

- [Electron Builder CLI](https://www.electron.build/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
- [多平台构建](https://www.electron.build/multi-platform-build)
