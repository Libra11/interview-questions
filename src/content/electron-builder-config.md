---
title: Electron Builder 的常见配置？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron Builder 的常用配置选项，包括应用信息、打包设置和平台特定配置。
tags:
  - Electron
  - Electron Builder
  - 打包配置
  - 应用分发
estimatedTime: 12 分钟
keywords:
  - Electron Builder
  - 打包配置
  - 构建选项
highlight: Electron Builder 通过 JSON 或 JS 配置文件定义打包行为
order: 250
---

## 问题 1：配置文件格式

### package.json 中配置

```json
{
  "build": {
    "appId": "com.example.myapp",
    "productName": "MyApp"
  }
}
```

### 独立配置文件

```javascript
// electron-builder.json
{
  "appId": "com.example.myapp",
  "productName": "MyApp"
}

// 或 electron-builder.yml
appId: com.example.myapp
productName: MyApp
```

---

## 问题 2：基本配置

```json
{
  "appId": "com.example.myapp",
  "productName": "MyApp",
  "copyright": "Copyright © 2025 Example",

  "directories": {
    "output": "dist",
    "buildResources": "build"
  },

  "files": ["dist/**/*", "package.json"],

  "extraResources": [
    {
      "from": "assets/",
      "to": "assets/"
    }
  ],

  "asar": true,
  "compression": "maximum"
}
```

---

## 问题 3：平台配置

### macOS

```json
{
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "category": "public.app-category.developer-tools",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ]
  }
}
```

### Windows

```json
{
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico",
    "requestedExecutionLevel": "asInvoker"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeaderIcon": "build/icon.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### Linux

```json
{
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "icon": "build/icons",
    "category": "Development",
    "maintainer": "example@example.com"
  },
  "deb": {
    "depends": ["libnotify4", "libxtst6"]
  }
}
```

---

## 问题 4：自动更新配置

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  ]
}
```

```json
{
  "publish": {
    "provider": "generic",
    "url": "https://updates.example.com"
  }
}
```

---

## 问题 5：完整配置示例

```json
{
  "appId": "com.example.myapp",
  "productName": "MyApp",
  "copyright": "Copyright © 2025",

  "directories": {
    "output": "release",
    "buildResources": "build"
  },

  "files": [
    "dist/**/*",
    "!node_modules/**/*",
    "node_modules/electron-store/**/*"
  ],

  "asar": true,
  "asarUnpack": ["**/*.node"],

  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "category": "public.app-category.productivity"
  },

  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },

  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icons"
  },

  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  },

  "publish": {
    "provider": "generic",
    "url": "https://updates.example.com"
  }
}
```

## 延伸阅读

- [Electron Builder 配置文档](https://www.electron.build/configuration/configuration)
- [macOS 配置](https://www.electron.build/configuration/mac)
- [Windows 配置](https://www.electron.build/configuration/win)
