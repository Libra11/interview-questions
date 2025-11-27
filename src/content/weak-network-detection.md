---
title: 弱网检测该如何做
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  掌握前端弱网检测的多种方案,包括 Network Information API、请求超时检测、下载速度测试等,了解如何针对弱网环境优化用户体验。
tags:
  - 弱网检测
  - 网络监控
  - 性能优化
  - 用户体验
estimatedTime: 24 分钟
keywords:
  - 弱网检测
  - Network Information API
  - 网络质量
  - 降级策略
highlight: 弱网检测能帮助我们及时发现网络问题,采取降级策略,提升弱网环境下的用户体验
order: 20
---

## 问题 1:什么是弱网检测?

### 基本概念

弱网检测是指检测用户当前的网络质量,判断是否处于弱网环境(网速慢、延迟高、丢包率高等)。

```javascript
// 弱网的特征:
// 1. 网速慢 (< 1Mbps)
// 2. 延迟高 (> 500ms)
// 3. 丢包率高 (> 5%)
// 4. 连接不稳定

// 为什么需要弱网检测?
// 1. 提前预警
// 2. 降级策略
// 3. 优化体验
// 4. 减少错误
```

### 应用场景

```javascript
// 1. 图片加载
// 弱网: 加载低质量图片
// 正常: 加载高质量图片

// 2. 视频播放
// 弱网: 降低清晰度
// 正常: 高清播放

// 3. 数据请求
// 弱网: 减少请求频率
// 正常: 正常请求

// 4. 功能降级
// 弱网: 关闭非核心功能
// 正常: 完整功能
```

---

## 问题 2:Network Information API

### 1. 基本用法

```javascript
// 获取网络信息
const connection = navigator.connection 
  || navigator.mozConnection 
  || navigator.webkitConnection;

if (connection) {
  console.log({
    // 有效带宽 (Mbps)
    downlink: connection.downlink,
    
    // 往返时间 (ms)
    rtt: connection.rtt,
    
    // 网络类型
    effectiveType: connection.effectiveType,  // 'slow-2g', '2g', '3g', '4g'
    
    // 是否省流量模式
    saveData: connection.saveData
  });
}
```

### 2. 监听网络变化

```javascript
// 监听网络状态变化
if (connection) {
  connection.addEventListener('change', () => {
    console.log('网络状态变化:');
    console.log('带宽:', connection.downlink, 'Mbps');
    console.log('延迟:', connection.rtt, 'ms');
    console.log('类型:', connection.effectiveType);
    
    // 根据网络状态调整策略
    adjustStrategy(connection);
  });
}

function adjustStrategy(connection) {
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    // 弱网策略
    console.log('检测到弱网,启用降级策略');
    enableLowQualityMode();
  } else {
    // 正常策略
    console.log('网络正常,启用标准模式');
    enableNormalMode();
  }
}
```

### 3. 判断弱网

```javascript
function isSlowNetwork() {
  const connection = navigator.connection;
  
  if (!connection) {
    return false;  // 不支持,假设正常
  }
  
  // 判断条件:
  // 1. 有效类型为 slow-2g 或 2g
  // 2. 带宽 < 1 Mbps
  // 3. RTT > 500ms
  
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.downlink < 1 ||
    connection.rtt > 500
  );
}

// 使用
if (isSlowNetwork()) {
  console.warn('当前处于弱网环境');
  showSlowNetworkTip();
}
```

---

## 问题 3:请求超时检测

### 1. 简单超时检测

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.warn('请求超时,可能处于弱网环境');
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

// 使用
try {
  const response = await fetchWithTimeout('/api/data', 3000);
  const data = await response.json();
} catch (error) {
  if (error.message === 'Request timeout') {
    // 处理超时
    showSlowNetworkWarning();
  }
}
```

### 2. 统计超时率

```javascript
class TimeoutDetector {
  constructor(threshold = 0.3) {  // 30% 超时率
    this.threshold = threshold;
    this.requests = [];
    this.maxRecords = 20;  // 最多记录 20 次
  }
  
