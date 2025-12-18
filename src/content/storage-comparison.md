---
title: Cookie、SessionStorage 和 LocalStorage 有什么区别？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解三种浏览器存储方式的特点、区别和使用场景，掌握如何选择合适的存储方案，了解安全性和最佳实践。
tags:
  - 浏览器存储
  - Cookie
  - Web Storage
  - 本地存储
estimatedTime: 22 分钟
keywords:
  - Cookie
  - SessionStorage
  - LocalStorage
  - 浏览器存储
  - Web Storage
highlight: Cookie 会随请求发送到服务器，LocalStorage 持久化存储，SessionStorage 会话级存储，各有适用场景
order: 368
---

## 问题 1：三种存储方式的基本概念是什么？

Cookie、SessionStorage 和 LocalStorage 是浏览器提供的三种客户端存储方案，各有不同的特点和用途。

### Cookie

Cookie 是服务器发送到浏览器并保存在本地的一小块数据，**会在每次请求时自动发送到服务器**。

```javascript
// 设置 Cookie
document.cookie = "username=Alice; expires=Fri, 31 Dec 2025 23:59:59 GMT; path=/";

// 读取 Cookie
console.log(document.cookie); // "username=Alice; theme=dark"

// Cookie 的特点：
// 1. 每次 HTTP 请求都会携带 Cookie
// 2. 大小限制约 4KB
// 3. 可以设置过期时间
// 4. 可以设置作用域（domain、path）
```

### LocalStorage

LocalStorage 提供**持久化的本地存储**，数据不会过期，除非手动清除。

```javascript
// 设置数据
localStorage.setItem('username', 'Alice');
localStorage.setItem('theme', 'dark');

// 读取数据
const username = localStorage.getItem('username');
console.log(username); // 'Alice'

// 删除数据
localStorage.removeItem('theme');

// 清空所有数据
localStorage.clear();

// LocalStorage 的特点：
// 1. 数据永久保存，除非手动删除
// 2. 大小限制约 5-10MB
// 3. 只在客户端使用，不会发送到服务器
// 4. 同源的所有页面共享数据
```

### SessionStorage

SessionStorage 提供**会话级的本地存储**，页面关闭后数据会被清除。

```javascript
// 设置数据
sessionStorage.setItem('tempData', 'temporary');

// 读取数据
const tempData = sessionStorage.getItem('tempData');
console.log(tempData); // 'temporary'

// 删除数据
sessionStorage.removeItem('tempData');

// 清空所有数据
sessionStorage.clear();

// SessionStorage 的特点：
// 1. 数据在页面会话期间有效
// 2. 页面关闭后数据被清除
// 3. 大小限制约 5-10MB
// 4. 只在当前标签页有效，不同标签页不共享
```

---

## 问题 2：三种存储方式的核心区别是什么？

从生命周期、容量、作用域等多个维度对比三种存储方式。

### 生命周期对比

```javascript
// Cookie：可设置过期时间
// 会话 Cookie：浏览器关闭后删除
document.cookie = "session=abc123"; // 没有 expires，会话结束后删除

// 持久 Cookie：指定过期时间
const expires = new Date('2025-12-31').toUTCString();
document.cookie = `persistent=value; expires=${expires}`;

// ---

// LocalStorage：永久保存
localStorage.setItem('permanent', 'data');
// 即使关闭浏览器、重启电脑，数据仍然存在
// 只能通过代码或手动清除

// ---

// SessionStorage：会话期间有效
sessionStorage.setItem('temporary', 'data');
// 关闭标签页或浏览器后，数据被清除
// 刷新页面数据仍然存在
```

### 容量限制对比

