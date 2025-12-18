---
title: 如何判断用户的网络条件？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解如何检测和判断用户的网络状态，掌握 Network Information API 的使用，了解网络质量评估方法，学会根据网络条件动态调整应用策略，提供更好的用户体验。
tags:
  - 网络检测
  - Network API
  - 性能优化
  - 用户体验
estimatedTime: 23 分钟
keywords:
  - 网络检测
  - Network Information API
  - 网络质量
  - 自适应加载
highlight: 掌握网络状态检测技术，实现根据网络条件的自适应优化
order: 494
---

## 问题 1：有哪些方法可以检测网络状态？

### 1. Navigator.onLine API

```javascript
// 最基础的网络状态检测
const isOnline = navigator.onLine;

console.log('网络状态:', isOnline ? '在线' : '离线');

// 监听网络状态变化
window.addEventListener('online', () => {
  console.log('网络已连接');
  showNotification('网络已恢复');
  // 重新加载数据
  reloadData();
});

window.addEventListener('offline', () => {
  console.log('网络已断开');
  showNotification('网络连接已断开，请检查网络设置');
  // 切换到离线模式
  enableOfflineMode();
});

// ⚠️ 局限性
const limitations = {
  problem: 'navigator.onLine 只能判断是否有网络连接',
  cannotDetect: [
    '网络速度',
    '网络质量',
    '带宽大小',
    '延迟高低'
  ],
  example: `
    // 即使网络很慢，navigator.onLine 仍然返回 true
    // 无法区分 4G 和 WiFi
    // 无法判断网络拥堵情况
  `
};
```

### 2. Network Information API

```javascript
// 获取网络连接信息
const connection = navigator.connection || 
                   navigator.mozConnection || 
                   navigator.webkitConnection;

if (connection) {
  console.log('网络类型:', connection.effectiveType);
  // 'slow-2g', '2g', '3g', '4g'
  
  console.log('下行速度:', connection.downlink, 'Mbps');
  // 估算的下行带宽（Mbps）
  
  console.log('往返时间:', connection.rtt, 'ms');
  // 估算的往返时间（毫秒）
  
  console.log('省流量模式:', connection.saveData);
  // 用户是否启用了省流量模式
  
  // 监听网络变化
  connection.addEventListener('change', () => {
    console.log('网络状态已变化');
    console.log('新的网络类型:', connection.effectiveType);
    handleNetworkChange(connection);
  });
}

// 网络类型说明
const networkTypes = {
  'slow-2g': {
    rtt: '≥ 2000ms',
    downlink: '≤ 0.05 Mbps',
    description: '非常慢的网络'
  },
  '2g': {
    rtt: '1400-2000ms',
    downlink: '0.05-0.25 Mbps',
    description: '慢速网络'
  },
  '3g': {
    rtt: '270-1400ms',
    downlink: '0.25-0.7 Mbps',
    description: '中速网络'
  },
  '4g': {
    rtt: '0-270ms',
    downlink: '≥ 0.7 Mbps',
    description: '快速网络'
  }
};
```

### 3. 主动测速

```javascript
// 方法1：下载测速
async function measureDownloadSpeed() {
  const imageUrl = 'https://example.com/test-image.jpg?t=' + Date.now();
  const imageSize = 500 * 1024; // 500KB
  
  const startTime = performance.now();
  
  try {
    await fetch(imageUrl, { cache: 'no-store' });
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000; // 秒
    const speedMbps = (imageSize * 8) / (duration * 1024 * 1024);
    
    console.log('下载速度:', speedMbps.toFixed(2), 'Mbps');
    return speedMbps;
  } catch (error) {
    console.error('测速失败:', error);
    return 0;
  }
}

// 方法2：Ping 测试（测量延迟）
async function measureLatency() {
  const pingUrl = 'https://example.com/ping';
  const attempts = 5;
  const latencies = [];
  
  for (let i = 0; i < attempts; i++) {
    const startTime = performance.now();
    
    try {
      await fetch(pingUrl, { 
        method: 'HEAD',
        cache: 'no-store'
      });
      
      const endTime = performance.now();
      latencies.push(endTime - startTime);
    } catch (error) {
      console.error('Ping 失败:', error);
    }
    
    // 间隔 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (latencies.length === 0) return null;
  
  const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
  console.log('平均延迟:', avgLatency.toFixed(2), 'ms');
  
  return avgLatency;
}

// 方法3：综合网络质量评估
async function assessNetworkQuality() {
  const speed = await measureDownloadSpeed();
  const latency = await measureLatency();
  
  let quality = 'unknown';
  
  if (speed >= 5 && latency < 100) {
    quality = 'excellent';  // 优秀
  } else if (speed >= 2 && latency < 200) {
    quality = 'good';       // 良好
  } else if (speed >= 0.5 && latency < 500) {
    quality = 'fair';       // 一般
  } else {
    quality = 'poor';       // 差
  }
  
  return {
    speed: speed.toFixed(2),
    latency: latency.toFixed(2),
    quality
  };
}
```

