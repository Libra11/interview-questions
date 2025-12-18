---
title: autoUpdater 的服务器如何搭建？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍搭建 Electron 自动更新服务器的方法，包括静态文件服务器和专用更新服务。
tags:
  - Electron
  - 自动更新
  - 服务器
  - 部署
estimatedTime: 12 分钟
keywords:
  - 更新服务器
  - 自动更新
  - 部署
highlight: 可以使用静态文件服务器、GitHub Releases 或专用更新服务来托管更新
order: 238
---

## 问题 1：服务器需要提供什么？

### 必需文件

```
/updates/
├── latest.yml           # Windows 版本信息
├── latest-mac.yml       # macOS 版本信息
├── latest-linux.yml     # Linux 版本信息
├── MyApp-1.0.0.exe      # Windows 安装包
├── MyApp-1.0.0.exe.blockmap  # 差分更新文件
├── MyApp-1.0.0.dmg      # macOS 安装包
├── MyApp-1.0.0-mac.zip  # macOS 更新包
└── MyApp-1.0.0.AppImage # Linux 安装包
```

### latest.yml 格式

```yaml
version: 1.0.0
files:
  - url: MyApp-1.0.0.exe
    sha512: abc123...
    size: 52428800
path: MyApp-1.0.0.exe
sha512: abc123...
releaseDate: "2025-12-11T00:00:00.000Z"
```

---

## 问题 2：使用静态文件服务器

### Nginx 配置

```nginx
server {
    listen 443 ssl;
    server_name updates.example.com;

    root /var/www/updates;

    location / {
        autoindex off;
        add_header Cache-Control "no-cache";
    }

    # CORS 支持
    add_header Access-Control-Allow-Origin *;
}
```

### 上传脚本

```bash
#!/bin/bash
# upload-release.sh

VERSION=$1
SERVER="user@updates.example.com"
REMOTE_PATH="/var/www/updates"

# 上传文件
scp dist/*.exe dist/*.yml $SERVER:$REMOTE_PATH/
scp dist/*.dmg dist/*.zip $SERVER:$REMOTE_PATH/
```

---

## 问题 3：使用 GitHub Releases

### electron-builder 配置

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  }
}
```

### 发布流程

```bash
# 设置 GitHub Token
export GH_TOKEN=your_github_token

# 打包并发布
npx electron-builder --publish always
```

### 客户端配置

```javascript
const { autoUpdater } = require("electron-updater");

autoUpdater.setFeedURL({
  provider: "github",
  owner: "your-username",
  repo: "your-repo",
});
```

---

## 问题 4：自建 Node.js 服务器

```javascript
// update-server.js
const express = require("express");
const path = require("path");

const app = express();
const RELEASES_DIR = path.join(__dirname, "releases");

// 获取最新版本信息
app.get("/update/:platform/:version", (req, res) => {
  const { platform, version } = req.params;
  const latestFile = platform === "darwin" ? "latest-mac.yml" : "latest.yml";

  res.sendFile(path.join(RELEASES_DIR, latestFile));
});

// 下载安装包
app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  res.download(path.join(RELEASES_DIR, filename));
});

app.listen(3000);
```

---

## 问题 5：使用云服务

### AWS S3

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "s3",
      "bucket": "my-app-updates",
      "region": "us-east-1"
    }
  }
}
```

### 阿里云 OSS

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/updates"
    }
  }
}
```

### 客户端配置

```javascript
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/updates",
});
```

## 延伸阅读

- [electron-updater 发布配置](https://www.electron.build/configuration/publish)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Hazel - 更新服务器](https://github.com/vercel/hazel)