  async fetch(url, timeout = 5000) {
    const startTime = Date.now();
    let isTimeout = false;
    
    try {
      const response = await fetchWithTimeout(url, timeout);
      return response;
    } catch (error) {
      if (error.message === 'Request timeout') {
        isTimeout = true;
      }
      throw error;
    } finally {
      // 记录请求
      this.recordRequest({
        url,
        duration: Date.now() - startTime,
        timeout: isTimeout
      });
    }
  }
  
  recordRequest(data) {
    this.requests.push(data);
    
    // 保持最多 maxRecords 条记录
    if (this.requests.length > this.maxRecords) {
      this.requests.shift();
    }
    
    // 检查是否弱网
    if (this.isSlowNetwork()) {
      console.warn('检测到弱网环境');
      this.onSlowNetwork?.();
    }
  }
  
  isSlowNetwork() {
    if (this.requests.length < 5) {
      return false;  // 样本不足
    }
    
    const timeoutCount = this.requests.filter(r => r.timeout).length;
    const timeoutRate = timeoutCount / this.requests.length;
    
    return timeoutRate >= this.threshold;
  }
  
  getStatistics() {
    return {
      total: this.requests.length,
      timeouts: this.requests.filter(r => r.timeout).length,
      timeoutRate: this.requests.filter(r => r.timeout).length / this.requests.length,
      avgDuration: this.requests.reduce((sum, r) => sum + r.duration, 0) / this.requests.length
    };
  }
}

// 使用
const detector = new TimeoutDetector(0.3);

detector.onSlowNetwork = () => {
  showSlowNetworkWarning();
  enableLowQualityMode();
};

// 发起请求
try {
  const response = await detector.fetch('/api/data');
} catch (error) {
  console.error('请求失败:', error);
}

// 查看统计
console.log(detector.getStatistics());
```

---

## 问题 4:下载速度测试

### 1. 测试下载速度

```javascript
async function measureDownloadSpeed(url, sampleSize = 100 * 1024) {  // 100KB
  const startTime = performance.now();
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;  // 秒
    const size = blob.size / 1024 / 1024;  // MB
    const speed = size / duration;  // MB/s
    
    return {
      speed,  // MB/s
      duration,  // 秒
      size  // MB
    };
  } catch (error) {
    console.error('测速失败:', error);
    return null;
  }
}

// 使用
const result = await measureDownloadSpeed('/test-file.jpg');

if (result) {
  console.log(`下载速度: ${result.speed.toFixed(2)} MB/s`);
  
  if (result.speed < 0.1) {  // < 100 KB/s
    console.warn('网速过慢');
    enableLowQualityMode();
  }
}
```

### 2. 定期测速

```javascript
class SpeedMonitor {
  constructor(options = {}) {
    this.testUrl = options.testUrl || '/speed-test.jpg';
    this.interval = options.interval || 30000;  // 30秒
    this.slowThreshold = options.slowThreshold || 0.1;  // 0.1 MB/s
    this.timer = null;
    this.speeds = [];
  }
  
  start() {
    // 立即测试一次
    this.test();
    
    // 定期测试
    this.timer = setInterval(() => {
      this.test();
    }, this.interval);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  async test() {
    const result = await measureDownloadSpeed(this.testUrl);
    
    if (result) {
      this.speeds.push({
        speed: result.speed,
        timestamp: Date.now()
      });
      
      // 保持最多 10 条记录
      if (this.speeds.length > 10) {
        this.speeds.shift();
      }
      
      // 检查是否弱网
      if (this.isSlowNetwork()) {
        this.onSlowNetwork?.(result.speed);
      }
    }
  }
  
  isSlowNetwork() {
    if (this.speeds.length < 3) {
      return false;
    }
    
    // 最近 3 次平均速度
    const recent = this.speeds.slice(-3);
    const avgSpeed = recent.reduce((sum, s) => sum + s.speed, 0) / recent.length;
    
    return avgSpeed < this.slowThreshold;
  }
  
  getAverageSpeed() {
    if (this.speeds.length === 0) {
      return 0;
    }
    
    return this.speeds.reduce((sum, s) => sum + s.speed, 0) / this.speeds.length;
  }
}

// 使用
const monitor = new SpeedMonitor({
  testUrl: '/speed-test.jpg',
  interval: 30000,
  slowThreshold: 0.1
});

monitor.onSlowNetwork = (speed) => {
  console.warn(`网速过慢: ${speed.toFixed(2)} MB/s`);
  showSlowNetworkWarning();
};

monitor.start();
```

---

## 问题 5:综合弱网检测方案

### 完整实现

```javascript
class NetworkDetector {
  constructor(options = {}) {
    this.options = {
      // Network Information API 阈值
      downlinkThreshold: 1,  // 1 Mbps
      rttThreshold: 500,  // 500ms
      
      // 超时检测阈值
      timeoutThreshold: 0.3,  // 30%
      requestTimeout: 5000,  // 5秒
      
      // 测速阈值
      speedThreshold: 0.1,  // 0.1 MB/s
      speedTestInterval: 60000,  // 60秒
      
      ...options
    };
    
    this.status = 'unknown';  // 'good', 'slow', 'unknown'
    this.listeners = [];
    
    this.init();
  }
  