---

## 问题 2：如何根据网络条件优化应用？

### 1. 自适应图片加载

```javascript
// 根据网络条件选择图片质量
class AdaptiveImageLoader {
  constructor() {
    this.connection = navigator.connection;
    this.quality = this.determineQuality();
  }
  
  determineQuality() {
    if (!this.connection) {
      return 'high'; // 默认高质量
    }
    
    const { effectiveType, saveData } = this.connection;
    
    // 省流量模式：低质量
    if (saveData) {
      return 'low';
    }
    
    // 根据网络类型
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'high';
    }
  }
  
  getImageUrl(baseUrl, imageName) {
    const qualities = {
      low: { suffix: '_low', quality: 50 },
      medium: { suffix: '_medium', quality: 75 },
      high: { suffix: '', quality: 100 }
    };
    
    const { suffix } = qualities[this.quality];
    const ext = imageName.split('.').pop();
    const name = imageName.replace(`.${ext}`, '');
    
    return `${baseUrl}/${name}${suffix}.${ext}`;
  }
  
  loadImage(baseUrl, imageName) {
    const url = this.getImageUrl(baseUrl, imageName);
    console.log(`加载图片 (${this.quality} 质量):`, url);
    
    const img = new Image();
    img.src = url;
    return img;
  }
}

// 使用示例
const imageLoader = new AdaptiveImageLoader();
const img = imageLoader.loadImage('/images', 'photo.jpg');
// 4G: /images/photo.jpg
// 3G: /images/photo_medium.jpg
// 2G: /images/photo_low.jpg

// 监听网络变化，动态调整
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    imageLoader.quality = imageLoader.determineQuality();
    console.log('网络变化，切换到', imageLoader.quality, '质量');
  });
}
```

### 2. 自适应视频加载

```javascript
// 根据网络条件选择视频质量
class AdaptiveVideoPlayer {
  constructor(videoElement) {
    this.video = videoElement;
    this.connection = navigator.connection;
    this.qualities = {
      'slow-2g': '240p',
      '2g': '360p',
      '3g': '480p',
      '4g': '1080p'
    };
  }
  
  getOptimalQuality() {
    if (!this.connection) {
      return '720p';
    }
    
    const { effectiveType, saveData } = this.connection;
    
    if (saveData) {
      return '240p'; // 省流量模式
    }
    
    return this.qualities[effectiveType] || '720p';
  }
  
  loadVideo(videoId) {
    const quality = this.getOptimalQuality();
    const videoUrl = `/videos/${videoId}_${quality}.mp4`;
    
    console.log(`加载视频 (${quality}):`, videoUrl);
    this.video.src = videoUrl;
    this.video.load();
  }
  
  // 动态切换质量
  switchQuality(newQuality) {
    const currentTime = this.video.currentTime;
    const wasPlaying = !this.video.paused;
    
    // 切换视频源
    const videoId = this.getCurrentVideoId();
    const videoUrl = `/videos/${videoId}_${newQuality}.mp4`;
    
    this.video.src = videoUrl;
    this.video.currentTime = currentTime;
    
    if (wasPlaying) {
      this.video.play();
    }
  }
}

// 使用示例
const player = new AdaptiveVideoPlayer(document.querySelector('video'));
player.loadVideo('movie123');

// 监听网络变化
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    const newQuality = player.getOptimalQuality();
    console.log('网络变化，切换到', newQuality);
    player.switchQuality(newQuality);
  });
}
```

### 3. 自适应数据预加载

```javascript
// 根据网络条件决定预加载策略
class AdaptivePrefetcher {
  constructor() {
    this.connection = navigator.connection;
  }
  
  shouldPrefetch() {
    if (!this.connection) {
      return true; // 默认预加载
    }
    
    const { effectiveType, saveData } = this.connection;
    
    // 省流量模式：不预加载
    if (saveData) {
      return false;
    }
    
    // 慢速网络：不预加载
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return false;
    }
    
    return true;
  }
  
  async prefetchData(urls) {
    if (!this.shouldPrefetch()) {
      console.log('网络条件不佳，跳过预加载');
      return;
    }
    
    console.log('预加载数据:', urls);
    
    const promises = urls.map(url => 
      fetch(url, { 
        priority: 'low',  // 低优先级
        cache: 'force-cache'
      })
    );
    
    await Promise.all(promises);
    console.log('预加载完成');
  }
  
  // 预加载下一页数据
  async prefetchNextPage(currentPage) {
    if (this.shouldPrefetch()) {
      const nextPageUrl = `/api/data?page=${currentPage + 1}`;
      await fetch(nextPageUrl, { priority: 'low' });
      console.log('预加载下一页完成');
    }
  }
}

// 使用示例
const prefetcher = new AdaptivePrefetcher();

// 预加载关键资源
prefetcher.prefetchData([
  '/api/user/profile',
  '/api/user/settings',
  '/images/avatar.jpg'
]);

// 滚动到底部时预加载下一页
let currentPage = 1;
window.addEventListener('scroll', () => {
  if (isNearBottom()) {
    prefetcher.prefetchNextPage(currentPage);
  }
});
```

