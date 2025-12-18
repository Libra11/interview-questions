---
title: 如何处理权限（摄像头、麦克风）？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 应用中请求和处理摄像头、麦克风等系统权限的方法。
tags:
  - Electron
  - 权限
  - 摄像头
  - 麦克风
estimatedTime: 10 分钟
keywords:
  - 权限请求
  - 摄像头
  - 麦克风
  - 系统权限
highlight: macOS 需要在 Info.plist 声明权限，Windows 通过系统设置管理
order: 274
---

## 问题 1：权限类型

### 常见权限

```
媒体权限：
├── 摄像头 (camera)
├── 麦克风 (microphone)
└── 屏幕录制 (screen)

系统权限：
├── 通知
├── 位置
├── 辅助功能
└── 完全磁盘访问
```

---

## 问题 2：请求媒体权限

### 使用 Web API

```javascript
// renderer.js
async function requestCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // 使用摄像头
    const video = document.getElementById("video");
    video.srcObject = stream;

    return true;
  } catch (error) {
    console.error("权限被拒绝:", error);
    return false;
  }
}
```

### 检查权限状态

```javascript
// renderer.js
async function checkPermission(name) {
  try {
    const result = await navigator.permissions.query({ name });
    return result.state; // 'granted', 'denied', 'prompt'
  } catch {
    return "unknown";
  }
}
```

---

## 问题 3：macOS 权限配置

### Info.plist

```xml
<!-- electron-builder.json 中配置 -->
{
  "mac": {
    "extendInfo": {
      "NSCameraUsageDescription": "此应用需要访问摄像头进行视频通话",
      "NSMicrophoneUsageDescription": "此应用需要访问麦克风进行语音通话",
      "NSScreenCaptureDescription": "此应用需要录制屏幕"
    }
  }
}
```

### 检查系统权限

```javascript
// main.js
const { systemPreferences } = require("electron");

// 检查摄像头权限
const cameraStatus = systemPreferences.getMediaAccessStatus("camera");
// 'not-determined', 'granted', 'denied', 'restricted', 'unknown'

// 请求权限
async function requestCameraAccess() {
  if (process.platform === "darwin") {
    const granted = await systemPreferences.askForMediaAccess("camera");
    return granted;
  }
  return true;
}
```

---

## 问题 4：处理权限拒绝

```javascript
// main.js
const { dialog, shell } = require("electron");

async function handlePermissionDenied(type) {
  const { response } = await dialog.showMessageBox({
    type: "warning",
    title: "权限被拒绝",
    message: `应用需要${type}权限才能正常工作`,
    buttons: ["打开系统设置", "取消"],
  });

  if (response === 0) {
    if (process.platform === "darwin") {
      // 打开系统偏好设置
      shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera"
      );
    } else if (process.platform === "win32") {
      // 打开 Windows 设置
      shell.openExternal("ms-settings:privacy-webcam");
    }
  }
}
```

---

## 问题 5：权限处理器

```javascript
// main.js
const { session } = require("electron");

// 设置权限处理器
session.defaultSession.setPermissionRequestHandler(
  (webContents, permission, callback) => {
    const allowedPermissions = ["media", "notifications"];

    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      console.log("拒绝权限:", permission);
      callback(false);
    }
  }
);

// 设置权限检查处理器
session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
  const allowedPermissions = ["media", "notifications"];
  return allowedPermissions.includes(permission);
});
```

### 完整示例

```javascript
// 权限管理器
class PermissionManager {
  async checkCamera() {
    if (process.platform === "darwin") {
      return systemPreferences.getMediaAccessStatus("camera") === "granted";
    }
    return true;
  }

  async requestCamera() {
    if (process.platform === "darwin") {
      return await systemPreferences.askForMediaAccess("camera");
    }
    return true;
  }

  async checkMicrophone() {
    if (process.platform === "darwin") {
      return systemPreferences.getMediaAccessStatus("microphone") === "granted";
    }
    return true;
  }

  async requestMicrophone() {
    if (process.platform === "darwin") {
      return await systemPreferences.askForMediaAccess("microphone");
    }
    return true;
  }
}
```

## 延伸阅读

- [systemPreferences](https://www.electronjs.org/docs/latest/api/system-preferences)
- [session 权限](https://www.electronjs.org/docs/latest/api/session#sessetpermissionrequesthandlerhandler)