  init() {
    // 1. 使用 Network Information API
    this.initNetworkInfo();
    
    // 2. 初始化超时检测
    this.timeoutDetector = new TimeoutDetector(this.options.timeoutThreshold);
    
    // 3. 初始化测速
    if (this.options.speedTestUrl) {
      this.speedMonitor = new SpeedMonitor({
        testUrl: this.options.speedTestUrl,
        interval: this.options.speedTestInterval,
        slowThreshold: this.options.speedThreshold
      });
      
      this.speedMonitor.onSlowNetwork = () => {
        this.updateStatus('slow');
      };
      
      this.speedMonitor.start();
    }
  }
  
  initNetworkInfo() {
    const connection = navigator.connection;
    
    if (connection) {
      // 初始检测
      this.checkNetworkInfo();
      
      // 监听变化
      connection.addEventListener('change', () => {
        this.checkNetworkInfo();
      });
    }
  }
  
  checkNetworkInfo() {
    const connection = navigator.connection;
    
    if (!connection) return;
    
    const isSlow = (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.downlink < this.options.downlinkThreshold ||
      connection.rtt > this.options.rttThreshold
    );
    
    this.updateStatus(isSlow ? 'slow' : 'good');
  }
  
  updateStatus(newStatus) {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      
      // 通知监听器
      this.listeners.forEach(listener => {
        listener(newStatus, oldStatus);
      });
    }
  }
  
  onChange(callback) {
    this.listeners.push(callback);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  isSlowNetwork() {
    return this.status === 'slow';
  }
  
  getNetworkInfo() {
    const connection = navigator.connection;
    
    return {
      status: this.status,
      connection: connection ? {
        downlink: connection.downlink,
        rtt: connection.rtt,
        effectiveType: connection.effectiveType,
        saveData: connection.saveData
      } : null,
      timeout: this.timeoutDetector?.getStatistics(),
      speed: this.speedMonitor?.getAverageSpeed()
    };
  }
}

// 使用
const detector = new NetworkDetector({
  speedTestUrl: '/speed-test.jpg'
});

// 监听网络状态变化
detector.onChange((newStatus, oldStatus) => {
  console.log(`网络状态变化: ${oldStatus} → ${newStatus}`);
  
  if (newStatus === 'slow') {
    showSlowNetworkWarning();
    enableLowQualityMode();
  } else {
    hideSlowNetworkWarning();
    enableNormalMode();
  }
});

// 检查当前状态
if (detector.isSlowNetwork()) {
  console.warn('当前处于弱网环境');
}

// 获取详细信息
console.log(detector.getNetworkInfo());
```

---

## 问题 6:弱网优化策略

### 1. 图片降级

```javascript
class ImageLoader {
  constructor(detector) {
    this.detector = detector;
  }
  
  getImageUrl(originalUrl) {
    if (this.detector.isSlowNetwork()) {
      // 弱网:加载低质量图片
      return this.getLowQualityUrl(originalUrl);
    } else {
      // 正常:加载原图
      return originalUrl;
    }
  }
  