### 4. 自适应功能降级

```javascript
// 根据网络条件启用/禁用功能
class AdaptiveFeatureManager {
  constructor() {
    this.connection = navigator.connection;
    this.features = this.determineFeatures();
  }
  
  determineFeatures() {
    if (!this.connection) {
      return this.getAllFeatures();
    }
    
    const { effectiveType, saveData } = this.connection;
    
    const features = {
      autoplay: false,
      animations: true,
      highResImages: true,
      videoPreview: true,
      liveUpdates: true,
      analytics: true
    };
    
    // 省流量模式：禁用所有非必要功能
    if (saveData) {
      return {
        ...features,
        autoplay: false,
        animations: false,
        highResImages: false,
        videoPreview: false,
        liveUpdates: false
      };
    }
    
    // 根据网络类型调整
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return {
          ...features,
          autoplay: false,
          animations: false,
          highResImages: false,
          videoPreview: false,
          liveUpdates: false
        };
      
      case '3g':
        return {
          ...features,
          autoplay: false,
          highResImages: false,
          videoPreview: false
        };
      
      case '4g':
      default:
        return features;
    }
  }
  
  getAllFeatures() {
    return {
      autoplay: true,
      animations: true,
      highResImages: true,
      videoPreview: true,
      liveUpdates: true,
      analytics: true
    };
  }
  
  isEnabled(feature) {
    return this.features[feature] || false;
  }
  
  applyFeatures() {
    // 应用动画设置
    if (!this.isEnabled('animations')) {
      document.body.classList.add('no-animations');
    }
    
    // 禁用自动播放
    if (!this.isEnabled('autoplay')) {
      document.querySelectorAll('video[autoplay]').forEach(video => {
        video.removeAttribute('autoplay');
      });
    }
    
    // 禁用实时更新
    if (!this.isEnabled('liveUpdates')) {
      stopLiveUpdates();
    }
    
    console.log('已应用网络自适应功能:', this.features);
  }
}

// 使用示例
const featureManager = new AdaptiveFeatureManager();
featureManager.applyFeatures();

// 根据功能状态加载内容
if (featureManager.isEnabled('videoPreview')) {
  loadVideoPreview();
} else {
  loadStaticThumbnail();
}

// 监听网络变化
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    featureManager.features = featureManager.determineFeatures();
    featureManager.applyFeatures();
  });
}
```

---

## 问题 3：如何实现网络状态的持久化监控？

### 完整的网络监控系统

