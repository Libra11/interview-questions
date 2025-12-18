---
title: Vue 异常处理机制有哪些
category: Vue
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 Vue 的异常处理机制，掌握 errorHandler、errorCaptured、onErrorCaptured 等 API 的使用，以及如何构建完善的错误处理系统。
tags:
  - Vue
  - 错误处理
  - errorHandler
  - errorCaptured
estimatedTime: 22 分钟
keywords:
  - Vue 错误处理
  - errorHandler
  - errorCaptured
  - 异常捕获
highlight: 掌握 Vue 的错误处理机制，构建健壮的应用程序
order: 112
---

## 问题 1：Vue 提供了哪些错误处理机制？

### Vue 的错误处理 API

```javascript
// 1. app.config.errorHandler - 全局错误处理
// 2. errorCaptured - 组件级错误捕获（Options API）
// 3. onErrorCaptured - 组合式 API 的错误捕获
// 4. try-catch - 手动错误处理
```

### 全局错误处理器

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

// ✅ 配置全局错误处理器
app.config.errorHandler = (err, instance, info) => {
  // err: 错误对象
  // instance: 发生错误的组件实例
  // info: Vue 特定的错误信息，例如错误发生的生命周期钩子
  
  console.error('Global error:', err);
  console.error('Component:', instance);
  console.error('Error info:', info);
  
  // 发送错误到监控服务
  reportError({
    message: err.message,
    stack: err.stack,
    componentName: instance?.$options.name,
    errorInfo: info
  });
};

app.mount('#app');
```

---

## 问题 2：如何使用组件级错误捕获？

### Options API: errorCaptured

```vue
<script>
export default {
  name: 'ErrorBoundary',
  
  data() {
    return {
      error: null,
      errorInfo: null
    };
  },
  
  // ✅ errorCaptured 钩子
  errorCaptured(err, instance, info) {
    // 捕获子组件的错误
    this.error = err;
    this.errorInfo = info;
    
    console.error('Error captured:', err);
    console.error('Component:', instance.$options.name);
    console.error('Error info:', info);
    
    // 返回 false 阻止错误继续向上传播
    // 返回 true 或不返回，错误会继续传播
    return false;
  },
  
  render() {
    if (this.error) {
      // 显示错误 UI
      return h('div', { class: 'error-boundary' }, [
        h('h2', '出错了'),
        h('p', this.error.message),
        h('button', {
          onClick: () => {
            this.error = null;
            this.errorInfo = null;
          }
        }, '重试')
      ]);
    }
    
    // 正常渲染子组件
    return this.$slots.default?.();
  }
};
</script>
```

### Composition API: onErrorCaptured

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue';

const error = ref(null);
const errorInfo = ref(null);

// ✅ 使用 onErrorCaptured
onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;
  
  console.error('Error captured:', err);
  console.error('Component:', instance);
  console.error('Error info:', info);
  
  // 返回 false 阻止错误传播
  return false;
});

const reset = () => {
  error.value = null;
  errorInfo.value = null;
};
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h2>出错了</h2>
    <p>{{ error.message }}</p>
    <button @click="reset">重试</button>
  </div>
  
  <slot v-else />
</template>
```

---

## 问题 3：如何实现错误边界组件？

### 完整的错误边界实现

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue';

const props = defineProps({
  // 自定义错误处理函数
  onError: Function,
  // 自定义错误 UI
  fallback: Function
});

const error = ref(null);
const errorInfo = ref(null);
const errorCount = ref(0);

onErrorCaptured((err, instance, info) => {
  error.value = err;
  errorInfo.value = info;
  errorCount.value++;
  
  // 调用自定义错误处理
  props.onError?.(err, instance, info);
  
  // 记录错误
  console.error('[ErrorBoundary] Caught error:', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info,
    count: errorCount.value
  });
  
  // 阻止错误继续传播
  return false;
});

const reset = () => {
  error.value = null;
  errorInfo.value = null;
};

