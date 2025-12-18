---
title: WebWorker、SharedWorker 和 ServiceWorker 有哪些区别？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解三种 Worker 的核心区别、使用场景和通信机制，掌握如何选择合适的 Worker 类型来优化 Web 应用性能。
tags:
  - Web Worker
  - 多线程
  - 离线缓存
  - 浏览器 API
estimatedTime: 26 分钟
keywords:
  - Web Worker
  - Shared Worker
  - Service Worker
  - 多线程
  - 离线应用
highlight: 三种 Worker 各有特点：WebWorker 用于计算密集任务，SharedWorker 用于跨页面通信，ServiceWorker 用于离线缓存和推送
order: 356
---

## 问题 1：三种 Worker 的基本概念是什么？

三种 Worker 都是在独立线程中运行的 JavaScript，但用途和特性各不相同。

### Web Worker

**专用 Worker**，为单个页面服务，用于执行耗时的计算任务，避免阻塞主线程。

```javascript
// 主线程：创建 Web Worker
const worker = new Worker('worker.js');

// 发送消息给 Worker
worker.postMessage({ type: 'calculate', data: [1, 2, 3] });

// 接收 Worker 的消息
worker.onmessage = (event) => {
  console.log('Worker 返回结果:', event.data);
};

// worker.js：Worker 线程
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'calculate') {
    // 执行耗时计算
    const result = data.reduce((sum, num) => sum + num, 0);
    
    // 返回结果
    self.postMessage(result);
  }
};
```

### Shared Worker

**共享 Worker**，可以被多个页面（同源）共享，用于跨页面通信和共享数据。

```javascript
// 页面 A：连接到 Shared Worker
const sharedWorker = new SharedWorker('shared-worker.js');

// 通过 port 通信
sharedWorker.port.start();

sharedWorker.port.postMessage('来自页面 A 的消息');

sharedWorker.port.onmessage = (event) => {
  console.log('页面 A 收到:', event.data);
};

// shared-worker.js：Shared Worker 线程
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  port.onmessage = (e) => {
    console.log('收到消息:', e.data);
    
    // 广播给所有连接的页面
    connections.forEach(conn => {
      conn.postMessage(`广播: ${e.data}`);
    });
  };
  
  port.start();
};
```

### Service Worker

**服务 Worker**，作为浏览器和网络之间的代理，用于离线缓存、推送通知、后台同步等。

```javascript
// 主线程：注册 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker 注册成功:', registration);
    })
    .catch(error => {
      console.log('注册失败:', error);
    });
}

// sw.js：Service Worker
// 安装阶段：缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/app.js'
      ]);
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 缓存命中则返回缓存，否则发起网络请求
      return response || fetch(event.request);
    })
  );
});
```

---

## 问题 2：三种 Worker 的生命周期有什么不同？

不同的 Worker 有不同的生命周期管理方式。

### Web Worker 生命周期

```javascript
// Web Worker 的生命周期与创建它的页面绑定
const worker = new Worker('worker.js');

// Worker 创建后立即开始运行
worker.postMessage('start');

// 页面关闭时，Worker 自动终止
// 也可以手动终止
worker.terminate();

// worker.js
self.onmessage = (event) => {
  console.log('Worker 运行中');
  
  // Worker 可以自己关闭
  if (event.data === 'stop') {
    self.close();
  }
};
```

### Shared Worker 生命周期

```javascript
// Shared Worker 在所有连接的页面都关闭后才终止
// 页面 1
const worker1 = new SharedWorker('shared.js');
worker1.port.start();

// 页面 2
const worker2 = new SharedWorker('shared.js'); // 连接到同一个 Worker
worker2.port.start();

// shared.js
let connectionCount = 0;

self.onconnect = (event) => {
  connectionCount++;
  console.log(`连接数: ${connectionCount}`);
  
  const port = event.ports[0];
  
  port.onmessage = (e) => {
    if (e.data === 'close') {
      port.close();
      connectionCount--;
      
      // 当所有连接都关闭时，Worker 才会终止
      if (connectionCount === 0) {
        console.log('所有连接已关闭，Worker 将终止');
      }
    }
  };
};
```

### Service Worker 生命周期

```javascript
// Service Worker 有复杂的生命周期：安装 -> 等待 -> 激活 -> 运行
// sw.js

// 1. 安装阶段
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装中...');
  
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll(['/index.html']);
    })
  );
  
  // 跳过等待，立即激活
  self.skipWaiting();
});

// 2. 激活阶段
self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活中...');
  
  event.waitUntil(
    // 清理旧缓存
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== 'v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即控制所有页面
  return self.clients.claim();
});

// 3. 运行阶段
self.addEventListener('fetch', (event) => {
  console.log('拦截请求:', event.request.url);
});

// Service Worker 可以在没有页面打开时继续运行
// 用于处理推送通知、后台同步等
```

