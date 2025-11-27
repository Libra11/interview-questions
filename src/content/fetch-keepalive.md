---
title: fetch 的 keepalive 选项有什么作用？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 fetch API 的 keepalive 选项，掌握页面卸载时发送请求的技术，了解 keepalive 与 sendBeacon 的区别，学会在实际场景中正确使用 keepalive 进行数据上报和日志记录。
tags:
  - fetch
  - keepalive
  - 数据上报
  - Web API
estimatedTime: 20 分钟
keywords:
  - fetch keepalive
  - sendBeacon
  - 页面卸载
  - 数据上报
highlight: 掌握 fetch keepalive 的作用和使用场景，实现可靠的数据上报
order: 214
---

## 问题 1：fetch keepalive 是什么？

**keepalive** 是 fetch API 的一个选项，允许请求在**页面卸载后继续执行**。

### 基本概念

```javascript
// 普通的 fetch 请求
fetch('/api/log', {
  method: 'POST',
  body: JSON.stringify({ event: 'page_view' })
});
// ❌ 页面关闭时，请求可能被取消

// 使用 keepalive
fetch('/api/log', {
  method: 'POST',
  body: JSON.stringify({ event: 'page_view' }),
  keepalive: true  // ✅ 页面关闭后仍会发送
});
```

### 为什么需要 keepalive？

```javascript
// 问题场景：页面卸载时的数据上报
window.addEventListener('beforeunload', () => {
  // ❌ 普通请求可能失败
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      duration: getSessionDuration(),
      clicks: getClickCount()
    })
  });
  // 页面关闭，请求被取消，数据丢失
});

// 解决方案：使用 keepalive
window.addEventListener('beforeunload', () => {
  // ✅ keepalive 确保请求完成
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      duration: getSessionDuration(),
      clicks: getClickCount()
    }),
    keepalive: true
  });
  // 即使页面关闭，请求仍会发送
});
```

### keepalive 的工作原理

```javascript
const howItWorks = {
  // 1. 普通请求
  normalRequest: {
    lifecycle: `
      发起请求 → 等待响应 → 处理响应
      ↓
      页面卸载 → 请求被取消 ❌
    `,
    problem: '页面卸载时，浏览器会取消所有未完成的请求'
  },
  
  // 2. keepalive 请求
  keepaliveRequest: {
    lifecycle: `
      发起请求 → 页面卸载 → 请求继续 ✅
      ↓
      浏览器在后台完成请求
    `,
    benefit: '请求不依赖页面生命周期，即使页面关闭也会完成'
  },
  
  // 3. 实现机制
  mechanism: `
    浏览器将 keepalive 请求移交给底层网络层
    不再依赖渲染进程
    即使标签页关闭，请求仍在进行
  `
};
```

---

## 问题 2：keepalive 有哪些使用场景？

### 1. 页面分析和统计

```javascript
// 记录用户会话时长
class SessionTracker {
  constructor() {
    this.startTime = Date.now();
    this.events = [];
    
    // 页面卸载时上报
    window.addEventListener('beforeunload', () => {
      this.reportSession();
    });
    
    // 页面隐藏时也上报（移动端）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportSession();
      }
    });
  }
  
  trackEvent(eventName, data) {
    this.events.push({
      name: eventName,
      data,
      timestamp: Date.now()
    });
  }
  
  reportSession() {
    const sessionData = {
      duration: Date.now() - this.startTime,
      events: this.events,
      page: window.location.pathname,
      referrer: document.referrer
    };
    
    // 使用 keepalive 确保数据上报
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionData),
      keepalive: true  // ⭐ 关键
    });
  }
}

// 使用
const tracker = new SessionTracker();
tracker.trackEvent('button_click', { buttonId: 'submit' });
tracker.trackEvent('form_submit', { formId: 'contact' });
```

### 2. 错误日志上报