```javascript
// Cookie：约 4KB
// 每个 Cookie 的大小限制
// 每个域名下 Cookie 数量有限制（通常 20-50 个）

try {
  // 尝试存储大数据到 Cookie
  const largeData = 'x'.repeat(5000); // 5KB
  document.cookie = `large=${largeData}`;
  // 可能失败或被截断
} catch (error) {
  console.error('Cookie 存储失败');
}

// ---

// LocalStorage：约 5-10MB（不同浏览器略有差异）
try {
  const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
  localStorage.setItem('large', largeData);
  console.log('存储成功');
} catch (error) {
  console.error('超出存储限制:', error);
}

// ---

// SessionStorage：约 5-10MB
try {
  const largeData = 'x'.repeat(5 * 1024 * 1024);
  sessionStorage.setItem('large', largeData);
  console.log('存储成功');
} catch (error) {
  console.error('超出存储限制:', error);
}
```

### 作用域对比

```javascript
// Cookie：可跨子域共享
// 设置 domain 属性可以让子域访问
document.cookie = "shared=value; domain=.example.com; path=/";
// www.example.com 和 api.example.com 都可以访问

// ---

// LocalStorage：同源策略
// 协议、域名、端口必须完全相同
// https://example.com:443 和 http://example.com:80 不共享
localStorage.setItem('data', 'value');

// ---

// SessionStorage：同源 + 同标签页
// 即使是同一个网站，不同标签页的 sessionStorage 也不共享
sessionStorage.setItem('tab', 'value');

// 示例：测试不同标签页
// 标签页 A
sessionStorage.setItem('test', 'A');
console.log(sessionStorage.getItem('test')); // 'A'

// 标签页 B（同一个网站）
console.log(sessionStorage.getItem('test')); // null（不共享）
```

### 网络传输对比

```javascript
// Cookie：每次 HTTP 请求都会自动携带
document.cookie = "token=abc123";

fetch('/api/data')
  .then(response => response.json());
// 请求头会自动包含：Cookie: token=abc123

// 这会增加请求大小，影响性能

// ---

// LocalStorage：不会自动发送到服务器
localStorage.setItem('token', 'abc123');

fetch('/api/data', {
  headers: {
    // 需要手动添加到请求头
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// ---

// SessionStorage：不会自动发送到服务器
sessionStorage.setItem('token', 'abc123');

fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
  }
});
```

---

## 问题 3：如何操作 Cookie？

Cookie 的操作相对复杂，需要手动解析和设置。

### 设置 Cookie

```javascript
// 基本设置
document.cookie = "username=Alice";

// 设置过期时间
const expires = new Date();
expires.setDate(expires.getDate() + 7); // 7 天后过期
document.cookie = `username=Alice; expires=${expires.toUTCString()}`;

// 设置路径
document.cookie = "username=Alice; path=/";

// 设置域名
document.cookie = "username=Alice; domain=.example.com";

// 设置安全标志
document.cookie = "token=abc123; secure"; // 只在 HTTPS 下传输
document.cookie = "token=abc123; httpOnly"; // 无法通过 JavaScript 访问（需服务器设置）
document.cookie = "token=abc123; sameSite=strict"; // 防止 CSRF 攻击

// 完整示例
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
}

setCookie('username', 'Alice', 7);
```

### 读取 Cookie

```javascript
// document.cookie 返回所有 Cookie 的字符串
console.log(document.cookie);
// "username=Alice; theme=dark; lang=zh-CN"

// 解析 Cookie
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  
  for (let cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

const username = getCookie('username');
console.log(username); // 'Alice'

// 更简洁的实现
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
```

### 删除 Cookie

```javascript
// 删除 Cookie：设置过期时间为过去
function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

deleteCookie('username');

// 删除特定域名的 Cookie
function deleteCookie(name, domain) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
}

deleteCookie('username', '.example.com');
```

---

## 问题 4：如何操作 LocalStorage 和 SessionStorage？

Web Storage API 提供了简单统一的接口。

### 基本操作

```javascript
// 存储数据
localStorage.setItem('key', 'value');
sessionStorage.setItem('key', 'value');

// 读取数据
const value = localStorage.getItem('key');
console.log(value); // 'value'

// 删除数据
localStorage.removeItem('key');

// 清空所有数据
localStorage.clear();

// 获取键名
const firstKey = localStorage.key(0);

// 获取数据数量
const count = localStorage.length;
```

