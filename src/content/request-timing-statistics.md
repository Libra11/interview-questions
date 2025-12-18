---
title: 如何统计前端请求耗时
category: 性能监控
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  掌握前端请求耗时统计的多种方法,包括 Performance API、Resource Timing、自定义拦截器等,了解如何分析和优化请求性能。
tags:
  - 性能监控
  - Performance API
  - 请求优化
  - 数据统计
estimatedTime: 24 分钟
keywords:
  - 请求耗时
  - Performance API
  - Resource Timing
  - 性能监控
highlight: 准确统计请求耗时是性能优化的基础,Performance API 提供了完整的性能数据
order: 118
---

## 问题 1:为什么要统计请求耗时?

### 统计的价值

```javascript
// 1. 性能优化
// 找出慢请求,针对性优化

// 2. 用户体验
// 监控实际用户的请求性能

// 3. 问题定位
// 快速定位性能瓶颈

// 4. 数据分析
// 分析请求趋势,预测问题
```

### 需要统计的指标

```javascript
// 1. 总耗时
// 从发起请求到接收完成的总时间

// 2. DNS 查询时间
// 域名解析耗时

// 3. TCP 连接时间
// 建立连接耗时

// 4. SSL 握手时间
// HTTPS 握手耗时

// 5. 请求发送时间
// 发送请求数据耗时

// 6. 等待时间 (TTFB)
// 等待服务器响应的时间

// 7. 内容下载时间
// 下载响应数据耗时
```

---

## 问题 2:使用 Performance API

### 1. Resource Timing API

```javascript
// 获取所有资源的性能数据
const resources = performance.getEntriesByType('resource');

resources.forEach(resource => {
  console.log({
    name: resource.name,  // 资源 URL
    duration: resource.duration,  // 总耗时
    
    // 详细时间
    dns: resource.domainLookupEnd - resource.domainLookupStart,  // DNS
    tcp: resource.connectEnd - resource.connectStart,  // TCP
    ssl: resource.secureConnectionStart > 0 
      ? resource.connectEnd - resource.secureConnectionStart 
      : 0,  // SSL
    ttfb: resource.responseStart - resource.requestStart,  // TTFB
    download: resource.responseEnd - resource.responseStart,  // 下载
  });
});
```

### 2. 监听特定请求

```javascript
// 使用 PerformanceObserver 监听新的资源
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
      console.log({
        url: entry.name,
        duration: entry.duration,
        size: entry.transferSize,  // 传输大小
        cached: entry.transferSize === 0,  // 是否缓存
      });
    }
  });
});

observer.observe({ entryTypes: ['resource'] });
```

### 3. 计算详细时间

```javascript
function analyzeResourceTiming(entry) {
  return {
    url: entry.name,
    
    // 总耗时
    total: entry.duration,
    
    // 重定向
    redirect: entry.redirectEnd - entry.redirectStart,
    
    // DNS 查询
    dns: entry.domainLookupEnd - entry.domainLookupStart,
    
    // TCP 连接
    tcp: entry.connectEnd - entry.connectStart,
    
    // SSL 握手
    ssl: entry.secureConnectionStart > 0
      ? entry.connectEnd - entry.secureConnectionStart
      : 0,
    
    // 请求发送
    request: entry.responseStart - entry.requestStart,
    
    // TTFB (Time To First Byte)
    ttfb: entry.responseStart - entry.requestStart,
    
    // 内容下载
    download: entry.responseEnd - entry.responseStart,
    
    // 资源大小
    size: entry.transferSize,
    
    // 是否缓存
    cached: entry.transferSize === 0,
  };
}

// 使用
const resources = performance.getEntriesByType('resource');
resources.forEach(resource => {
  const timing = analyzeResourceTiming(resource);
  console.log(timing);
});
```

---

## 问题 3:拦截器方式统计

### 1. Fetch 拦截

```javascript
// 原始 fetch
const originalFetch = window.fetch;

// 拦截 fetch
window.fetch = function(...args) {
  const startTime = performance.now();
  const url = args[0];
  
  return originalFetch.apply(this, args)
    .then(response => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 记录耗时
      console.log({
        url,
        duration,
        status: response.status,
        type: 'fetch'
      });
      
      // 上报数据
      reportTiming({
        url,
        duration,
        status: response.status
      });
      
      return response;
    })
    .catch(error => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 记录错误
      console.error({
        url,
        duration,
        error: error.message,
        type: 'fetch'
      });
      
      throw error;
    });
};
```

### 2. XMLHttpRequest 拦截

