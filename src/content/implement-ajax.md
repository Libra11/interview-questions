---
title: 如何手写实现一个 AJAX 请求？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 AJAX 的实现原理，掌握 XMLHttpRequest 的使用方法，学习如何封装一个完整的 AJAX 请求函数，包括 Promise 化、超时处理、错误处理等。
tags:
  - AJAX
  - XMLHttpRequest
  - HTTP请求
  - 异步编程
estimatedTime: 26 分钟
keywords:
  - AJAX
  - XMLHttpRequest
  - 异步请求
  - Promise
  - Fetch
highlight: AJAX 的核心是 XMLHttpRequest 对象，现代开发推荐使用 Fetch API 或封装好的库如 Axios
order: 122
---

## 问题 1：什么是 AJAX？

AJAX（Asynchronous JavaScript and XML）是一种**无需刷新页面即可与服务器交换数据**的技术。

### 基本概念

```javascript
// AJAX 的核心是 XMLHttpRequest 对象
// 它允许浏览器向服务器发送 HTTP 请求并接收响应

// AJAX 的特点：
// 1. 异步通信：不阻塞页面
// 2. 局部更新：只更新部分页面
// 3. 用户体验好：无需刷新整个页面

// AJAX 的工作流程：
// 1. 创建 XMLHttpRequest 对象
// 2. 配置请求（方法、URL、是否异步）
// 3. 设置请求头（可选）
// 4. 发送请求
// 5. 监听响应
// 6. 处理响应数据
```

### XMLHttpRequest 的基本使用

```javascript
// 创建 XMLHttpRequest 对象
const xhr = new XMLHttpRequest();

// 配置请求：方法、URL、是否异步
xhr.open('GET', 'https://api.example.com/data', true);

// 监听状态变化
xhr.onreadystatechange = function() {
  // readyState === 4 表示请求完成
  if (xhr.readyState === 4) {
    // status === 200 表示成功
    if (xhr.status === 200) {
      console.log('成功', xhr.responseText);
    } else {
      console.log('失败', xhr.status);
    }
  }
};

// 发送请求
xhr.send();
```

---

## 问题 2：如何实现一个基础的 AJAX GET 请求？

实现一个简单的 GET 请求函数。

### 基础实现

```javascript
// 基础的 AJAX GET 请求
function ajaxGet(url, callback) {
  // 1. 创建 XMLHttpRequest 对象
  const xhr = new XMLHttpRequest();
  
  // 2. 配置请求
  xhr.open('GET', url, true);
  
  // 3. 监听状态变化
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // 成功回调
        callback(null, xhr.responseText);
      } else {
        // 失败回调
        callback(new Error(`请求失败: ${xhr.status}`));
      }
    }
  };
  
  // 4. 发送请求
  xhr.send();
}

// 使用
ajaxGet('https://api.example.com/users', (error, data) => {
  if (error) {
    console.error('错误', error);
  } else {
    console.log('数据', JSON.parse(data));
  }
});
```

### readyState 的五个状态

```javascript
// XMLHttpRequest.readyState 的五个状态：
// 0 - UNSENT: 未初始化，还没有调用 open()
// 1 - OPENED: 已打开，已调用 open()，但未调用 send()
// 2 - HEADERS_RECEIVED: 已接收响应头
// 3 - LOADING: 正在接收响应体
// 4 - DONE: 请求完成

function ajaxGet(url, callback) {
  const xhr = new XMLHttpRequest();
  
  xhr.onreadystatechange = function() {
    console.log('readyState:', xhr.readyState);
    
    switch (xhr.readyState) {
      case 0:
        console.log('未初始化');
        break;
      case 1:
        console.log('已打开');
        break;
      case 2:
        console.log('已接收响应头');
        break;
      case 3:
        console.log('正在接收响应体');
        break;
      case 4:
        console.log('请求完成');
        if (xhr.status === 200) {
          callback(null, xhr.responseText);
        } else {
          callback(new Error(`请求失败: ${xhr.status}`));
        }
        break;
    }
  };
  
  xhr.open('GET', url, true);
  xhr.send();
}
```

