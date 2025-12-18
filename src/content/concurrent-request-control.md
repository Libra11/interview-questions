---
title: 前端如何控制几十个请求的并发
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  掌握前端并发请求控制的多种方案,包括 Promise 并发控制、请求队列、分批处理等技术,理解如何优雅地处理大量异步请求。
tags:
  - JavaScript
  - 并发控制
  - Promise
  - 异步编程
estimatedTime: 24 分钟
keywords:
  - 并发控制
  - Promise并发
  - 请求队列
  - 限流
highlight: 并发控制是前端性能优化的重要手段,合理控制并发数可以避免浏览器卡顿和服务器压力
order: 99
---

## 问题 1:为什么需要控制并发?

### 问题场景

```javascript
// 场景:上传 100 张图片
const files = [...]; // 100 个文件

// ❌ 不好的做法 - 同时发起 100 个请求
const promises = files.map(file => uploadFile(file));
await Promise.all(promises);

// 问题:
// 1. 浏览器限制:Chrome 同域名最多 6 个并发
// 2. 服务器压力:瞬间 100 个请求
// 3. 内存占用:100 个文件同时读取
// 4. 用户体验:浏览器卡顿
```

### 浏览器并发限制

```javascript
// 浏览器对同一域名的并发请求有限制
// Chrome/Firefox: 6 个
// IE: 2-8 个(版本不同)
// Safari: 6 个

// 超过限制的请求会排队等待
// 例如:发起 20 个请求
// 前 6 个立即发送
// 后 14 个等待前面的完成
```

---

## 问题 2:Promise 并发控制实现

### 方案 1:简单的并发控制

```javascript
/**
 * 并发控制函数
 * @param {Array} tasks - 任务数组
 * @param {Number} limit - 并发限制
 */
async function concurrentControl(tasks, limit) {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    // 创建 Promise
    const p = Promise.resolve().then(() => task());
    results.push(p);
    
    // 如果达到并发限制,等待一个完成
    if (limit <= tasks.length) {
      const e = p.then(() => {
        // 完成后从执行队列中移除
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

// 使用
const tasks = Array.from({ length: 20 }, (_, i) => {
  return () => fetch(`/api/data/${i}`);
});

await concurrentControl(tasks, 3);  // 最多 3 个并发
```

### 方案 2:请求队列类

```javascript
class RequestQueue {
  constructor(limit = 3) {
    this.limit = limit;      // 并发限制
    this.queue = [];         // 等待队列
    this.running = 0;        // 正在执行的数量
  }
  
  async add(task) {
    // 如果达到并发限制,等待
    while (this.running >= this.limit) {
      await new Promise(resolve => {
        this.queue.push(resolve);
      });
    }
    
    // 执行任务
    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      // 从队列中取出下一个任务
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

// 使用
const queue = new RequestQueue(3);

const tasks = Array.from({ length: 20 }, (_, i) => {
  return queue.add(() => fetch(`/api/data/${i}`));
});

await Promise.all(tasks);
```

### 方案 3:使用 p-limit 库

```javascript
import pLimit from 'p-limit';

const limit = pLimit(3);  // 限制 3 个并发

const tasks = Array.from({ length: 20 }, (_, i) => {
  return limit(() => fetch(`/api/data/${i}`));
});

await Promise.all(tasks);

// p-limit 的优势:
// 1. 简单易用
// 2. 经过充分测试
// 3. 支持 TypeScript
// 4. 体积小(< 1KB)
```

---

## 问题 3:分批处理方案

### 方案 1:简单分批

```javascript
/**
 * 分批处理
 * @param {Array} items - 数据数组
 * @param {Number} batchSize - 每批数量
 * @param {Function} handler - 处理函数
 */
async function batchProcess(items, batchSize, handler) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => handler(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// 使用
const files = [...];  // 100 个文件

await batchProcess(files, 5, async (file) => {
  return uploadFile(file);
});

// 每批 5 个,串行处理
// 第 1 批:1-5 并发
// 第 2 批:6-10 并发
// ...
```