### 存储对象

```javascript
// Web Storage 只能存储字符串
// 存储对象需要序列化

// ❌ 错误做法
const user = { name: 'Alice', age: 25 };
localStorage.setItem('user', user);
console.log(localStorage.getItem('user')); // "[object Object]"

// ✅ 正确做法：使用 JSON
const user = { name: 'Alice', age: 25 };
localStorage.setItem('user', JSON.stringify(user));

const storedUser = JSON.parse(localStorage.getItem('user'));
console.log(storedUser.name); // 'Alice'

// 封装工具函数
const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get(key) {
    const value = localStorage.getItem(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  
  remove(key) {
    localStorage.removeItem(key);
  },
  
  clear() {
    localStorage.clear();
  }
};

// 使用
storage.set('user', { name: 'Alice', age: 25 });
const user = storage.get('user');
console.log(user.name); // 'Alice'
```

### 监听存储变化

```javascript
// storage 事件：监听其他标签页的存储变化
window.addEventListener('storage', (event) => {
  console.log('存储发生变化:');
  console.log('键名:', event.key);
  console.log('旧值:', event.oldValue);
  console.log('新值:', event.newValue);
  console.log('URL:', event.url);
  console.log('存储对象:', event.storageArea);
});

// 注意：
// 1. 只能监听其他标签页的变化
// 2. 当前标签页的修改不会触发事件
// 3. 只对 localStorage 有效，sessionStorage 不触发

// 示例：跨标签页同步
// 标签页 A
localStorage.setItem('theme', 'dark');

// 标签页 B 会收到 storage 事件
window.addEventListener('storage', (event) => {
  if (event.key === 'theme') {
    document.body.className = event.newValue;
  }
});
```

---

## 问题 5：三种存储方式的使用场景是什么？

根据不同的需求选择合适的存储方式。

### Cookie 的使用场景

```javascript
// 1. 身份认证
// Cookie 会自动发送到服务器，适合存储认证信息
document.cookie = "sessionId=abc123; secure; httpOnly; sameSite=strict";

// 2. 用户偏好设置（需要服务器知道）
document.cookie = "language=zh-CN; expires=...";
document.cookie = "currency=CNY; expires=...";

// 3. 跟踪和分析
document.cookie = "ga_id=GA1.2.123456789; expires=...";

// 4. 跨子域共享数据
document.cookie = "user_role=admin; domain=.example.com";
// www.example.com 和 api.example.com 都可以访问

// 不适合的场景：
// - 存储大量数据（限制 4KB）
// - 存储敏感信息（会在网络传输）
// - 频繁修改的数据（每次请求都会发送）
```

### LocalStorage 的使用场景

```javascript
// 1. 用户偏好设置（不需要服务器知道）
localStorage.setItem('theme', 'dark');
localStorage.setItem('fontSize', '16px');
localStorage.setItem('sidebarCollapsed', 'true');

// 2. 缓存数据
const cache = {
  set(key, data, ttl) {
    const item = {
      data: data,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get(key) {
    const item = JSON.parse(localStorage.getItem(key));
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  }
};

// 缓存 API 数据
cache.set('userList', userData, 60 * 60 * 1000); // 1 小时

// 3. 表单数据草稿
function saveFormDraft() {
  const formData = {
    title: document.getElementById('title').value,
    content: document.getElementById('content').value
  };
  localStorage.setItem('formDraft', JSON.stringify(formData));
}

// 恢复草稿
function restoreFormDraft() {
  const draft = JSON.parse(localStorage.getItem('formDraft'));
  if (draft) {
    document.getElementById('title').value = draft.title;
    document.getElementById('content').value = draft.content;
  }
}

// 4. 离线应用数据
localStorage.setItem('offlineData', JSON.stringify(data));
```

### SessionStorage 的使用场景