---

## 问题 3：如何实现 POST 请求？

POST 请求需要设置请求头和发送请求体。

### 基础 POST 实现

```javascript
// POST 请求
function ajaxPost(url, data, callback) {
  const xhr = new XMLHttpRequest();
  
  xhr.open('POST', url, true);
  
  // 设置请求头
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error(`请求失败: ${xhr.status}`));
      }
    }
  };
  
  // 发送 JSON 数据
  xhr.send(JSON.stringify(data));
}

// 使用
ajaxPost('https://api.example.com/users', 
  { name: 'Alice', age: 25 },
  (error, data) => {
    if (error) {
      console.error('错误', error);
    } else {
      console.log('响应', JSON.parse(data));
    }
  }
);
```

### 支持表单数据

```javascript
// 发送表单数据
function ajaxPostForm(url, formData, callback) {
  const xhr = new XMLHttpRequest();
  
  xhr.open('POST', url, true);
  
  // 表单数据使用 application/x-www-form-urlencoded
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callback(null, xhr.responseText);
      } else {
        callback(new Error(`请求失败: ${xhr.status}`));
      }
    }
  };
  
  // 将对象转换为表单格式
  const formString = Object.keys(formData)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(formData[key])}`)
    .join('&');
  
  xhr.send(formString);
}

// 使用
ajaxPostForm('https://api.example.com/login',
  { username: 'alice', password: '123456' },
  (error, data) => {
    console.log(error || data);
  }
);
```

---

## 问题 4：如何封装一个通用的 AJAX 函数？

封装一个支持多种配置的通用 AJAX 函数。

### 通用 AJAX 封装

```javascript
// 通用 AJAX 函数
function ajax(options) {
  // 默认配置
  const defaults = {
    method: 'GET',
    url: '',
    data: null,
    headers: {},
    timeout: 0,
    async: true,
    success: function() {},
    error: function() {}
  };
  
  // 合并配置
  const config = Object.assign({}, defaults, options);
  
  // 创建 XMLHttpRequest
  const xhr = new XMLHttpRequest();
  
  // 处理 GET 请求的参数
  let url = config.url;
  if (config.method.toUpperCase() === 'GET' && config.data) {
    const params = Object.keys(config.data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(config.data[key])}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + params;
  }
  
  // 配置请求
  xhr.open(config.method, url, config.async);
  
  // 设置超时
  if (config.timeout > 0) {
    xhr.timeout = config.timeout;
  }
  
  // 设置请求头
  Object.keys(config.headers).forEach(key => {
    xhr.setRequestHeader(key, config.headers[key]);
  });
  
  // 监听状态变化
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 尝试解析 JSON
        let response = xhr.responseText;
        try {
          response = JSON.parse(response);
        } catch (e) {
          // 不是 JSON，保持原样
        }
        config.success(response, xhr);
      } else {
        config.error(xhr);
      }
    }
  };
  
  // 监听超时
  xhr.ontimeout = function() {
    config.error(new Error('请求超时'));
  };
  
  // 监听错误
  xhr.onerror = function() {
    config.error(new Error('网络错误'));
  };
  
  // 发送请求
  if (config.method.toUpperCase() === 'POST' && config.data) {
    // POST 请求发送数据
    if (typeof config.data === 'object') {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(config.data));
    } else {
      xhr.send(config.data);
    }
  } else {
    xhr.send();
  }
  
  // 返回 xhr 对象，支持取消请求
  return xhr;
}

// 使用示例
// GET 请求
ajax({
  method: 'GET',
  url: 'https://api.example.com/users',
  data: { page: 1, limit: 10 },
  success: (data) => {
    console.log('成功', data);
  },
  error: (error) => {
    console.error('失败', error);
  }
});