### 方案 2:带进度的分批

```javascript
async function batchProcessWithProgress(items, batchSize, handler, onProgress) {
  const results = [];
  const total = items.length;
  let completed = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await handler(item);
        completed++;
        // 更新进度
        onProgress({
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        });
        return result;
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

// 使用
await batchProcessWithProgress(
  files,
  5,
  uploadFile,
  (progress) => {
    console.log(`进度: ${progress.percentage}%`);
  }
);
```

---

## 问题 4:高级并发控制

### 方案 1:动态调整并发数

```javascript
class AdaptiveQueue {
  constructor(initialLimit = 3) {
    this.limit = initialLimit;
    this.queue = [];
    this.running = 0;
    this.successCount = 0;
    this.failCount = 0;
  }
  
  async add(task) {
    while (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    const startTime = Date.now();
    
    try {
      const result = await task();
      this.successCount++;
      
      // 成功且快速,增加并发
      if (Date.now() - startTime < 1000 && this.limit < 10) {
        this.limit++;
      }
      
      return result;
    } catch (error) {
      this.failCount++;
      
      // 失败率高,减少并发
      if (this.failCount / (this.successCount + this.failCount) > 0.1) {
        this.limit = Math.max(1, this.limit - 1);
      }
      
      throw error;
    } finally {
      this.running--;
      this.queue.shift()?.();
    }
  }
}
```

### 方案 2:优先级队列

```javascript
class PriorityQueue {
  constructor(limit = 3) {
    this.limit = limit;
    this.queue = [];
    this.running = 0;
  }
  
  async add(task, priority = 0) {
    return new Promise((resolve, reject) => {
      // 添加到队列
      this.queue.push({ task, priority, resolve, reject });
      // 按优先级排序
      this.queue.sort((a, b) => b.priority - a.priority);
      // 尝试执行
      this.run();
    });
  }
  
  async run() {
    while (this.running < this.limit && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;
      
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.run();
        });
    }
  }
}

// 使用
const queue = new PriorityQueue(3);

// 高优先级任务
queue.add(() => fetch('/api/important'), 10);

// 普通任务
queue.add(() => fetch('/api/normal'), 5);

// 低优先级任务
queue.add(() => fetch('/api/low'), 1);
```

### 方案 3:重试机制

```javascript
class RetryQueue {
  constructor(limit = 3, maxRetries = 3) {
    this.limit = limit;
    this.maxRetries = maxRetries;
    this.queue = [];
    this.running = 0;
  }
  
  async add(task) {
    let retries = 0;
    
    while (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    
    while (retries <= this.maxRetries) {
      try {
        const result = await task();
        this.running--;
        this.queue.shift()?.();
        return result;
      } catch (error) {
        retries++;
        
        if (retries > this.maxRetries) {
          this.running--;
          this.queue.shift()?.();
          throw error;
        }
        
        // 指数退避
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
      }
    }
  }
}
```

---

## 问题 5:实际应用场景

### 场景 1:文件上传

```javascript
class FileUploader {
  constructor(concurrency = 3) {
    this.queue = new RequestQueue(concurrency);
  }
  
  async uploadFiles(files, onProgress) {
    const total = files.length;
    let completed = 0;
    
    const tasks = files.map(file => {
      return this.queue.add(async () => {
        try {
          const result = await this.uploadFile(file);
          completed++;
          onProgress?.({
            file,
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
          });
          return result;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      });
    });
    
    return Promise.allSettled(tasks);
  }
  
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
}

// 使用
const uploader = new FileUploader(5);

uploader.uploadFiles(files, (progress) => {
  console.log(`上传进度: ${progress.percentage}%`);
  console.log(`已完成: ${progress.completed}/${progress.total}`);
});
```

### 场景 2:数据抓取