```javascript
// 保存原始方法
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

// 拦截 open
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._url = url;
  this._method = method;
  this._startTime = performance.now();
  
  return originalOpen.apply(this, [method, url, ...args]);
};

// 拦截 send
XMLHttpRequest.prototype.send = function(...args) {
  // 监听加载完成
  this.addEventListener('loadend', function() {
    const endTime = performance.now();
    const duration = endTime - this._startTime;
    
    console.log({
      url: this._url,
      method: this._method,
      duration,
      status: this.status,
      type: 'xhr'
    });
    
    // 上报数据
    reportTiming({
      url: this._url,
      duration,
      status: this.status
    });
  });
  
  return originalSend.apply(this, args);
};
```

### 3. Axios 拦截器

```javascript
import axios from 'axios';

// 请求拦截器
axios.interceptors.request.use(config => {
  // 记录开始时间
  config.metadata = { startTime: performance.now() };
  return config;
});

// 响应拦截器
axios.interceptors.response.use(
  response => {
    const endTime = performance.now();
    const duration = endTime - response.config.metadata.startTime;
    
    console.log({
      url: response.config.url,
      method: response.config.method,
      duration,
      status: response.status,
      type: 'axios'
    });
    
    // 上报数据
    reportTiming({
      url: response.config.url,
      duration,
      status: response.status
    });
    
    return response;
  },
  error => {
    if (error.config) {
      const endTime = performance.now();
      const duration = endTime - error.config.metadata.startTime;
      
      console.error({
        url: error.config.url,
        duration,
        error: error.message,
        type: 'axios'
      });
    }
    
    return Promise.reject(error);
  }
);
```

---

## 问题 4:自定义性能监控类

### 完整实现

```javascript
class RequestMonitor {
  constructor() {
    this.requests = [];
    this.init();
  }
  
  init() {
    // 监听 fetch
    this.interceptFetch();
    
    // 监听 XHR
    this.interceptXHR();
    
    // 监听 Resource Timing
    this.observeResourceTiming();
  }
  
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      return originalFetch(...args)
        .then(response => {
          this.recordRequest({
            url,
            duration: performance.now() - startTime,
            status: response.status,
            type: 'fetch',
            success: response.ok
          });
          
          return response;
        })
        .catch(error => {
          this.recordRequest({
            url,
            duration: performance.now() - startTime,
            type: 'fetch',
            success: false,
            error: error.message
          });
          
          throw error;
        });
    };
  }
  
  interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._requestData = {
        url,
        method,
        startTime: performance.now()
      };
      
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('loadend', () => {
        RequestMonitor.instance.recordRequest({
          url: this._requestData.url,
          method: this._requestData.method,
          duration: performance.now() - this._requestData.startTime,
          status: this.status,
          type: 'xhr',
          success: this.status >= 200 && this.status < 300
        });
      });
      
      return originalSend.apply(this, args);
    };
  }
  
  observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.recordRequest({
            url: entry.name,
            duration: entry.duration,
            type: entry.initiatorType,
            size: entry.transferSize,
            cached: entry.transferSize === 0
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
  
  recordRequest(data) {
    this.requests.push({
      ...data,
      timestamp: Date.now()
    });
    
    // 上报到服务器
    this.report(data);
  }
  
  report(data) {
    // 批量上报,避免频繁请求
    if (this.requests.length >= 10) {
      this.sendToServer(this.requests);
      this.requests = [];
    }
  }
  
  sendToServer(requests) {
    // 使用 sendBeacon 确保数据发送
    const data = JSON.stringify(requests);
    navigator.sendBeacon('/api/performance', data);
  }
  
  getStatistics() {
    return {
      total: this.requests.length,
      avgDuration: this.requests.reduce((sum, r) => sum + r.duration, 0) / this.requests.length,
      slowRequests: this.requests.filter(r => r.duration > 1000),
      failedRequests: this.requests.filter(r => !r.success)
    };
  }
}

// 单例
RequestMonitor.instance = new RequestMonitor();
```

---

## 问题 5:性能数据分析

### 1. 统计分析