---

## 问题 3：三种 Worker 的通信方式有什么区别？

不同的 Worker 有不同的通信机制。

### Web Worker 通信

```javascript
// 简单的双向通信
// 主线程
const worker = new Worker('worker.js');

// 发送消息
worker.postMessage({ command: 'start', value: 100 });

// 接收消息
worker.onmessage = (event) => {
  console.log('收到结果:', event.data);
};

// 错误处理
worker.onerror = (error) => {
  console.error('Worker 错误:', error.message);
};

// worker.js
self.onmessage = (event) => {
  const { command, value } = event.data;
  
  if (command === 'start') {
    const result = value * 2;
    self.postMessage(result);
  }
};

// 传输大数据：使用 Transferable Objects
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage(buffer, [buffer]); // 转移所有权，不复制
```

### Shared Worker 通信

```javascript
// 通过 port 进行通信
// 页面 A
const worker = new SharedWorker('shared.js');
const port = worker.port;

port.start(); // 必须调用 start

port.postMessage({ from: 'pageA', message: 'Hello' });

port.onmessage = (event) => {
  console.log('页面 A 收到:', event.data);
};

// 页面 B
const worker2 = new SharedWorker('shared.js');
const port2 = worker2.port;

port2.start();

port2.postMessage({ from: 'pageB', message: 'Hi' });

port2.onmessage = (event) => {
  console.log('页面 B 收到:', event.data);
};

// shared.js
const ports = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  ports.push(port);
  
  port.onmessage = (e) => {
    const { from, message } = e.data;
    
    // 广播给其他页面
    ports.forEach(p => {
      if (p !== port) {
        p.postMessage({ from, message });
      }
    });
  };
  
  port.start();
};
```

### Service Worker 通信

```javascript
// Service Worker 有多种通信方式

// 1. postMessage 通信
// 页面
navigator.serviceWorker.controller.postMessage({
  type: 'CACHE_URLS',
  urls: ['/page1.html', '/page2.html']
});

navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('收到 SW 消息:', event.data);
});

// sw.js
self.addEventListener('message', (event) => {
  const { type, urls } = event.data;
  
  if (type === 'CACHE_URLS') {
    caches.open('dynamic').then(cache => {
      cache.addAll(urls);
    });
    
    // 回复消息
    event.source.postMessage({ type: 'CACHE_COMPLETE' });
  }
});

// 2. 通过 clients 向所有页面广播
self.addEventListener('sync', (event) => {
  // 后台同步完成后通知所有页面
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  });
});
```

---

## 问题 4：三种 Worker 的使用场景有什么不同？

不同的 Worker 适用于不同的场景。

### Web Worker 使用场景

```javascript
// 1. 复杂计算：图像处理
// 主线程
const worker = new Worker('image-processor.js');

worker.postMessage({
  imageData: imageData,
  filter: 'blur'
});

worker.onmessage = (event) => {
  const processedImage = event.data;
  ctx.putImageData(processedImage, 0, 0);
};

// image-processor.js
self.onmessage = (event) => {
  const { imageData, filter } = event.data;
  
  // 执行耗时的图像处理
  const processed = applyFilter(imageData, filter);
  
  self.postMessage(processed);
};

// 2. 大数据处理：排序、搜索
const worker = new Worker('data-processor.js');

worker.postMessage({
  action: 'sort',
  data: largeArray // 百万级数据
});

// 3. 加密解密
const worker = new Worker('crypto-worker.js');

worker.postMessage({
  action: 'encrypt',
  data: sensitiveData,
  key: encryptionKey
});
```

### Shared Worker 使用场景

```javascript
// 1. 跨页面状态同步
// shared-state.js
let sharedState = {
  user: null,
  cart: []
};

const ports = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  ports.push(port);
  
  port.onmessage = (e) => {
    const { action, data } = e.data;
    
    if (action === 'UPDATE_STATE') {
      sharedState = { ...sharedState, ...data };
      
      // 同步到所有页面
      ports.forEach(p => {
        p.postMessage({ action: 'STATE_UPDATED', state: sharedState });
      });
    }
    
    if (action === 'GET_STATE') {
      port.postMessage({ action: 'STATE', state: sharedState });
    }
  };
  
  port.start();
};

// 2. 跨页面 WebSocket 连接共享
// shared-websocket.js
let ws = null;
const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  // 只创建一个 WebSocket 连接
  if (!ws) {
    ws = new WebSocket('wss://example.com');
    
    ws.onmessage = (event) => {
      // 广播给所有页面
      connections.forEach(conn => {
        conn.postMessage({ type: 'WS_MESSAGE', data: event.data });
      });
    };
  }
  
  port.onmessage = (e) => {
    // 通过共享的 WebSocket 发送
    ws.send(e.data);
  };
  
  port.start();
};
```