```javascript
// 1. 单页应用的页面状态
// 保存当前页面的滚动位置
window.addEventListener('scroll', () => {
  sessionStorage.setItem('scrollPosition', window.scrollY);
});

// 恢复滚动位置
window.addEventListener('load', () => {
  const position = sessionStorage.getItem('scrollPosition');
  if (position) {
    window.scrollTo(0, parseInt(position));
  }
});

// 2. 多步骤表单
// 步骤 1
function saveStep1() {
  const step1Data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value
  };
  sessionStorage.setItem('step1', JSON.stringify(step1Data));
}

// 步骤 2
function loadStep1() {
  const step1Data = JSON.parse(sessionStorage.getItem('step1'));
  // 使用步骤 1 的数据
}

// 3. 临时数据
// 搜索历史（仅当前会话）
function addSearchHistory(keyword) {
  const history = JSON.parse(sessionStorage.getItem('searchHistory') || '[]');
  history.unshift(keyword);
  sessionStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
}

// 4. 标签页隔离的数据
// 每个标签页独立的购物车
sessionStorage.setItem('cart', JSON.stringify(cartItems));
```

---

## 问题 6：存储的安全性问题有哪些？

了解安全风险并采取相应的防护措施。

### XSS 攻击风险

```javascript
// ❌ 危险：存储敏感信息在 LocalStorage
// 容易被 XSS 攻击窃取
localStorage.setItem('token', 'sensitive_token');

// 攻击者注入的脚本可以轻易获取
const token = localStorage.getItem('token');
// 发送到攻击者服务器

// ✅ 相对安全：使用 HttpOnly Cookie
// 服务器设置 HttpOnly Cookie，JavaScript 无法访问
// Set-Cookie: token=abc123; HttpOnly; Secure; SameSite=Strict

// 如果必须使用 LocalStorage 存储 Token
// 1. 使用短期 Token
// 2. 实施严格的 CSP（Content Security Policy）
// 3. 对输入进行严格的验证和转义
```

### CSRF 攻击风险

```javascript
// Cookie 的 CSRF 风险
// 攻击者可以利用浏览器自动发送 Cookie 的特性

// ✅ 防护措施：使用 SameSite 属性
document.cookie = "token=abc123; SameSite=Strict";
// Strict: 完全禁止第三方请求携带 Cookie
// Lax: 允许部分第三方请求（GET 请求）
// None: 允许所有第三方请求（需配合 Secure）

// LocalStorage 和 SessionStorage 不会自动发送
// 需要手动添加到请求头，相对安全
fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 数据加密

```javascript
// 敏感数据加密存储
class SecureStorage {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  
  // 简单的加密（实际应用应使用更安全的加密算法）
  encrypt(data) {
    const str = JSON.stringify(data);
    return btoa(str); // Base64 编码（仅示例，不安全）
  }
  
  decrypt(encrypted) {
    const str = atob(encrypted);
    return JSON.parse(str);
  }
  
  set(key, value) {
    const encrypted = this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }
  
  get(key) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      return this.decrypt(encrypted);
    } catch {
      return null;
    }
  }
}

// 使用
const storage = new SecureStorage('my-secret-key');
storage.set('sensitive', { password: '123456' });

// 实际应用建议使用 Web Crypto API
async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(12) },
    key,
    dataBuffer
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

---

## 问题 7：如何选择合适的存储方式？

根据实际需求选择最合适的存储方案。

### 决策流程

```javascript
// 决策树
function chooseStorage(requirements) {
  // 1. 需要服务器访问？
  if (requirements.serverAccess) {
    return 'Cookie';
  }
  
  // 2. 需要持久化？
  if (requirements.persistent) {
    // 3. 数据量大小？
    if (requirements.size > 4 * 1024) {
      return 'LocalStorage';
    }
    return 'Cookie 或 LocalStorage';
  }
  
  // 4. 只在当前会话有效？
  if (requirements.sessionOnly) {
    return 'SessionStorage';
  }
  
  // 5. 需要跨标签页共享？
  if (requirements.crossTab) {
    return 'LocalStorage';
  }
  
  return 'SessionStorage';
}

// 使用示例
const choice = chooseStorage({
  serverAccess: false,
  persistent: true,
  size: 10 * 1024,
  sessionOnly: false,
  crossTab: true
});

console.log('推荐使用:', choice); // 'LocalStorage'
```

