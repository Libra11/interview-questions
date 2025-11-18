---
title: 分片上传文件时如何校验文件完整性
category: 网络
difficulty: 高级
updatedAt: 2025-11-18
summary: >-
  了解大文件分片上传的完整流程，掌握使用哈希算法校验文件完整性的方法，以及断点续传和秒传的实现原理
tags:
  - 文件上传
  - 分片上传
  - 哈希校验
  - 断点续传
estimatedTime: 28 分钟
keywords:
  - 分片上传
  - 文件完整性
  - MD5
  - SHA256
  - 断点续传
  - 秒传
highlight: 通过计算文件哈希值和分片哈希值，确保大文件上传的完整性和可靠性
order: 92
---

## 问题 1：为什么需要分片上传？

### 大文件上传的问题

```javascript
// 传统上传：一次性上传整个文件
const file = document.getElementById('fileInput').files[0];

// ❌ 问题：
// 1. 大文件上传时间长，容易超时
// 2. 网络中断导致上传失败，需要重新上传
// 3. 占用大量内存
// 4. 无法显示准确的上传进度
```

### 分片上传的优势

```javascript
// ✅ 分片上传
// 1. 将大文件切分成小块（如 5MB 一片）
// 2. 并发上传多个分片，提高速度
// 3. 单个分片失败只需重传该分片
// 4. 支持断点续传
// 5. 可以实现秒传功能
```

---

## 问题 2：如何实现分片上传？

### 基本流程

```javascript
// 1. 文件分片
function sliceFile(file, chunkSize = 5 * 1024 * 1024) {
  const chunks = [];
  let start = 0;
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }
  
  return chunks;
}

// 2. 上传单个分片
async function uploadChunk(chunk, index, fileHash) {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('index', index);
  formData.append('fileHash', fileHash);
  
  const response = await fetch('/api/upload/chunk', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}

// 3. 合并分片
async function mergeChunks(fileHash, fileName, totalChunks) {
  const response = await fetch('/api/upload/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileHash,
      fileName,
      totalChunks
    })
  });
  
  return response.json();
}
```

### 完整上传流程

```javascript
async function uploadFile(file) {
  // 1. 计算文件哈希（用于唯一标识文件）
  const fileHash = await calculateFileHash(file);
  
  // 2. 检查文件是否已存在（秒传）
  const exists = await checkFileExists(fileHash);
  if (exists) {
    console.log('文件已存在，秒传成功');
    return { success: true, message: '秒传' };
  }
  
  // 3. 分片
  const chunks = sliceFile(file);
  
  // 4. 上传所有分片
  const uploadPromises = chunks.map((chunk, index) => 
    uploadChunk(chunk, index, fileHash)
  );
  
  await Promise.all(uploadPromises);
  
  // 5. 合并分片
  await mergeChunks(fileHash, file.name, chunks.length);
  
  return { success: true, message: '上传成功' };
}
```

---

## 问题 3：如何计算文件哈希值？

### 使用 Web Crypto API

```javascript
async function calculateFileHash(file) {
  // 读取文件内容
  const arrayBuffer = await file.arrayBuffer();
  
  // 计算 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  
  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hashHex;
}
```

### 使用 spark-md5（分片计算，避免内存溢出）

```javascript
import SparkMD5 from 'spark-md5';

async function calculateFileHashByChunks(file) {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    const chunkSize = 2 * 1024 * 1024; // 2MB
    let currentChunk = 0;
    const chunks = Math.ceil(file.size / chunkSize);
    
    fileReader.onload = (e) => {
      spark.append(e.target.result);
      currentChunk++;
      
      if (currentChunk < chunks) {
        loadNext();
      } else {
        const hash = spark.end();
        resolve(hash);
      }
    };
    
    fileReader.onerror = reject;
    
    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }
    
    loadNext();
  });
}
```

### 优化：采样哈希（提高速度）

```javascript
// 对于超大文件，不计算整个文件的哈希
// 而是采样部分内容计算哈希
async function calculateSampleHash(file) {
  const spark = new SparkMD5.ArrayBuffer();
  const chunkSize = 2 * 1024 * 1024;
  
  // 1. 文件头部 2MB
  const head = file.slice(0, chunkSize);
  spark.append(await head.arrayBuffer());
  
  // 2. 文件尾部 2MB
  const tail = file.slice(-chunkSize);
  spark.append(await tail.arrayBuffer());
  
  // 3. 中间采样几个点
  const sampleCount = 3;
  const step = Math.floor(file.size / (sampleCount + 1));
  
  for (let i = 1; i <= sampleCount; i++) {
    const start = step * i;
    const sample = file.slice(start, start + chunkSize);
    spark.append(await sample.arrayBuffer());
  }
  
  // 4. 加入文件大小和修改时间，增加唯一性
  spark.append(new TextEncoder().encode(
    `${file.size}-${file.lastModified}`
  ));
  
  return spark.end();
}
```

---

## 问题 4：如何校验分片和文件的完整性？

### 方案 1：每个分片单独校验