### Service Worker 使用场景

```javascript
// 1. 离线缓存策略
// sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // 缓存优先
      }
      
      return fetch(event.request).then(response => {
        // 缓存新请求的资源
        return caches.open('dynamic').then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

// 2. 推送通知
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/badge.png'
    })
  );
});

// 3. 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // 在后台同步未发送的消息
      syncMessages()
    );
  }
});

// 4. 网络请求拦截和修改
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        // 修改响应
        return response.json().then(data => {
          const modifiedData = { ...data, cached: true };
          return new Response(JSON.stringify(modifiedData));
        });
      })
    );
  }
});
```

---

## 问题 5：三种 Worker 的作用域和权限有什么区别？

不同的 Worker 有不同的作用域限制和 API 访问权限。

### 作用域对比

```javascript
// Web Worker：页面级作用域
// 只能被创建它的页面访问
const worker = new Worker('worker.js');
// 页面关闭，Worker 终止

// Shared Worker：同源多页面作用域
// 同源的多个页面可以共享同一个 Worker
const sharedWorker = new SharedWorker('shared.js');
// 所有页面关闭，Worker 才终止

// Service Worker：域级作用域
// 控制整个域（或指定路径）下的所有页面
navigator.serviceWorker.register('/sw.js', {
  scope: '/' // 控制根路径下的所有页面
});
```

### API 访问权限

```javascript
// Web Worker 和 Shared Worker 可用的 API
// worker.js / shared-worker.js

// ✅ 可以使用
self.setTimeout(() => {}, 1000);
self.setInterval(() => {}, 1000);
self.fetch('https://api.example.com');
self.XMLHttpRequest;
self.WebSocket;
self.IndexedDB;
self.Cache;

// ❌ 不能使用
// self.document - 无法访问 DOM
// self.window - 无法访问 window
// self.localStorage - 无法访问本地存储
// self.alert() - 无法使用 UI API

// Service Worker 额外的 API
// sw.js

// ✅ Service Worker 特有的 API
self.caches; // Cache API
self.clients; // Clients API
self.registration; // Service Worker Registration

// 推送通知
self.addEventListener('push', (event) => {
  self.registration.showNotification('标题', {
    body: '内容'
  });
});

// 后台同步
self.addEventListener('sync', (event) => {
  // 后台同步逻辑
});

// ❌ Service Worker 也不能访问 DOM
// self.document - 不可用
```

### 网络请求权限

```javascript
// Web Worker：可以发起网络请求，但不能拦截
// worker.js
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => {
    self.postMessage(data);
  });

// Shared Worker：同样可以发起请求，不能拦截
// shared-worker.js
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => {
    // 广播给所有连接的页面
  });

// Service Worker：可以拦截和修改所有网络请求
// sw.js
self.addEventListener('fetch', (event) => {
  // 拦截请求
  event.respondWith(
    // 自定义响应
    new Response('自定义内容', {
      headers: { 'Content-Type': 'text/plain' }
    })
  );
});
```

---

## 问题 6：如何选择使用哪种 Worker？

根据具体需求选择合适的 Worker 类型。

### 选择决策树

```javascript
// 需要执行耗时计算，避免阻塞 UI？
// → 使用 Web Worker

// 示例：大数据排序
const worker = new Worker('sort-worker.js');
worker.postMessage(largeArray);
worker.onmessage = (e) => {
  const sorted = e.data;
  updateUI(sorted);
};

// ---

// 需要在多个页面间共享数据或连接？
// → 使用 Shared Worker

// 示例：多个标签页共享 WebSocket
const sharedWorker = new SharedWorker('ws-worker.js');
sharedWorker.port.postMessage({ action: 'subscribe', channel: 'updates' });

// ---

// 需要离线缓存、推送通知、后台同步？
// → 使用 Service Worker

// 示例：PWA 离线支持
navigator.serviceWorker.register('/sw.js');
```

### 实际场景对比

```javascript
// 场景 1：图片压缩
// 选择：Web Worker
// 原因：单页面使用，计算密集，不需要跨页面共享

const compressWorker = new Worker('compress.js');
compressWorker.postMessage({ image: imageData, quality: 0.8 });

// ---

// 场景 2：多标签页聊天应用
// 选择：Shared Worker
// 原因：需要在多个标签页间同步消息

const chatWorker = new SharedWorker('chat.js');
chatWorker.port.postMessage({ type: 'send', message: 'Hello' });

// ---

// 场景 3：PWA 应用
// 选择：Service Worker
// 原因：需要离线缓存、推送通知

navigator.serviceWorker.register('/sw.js').then(reg => {
  // 请求推送权限
  reg.pushManager.subscribe({
    userVisibleOnly: true
  });
});

// ---

// 场景 4：复杂的数据分析
// 可以组合使用：Service Worker + Web Worker

// Service Worker 缓存数据
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/data')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// Web Worker 处理数据
const analysisWorker = new Worker('analysis.js');
analysisWorker.postMessage(cachedData);
```