  getLowQualityUrl(url) {
    // 方式 1: 使用图片 CDN 参数
    return `${url}?quality=30&width=400`;
    
    // 方式 2: 使用缩略图
    // return url.replace('.jpg', '_thumb.jpg');
  }
  
  load(img, url) {
    const finalUrl = this.getImageUrl(url);
    
    img.src = finalUrl;
    img.dataset.originalUrl = url;
    
    // 网络恢复后加载原图
    const unsubscribe = this.detector.onChange((status) => {
      if (status === 'good' && img.dataset.originalUrl) {
        img.src = img.dataset.originalUrl;
        unsubscribe();
      }
    });
  }
}

// 使用
const imageLoader = new ImageLoader(detector);

const img = document.querySelector('img');
imageLoader.load(img, '/images/photo.jpg');
```

### 2. 请求降级

```javascript
class RequestManager {
  constructor(detector) {
    this.detector = detector;
    this.queue = [];
    this.processing = false;
  }
  
  async fetch(url, options = {}) {
    if (this.detector.isSlowNetwork()) {
      // 弱网:加入队列,串行处理
      return this.queueRequest(url, options);
    } else {
      // 正常:直接请求
      return fetch(url, options);
    }
  }
  
  async queueRequest(url, options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { url, options, resolve, reject } = this.queue.shift();
      
      try {
        const response = await fetch(url, options);
        resolve(response);
      } catch (error) {
        reject(error);
      }
      
      // 弱网环境下,请求间隔 500ms
      await new Promise(r => setTimeout(r, 500));
    }
    
    this.processing = false;
  }
}

// 使用
const requestManager = new RequestManager(detector);

// 发起请求
const response = await requestManager.fetch('/api/data');
```

### 3. 功能降级

```javascript
class FeatureManager {
  constructor(detector) {
    this.detector = detector;
    this.features = new Map();
    
    // 监听网络变化
    detector.onChange((status) => {
      this.updateFeatures(status);
    });
    
    // 初始化
    this.updateFeatures(detector.status);
  }
  
  register(name, config) {
    this.features.set(name, {
      enabled: true,
      disableOnSlowNetwork: config.disableOnSlowNetwork || false,
      ...config
    });
  }
  
  updateFeatures(status) {
    const isSlow = status === 'slow';
    
    this.features.forEach((feature, name) => {
      if (feature.disableOnSlowNetwork) {
        feature.enabled = !isSlow;
        console.log(`功能 ${name}: ${feature.enabled ? '启用' : '禁用'}`);
      }
    });
  }
  
  isEnabled(name) {
    const feature = this.features.get(name);
    return feature ? feature.enabled : false;
  }
}

// 使用
const featureManager = new FeatureManager(detector);

// 注册功能
featureManager.register('autoplay-video', {
  disableOnSlowNetwork: true
});

featureManager.register('real-time-update', {
  disableOnSlowNetwork: true
});

featureManager.register('high-quality-image', {
  disableOnSlowNetwork: true
});

// 使用功能
if (featureManager.isEnabled('autoplay-video')) {
  video.play();
} else {
  console.log('弱网环境,禁用视频自动播放');
}
```

---

## 总结

**核心概念总结**:

### 1. 检测方法

- **Network Information API**: 浏览器原生支持
- **超时检测**: 统计请求超时率
- **测速**: 定期下载测试文件
- **综合判断**: 多种方法结合

### 2. 判断标准

- 带宽 < 1 Mbps
- RTT > 500ms
- 超时率 > 30%
- 下载速度 < 100 KB/s

### 3. 优化策略

- **图片降级**: 加载低质量图片
- **请求降级**: 串行处理,减少并发
- **功能降级**: 关闭非核心功能
- **用户提示**: 显示弱网提示

### 4. 最佳实践

- 多种检测方法结合
- 实时监听网络变化
- 提供降级策略
- 优化用户体验

## 延伸阅读

- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [弱网优化最佳实践](https://web.dev/network-quality/)
- [Adaptive Loading](https://web.dev/adaptive-loading-cds-2019/)
- [Save Data API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData)
