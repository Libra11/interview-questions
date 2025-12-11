---
title: 如何安全地让渲染进程访问文件？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中安全地让渲染进程访问文件系统的方法，包括路径验证、权限控制和最小化暴露原则。
tags:
  - Electron
  - 安全
  - 文件系统
  - 最佳实践
estimatedTime: 12 分钟
keywords:
  - 安全文件访问
  - 路径验证
  - 权限控制
highlight: 通过主进程中转、路径白名单和严格验证来安全地提供文件访问能力
order: 34
---

## 问题 1：为什么直接访问文件不安全？

### 危险的做法

```javascript
// ❌ 危险：直接暴露 fs 模块
contextBridge.exposeInMainWorld("fs", require("fs"));

// ❌ 危险：允许访问任意路径
ipcMain.handle("readFile", (event, path) => {
  return fs.readFileSync(path, "utf-8"); // 可以读取任何文件！
});

// 恶意代码可以：
window.fs.readFileSync("/etc/passwd");
window.fs.readFileSync("~/.ssh/id_rsa");
window.fs.writeFileSync("/important/file", "corrupted");
```

### 风险来源

- XSS 攻击注入的恶意脚本
- 第三方库中的恶意代码
- 用户输入的恶意路径

---

## 问题 2：如何实现安全的文件访问？

### 原则 1：只暴露具体功能，不暴露通用能力

```javascript
// ✅ 安全：只暴露特定的、受限的功能
contextBridge.exposeInMainWorld("documents", {
  // 只能读取文档目录下的文件
  read: (filename) => ipcRenderer.invoke("documents:read", filename),

  // 只能保存到文档目录
  save: (filename, content) =>
    ipcRenderer.invoke("documents:save", filename, content),

  // 只能列出文档目录
  list: () => ipcRenderer.invoke("documents:list"),
});

// ❌ 不安全：暴露通用的文件操作
contextBridge.exposeInMainWorld("fs", {
  read: (path) => ipcRenderer.invoke("fs:read", path), // 任意路径
  write: (path, content) => ipcRenderer.invoke("fs:write", path, content),
});
```

### 原则 2：在主进程中验证所有输入

```javascript
// main.js
const path = require("path");
const fs = require("fs").promises;
const { app } = require("electron");

// 安全的文档目录
const DOCUMENTS_DIR = path.join(app.getPath("userData"), "documents");

// 验证并规范化文件名
function validateFilename(filename) {
  // 1. 类型检查
  if (typeof filename !== "string") {
    throw new Error("Filename must be a string");
  }

  // 2. 防止路径遍历
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error("Invalid filename");
  }

  // 3. 限制文件扩展名
  const allowedExtensions = [".txt", ".md", ".json"];
  const ext = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error("File type not allowed");
  }

  // 4. 限制文件名长度
  if (filename.length > 255) {
    throw new Error("Filename too long");
  }

  return filename;
}

// 获取安全的完整路径
function getSafePath(filename) {
  const safeName = validateFilename(filename);
  const fullPath = path.join(DOCUMENTS_DIR, safeName);

  // 再次验证最终路径在允许的目录内
  if (!fullPath.startsWith(DOCUMENTS_DIR)) {
    throw new Error("Access denied");
  }

  return fullPath;
}

// IPC 处理器
ipcMain.handle("documents:read", async (event, filename) => {
  const safePath = getSafePath(filename);
  return await fs.readFile(safePath, "utf-8");
});

ipcMain.handle("documents:save", async (event, filename, content) => {
  const safePath = getSafePath(filename);

  // 验证内容大小
  if (content.length > 10 * 1024 * 1024) {
    // 10MB 限制
    throw new Error("Content too large");
  }

  await fs.writeFile(safePath, content);
  return true;
});

ipcMain.handle("documents:list", async () => {
  await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
  const files = await fs.readdir(DOCUMENTS_DIR);
  return files.filter((f) => !f.startsWith(".")); // 过滤隐藏文件
});
```

---

## 问题 3：如何处理用户选择的文件？

### 使用对话框获取路径

```javascript
// main.js
ipcMain.handle("file:open", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "文档", extensions: ["txt", "md"] }],
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];

  // 用户通过对话框选择的文件是可信的
  const content = await fs.readFile(filePath, "utf-8");

  return {
    path: filePath,
    name: path.basename(filePath),
    content,
  };
});

// 保存到用户选择的位置
ipcMain.handle("file:saveAs", async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: "文本文件", extensions: ["txt"] }],
  });

  if (result.canceled) {
    return null;
  }

  await fs.writeFile(result.filePath, content);
  return result.filePath;
});
```

### 记住用户授权的路径