---

## 问题 7：三种 Worker 的兼容性和限制是什么？

了解兼容性和限制有助于做出正确的技术选择。

### 浏览器兼容性

```javascript
// 检测 Web Worker 支持
if (typeof Worker !== 'undefined') {
  const worker = new Worker('worker.js');
  console.log('Web Worker 支持');
} else {
  console.log('不支持 Web Worker，使用降级方案');
  // 在主线程执行
}

// 检测 Shared Worker 支持
if (typeof SharedWorker !== 'undefined') {
  const sharedWorker = new SharedWorker('shared.js');
  console.log('Shared Worker 支持');
} else {
  console.log('不支持 Shared Worker');
  // 注意：Safari 不支持 Shared Worker
}

// 检测 Service Worker 支持
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker 注册成功'))
    .catch(err => console.log('注册失败', err));
} else {
  console.log('不支持 Service Worker');
}
```

### 使用限制

```javascript
// Web Worker 限制
// 1. 无法访问 DOM
const worker = new Worker('worker.js');
// worker.js 中无法使用 document.querySelector()

// 2. 无法访问父页面的变量
let pageVar = 'test';
// worker.js 无法直接访问 pageVar

// 3. 同源限制
// Worker 脚本必须与主页面同源

// ---

// Shared Worker 限制
// 1. 浏览器支持有限（Safari 不支持）
// 2. 调试困难（需要特殊的调试工具）
// 3. 同源限制更严格

// ---

// Service Worker 限制
// 1. 必须在 HTTPS 下运行（localhost 除外）
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.log('Service Worker 需要 HTTPS');
}

// 2. 作用域限制
navigator.serviceWorker.register('/sw.js', {
  scope: '/app/' // 只能控制 /app/ 路径下的页面
});

// 3. 无法同步操作
// Service Worker 中所有操作都是异步的
self.addEventListener('fetch', (event) => {
  // 必须使用 event.respondWith()
  event.respondWith(
    caches.match(event.request)
  );
});
```

### 调试技巧

```javascript
// Web Worker 调试
const worker = new Worker('worker.js');

worker.onerror = (error) => {
  console.error('Worker 错误:', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno
  });
};

// Shared Worker 调试
// Chrome: chrome://inspect/#workers
// 可以看到所有运行中的 Shared Worker

// Service Worker 调试
// Chrome: chrome://serviceworker-internals/
// 或在 DevTools 的 Application 标签查看

// 强制更新 Service Worker
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.update(); // 手动检查更新
});

// 跳过等待，立即激活新版本
// sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
```

---

## 总结

**三种 Worker 的核心区别**：

### 1. 基本定位
- **Web Worker**：专用 Worker，单页面使用，执行计算任务
- **Shared Worker**：共享 Worker，多页面共享，跨页面通信
- **Service Worker**：服务 Worker，网络代理，离线缓存和推送

### 2. 生命周期
- **Web Worker**：与页面绑定，页面关闭即终止
- **Shared Worker**：所有连接页面关闭后才终止
- **Service Worker**：独立生命周期，可在无页面时运行

### 3. 通信方式
- **Web Worker**：简单的 postMessage 双向通信
- **Shared Worker**：通过 port 进行多对一通信
- **Service Worker**：多种通信方式，可拦截网络请求

### 4. 使用场景
- **Web Worker**：图像处理、大数据计算、加密解密
- **Shared Worker**：跨页面状态同步、共享 WebSocket 连接
- **Service Worker**：PWA、离线缓存、推送通知、后台同步

### 5. 权限和限制
- **Web Worker**：无 DOM 访问，可发起网络请求
- **Shared Worker**：类似 Web Worker，但可跨页面共享
- **Service Worker**：可拦截请求，需要 HTTPS，有复杂的生命周期

### 6. 兼容性
- **Web Worker**：主流浏览器都支持
- **Shared Worker**：Safari 不支持
- **Service Worker**：现代浏览器支持，需要 HTTPS

## 延伸阅读

- [MDN - Web Workers API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
- [MDN - SharedWorker](https://developer.mozilla.org/zh-CN/docs/Web/API/SharedWorker)
- [MDN - Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
- [Service Worker 生命周期](https://web.dev/service-worker-lifecycle/)
- [PWA 实践指南](https://web.dev/progressive-web-apps/)
