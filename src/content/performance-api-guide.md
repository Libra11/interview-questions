---
title: 介绍 Performance API
category: 性能监控
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  全面了解 Performance API 的各个接口和功能,掌握如何使用 Performance API 进行性能监控、数据采集和分析,提升 Web 应用性能。
tags:
  - Performance API
  - 性能监控
  - Web API
  - 性能优化
estimatedTime: 28 分钟
keywords:
  - Performance API
  - 性能监控
  - Navigation Timing
  - Resource Timing
highlight: Performance API 是浏览器提供的强大性能监控工具,能够精确测量各种性能指标
order: 124
---

## 问题 1:什么是 Performance API?

### 基本概念

Performance API 是浏览器提供的一组用于测量 Web 应用性能的接口,可以精确获取各种性能指标。

```javascript
// 访问 Performance 对象
const perf = window.performance;

// 主要功能:
// 1. 测量页面加载性能
// 2. 监控资源加载
// 3. 自定义性能标记
// 4. 获取精确时间戳
```

### 核心接口

```javascript
// 1. Performance
// 主接口,提供性能相关方法

// 2. PerformanceEntry
// 性能条目基类

// 3. PerformanceObserver
// 性能观察器,监听性能事件

// 4. PerformanceTiming (已废弃)
// 导航时序,被 PerformanceNavigationTiming 替代

// 5. PerformanceResourceTiming
// 资源加载时序
```

---

## 问题 2:Navigation Timing - 页面加载性能

### 1. 获取导航时序

```javascript
// 获取导航性能数据
const navigation = performance.getEntriesByType('navigation')[0];

console.log({
  // DNS 查询时间
  dns: navigation.domainLookupEnd - navigation.domainLookupStart,
  
  // TCP 连接时间
  tcp: navigation.connectEnd - navigation.connectStart,
  
  // SSL 握手时间
  ssl: navigation.secureConnectionStart > 0
    ? navigation.connectEnd - navigation.secureConnectionStart
    : 0,
  
  // 请求时间
  request: navigation.responseStart - navigation.requestStart,
  
  // 响应时间
  response: navigation.responseEnd - navigation.responseStart,
  
  // DOM 解析时间
  domParse: navigation.domInteractive - navigation.domLoading,
  
  // DOM 内容加载完成
  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
  
  // 页面完全加载
  load: navigation.loadEventEnd - navigation.loadEventStart,
  
  // 总时间
  total: navigation.loadEventEnd - navigation.fetchStart
});
```

### 2. 关键性能指标

```javascript
function getWebVitals() {
  const navigation = performance.getEntriesByType('navigation')[0];
  
  return {
    // FCP (First Contentful Paint)
    // 首次内容绘制
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    
    // LCP (Largest Contentful Paint)
    // 最大内容绘制
    lcp: getLCP(),
    
    // FID (First Input Delay)
    // 首次输入延迟
    fid: getFID(),
    
    // CLS (Cumulative Layout Shift)
    // 累积布局偏移
    cls: getCLS(),
    
    // TTFB (Time To First Byte)
    // 首字节时间
    ttfb: navigation.responseStart - navigation.requestStart,
    
    // TTI (Time To Interactive)
    // 可交互时间
    tti: navigation.domInteractive - navigation.fetchStart
  };
}
```

### 3. 页面加载阶段

```javascript
function getLoadingPhases() {
  const navigation = performance.getEntriesByType('navigation')[0];
  const start = navigation.fetchStart;
  
  return {
    // 1. 重定向
    redirect: {
      start: navigation.redirectStart - start,
      end: navigation.redirectEnd - start,
      duration: navigation.redirectEnd - navigation.redirectStart
    },
    
    // 2. 应用缓存
    appCache: {
      start: navigation.fetchStart - start,
      end: navigation.domainLookupStart - start,
      duration: navigation.domainLookupStart - navigation.fetchStart
    },
    
    // 3. DNS
    dns: {
      start: navigation.domainLookupStart - start,
      end: navigation.domainLookupEnd - start,
      duration: navigation.domainLookupEnd - navigation.domainLookupStart
    },
    
    // 4. TCP
    tcp: {
      start: navigation.connectStart - start,
      end: navigation.connectEnd - start,
      duration: navigation.connectEnd - navigation.connectStart
    },
    
    // 5. 请求
    request: {
      start: navigation.requestStart - start,
      end: navigation.responseStart - start,
      duration: navigation.responseStart - navigation.requestStart
    },
    
    // 6. 响应
    response: {
      start: navigation.responseStart - start,
      end: navigation.responseEnd - start,
      duration: navigation.responseEnd - navigation.responseStart
    },
    
    // 7. DOM 处理
    dom: {
      start: navigation.domLoading - start,
      end: navigation.domComplete - start,
      duration: navigation.domComplete - navigation.domLoading
    },
    
    // 8. 加载完成
    load: {
      start: navigation.loadEventStart - start,
      end: navigation.loadEventEnd - start,
      duration: navigation.loadEventEnd - navigation.loadEventStart
    }
  };
}
```