// 自动重置（可选）
const autoReset = () => {
  setTimeout(reset, 3000);
};
</script>

<template>
  <div class="error-boundary">
    <!-- 有错误时显示 fallback UI -->
    <div v-if="error" class="error-content">
      <!-- 使用自定义 fallback -->
      <component
        v-if="fallback"
        :is="fallback"
        :error="error"
        :errorInfo="errorInfo"
        :reset="reset"
      />
      
      <!-- 默认错误 UI -->
      <div v-else class="default-error">
        <h2>⚠️ 出错了</h2>
        <p class="error-message">{{ error.message }}</p>
        <details v-if="errorInfo">
          <summary>错误详情</summary>
          <pre>{{ errorInfo }}</pre>
          <pre>{{ error.stack }}</pre>
        </details>
        <button @click="reset">重试</button>
      </div>
    </div>
    
    <!-- 正常渲染子组件 -->
    <slot v-else />
  </div>
</template>

<style scoped>
.error-boundary {
  width: 100%;
}

.error-content {
  padding: 20px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
}

.default-error {
  text-align: center;
}

.error-message {
  color: #c00;
  margin: 10px 0;
}

details {
  margin-top: 10px;
  text-align: left;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  overflow: auto;
  font-size: 12px;
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}
</style>
```

### 使用错误边界

```vue
<script setup>
import ErrorBoundary from './ErrorBoundary.vue';

// 自定义错误处理
const handleError = (err, instance, info) => {
  // 发送到错误监控服务
  sendToErrorTracking({
    error: err,
    component: instance?.$options?.name,
    info
  });
};

// 自定义错误 UI
const CustomErrorFallback = {
  props: ['error', 'reset'],
  template: `
    <div class="custom-error">
      <h3>😢 Something went wrong</h3>
      <p>{{ error.message }}</p>
      <button @click="reset">Try Again</button>
    </div>
  `
};
</script>

<template>
  <div>
    <h1>My App</h1>
    
    <!-- 使用错误边界包裹可能出错的组件 -->
    <ErrorBoundary
      :onError="handleError"
      :fallback="CustomErrorFallback"
    >
      <ProblematicComponent />
    </ErrorBoundary>
    
    <!-- 嵌套错误边界 -->
    <ErrorBoundary>
      <UserProfile />
      
      <ErrorBoundary>
        <UserPosts />
      </ErrorBoundary>
    </ErrorBoundary>
  </div>
</template>
```

---

## 问题 4：如何处理异步错误？

### 异步错误处理

```vue
<script setup>
import { ref, onErrorCaptured } from 'vue';

const data = ref(null);
const loading = ref(false);
const error = ref(null);

// ❌ errorCaptured 无法捕获异步错误
onErrorCaptured((err) => {
  console.log('This will NOT catch async errors');
  return false;
});

// ✅ 使用 try-catch 处理异步错误
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data.value = await response.json();
  } catch (err) {
    error.value = err;
    
    // 手动报告错误
    reportError(err);
  } finally {
    loading.value = false;
  }
};

// ✅ 创建错误处理包装器
const withErrorHandling = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      error.value = err;
      reportError(err);
      throw err; // 重新抛出，让调用者也能处理
    }
  };
};