```javascript
// 错误监控
class ErrorReporter {
  static report(error) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
    
    // 立即上报，使用 keepalive
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData),
      keepalive: true
    }).catch(err => {
      // 上报失败，存储到本地
      console.error('Error reporting failed:', err);
      this.saveToLocal(errorData);
    });
  }
  
  static saveToLocal(errorData) {
    const errors = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
    errors.push(errorData);
    localStorage.setItem('pendingErrors', JSON.stringify(errors));
  }
  
  static reportPendingErrors() {
    const errors = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
    
    if (errors.length > 0) {
      fetch('/api/errors/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errors),
        keepalive: true
      }).then(() => {
        localStorage.removeItem('pendingErrors');
      });
    }
  }
}

// 全局错误监听
window.addEventListener('error', (event) => {
  ErrorReporter.report(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorReporter.report(new Error(event.reason));
});

// 页面加载时上报之前的错误
window.addEventListener('load', () => {
  ErrorReporter.reportPendingErrors();
});
```

### 3. 用户行为追踪

```javascript
// 点击追踪
class ClickTracker {
  constructor() {
    this.clicks = [];
    this.maxBatchSize = 10;
    
    document.addEventListener('click', (e) => {
      this.trackClick(e);
    });
    
    // 页面卸载时发送剩余数据
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }
  
  trackClick(event) {
    const clickData = {
      x: event.clientX,
      y: event.clientY,
      target: event.target.tagName,
      targetId: event.target.id,
      targetClass: event.target.className,
      timestamp: Date.now()
    };
    
    this.clicks.push(clickData);
    
    // 达到批量大小时发送
    if (this.clicks.length >= this.maxBatchSize) {
      this.flush();
    }
  }
  
  flush() {
    if (this.clicks.length === 0) return;
    
    fetch('/api/analytics/clicks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clicks: this.clicks,
        page: window.location.pathname
      }),
      keepalive: true
    });
    
    this.clicks = [];
  }
}

// 使用
const clickTracker = new ClickTracker();
```

### 4. 离开页面确认

```javascript
// 表单未保存提醒
class FormExitGuard {
  constructor(formElement) {
    this.form = formElement;
    this.isDirty = false;
    this.initialData = this.getFormData();
    
    // 监听表单变化
    this.form.addEventListener('input', () => {
      this.isDirty = true;
    });
    
    // 页面卸载时保存草稿
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        this.saveDraft();
        
        // 提示用户
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
  
  getFormData() {
    const formData = new FormData(this.form);
    return Object.fromEntries(formData);
  }
  
  saveDraft() {
    const draftData = {
      formId: this.form.id,
      data: this.getFormData(),
      timestamp: Date.now()
    };
    
    // 保存草稿到服务器
    fetch('/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData),
      keepalive: true
    });
  }
}

// 使用
const form = document.querySelector('#contact-form');
const guard = new FormExitGuard(form);
```

---

## 问题 3：keepalive 与 sendBeacon 有什么区别？

### sendBeacon API

```javascript
// sendBeacon 是专门为页面卸载时发送数据设计的
navigator.sendBeacon('/api/analytics', JSON.stringify({
  event: 'page_unload',
  duration: getSessionDuration()
}));

// sendBeacon 的特点
const sendBeaconFeatures = {
  // 1. 专门用途
  purpose: '页面卸载时发送数据',
  
  // 2. 自动 keepalive
  keepalive: '自动保证请求完成',
  
  // 3. 方法限制
  method: '只能使用 POST',
  
  // 4. 数据格式
  dataTypes: [
    'Blob',
    'ArrayBuffer',
    'FormData',
    'URLSearchParams',
    'String'
  ],
  
  // 5. 无法获取响应
  response: '无法读取响应，fire-and-forget'
};
```

### 对比分析