// POST 请求
ajax({
  method: 'POST',
  url: 'https://api.example.com/users',
  data: { name: 'Alice', age: 25 },
  headers: {
    'Authorization': 'Bearer token123'
  },
  timeout: 5000,
  success: (data) => {
    console.log('创建成功', data);
  },
  error: (error) => {
    console.error('创建失败', error);
  }
});
```

---

## 问题 5：如何实现 Promise 化的 AJAX？

将 AJAX 封装为返回 Promise 的函数。

### Promise 版本

```javascript
// Promise 化的 AJAX
function ajax(options) {
  return new Promise((resolve, reject) => {
    // 默认配置
    const defaults = {
      method: 'GET',
      url: '',
      data: null,
      headers: {},
      timeout: 0,
      async: true
    };
    
    const config = Object.assign({}, defaults, options);
    
    const xhr = new XMLHttpRequest();
    
    // 处理 GET 请求参数
    let url = config.url;
    if (config.method.toUpperCase() === 'GET' && config.data) {
      const params = Object.keys(config.data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(config.data[key])}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + params;
    }
    
    xhr.open(config.method, url, config.async);
    
    // 设置超时
    if (config.timeout > 0) {
      xhr.timeout = config.timeout;
    }
    
    // 设置请求头
    Object.keys(config.headers).forEach(key => {
      xhr.setRequestHeader(key, config.headers[key]);
    });
    
    // 监听状态变化
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          let response = xhr.responseText;
          try {
            response = JSON.parse(response);
          } catch (e) {
            // 保持原样
          }
          resolve(response);
        } else {
          reject(new Error(`请求失败: ${xhr.status}`));
        }
      }
    };
    
    // 超时处理
    xhr.ontimeout = function() {
      reject(new Error('请求超时'));
    };
    
    // 错误处理
    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };
    
    // 发送请求
    if (config.method.toUpperCase() === 'POST' && config.data) {
      if (typeof config.data === 'object') {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(config.data));
      } else {
        xhr.send(config.data);
      }
    } else {
      xhr.send();
    }
  });
}

// 使用示例
// 基本使用
ajax({
  method: 'GET',
  url: 'https://api.example.com/users'
})
  .then(data => {
    console.log('成功', data);
  })
  .catch(error => {
    console.error('失败', error);
  });

// async/await 使用
async function fetchUsers() {
  try {
    const users = await ajax({
      method: 'GET',
      url: 'https://api.example.com/users',
      data: { page: 1 }
    });
    console.log('用户列表', users);
    
    const newUser = await ajax({
      method: 'POST',
      url: 'https://api.example.com/users',
      data: { name: 'Alice', age: 25 }
    });
    console.log('新用户', newUser);
  } catch (error) {
    console.error('错误', error);
  }
}

fetchUsers();
```

---

## 问题 6：如何处理 AJAX 的常见问题？

处理超时、取消请求、进度监控等常见需求。

### 超时处理

```javascript
// 支持超时的 AJAX
function ajaxWithTimeout(options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open(options.method || 'GET', options.url, true);
    
    // 设置超时时间
    if (options.timeout) {
      xhr.timeout = options.timeout;
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
    };
    
    // 超时回调
    xhr.ontimeout = function() {
      reject(new Error(`请求超时（${options.timeout}ms）`));
    };
    
    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };
    
    xhr.send(options.data ? JSON.stringify(options.data) : null);
  });
}

// 使用
ajaxWithTimeout({
  url: 'https://api.example.com/slow',
  timeout: 3000 // 3秒超时
})
  .then(data => console.log('成功', data))
  .catch(error => console.error('失败', error.message));
```

### 取消请求

```javascript
// 支持取消的 AJAX
function ajaxWithCancel(options) {
  let xhr = null;
  
  const promise = new Promise((resolve, reject) => {
    xhr = new XMLHttpRequest();
    
    xhr.open(options.method || 'GET', options.url, true);
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else if (xhr.status !== 0) {
          // status 为 0 表示请求被取消
          reject(new Error(`请求失败: ${xhr.status}`));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('网络错误'));
    };
    
    xhr.send(options.data ? JSON.stringify(options.data) : null);
  });
  
  // 返回 promise 和 cancel 方法
  return {
    promise,
    cancel: () => {
      if (xhr) {
        xhr.abort();
        xhr = null;
      }
    }
  };
}