```javascript
class DataCrawler {
  constructor(concurrency = 3) {
    this.queue = new RequestQueue(concurrency);
  }
  
  async crawl(urls) {
    const results = [];
    
    for (const url of urls) {
      const result = await this.queue.add(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          return { url, data, success: true };
        } catch (error) {
          return { url, error: error.message, success: false };
        }
      });
      
      results.push(result);
    }
    
    return results;
  }
}

// 使用
const crawler = new DataCrawler(5);
const urls = Array.from({ length: 100 }, (_, i) => `/api/page/${i}`);
const results = await crawler.crawl(urls);

console.log(`成功: ${results.filter(r => r.success).length}`);
console.log(`失败: ${results.filter(r => !r.success).length}`);
```

### 场景 3:图片预加载

```javascript
class ImagePreloader {
  constructor(concurrency = 6) {
    this.queue = new RequestQueue(concurrency);
  }
  
  async preload(urls, onProgress) {
    const total = urls.length;
    let loaded = 0;
    
    const tasks = urls.map(url => {
      return this.queue.add(() => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            loaded++;
            onProgress?.({
              url,
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100)
            });
            resolve(img);
          };
          
          img.onerror = () => {
            reject(new Error(`Failed to load ${url}`));
          };
          
          img.src = url;
        });
      });
    });
    
    return Promise.allSettled(tasks);
  }
}

// 使用
const preloader = new ImagePreloader(6);
const imageUrls = [...];

await preloader.preload(imageUrls, (progress) => {
  console.log(`加载进度: ${progress.percentage}%`);
});
```

---

## 问题 6:性能优化建议

### 1. 合理设置并发数

```javascript
// 根据场景选择并发数

// 图片/静态资源:6-10 个
// (浏览器限制,可以稍高)
const imageQueue = new RequestQueue(8);

// API 请求:3-5 个
// (避免服务器压力)
const apiQueue = new RequestQueue(3);

// 文件上传:2-3 个
// (带宽限制)
const uploadQueue = new RequestQueue(2);
```

### 2. 错误处理

```javascript
async function robustConcurrentControl(tasks, limit) {
  const queue = new RequestQueue(limit);
  
  const results = await Promise.allSettled(
    tasks.map(task => queue.add(task))
  );
  
  // 分析结果
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);
  
  // 重试失败的任务
  if (failed.length > 0) {
    console.log('重试失败的任务...');
    // 实现重试逻辑
  }
  
  return results;
}
```

### 3. 取消支持

```javascript
class CancellableQueue {
  constructor(limit = 3) {
    this.limit = limit;
    this.queue = [];
    this.running = 0;
    this.cancelled = false;
  }
  
  cancel() {
    this.cancelled = true;
    this.queue = [];
  }
  
  async add(task) {
    if (this.cancelled) {
      throw new Error('Queue cancelled');
    }
    
    // ... 执行逻辑
  }
}

// 使用
const queue = new CancellableQueue(3);

// 开始任务
const promise = Promise.all(
  tasks.map(task => queue.add(task))
);

// 取消
setTimeout(() => {
  queue.cancel();
}, 5000);
```

---

## 总结

**核心概念总结**:

### 1. 为什么需要并发控制

- 浏览器并发限制
- 服务器压力
- 内存占用
- 用户体验

### 2. 实现方案

- **Promise.race**: 简单控制
- **请求队列**: 灵活控制
- **分批处理**: 串行批次
- **第三方库**: p-limit

### 3. 高级特性

- 动态调整并发数
- 优先级队列
- 重试机制
- 进度反馈

### 4. 最佳实践

- 合理设置并发数
- 完善错误处理
- 支持取消操作
- 提供进度反馈

## 延伸阅读

- [p-limit 源码](https://github.com/sindresorhus/p-limit)
- [Promise 并发控制](https://javascript.info/promise-api)
- [浏览器并发限制](https://developer.mozilla.org/en-US/docs/Web/HTTP/Connection_management_in_HTTP_1.x)
- [async-pool](https://github.com/rxaviers/async-pool)