```javascript
const comparison = {
  // fetch with keepalive
  fetchKeepalive: {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    headers: '可以自定义请求头',
    response: '可以处理响应（但页面卸载后无法处理）',
    dataLimit: '64KB（Chrome）',
    example: `
      fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify(data),
        keepalive: true
      }).then(res => res.json())
        .then(data => console.log(data));
    `
  },
  
  // sendBeacon
  sendBeacon: {
    methods: ['POST only'],
    headers: '自动设置，无法自定义',
    response: '无法获取响应',
    dataLimit: '64KB（大多数浏览器）',
    example: `
      navigator.sendBeacon('/api/log', JSON.stringify(data));
      // 返回 boolean，表示是否成功加入队列
    `
  }
};

// 使用建议
const recommendations = {
  useSendBeacon: [
    '页面卸载时的简单数据上报',
    '不需要自定义请求头',
    '不需要处理响应',
    '数据量小于 64KB'
  ],
  
  useFetchKeepalive: [
    '需要自定义请求头（如 Authorization）',
    '需要使用 GET 或其他 HTTP 方法',
    '可能需要处理响应',
    '需要更灵活的控制'
  ]
};
```

### 实际使用示例

```javascript
// 统一的数据上报工具
class DataReporter {
  static report(endpoint, data, options = {}) {
    const {
      useBeacon = false,
      headers = {},
      method = 'POST'
    } = options;
    
    // 优先使用 sendBeacon（如果适用）
    if (useBeacon && method === 'POST' && !Object.keys(headers).length) {
      const success = navigator.sendBeacon(
        endpoint,
        JSON.stringify(data)
      );
      
      if (success) {
        console.log('Data queued with sendBeacon');
        return Promise.resolve();
      }
    }
    
    // 降级到 fetch with keepalive
    return fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
      keepalive: true
    });
  }
}

// 使用示例

// 1. 简单上报（使用 sendBeacon）
window.addEventListener('beforeunload', () => {
  DataReporter.report('/api/analytics', {
    event: 'page_unload',
    duration: getSessionDuration()
  }, { useBeacon: true });
});

// 2. 需要认证（使用 fetch keepalive）
window.addEventListener('beforeunload', () => {
  DataReporter.report('/api/user/activity', {
    actions: getUserActions()
  }, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
});
```

---

## 问题 4：使用 keepalive 有哪些注意事项？

### 1. 数据大小限制

```javascript
// keepalive 请求有大小限制（通常 64KB）
const sizeLimit = {
  chrome: '64KB',
  firefox: '64KB',
  safari: '64KB',
  
  // 超过限制会失败
  problem: `
    const largeData = 'x'.repeat(100 * 1024); // 100KB
    
    fetch('/api/log', {
      method: 'POST',
      body: largeData,
      keepalive: true  // ❌ 失败
    });
  `,
  
  // 解决方案：分批发送
  solution: `
    function sendInChunks(data, chunkSize = 50 * 1024) {
      const chunks = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
      }
      
      chunks.forEach((chunk, index) => {
        fetch('/api/log', {
          method: 'POST',
          body: JSON.stringify({
            chunk,
            index,
            total: chunks.length
          }),
          keepalive: true
        });
      });
    }
  `
};
```

### 2. 浏览器兼容性

```javascript
// 检查浏览器支持
function supportsKeepalive() {
  try {
    const request = new Request('/', {
      keepalive: true
    });
    return true;
  } catch (e) {
    return false;
  }
}

// 降级方案
function reportData(endpoint, data) {
  if (supportsKeepalive()) {
    // 使用 keepalive
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      keepalive: true
    });
  } else if (navigator.sendBeacon) {
    // 降级到 sendBeacon
    navigator.sendBeacon(endpoint, JSON.stringify(data));
  } else {
    // 最后的降级：同步 XHR（不推荐）
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, false); // 同步
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  }
}
```

### 3. 请求数量限制