```javascript
// 前端：上传分片时计算分片哈希
async function uploadChunkWithHash(chunk, index, fileHash) {
  // 计算分片哈希
  const chunkHash = await calculateChunkHash(chunk);
  
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('index', index);
  formData.append('fileHash', fileHash);
  formData.append('chunkHash', chunkHash);  // 分片哈希
  
  await fetch('/api/upload/chunk', {
    method: 'POST',
    body: formData
  });
}

async function calculateChunkHash(chunk) {
  const arrayBuffer = await chunk.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

```javascript
// 后端：验证分片哈希
app.post('/api/upload/chunk', async (req, res) => {
  const { chunk, index, fileHash, chunkHash } = req.body;
  
  // 计算接收到的分片的哈希
  const receivedHash = calculateHash(chunk);
  
  // 校验哈希是否匹配
  if (receivedHash !== chunkHash) {
    return res.status(400).json({
      error: '分片数据损坏，哈希不匹配'
    });
  }
  
  // 保存分片
  await saveChunk(fileHash, index, chunk);
  
  res.json({ success: true });
});
```

### 方案 2：合并后校验整个文件

```javascript
// 后端：合并分片后校验
app.post('/api/upload/merge', async (req, res) => {
  const { fileHash, fileName, totalChunks } = req.body;
  
  // 1. 合并所有分片
  const filePath = await mergeAllChunks(fileHash, totalChunks);
  
  // 2. 计算合并后文件的哈希
  const actualHash = await calculateFileHashOnServer(filePath);
  
  // 3. 校验哈希
  if (actualHash !== fileHash) {
    // 删除损坏的文件
    fs.unlinkSync(filePath);
    return res.status(400).json({
      error: '文件完整性校验失败'
    });
  }
  
  // 4. 重命名文件
  const finalPath = path.join(uploadDir, fileName);
  fs.renameSync(filePath, finalPath);
  
  res.json({ success: true, path: finalPath });
});
```

### 方案 3：使用 Merkle Tree（高级）

```javascript
// 构建 Merkle Tree 进行校验
class MerkleTree {
  constructor(chunks) {
    this.leaves = chunks.map(chunk => this.hash(chunk));
    this.tree = this.buildTree(this.leaves);
  }
  
  hash(data) {
    // 计算哈希
    return crypto.subtle.digest('SHA-256', data);
  }
  
  buildTree(leaves) {
    if (leaves.length === 1) return leaves;
    
    const parents = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = leaves[i + 1] || left;
      const parent = this.hash(left + right);
      parents.push(parent);
    }
    
    return this.buildTree(parents);
  }
  
  getRoot() {
    return this.tree[0];
  }
}

// 使用 Merkle Tree
const tree = new MerkleTree(chunks);
const rootHash = tree.getRoot();

// 上传时只需传递根哈希
// 服务器重建 Merkle Tree 并比对根哈希
```

---

## 问题 5：如何实现断点续传？

### 前端实现

```javascript
class FileUploader {
  constructor(file) {
    this.file = file;
    this.chunkSize = 5 * 1024 * 1024;
    this.chunks = [];
    this.uploadedChunks = new Set();
  }
  
  async upload() {
    // 1. 计算文件哈希
    this.fileHash = await calculateFileHash(this.file);
    
    // 2. 检查已上传的分片
    const uploaded = await this.checkUploadedChunks();
    this.uploadedChunks = new Set(uploaded);
    
    // 3. 分片
    this.chunks = sliceFile(this.file, this.chunkSize);
    
    // 4. 上传未完成的分片
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.uploadedChunks.has(i)) {
        console.log(`分片 ${i} 已上传，跳过`);
        continue;
      }
      
      await this.uploadChunk(this.chunks[i], i);
      this.uploadedChunks.add(i);
      
      // 保存进度到 localStorage
      this.saveProgress();
    }
    
    // 5. 合并分片
    await this.mergeChunks();
  }
  
  async checkUploadedChunks() {
    const response = await fetch(
      `/api/upload/check?fileHash=${this.fileHash}`
    );
    const data = await response.json();
    return data.uploadedChunks || [];
  }
  
  saveProgress() {
    localStorage.setItem(`upload_${this.fileHash}`, JSON.stringify({
      uploadedChunks: Array.from(this.uploadedChunks),
      totalChunks: this.chunks.length
    }));
  }
  
  loadProgress() {
    const saved = localStorage.getItem(`upload_${this.fileHash}`);
    if (saved) {
      const data = JSON.parse(saved);
      this.uploadedChunks = new Set(data.uploadedChunks);
    }
  }
}
```

### 后端实现

```javascript
// 检查已上传的分片
app.get('/api/upload/check', (req, res) => {
  const { fileHash } = req.query;
  const chunkDir = path.join(uploadDir, fileHash);
  
  if (!fs.existsSync(chunkDir)) {
    return res.json({ uploadedChunks: [] });
  }
  
  // 读取已上传的分片索引
  const files = fs.readdirSync(chunkDir);
  const uploadedChunks = files.map(f => parseInt(f));
  
  res.json({ uploadedChunks });
});
```

---

## 总结

**核心要点**：

### 1. 分片上传流程
- 计算文件哈希（唯一标识）
- 检查是否已存在（秒传）
- 文件分片
- 并发上传分片
- 合并分片

### 2. 完整性校验方法
- 每个分片单独校验哈希
- 合并后校验整个文件哈希
- 使用 Merkle Tree（高级）

### 3. 哈希计算
- Web Crypto API（SHA-256）
- spark-md5（MD5，分片计算）
- 采样哈希（超大文件优化）

### 4. 断点续传
- 记录已上传的分片
- 恢复时跳过已上传分片
- 使用 localStorage 保存进度

---

## 延伸阅读

- [MDN - File API](https://developer.mozilla.org/zh-CN/docs/Web/API/File)
- [MDN - Web Crypto API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API)
- [spark-md5](https://github.com/satazor/js-spark-md5)
- [大文件上传最佳实践](https://web.dev/articles/file-upload-best-practices)