```javascript
class NetworkMonitor {
  constructor() {
    this.connection = navigator.connection;
    this.metrics = {
      history: [],
      currentStatus: 'unknown'
    };
    
    this.init();
  }
  
  init() {
    // 初始检测
    this.checkNetwork();
    
    // 监听在线/离线
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // 监听网络变化
    if (this.connection) {
      this.connection.addEventListener('change', () => this.handleNetworkChange());
    }
    
    // 定期测速
    this.startPeriodicCheck();
  }
  
  async checkNetwork() {
    const status = {
      timestamp: Date.now(),
      online: navigator.onLine,
      type: this.connection?.effectiveType || 'unknown',
      downlink: this.connection?.downlink || null,
      rtt: this.connection?.rtt || null,
      saveData: this.connection?.saveData || false
    };
    
    // 主动测速
    if (navigator.onLine) {
      try {
        const speed = await this.measureSpeed();
        const latency = await this.measureLatency();
        
        status.measuredSpeed = speed;
        status.measuredLatency = latency;
        status.quality = this.assessQuality(speed, latency);
      } catch (error) {
        console.error('测速失败:', error);
      }
    }
    
    this.metrics.currentStatus = status;
    this.metrics.history.push(status);
    
    // 保持历史记录在合理范围
    if (this.metrics.history.length > 100) {
      this.metrics.history.shift();
    }
    
    // 触发事件
    this.notifyListeners(status);
    
    // 上报数据
    this.reportMetrics(status);
    
    return status;
  }
  
  async measureSpeed() {
    const testUrl = '/api/speed-test?t=' + Date.now();
    const testSize = 100 * 1024; // 100KB
    
    const startTime = performance.now();
    await fetch(testUrl, { cache: 'no-store' });
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000;
    const speedMbps = (testSize * 8) / (duration * 1024 * 1024);
    
    return speedMbps;
  }
  
  async measureLatency() {
    const pingUrl = '/api/ping';
    const startTime = performance.now();
    
    await fetch(pingUrl, { 
      method: 'HEAD',
      cache: 'no-store'
    });
    
    const endTime = performance.now();
    return endTime - startTime;
  }
  
  assessQuality(speed, latency) {
    if (speed >= 5 && latency < 100) return 'excellent';
    if (speed >= 2 && latency < 200) return 'good';
    if (speed >= 0.5 && latency < 500) return 'fair';
    return 'poor';
  }
  
  handleOnline() {
    console.log('网络已连接');
    this.checkNetwork();
    this.dispatchEvent('online');
  }
  
  handleOffline() {
    console.log('网络已断开');
    this.metrics.currentStatus = {
      timestamp: Date.now(),
      online: false
    };
    this.dispatchEvent('offline');
  }
  
  handleNetworkChange() {
    console.log('网络状态变化');
    this.checkNetwork();
  }
  
  startPeriodicCheck() {
    // 每5分钟检测一次
    setInterval(() => {
      if (navigator.onLine) {
        this.checkNetwork();
      }
    }, 5 * 60 * 1000);
  }
  
  // 事件系统
  listeners = new Map();
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  dispatchEvent(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  notifyListeners(status) {
    this.dispatchEvent('change', status);
    
    // 质量变化
    const prevQuality = this.metrics.history[this.metrics.history.length - 2]?.quality;
    if (prevQuality && prevQuality !== status.quality) {
      this.dispatchEvent('quality-change', {
        from: prevQuality,
        to: status.quality
      });
    }
  }
  
  // 上报监控数据
  reportMetrics(status) {
    // 上报到监控系统
    fetch('/api/metrics/network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...status,
        userAgent: navigator.userAgent,
        page: window.location.pathname
      })
    }).catch(err => {
      console.error('上报失败:', err);
    });
  }
  
  // 获取统计信息
  getStats() {
    const history = this.metrics.history;
    
    if (history.length === 0) {
      return null;
    }
    
    const speeds = history.map(h => h.measuredSpeed).filter(Boolean);
    const latencies = history.map(h => h.measuredLatency).filter(Boolean);
    
    return {
      current: this.metrics.currentStatus,
      avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      sampleCount: history.length,
      qualityDistribution: this.getQualityDistribution()
    };
  }
  
  getQualityDistribution() {
    const distribution = {};
    
    this.metrics.history.forEach(h => {
      const quality = h.quality || 'unknown';
      distribution[quality] = (distribution[quality] || 0) + 1;
    });
    
    return distribution;
  }
}

// 使用示例
const networkMonitor = new NetworkMonitor();

// 监听网络变化
networkMonitor.on('change', (status) => {
  console.log('网络状态:', status);
  
  // 根据网络状态调整应用
  if (status.quality === 'poor') {
    enableLowBandwidthMode();
  } else {
    disableLowBandwidthMode();
  }
});

networkMonitor.on('quality-change', ({ from, to }) => {
  console.log(`网络质量变化: ${from} → ${to}`);
  showNotification(`网络质量已${to === 'poor' ? '降低' : '提升'}`);
});

networkMonitor.on('offline', () => {
  showNotification('网络连接已断开');
  enableOfflineMode();
});

networkMonitor.on('online', () => {
  showNotification('网络已恢复');
  disableOfflineMode();
});

// 获取统计信息
setTimeout(() => {
  const stats = networkMonitor.getStats();
  console.log('网络统计:', stats);
}, 60000);
```

## 总结

**网络条件判断核心要点**：

### 1. 检测方法

- **navigator.onLine**：基础的在线/离线检测
- **Network Information API**：网络类型、速度、延迟
- **主动测速**：下载测速、Ping 测试
- **综合评估**：结合多种指标判断网络质量

### 2. 自适应策略

- **图片加载**：根据网络选择质量
- **视频播放**：动态切换分辨率
- **数据预加载**：慢速网络跳过预加载
- **功能降级**：禁用非必要功能

### 3. 监控系统

- 持续监控网络状态
- 记录历史数据
- 上报监控指标
- 提供统计分析

### 4. 最佳实践

- 优雅降级，保证基本功能
- 提供用户手动控制选项
- 避免频繁测速消耗流量
- 考虑省流量模式

## 延伸阅读

- [MDN - Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [MDN - Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
- [Adaptive Loading](https://web.dev/adaptive-loading-cds-2019/)
- [Network Quality Estimation](https://web.dev/adaptive-serving-based-on-network-quality/)
- [Save Data Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Save-Data)