// 使用
const request = ajaxWithCancel({
  url: 'https://api.example.com/data'
});

request.promise
  .then(data => console.log('成功', data))
  .catch(error => console.error('失败', error));

// 3秒后取消请求
setTimeout(() => {
  request.cancel();
  console.log('请求已取消');
}, 3000);
```

### 进度监控

```javascript
// 支持进度监控的 AJAX
function ajaxWithProgress(options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open(options.method || 'GET', options.url, true);
    
    // 上传进度
    if (xhr.upload && options.onUploadProgress) {
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          options.onUploadProgress(percentComplete, event);
        }
      };
    }
    
    // 下载进度
    if (options.onDownloadProgress) {
      xhr.onprogress = function(event) {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          options.onDownloadProgress(percentComplete, event);
        }
      };
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(xhr.responseText);
      }
    };
    
    xhr.onerror = () => reject(new Error('网络错误'));
    
    xhr.send(options.data || null);
  });
}

// 使用 - 文件上传
const formData = new FormData();
formData.append('file', fileInput.files[0]);

ajaxWithProgress({
  method: 'POST',
  url: 'https://api.example.com/upload',
  data: formData,
  onUploadProgress: (percent, event) => {
    console.log(`上传进度: ${percent.toFixed(2)}%`);
  }
})
  .then(data => console.log('上传成功', data))
  .catch(error => console.error('上传失败', error));
```

---

## 问题 7：AJAX 与 Fetch API 的区别是什么？

对比传统 AJAX 和现代 Fetch API。

### 基本对比

```javascript
// XMLHttpRequest（传统 AJAX）
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/users', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
    console.log(data);
  }
};
xhr.send();

// Fetch API（现代方式）
fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### 主要区别

```javascript
// 1. 返回值
// XMLHttpRequest：不返回 Promise
// Fetch：返回 Promise

// 2. 错误处理
// XMLHttpRequest：需要手动检查 status
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      // 成功
    } else {
      // 失败
    }
  }
};

// Fetch：只有网络错误才会 reject
fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .catch(error => console.error(error));

// 3. 超时处理
// XMLHttpRequest：内置超时支持
xhr.timeout = 5000;
xhr.ontimeout = () => console.log('超时');

// Fetch：需要手动实现
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('超时')), timeout)
    )
  ]);
}

// 4. 取消请求
// XMLHttpRequest：使用 abort()
xhr.abort();

// Fetch：使用 AbortController
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort();
```

---

## 总结

**手写 AJAX 的核心要点**：

### 1. 基本步骤
- 创建 XMLHttpRequest 对象
- 配置请求（open）
- 设置请求头（setRequestHeader）
- 监听状态变化（onreadystatechange）
- 发送请求（send）

### 2. readyState 状态
- 0: UNSENT（未初始化）
- 1: OPENED（已打开）
- 2: HEADERS_RECEIVED（已接收响应头）
- 3: LOADING（正在接收响应体）
- 4: DONE（请求完成）

### 3. 请求类型
- GET：参数拼接在 URL
- POST：数据在请求体中
- 需要设置正确的 Content-Type

### 4. Promise 化
- 返回 Promise 对象
- 支持 async/await
- 更好的错误处理

### 5. 高级功能
- 超时处理（timeout）
- 取消请求（abort）
- 进度监控（onprogress）

### 6. 与 Fetch 对比
- XMLHttpRequest：功能完整，兼容性好
- Fetch：API 简洁，返回 Promise
- 实际项目推荐使用 Axios

### 7. 最佳实践
- 封装通用函数
- 统一错误处理
- 合理设置超时
- 支持取消请求

## 延伸阅读

- [MDN - XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest)
- [MDN - Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- [Axios 文档](https://axios-http.com/)
- [深入理解 AJAX](https://javascript.info/xmlhttprequest)
