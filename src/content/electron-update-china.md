---
title: 如何在国内网络支持自动更新？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在国内网络环境下配置 Electron 自动更新的方法，包括使用国内 CDN 和镜像服务。
tags:
  - Electron
  - 自动更新
  - 国内网络
  - CDN
estimatedTime: 10 分钟
keywords:
  - 国内更新
  - CDN加速
  - 镜像服务
highlight: 使用国内 CDN 或对象存储服务托管更新文件，确保国内用户的下载速度
order: 57
---

## 问题 1：国内网络面临的问题

### 常见问题

```
- GitHub Releases 访问慢或无法访问
- AWS S3 等国外服务延迟高
- 大文件下载经常中断
- 用户体验差
```

---

## 问题 2：使用国内对象存储

### 阿里云 OSS

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/releases"
    }
  }
}

// 客户端配置
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-bucket.oss-cn-hangzhou.aliyuncs.com/releases'
});
```

### 腾讯云 COS

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/releases"
    }
  }
}
```

---

## 问题 3：使用国内 CDN

### 配置 CDN 加速

```javascript
// 使用 CDN 域名
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://cdn.example.com/releases",
});

// CDN 回源到对象存储
// OSS/COS → CDN → 用户
```

### 七牛云配置

```javascript
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://cdn.qiniu.example.com/releases"
    }
  }
}
```

---

## 问题 4：自动选择最佳源

```javascript
// 根据网络环境选择更新源
async function getBestUpdateUrl() {
  const urls = [
    "https://cdn.example.com/releases", // 国内 CDN
    "https://oss.example.com/releases", // 国内 OSS
    "https://github.example.com/releases", // GitHub
  ];

  for (const url of urls) {
    try {
      const response = await fetch(`${url}/latest.yml`, {
        timeout: 5000,
      });
      if (response.ok) {
        return url;
      }
    } catch (e) {
      continue;
    }
  }

  return urls[0]; // 默认使用第一个
}

// 使用
const updateUrl = await getBestUpdateUrl();
autoUpdater.setFeedURL({
  provider: "generic",
  url: updateUrl,
});
```

---

## 问题 5：上传脚本

```javascript
// upload-to-oss.js
const OSS = require("ali-oss");
const path = require("path");
const fs = require("fs");

const client = new OSS({
  region: "oss-cn-hangzhou",
  accessKeyId: process.env.OSS_KEY,
  accessKeySecret: process.env.OSS_SECRET,
  bucket: "your-bucket",
});

async function uploadRelease(version) {
  const files = [
    `MyApp-${version}.exe`,
    `MyApp-${version}.exe.blockmap`,
    "latest.yml",
    `MyApp-${version}.dmg`,
    `MyApp-${version}-mac.zip`,
    "latest-mac.yml",
  ];

  for (const file of files) {
    const localPath = path.join("dist", file);
    if (fs.existsSync(localPath)) {
      await client.put(`releases/${file}`, localPath);
      console.log(`上传成功: ${file}`);
    }
  }
}

uploadRelease(process.argv[2]);
```

## 延伸阅读

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
- [electron-updater 配置](https://www.electron.build/auto-update)