```javascript
// 浏览器限制同时进行的 keepalive 请求数量
const requestLimit = {
  problem: '过多的 keepalive 请求可能被拒绝',
  
  // ✅ 批量发送
  solution: `
    class BatchReporter {
      constructor() {
        this.queue = [];
        this.flushInterval = 5000; // 5秒
        
        setInterval(() => this.flush(), this.flushInterval);
        
        window.addEventListener('beforeunload', () => this.flush());
      }
      
      add(data) {
        this.queue.push(data);
      }
      
      flush() {
        if (this.queue.length === 0) return;
        
        // 合并所有数据为一个请求
        fetch('/api/analytics/batch', {
          method: 'POST',
          body: JSON.stringify({
            events: this.queue,
            timestamp: Date.now()
          }),
          keepalive: true
        });
        
        this.queue = [];
      }
    }
  `
};
```

### 4. 最佳实践

```javascript
// 完整的数据上报方案
class RobustReporter {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.queue = [];
    this.maxQueueSize = 50;
    this.maxDataSize = 50 * 1024; // 50KB
    
    // 定期发送
    setInterval(() => this.flush(), 10000);
    
    // 页面卸载时发送
    window.addEventListener('beforeunload', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }
  
  track(event, data) {
    this.queue.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // 队列满了，立即发送
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  flush() {
    if (this.queue.length === 0) return;
    
    const payload = JSON.stringify({
      events: this.queue,
      page: window.location.pathname,
      userAgent: navigator.userAgent
    });
    
    // 检查大小
    if (payload.length > this.maxDataSize) {
      console.warn('Payload too large, splitting...');
      this.flushInChunks();
      return;
    }
    
    // 优先使用 sendBeacon
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.endpoint, payload);
      if (success) {
        this.queue = [];
        return;
      }
    }
    
    // 降级到 fetch keepalive
    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload,
      keepalive: true
    }).then(() => {
      this.queue = [];
    }).catch(err => {
      console.error('Report failed:', err);
      // 保存到本地存储
      this.saveToLocal();
    });
  }
  
  flushInChunks() {
    const chunkSize = Math.ceil(this.queue.length / 2);
    const chunks = [];
    
    for (let i = 0; i < this.queue.length; i += chunkSize) {
      chunks.push(this.queue.slice(i, i + chunkSize));
    }
    
    chunks.forEach((chunk, index) => {
      const payload = JSON.stringify({
        events: chunk,
        chunk: index,
        totalChunks: chunks.length
      });
      
      navigator.sendBeacon(this.endpoint, payload);
    });
    
    this.queue = [];
  }
  
  saveToLocal() {
    const stored = JSON.parse(localStorage.getItem('pendingReports') || '[]');
    stored.push(...this.queue);
    localStorage.setItem('pendingReports', JSON.stringify(stored));
    this.queue = [];
  }
}

// 使用
const reporter = new RobustReporter('/api/analytics');
reporter.track('page_view', { page: '/home' });
reporter.track('button_click', { buttonId: 'submit' });
```

## 总结

**fetch keepalive 核心要点**：

### 1. 基本作用

- 允许请求在页面卸载后继续执行
- 确保数据上报的可靠性
- 不依赖页面生命周期

### 2. 使用场景

- 页面分析和统计
- 错误日志上报
- 用户行为追踪
- 表单草稿保存

### 3. 与 sendBeacon 对比

- **sendBeacon**：专用于页面卸载，简单易用
- **fetch keepalive**：更灵活，支持自定义头部和方法

### 4. 注意事项

- 数据大小限制（64KB）
- 浏览器兼容性
- 请求数量限制
- 批量发送优化

## 延伸阅读

- [MDN - Fetch API: keepalive](https://developer.mozilla.org/en-US/docs/Web/API/fetch#keepalive)
- [MDN - Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- [Reliably Send HTTP Requests](https://web.dev/bfcache/#never-use-the-unload-event)
- [Page Lifecycle API](https://developer.chrome.com/blog/page-lifecycle-api/)
- [Beacon API Specification](https://w3c.github.io/beacon/)