```javascript
class PerformanceAnalyzer {
  constructor(requests) {
    this.requests = requests;
  }
  
  // 平均耗时
  getAverageDuration() {
    const total = this.requests.reduce((sum, r) => sum + r.duration, 0);
    return total / this.requests.length;
  }
  
  // 中位数
  getMedianDuration() {
    const sorted = this.requests
      .map(r => r.duration)
      .sort((a, b) => a - b);
    
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  // 95 分位
  getP95Duration() {
    const sorted = this.requests
      .map(r => r.duration)
      .sort((a, b) => a - b);
    
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }
  
  // 慢请求
  getSlowRequests(threshold = 1000) {
    return this.requests.filter(r => r.duration > threshold);
  }
  
  // 失败请求
  getFailedRequests() {
    return this.requests.filter(r => !r.success);
  }
  
  // 按 URL 分组
  groupByUrl() {
    const groups = {};
    
    this.requests.forEach(r => {
      if (!groups[r.url]) {
        groups[r.url] = [];
      }
      groups[r.url].push(r);
    });
    
    return Object.entries(groups).map(([url, requests]) => ({
      url,
      count: requests.length,
      avgDuration: requests.reduce((sum, r) => sum + r.duration, 0) / requests.length,
      maxDuration: Math.max(...requests.map(r => r.duration)),
      minDuration: Math.min(...requests.map(r => r.duration))
    }));
  }
}

// 使用
const analyzer = new PerformanceAnalyzer(requests);

console.log('平均耗时:', analyzer.getAverageDuration());
console.log('中位数:', analyzer.getMedianDuration());
console.log('P95:', analyzer.getP95Duration());
console.log('慢请求:', analyzer.getSlowRequests());
console.log('URL 统计:', analyzer.groupByUrl());
```

### 2. 可视化展示

```javascript
// 生成性能报告
function generateReport(requests) {
  const analyzer = new PerformanceAnalyzer(requests);
  
  return {
    summary: {
      total: requests.length,
      avgDuration: analyzer.getAverageDuration().toFixed(2),
      medianDuration: analyzer.getMedianDuration().toFixed(2),
      p95Duration: analyzer.getP95Duration().toFixed(2),
      slowCount: analyzer.getSlowRequests().length,
      failedCount: analyzer.getFailedRequests().length
    },
    
    slowRequests: analyzer.getSlowRequests().map(r => ({
      url: r.url,
      duration: r.duration.toFixed(2),
      timestamp: new Date(r.timestamp).toISOString()
    })),
    
    urlStats: analyzer.groupByUrl()
  };
}

// 使用
const report = generateReport(requests);
console.table(report.summary);
console.table(report.slowRequests);
console.table(report.urlStats);
```

---

## 问题 6:实时监控告警

### 告警系统

```javascript
class PerformanceAlert {
  constructor(options = {}) {
    this.thresholds = {
      duration: options.duration || 3000,  // 3秒
      errorRate: options.errorRate || 0.1,  // 10%
      ...options
    };
    
    this.alerts = [];
  }
  
  check(request) {
    // 检查耗时
    if (request.duration > this.thresholds.duration) {
      this.alert({
        type: 'slow_request',
        message: `请求耗时过长: ${request.url}`,
        duration: request.duration,
        url: request.url
      });
    }
    
    // 检查错误率
    const recentRequests = this.getRecentRequests(request.url, 100);
    const errorRate = recentRequests.filter(r => !r.success).length / recentRequests.length;
    
    if (errorRate > this.thresholds.errorRate) {
      this.alert({
        type: 'high_error_rate',
        message: `错误率过高: ${request.url}`,
        errorRate,
        url: request.url
      });
    }
  }
  
  alert(data) {
    this.alerts.push({
      ...data,
      timestamp: Date.now()
    });
    
    // 发送告警
    this.sendAlert(data);
  }
  
  sendAlert(data) {
    // 发送到监控系统
    fetch('/api/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    // 控制台警告
    console.warn('[Performance Alert]', data);
  }
  
  getRecentRequests(url, count) {
    // 获取最近的请求记录
    return RequestMonitor.instance.requests
      .filter(r => r.url === url)
      .slice(-count);
  }
}

// 使用
const alert = new PerformanceAlert({
  duration: 2000,
  errorRate: 0.05
});

// 在请求监控中集成
RequestMonitor.instance.recordRequest = function(data) {
  this.requests.push(data);
  alert.check(data);
};
```

---

## 总结

**核心概念总结**:

### 1. 统计方法

- **Performance API**: 浏览器原生支持
- **拦截器**: 自定义统计
- **PerformanceObserver**: 实时监听

### 2. 关键指标

- 总耗时
- DNS/TCP/SSL 时间
- TTFB
- 下载时间

### 3. 数据分析

- 平均值/中位数
- P95/P99
- 慢请求统计
- 错误率分析

### 4. 实时监控

- 性能告警
- 数据上报
- 可视化展示

## 延伸阅读

- [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
- [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API)
