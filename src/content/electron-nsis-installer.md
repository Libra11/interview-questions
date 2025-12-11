---
title: 如何使用 NSIS 制作 Windows 安装包？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍使用 NSIS 制作 Electron Windows 安装包的配置方法和常见定制选项。
tags:
  - Electron
  - NSIS
  - Windows
  - 安装包
estimatedTime: 12 分钟
keywords:
  - NSIS
  - Windows安装包
  - 安装程序
highlight: NSIS 是 Electron Builder 默认的 Windows 安装包格式，支持丰富的定制选项
order: 64
---

## 问题 1：NSIS 基本配置

### electron-builder 配置

```json
{
  "win": {
    "target": "nsis",
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeaderIcon": "build/icon.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "MyApp"
  }
}
```

---

## 问题 2：安装模式选择

### 一键安装

```json
{
  "nsis": {
    "oneClick": true,
    "perMachine": false
  }
}
```

### 向导式安装

```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,
    "installerSidebar": "build/installerSidebar.bmp",
    "uninstallerSidebar": "build/uninstallerSidebar.bmp"
  }
}
```

---

## 问题 3：高级配置

### 安装路径

```json
{
  "nsis": {
    "perMachine": true,
    "allowToChangeInstallationDirectory": true,
    "installerLanguages": ["zh_CN", "en_US"],
    "language": 2052
  }
}
```

### 注册表和文件关联

```json
{
  "nsis": {
    "include": "build/installer.nsh",
    "deleteAppDataOnUninstall": true
  },
  "fileAssociations": [
    {
      "ext": "myapp",
      "name": "MyApp Document",
      "description": "MyApp Document File",
      "icon": "build/file-icon.ico"
    }
  ]
}
```

---

## 问题 4：自定义 NSIS 脚本

### installer.nsh

```nsis
; build/installer.nsh

!macro customHeader
  ; 自定义头部
!macroend

!macro customInstall
  ; 安装时执行
  WriteRegStr HKLM "Software\MyApp" "InstallPath" "$INSTDIR"

  ; 创建开机启动
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MyApp" "$INSTDIR\MyApp.exe"
!macroend

!macro customUnInstall
  ; 卸载时执行
  DeleteRegKey HKLM "Software\MyApp"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MyApp"

  ; 删除用户数据
  RMDir /r "$APPDATA\MyApp"
!macroend
```

---

## 问题 5：完整配置示例

```json
{
  "appId": "com.example.myapp",
  "productName": "MyApp",

  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      }
    ],
    "icon": "build/icon.ico",
    "publisherName": "My Company",
    "verifyUpdateCodeSignature": false
  },

  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "allowElevation": true,

    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeader": "build/header.bmp",
    "installerSidebar": "build/sidebar.bmp",

    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "MyApp",

    "include": "build/installer.nsh",
    "script": "build/installer.nsi",

    "deleteAppDataOnUninstall": false,
    "runAfterFinish": true,

    "installerLanguages": ["zh_CN", "en_US"],
    "language": 2052,

    "license": "LICENSE.txt"
  }
}
```

## 延伸阅读

- [NSIS 配置文档](https://www.electron.build/configuration/nsis)
- [NSIS 官方文档](https://nsis.sourceforge.io/Docs/)
- [自定义 NSIS 脚本](https://www.electron.build/configuration/nsis#custom-nsis-script)