---

## 问题 3:Resource Timing - 资源加载性能

### 1. 获取资源时序

```javascript
// 获取所有资源
const resources = performance.getEntriesByType('resource');

resources.forEach(resource => {
  console.log({
    name: resource.name,  // 资源 URL
    type: resource.initiatorType,  // 资源类型
    duration: resource.duration,  // 总耗时
    size: resource.transferSize,  // 传输大小
    
    // 详细时序
    dns: resource.domainLookupEnd - resource.domainLookupStart,
    tcp: resource.connectEnd - resource.connectStart,
    request: resource.responseStart - resource.requestStart,
    response: resource.responseEnd - resource.responseStart,
    
    // 是否缓存
    cached: resource.transferSize === 0
  });
});
```

### 2. 按类型分组

```javascript
function groupResourcesByType() {
  const resources = performance.getEntriesByType('resource');
  const groups = {};
  
  resources.forEach(resource => {
    const type = resource.initiatorType;
    
    if (!groups[type]) {
      groups[type] = {
        count: 0,
        totalSize: 0,
        totalDuration: 0,
        resources: []
      };
    }
    
    groups[type].count++;
    groups[type].totalSize += resource.transferSize;
    groups[type].totalDuration += resource.duration;
    groups[type].resources.push(resource);
  });
  
  return Object.entries(groups).map(([type, data]) => ({
    type,
    count: data.count,
    totalSize: data.totalSize,
    avgDuration: data.totalDuration / data.count,
    resources: data.resources
  }));
}

// 使用
const grouped = groupResourcesByType();
console.table(grouped);

// 输出示例:
// type       count  totalSize  avgDuration
// script     10     500KB      150ms
// css        5      100KB      80ms
// img        20     2MB        200ms
// fetch      15     300KB      120ms
```

### 3. 查找慢资源

```javascript
function findSlowResources(threshold = 1000) {
  const resources = performance.getEntriesByType('resource');
  
  return resources
    .filter(r => r.duration > threshold)
    .sort((a, b) => b.duration - a.duration)
    .map(r => ({
      url: r.name,
      type: r.initiatorType,
      duration: r.duration.toFixed(2),
      size: (r.transferSize / 1024).toFixed(2) + ' KB'
    }));
}

// 使用
const slowResources = findSlowResources(500);
console.table(slowResources);
```

---

## 问题 4:User Timing - 自定义性能标记

### 1. 标记和测量

```javascript
// 标记时间点
performance.mark('task-start');

// 执行任务
doSomething();

// 标记结束
performance.mark('task-end');

// 测量时间差
performance.measure('task-duration', 'task-start', 'task-end');

// 获取测量结果
const measure = performance.getEntriesByName('task-duration')[0];
console.log(`任务耗时: ${measure.duration}ms`);

// 清理
performance.clearMarks();
performance.clearMeasures();
```

### 2. 实际应用

```javascript
// 测量组件渲染时间
class PerformanceTracker {
  startRender(componentName) {
    performance.mark(`${componentName}-render-start`);
  }
  
  endRender(componentName) {
    performance.mark(`${componentName}-render-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`,
      `${componentName}-render-end`
    );
    
    const measure = performance.getEntriesByName(`${componentName}-render`)[0];
    console.log(`${componentName} 渲染耗时: ${measure.duration}ms`);
    
    // 上报数据
    this.report(componentName, measure.duration);
  }
  
  report(name, duration) {
    // 发送到监控系统
    navigator.sendBeacon('/api/performance', JSON.stringify({
      metric: 'component-render',
      name,
      duration,
      timestamp: Date.now()
    }));
  }
}

// 使用
const tracker = new PerformanceTracker();

// React 组件
function MyComponent() {
  useEffect(() => {
    tracker.startRender('MyComponent');
    return () => tracker.endRender('MyComponent');
  }, []);
  
  return <div>...</div>;
}
```

### 3. 测量异步操作

```javascript
async function measureAsync(name, fn) {
  performance.mark(`${name}-start`);
  
  try {
    const result = await fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name} 耗时: ${measure.duration}ms`);
    
    return result;
  } finally {
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }
}