### 实际场景对比

```javascript
// 场景 1：用户登录状态
// 推荐：HttpOnly Cookie（服务器设置）
// 原因：安全性高，自动发送到服务器

// 场景 2：用户主题偏好
// 推荐：LocalStorage
localStorage.setItem('theme', 'dark');
// 原因：持久化，不需要服务器知道

// 场景 3：表单临时数据
// 推荐：SessionStorage
sessionStorage.setItem('formData', JSON.stringify(data));
// 原因：会话级别，关闭页面自动清除

// 场景 4：购物车
// 推荐：LocalStorage（未登录）或服务器（已登录）
localStorage.setItem('cart', JSON.stringify(items));
// 原因：需要持久化，跨标签页共享

// 场景 5：页面滚动位置
// 推荐：SessionStorage
sessionStorage.setItem('scrollY', window.scrollY);
// 原因：仅当前标签页，刷新后恢复

// 场景 6：API 数据缓存
// 推荐：LocalStorage + 过期时间
const cache = {
  data: apiData,
  expiry: Date.now() + 3600000
};
localStorage.setItem('cache', JSON.stringify(cache));
// 原因：减少请求，提高性能
```

### 组合使用

```javascript
// 实际应用中可以组合使用多种存储方式
class StorageManager {
  // Token 使用 Cookie（HttpOnly，服务器设置）
  // 用户信息使用 LocalStorage
  // 临时状态使用 SessionStorage
  
  setUserInfo(user) {
    localStorage.setItem('userInfo', JSON.stringify(user));
  }
  
  getUserInfo() {
    return JSON.parse(localStorage.getItem('userInfo'));
  }
  
  setPageState(state) {
    sessionStorage.setItem('pageState', JSON.stringify(state));
  }
  
  getPageState() {
    return JSON.parse(sessionStorage.getItem('pageState'));
  }
  
  clearAll() {
    localStorage.clear();
    sessionStorage.clear();
    // Cookie 由服务器清除
  }
}
```

---

## 总结

**三种存储方式的核心区别**：

### 1. Cookie
- **生命周期**：可设置过期时间，默认会话结束删除
- **容量**：约 4KB
- **作用域**：可跨子域，可设置 path
- **网络传输**：每次请求自动发送
- **使用场景**：身份认证、用户偏好（需服务器知道）

### 2. LocalStorage
- **生命周期**：永久保存，除非手动删除
- **容量**：约 5-10MB
- **作用域**：同源策略，所有标签页共享
- **网络传输**：不会自动发送
- **使用场景**：用户偏好、缓存数据、离线应用

### 3. SessionStorage
- **生命周期**：会话期间有效，关闭标签页删除
- **容量**：约 5-10MB
- **作用域**：同源 + 同标签页，不跨标签页
- **网络传输**：不会自动发送
- **使用场景**：页面状态、多步骤表单、临时数据

### 4. 选择建议
- 需要服务器访问 → Cookie
- 持久化 + 大容量 → LocalStorage
- 会话级 + 标签页隔离 → SessionStorage
- 安全敏感数据 → HttpOnly Cookie

### 5. 安全注意
- 避免在 LocalStorage 存储敏感信息
- Cookie 使用 HttpOnly、Secure、SameSite
- 敏感数据考虑加密
- 实施 CSP 防止 XSS

## 延伸阅读

- [MDN - HTTP Cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
- [MDN - Web Storage API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Storage_API)
- [浏览器存储安全](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [Cookie 的 SameSite 属性](https://web.dev/samesite-cookies-explained/)