```javascript
// 存储用户授权的路径
const authorizedPaths = new Set();

ipcMain.handle("file:open", async (event) => {
  const result = await dialog.showOpenDialog({
    /* ... */
  });

  if (!result.canceled) {
    const filePath = result.filePaths[0];
    // 记住这个路径，允许后续访问
    authorizedPaths.add(filePath);
    return { path: filePath, content: await fs.readFile(filePath, "utf-8") };
  }

  return null;
});

// 重新读取已授权的文件
ipcMain.handle("file:reread", async (event, filePath) => {
  // 只允许读取用户之前选择过的文件
  if (!authorizedPaths.has(filePath)) {
    throw new Error("File not authorized");
  }

  return await fs.readFile(filePath, "utf-8");
});
```

---

## 问题 4：如何限制文件操作的范围？

### 使用沙箱目录

```javascript
class SandboxedFileSystem {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
  }

  // 确保路径在沙箱内
  resolvePath(relativePath) {
    const resolved = path.resolve(this.baseDir, relativePath);

    if (!resolved.startsWith(this.baseDir + path.sep)) {
      throw new Error("Path escapes sandbox");
    }

    return resolved;
  }

  async read(relativePath) {
    const fullPath = this.resolvePath(relativePath);
    return await fs.readFile(fullPath, "utf-8");
  }

  async write(relativePath, content) {
    const fullPath = this.resolvePath(relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  async delete(relativePath) {
    const fullPath = this.resolvePath(relativePath);
    await fs.unlink(fullPath);
  }

  async list(relativePath = ".") {
    const fullPath = this.resolvePath(relativePath);
    return await fs.readdir(fullPath);
  }
}

// 使用
const sandbox = new SandboxedFileSystem(app.getPath("userData"));

ipcMain.handle("sandbox:read", (e, path) => sandbox.read(path));
ipcMain.handle("sandbox:write", (e, path, content) =>
  sandbox.write(path, content)
);
ipcMain.handle("sandbox:delete", (e, path) => sandbox.delete(path));
ipcMain.handle("sandbox:list", (e, path) => sandbox.list(path));
```

---

## 问题 5：完整的安全文件系统示例

```javascript
// SecureFileSystem.js
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

class SecureFileSystem {
  constructor(options = {}) {
    this.baseDir = options.baseDir;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedExtensions = options.allowedExtensions || [
      ".txt",
      ".md",
      ".json",
    ];
    this.authorizedPaths = new Set();
  }

  validateFilename(filename) {
    if (typeof filename !== "string") {
      throw new Error("Invalid filename type");
    }

    // 只允许基本文件名，不允许路径
    const basename = path.basename(filename);
    if (basename !== filename) {
      throw new Error("Path components not allowed");
    }

    // 检查扩展名
    const ext = path.extname(filename).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`Extension ${ext} not allowed`);
    }

    // 检查长度
    if (filename.length > 255) {
      throw new Error("Filename too long");
    }

    // 检查非法字符
    if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
      throw new Error("Invalid characters in filename");
    }

    return filename;
  }

  getSafePath(filename) {
    const safeName = this.validateFilename(filename);
    const fullPath = path.join(this.baseDir, safeName);

    // 确保路径在基础目录内
    const realBase = path.resolve(this.baseDir);
    const realPath = path.resolve(fullPath);

    if (!realPath.startsWith(realBase + path.sep) && realPath !== realBase) {
      throw new Error("Path escapes base directory");
    }

    return fullPath;
  }

  async read(filename) {
    const safePath = this.getSafePath(filename);

    // 检查文件大小
    const stats = await fs.stat(safePath);
    if (stats.size > this.maxFileSize) {
      throw new Error("File too large");
    }

    return await fs.readFile(safePath, "utf-8");
  }

  async write(filename, content) {
    const safePath = this.getSafePath(filename);

    // 检查内容大小
    if (Buffer.byteLength(content, "utf-8") > this.maxFileSize) {
      throw new Error("Content too large");
    }

    // 确保目录存在
    await fs.mkdir(path.dirname(safePath), { recursive: true });

    // 原子写入：先写临时文件，再重命名
    const tempPath = `${safePath}.${crypto.randomBytes(8).toString("hex")}.tmp`;
    await fs.writeFile(tempPath, content);
    await fs.rename(tempPath, safePath);

    return true;
  }

  async delete(filename) {
    const safePath = this.getSafePath(filename);
    await fs.unlink(safePath);
    return true;
  }

  async list() {
    await fs.mkdir(this.baseDir, { recursive: true });
    const files = await fs.readdir(this.baseDir);
    return files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return this.allowedExtensions.includes(ext) && !f.startsWith(".");
    });
  }

  // 授权外部文件访问
  authorize(filePath) {
    this.authorizedPaths.add(path.resolve(filePath));
  }

  async readAuthorized(filePath) {
    const resolved = path.resolve(filePath);
    if (!this.authorizedPaths.has(resolved)) {
      throw new Error("File not authorized");
    }
    return await fs.readFile(resolved, "utf-8");
  }
}

module.exports = SecureFileSystem;
```

## 延伸阅读

- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js 路径遍历防护](https://owasp.org/www-community/attacks/Path_Traversal)
- [文件系统安全](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