// 使用
const data = await measureAsync('fetch-user-data', async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

---

## 问题 5:PerformanceObserver - 性能观察器

### 1. 基本用法

```javascript
// 创建观察器
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    console.log({
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration
    });
  });
});

// 观察特定类型
observer.observe({ entryTypes: ['resource', 'measure', 'navigation'] });

// 停止观察
// observer.disconnect();
```

### 2. 监听 LCP

```javascript
// 监听最大内容绘制
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
  
  // 上报 LCP
  reportMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
});

lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
```

### 3. 监听 FID

```javascript
// 监听首次输入延迟
const fidObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    const fid = entry.processingStart - entry.startTime;
    console.log('FID:', fid);
    
    // 上报 FID
    reportMetric('fid', fid);
  });
});

fidObserver.observe({ entryTypes: ['first-input'] });
```

### 4. 监听 CLS

```javascript
// 监听累积布局偏移
let clsScore = 0;

const clsObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
      console.log('CLS:', clsScore);
    }
  });
});

clsObserver.observe({ entryTypes: ['layout-shift'] });

// 页面卸载时上报
window.addEventListener('beforeunload', () => {
  reportMetric('cls', clsScore);
});
```

---

## 问题 6:性能数据上报

### 1. 使用 sendBeacon

```javascript
function reportPerformance() {
  const navigation = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  
  const data = {
    // 页面信息
    url: window.location.href,
    timestamp: Date.now(),
    
    // 导航时序
    navigation: {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart
    },
    
    // 资源统计
    resources: {
      count: resources.length,
      totalSize: resources.reduce((sum, r) => sum + r.transferSize, 0),
      avgDuration: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
    },
    
    // Web Vitals
    vitals: getWebVitals()
  };
  
  // 使用 sendBeacon 确保数据发送
  navigator.sendBeacon('/api/performance', JSON.stringify(data));
}

// 页面卸载时上报
window.addEventListener('beforeunload', reportPerformance);
```

### 2. 批量上报

```javascript
class PerformanceReporter {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/api/performance';
    this.batchSize = options.batchSize || 10;
    this.buffer = [];
    this.timer = null;
  }
  
  report(data) {
    this.buffer.push({
      ...data,
      timestamp: Date.now()
    });
    
    // 达到批量大小,立即发送
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else {
      // 否则延迟发送
      this.scheduleFlush();
    }
  }
  
  scheduleFlush() {
    if (this.timer) return;
    
    this.timer = setTimeout(() => {
      this.flush();
    }, 5000);  // 5秒后发送
  }
  
  flush() {
    if (this.buffer.length === 0) return;
    
    const data = this.buffer.splice(0);
    
    navigator.sendBeacon(this.endpoint, JSON.stringify(data));
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// 使用
const reporter = new PerformanceReporter({
  endpoint: '/api/performance',
  batchSize: 20
});

// 上报数据
reporter.report({
  metric: 'resource-load',
  url: '/api/data',
  duration: 150
});
```

---

## 问题 7:完整的性能监控方案

### 综合实现

```javascript
class PerformanceMonitor {
  constructor() {
    this.reporter = new PerformanceReporter();
    this.init();
  }
  
  init() {
    // 监听页面加载
    this.monitorNavigation();
    
    // 监听资源加载
    this.monitorResources();
    
    // 监听 Web Vitals
    this.monitorWebVitals();
    
    // 监听自定义指标
    this.monitorCustomMetrics();
    
    // 页面卸载时上报
    window.addEventListener('beforeunload', () => {
      this.reporter.flush();
    });
  }
  
  monitorNavigation() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      this.reporter.report({
        type: 'navigation',
        data: {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load: navigation.loadEventEnd - navigation.loadEventStart
        }
      });
    });
  }
  
  monitorResources() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.duration > 1000) {  // 只上报慢资源
          this.reporter.report({
            type: 'slow-resource',
            data: {
              url: entry.name,
              duration: entry.duration,
              size: entry.transferSize
            }
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
  
  monitorWebVitals() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.reporter.report({
        type: 'lcp',
        value: lastEntry.renderTime || lastEntry.loadTime
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.reporter.report({
          type: 'fid',
          value: entry.processingStart - entry.startTime
        });
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS
    let clsScore = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
    
    window.addEventListener('beforeunload', () => {
      this.reporter.report({
        type: 'cls',
        value: clsScore
      });
    });
  }
  
  monitorCustomMetrics() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.reporter.report({
          type: 'custom',
          name: entry.name,
          duration: entry.duration
        });
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
}

// 初始化
new PerformanceMonitor();
```

---

## 总结

**核心概念总结**:

### 1. 主要接口

- **Navigation Timing**: 页面加载性能
- **Resource Timing**: 资源加载性能
- **User Timing**: 自定义性能标记
- **PerformanceObserver**: 性能观察器

### 2. 关键指标

- **FCP**: 首次内容绘制
- **LCP**: 最大内容绘制
- **FID**: 首次输入延迟
- **CLS**: 累积布局偏移
- **TTFB**: 首字节时间

### 3. 实践要点

- 使用 PerformanceObserver 监听
- sendBeacon 确保数据上报
- 批量上报减少请求
- 监控关键性能指标

## 延伸阅读

- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API)
- [Resource Timing](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API)
- [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API)
- [Web Vitals](https://web.dev/vitals/)
- [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