// 使用包装器
const fetchDataSafe = withErrorHandling(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">
      Error: {{ error.message }}
      <button @click="fetchData">Retry</button>
    </div>
    <div v-else-if="data">
      {{ data }}
    </div>
  </div>
</template>
```

### 创建异步错误处理 Hook

```javascript
// useAsyncError.js
import { ref } from 'vue';

export function useAsyncError() {
  const error = ref(null);
  const loading = ref(false);
  
  const execute = async (fn) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await fn();
      return result;
    } catch (err) {
      error.value = err;
      
      // 全局错误处理
      if (window.$errorHandler) {
        window.$errorHandler(err);
      }
      
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  const reset = () => {
    error.value = null;
  };
  
  return {
    error,
    loading,
    execute,
    reset
  };
}

// 使用
import { useAsyncError } from './useAsyncError';

const { error, loading, execute } = useAsyncError();

const fetchData = () => execute(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

---

## 问题 5：如何构建完整的错误处理系统？

### 错误监控服务集成

```javascript
// errorTracking.js
class ErrorTracker {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.environment = options.environment || 'production';
    this.enabled = options.enabled !== false;
  }
  
  // 捕获错误
  captureError(error, context = {}) {
    if (!this.enabled) return;
    
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };
    
    // 发送到错误监控服务
    this.send(errorData);
    
    // 本地记录
    console.error('[ErrorTracker]', errorData);
  }
  
  // 发送错误数据
  async send(errorData) {
    try {
      await fetch('https://error-tracking-service.com/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(errorData)
      });
    } catch (err) {
      console.error('Failed to send error:', err);
    }
  }
  
  // 捕获未处理的 Promise 拒绝
  setupGlobalHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledRejection'
      });
    });
    
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'uncaughtError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
}

// 导出单例
export const errorTracker = new ErrorTracker({
  apiKey: import.meta.env.VITE_ERROR_TRACKING_KEY,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD
});

// 设置全局处理器
errorTracker.setupGlobalHandlers();
```

### Vue 应用集成

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import { errorTracker } from './errorTracking';

const app = createApp(App);

// 配置全局错误处理
app.config.errorHandler = (err, instance, info) => {
  // 发送到错误监控
  errorTracker.captureError(err, {
    componentName: instance?.$options?.name,
    componentStack: instance?.$?.type,
    errorInfo: info,
    props: instance?.$props
  });
  
  // 开发环境下也在控制台显示
  if (import.meta.env.DEV) {
    console.error('Vue Error:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
  }
};

// 配置警告处理
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('Vue Warning:', msg);
    console.warn('Trace:', trace);
  }
};

app.mount('#app');
```

### 完整的错误处理示例

```vue
<script setup>
import { ref, onErrorCaptured, onMounted } from 'vue';
import { errorTracker } from './errorTracking';

const error = ref(null);
const data = ref(null);
const loading = ref(false);

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  error.value = err;
  
  errorTracker.captureError(err, {
    type: 'component',
    component: instance?.$options?.name,
    info
  });
  
  return false;
});

// 处理异步错误
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    data.value = await response.json();
  } catch (err) {
    error.value = err;
    
    errorTracker.captureError(err, {
      type: 'api',
      endpoint: '/api/data'
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const retry = () => {
  error.value = null;
  fetchData();
};
</script>

<template>
  <div>
    <div v-if="error" class="error">
      <h3>Error</h3>
      <p>{{ error.message }}</p>
      <button @click="retry">Retry</button>
    </div>
    
    <div v-else-if="loading">
      Loading...
    </div>
    
    <div v-else>
      <slot :data="data" />
    </div>
  </div>
</template>
```

---

## 总结

**核心机制**：

### 1. 全局错误处理

- `app.config.errorHandler`：捕获所有组件错误
- 适用于全局错误监控和日志记录

### 2. 组件级错误捕获

- `errorCaptured`（Options API）
- `onErrorCaptured`（Composition API）
- 实现错误边界组件

### 3. 异步错误处理

- 使用 try-catch
- 创建错误处理包装器
- 自定义 Hook

### 4. 完整错误系统

- 错误监控服务集成
- 全局错误处理器
- 错误边界组件
- 错误上报和分析

### 5. 最佳实践

- 使用错误边界隔离错误
- 提供友好的错误 UI
- 记录和上报错误
- 区分开发和生产环境
- 处理异步错误

## 延伸阅读

- [Vue 官方文档 - 错误处理](https://cn.vuejs.org/api/application.html#app-config-errorhandler)
- [Vue 官方文档 - errorCaptured](https://cn.vuejs.org/api/options-lifecycle.html#errorcaptured)
- [Vue 官方文档 - onErrorCaptured](https://cn.vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)
- [Sentry - 错误监控服务](https://sentry.io/)
