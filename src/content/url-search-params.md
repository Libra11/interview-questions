---
title: 关于 URLSearchParams 你需要知道什么？
category: JavaScript
difficulty: 入门
updatedAt: 2025-11-17
summary: >-
  深入理解 URLSearchParams API，掌握 URL 查询参数的解析、构建和操作方法，学习如何在实际项目中处理 URL 参数，包括路由传参、表单提交等场景。
tags:
  - URLSearchParams
  - URL
  - 查询参数
  - Web API
estimatedTime: 20 分钟
keywords:
  - URLSearchParams
  - URL参数
  - 查询字符串
  - query string
  - URL解析
highlight: URLSearchParams 提供了简洁的 API 来处理 URL 查询参数，避免了手动字符串解析的复杂性
order: 408
---

## 问题 1：什么是 URLSearchParams？

URLSearchParams 是一个 **Web API**，用于处理 URL 的查询字符串。

### 基本概念

```javascript
// URL 查询字符串
const url = 'https://example.com/search?q=javascript&page=1&sort=desc';
// 查询字符串：q=javascript&page=1&sort=desc

// 创建 URLSearchParams 对象
const params = new URLSearchParams('q=javascript&page=1&sort=desc');

// 或从 URL 对象获取
const urlObj = new URL('https://example.com/search?q=javascript&page=1');
const params2 = urlObj.searchParams;

// 或从当前页面 URL 获取
const currentParams = new URLSearchParams(window.location.search);

console.log(params.get('q')); // 'javascript'
console.log(params.get('page')); // '1'
console.log(params.get('sort')); // 'desc'
```

### 为什么需要 URLSearchParams

```javascript
// 传统方式：手动解析（容易出错）
function parseQuery(queryString) {
  const params = {};
  const pairs = queryString.substring(1).split('&');
  
  for (let pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  
  return params;
}

// 问题：
// 1. 需要处理 URL 编码
// 2. 需要处理特殊字符
// 3. 需要处理数组参数
// 4. 代码复杂，容易出错

// 使用 URLSearchParams（简洁可靠）
const params = new URLSearchParams(window.location.search);
const q = params.get('q');
const page = params.get('page');
```

---

## 问题 2：如何创建 URLSearchParams 对象？

有**多种方式**创建 URLSearchParams 对象。

### 从字符串创建

```javascript
// 方法 1：从查询字符串创建
const params1 = new URLSearchParams('q=javascript&page=1');

// 方法 2：从带 ? 的字符串创建
const params2 = new URLSearchParams('?q=javascript&page=1');

// 方法 3：从对象创建
const params3 = new URLSearchParams({
  q: 'javascript',
  page: '1',
  sort: 'desc'
});

// 方法 4：从数组创建
const params4 = new URLSearchParams([
  ['q', 'javascript'],
  ['page', '1'],
  ['sort', 'desc']
]);

// 方法 5：从另一个 URLSearchParams 创建
const params5 = new URLSearchParams(params1);
```

### 从 URL 对象获取

```javascript
// 从 URL 对象获取
const url = new URL('https://example.com/search?q=javascript&page=1');
const params = url.searchParams;

console.log(params.get('q')); // 'javascript'

// 修改参数会影响 URL
params.set('page', '2');
console.log(url.href); // 'https://example.com/search?q=javascript&page=2'
```

### 从当前页面 URL 获取

```javascript
// 获取当前页面的查询参数
// 假设当前 URL: https://example.com/page?id=123&name=alice

const params = new URLSearchParams(window.location.search);

console.log(params.get('id')); // '123'
console.log(params.get('name')); // 'alice'

// 或使用 URL 对象
const currentUrl = new URL(window.location.href);
const params2 = currentUrl.searchParams;
```

---

## 问题 3：URLSearchParams 有哪些常用方法？

URLSearchParams 提供了**丰富的方法**来操作查询参数。

### get/set/has/delete

```javascript
const params = new URLSearchParams('q=javascript&page=1');

// get: 获取参数值
console.log(params.get('q')); // 'javascript'
console.log(params.get('notexist')); // null

// set: 设置参数值（会覆盖已存在的值）
params.set('page', '2');
console.log(params.get('page')); // '2'

// has: 检查参数是否存在
console.log(params.has('q')); // true
console.log(params.has('notexist')); // false

// delete: 删除参数
params.delete('page');
console.log(params.has('page')); // false

// toString: 转换为字符串
console.log(params.toString()); // 'q=javascript'
```

### append（添加参数）

```javascript
// append: 添加参数（不会覆盖已存在的值）
const params = new URLSearchParams('tag=js');

params.append('tag', 'web');
params.append('tag', 'frontend');

// 获取所有同名参数
console.log(params.getAll('tag')); // ['js', 'web', 'frontend']

// toString 会包含所有值
console.log(params.toString()); // 'tag=js&tag=web&tag=frontend'

// set vs append
const params2 = new URLSearchParams('tag=js');

params2.set('tag', 'web'); // 覆盖
console.log(params2.getAll('tag')); // ['web']

params2.append('tag', 'frontend'); // 添加
console.log(params2.getAll('tag')); // ['web', 'frontend']
```

### getAll（获取所有值）

```javascript
// getAll: 获取同名参数的所有值
const params = new URLSearchParams('tag=js&tag=web&tag=frontend');

console.log(params.get('tag')); // 'js'（只返回第一个）
console.log(params.getAll('tag')); // ['js', 'web', 'frontend']

// 实际应用：处理多选框
const url = 'https://example.com/search?category=tech&category=news&category=sports';
const params2 = new URLSearchParams(url.split('?')[1]);
const categories = params2.getAll('category');

console.log(categories); // ['tech', 'news', 'sports']
```

### 遍历方法

```javascript
const params = new URLSearchParams('q=javascript&page=1&sort=desc');

// forEach: 遍历所有参数
params.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});
// 输出：
// q: javascript
// page: 1
// sort: desc

// keys: 获取所有键
for (let key of params.keys()) {
  console.log(key);
}
// 输出：q, page, sort

// values: 获取所有值
for (let value of params.values()) {
  console.log(value);
}
// 输出：javascript, 1, desc

// entries: 获取所有键值对
for (let [key, value] of params.entries()) {
  console.log(`${key} = ${value}`);
}

// 或使用 for...of（默认迭代器）
for (let [key, value] of params) {
  console.log(`${key} = ${value}`);
}
```

---

## 问题 4：如何处理特殊字符和编码？

URLSearchParams 会**自动处理 URL 编码**。

### 自动编码

```javascript
// URLSearchParams 自动处理编码
const params = new URLSearchParams();

params.set('name', '张三');
params.set('email', 'user@example.com');
params.set('query', 'a + b = c');

console.log(params.toString());
// 'name=%E5%BC%A0%E4%B8%89&email=user%40example.com&query=a+%2B+b+%3D+c'

// 获取时自动解码
console.log(params.get('name')); // '张三'
console.log(params.get('query')); // 'a + b = c'
```

### 特殊字符处理

```javascript
// 特殊字符会被正确编码
const params = new URLSearchParams();

params.set('url', 'https://example.com?id=123');
params.set('symbols', '!@#$%^&*()');
params.set('spaces', 'hello world');

console.log(params.toString());
// url=https%3A%2F%2Fexample.com%3Fid%3D123&symbols=!%40%23%24%25%5E%26*()&spaces=hello+world

// 空格编码为 +
console.log(params.get('spaces')); // 'hello world'
```

### 数组和对象

```javascript
// 处理数组参数
const params = new URLSearchParams();

const tags = ['javascript', 'web', 'frontend'];
tags.forEach(tag => params.append('tag', tag));

console.log(params.toString()); // 'tag=javascript&tag=web&tag=frontend'

// 处理对象（需要手动序列化）
const filters = {
  category: 'tech',
  author: 'alice',
  year: 2024
};

const params2 = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  params2.set(key, value);
});

console.log(params2.toString()); // 'category=tech&author=alice&year=2024'

// 或直接传入对象
const params3 = new URLSearchParams(filters);
console.log(params3.toString()); // 'category=tech&author=alice&year=2024'
```

---

## 问题 5：URLSearchParams 的实际应用场景有哪些？

了解 URLSearchParams 的**常见使用场景**。

### 场景 1：解析 URL 参数

```javascript
// 获取当前页面的查询参数
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (let [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}

// 使用
const queryParams = getQueryParams();
console.log(queryParams); // { q: 'javascript', page: '1' }

// 获取单个参数
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const searchQuery = getQueryParam('q');
const currentPage = getQueryParam('page');
```

### 场景 2：构建 URL

```javascript
// 构建带参数的 URL
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

// 使用
const url = buildUrl('https://api.example.com/search', {
  q: 'javascript',
  page: 1,
  tags: ['web', 'frontend']
});

console.log(url);
// 'https://api.example.com/search?q=javascript&page=1&tags=web&tags=frontend'
```

### 场景 3：API 请求

```javascript
// 发送 GET 请求
async function fetchData(endpoint, params) {
  const url = new URL(endpoint);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const response = await fetch(url);
  return response.json();
}

// 使用
const data = await fetchData('https://api.example.com/users', {
  page: 1,
  limit: 10,
  sort: 'name'
});

// 发送 POST 请求（表单数据）
async function submitForm(endpoint, formData) {
  const params = new URLSearchParams(formData);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  return response.json();
}

// 使用
const result = await submitForm('https://api.example.com/login', {
  username: 'alice',
  password: '123456'
});
```

### 场景 4：路由跳转

```javascript
// 更新 URL 参数（不刷新页面）
function updateUrlParams(params) {
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  
  window.history.pushState({}, '', url);
}

// 使用：更新分页
updateUrlParams({ page: 2 });

// 使用：更新搜索
updateUrlParams({ q: 'javascript', page: 1 });

// 使用：删除参数
updateUrlParams({ filter: null });
```

### 场景 5：表单序列化

```javascript
// 将表单转换为 URLSearchParams
function serializeForm(form) {
  const formData = new FormData(form);
  return new URLSearchParams(formData);
}

// 使用
const form = document.getElementById('searchForm');
const params = serializeForm(form);

console.log(params.toString()); // 'q=javascript&category=tech'

// 提交表单
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const params = serializeForm(form);
  const url = `/search?${params.toString()}`;
  
  window.location.href = url;
});
```

### 场景 6：过滤和搜索

```javascript
// 构建搜索 URL
function buildSearchUrl(filters) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
  });
  
  return `/search?${params.toString()}`;
}

// 使用
const searchUrl = buildSearchUrl({
  q: 'javascript',
  category: ['tech', 'news'],
  minPrice: 100,
  maxPrice: '', // 空值会被忽略
  sort: 'price'
});

console.log(searchUrl);
// '/search?q=javascript&category=tech&category=news&minPrice=100&sort=price'
```

---

## 问题 6：URLSearchParams 的注意事项有哪些？

了解使用 URLSearchParams 的**常见问题和最佳实践**。

### 常见问题

```javascript
// 1. 参数值都是字符串
const params = new URLSearchParams({ page: 1, active: true });

console.log(params.get('page')); // '1'（字符串，不是数字）
console.log(params.get('active')); // 'true'（字符串，不是布尔值）

// 需要手动转换类型
const page = Number(params.get('page'));
const active = params.get('active') === 'true';

// 2. 不支持嵌套对象
const data = {
  user: {
    name: 'alice',
    age: 25
  }
};

const params2 = new URLSearchParams(data);
console.log(params2.toString()); // 'user=[object Object]'（错误）

// 需要手动展平
const flatData = {
  'user.name': 'alice',
  'user.age': 25
};
const params3 = new URLSearchParams(flatData);
console.log(params3.toString()); // 'user.name=alice&user.age=25'

// 3. 数组参数的处理
const params4 = new URLSearchParams({ tags: ['js', 'web'] });
console.log(params4.toString()); // 'tags=js%2Cweb'（数组被转为字符串）

// 正确方式：使用 append
const params5 = new URLSearchParams();
['js', 'web'].forEach(tag => params5.append('tags', tag));
console.log(params5.toString()); // 'tags=js&tags=web'

// 4. 顺序问题
const params6 = new URLSearchParams('b=2&a=1');
console.log(params6.toString()); // 'b=2&a=1'（保持原顺序）

// sort: 按字母顺序排序
params6.sort();
console.log(params6.toString()); // 'a=1&b=2'
```

### 最佳实践

```javascript
// 1. 封装工具函数
const QueryUtils = {
  // 解析查询参数为对象
  parse(search) {
    const params = new URLSearchParams(search);
    const result = {};
    
    for (let [key, value] of params) {
      if (result[key]) {
        // 处理重复的键
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  },
  
  // 对象转查询字符串
  stringify(obj) {
    const params = new URLSearchParams();
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, String(value));
      }
    });
    
    return params.toString();
  },
  
  // 获取参数（带类型转换）
  get(name, type = 'string') {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name);
    
    if (value === null) return null;
    
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'array':
        return params.getAll(name);
      default:
        return value;
    }
  }
};

// 使用
const query = QueryUtils.parse('?q=js&page=1&tags=web&tags=frontend');
console.log(query); // { q: 'js', page: '1', tags: ['web', 'frontend'] }

const queryString = QueryUtils.stringify({
  q: 'javascript',
  page: 2,
  tags: ['web', 'frontend']
});
console.log(queryString); // 'q=javascript&page=2&tags=web&tags=frontend'

const page = QueryUtils.get('page', 'number');
const tags = QueryUtils.get('tags', 'array');
```

### 浏览器兼容性

```javascript
// URLSearchParams 兼容性检查
if (typeof URLSearchParams === 'undefined') {
  console.error('浏览器不支持 URLSearchParams');
  // 使用 polyfill 或降级方案
}

// 兼容性：
// - Chrome 49+
// - Firefox 44+
// - Safari 10.1+
// - Edge 17+
// - IE 不支持（需要 polyfill）

// 使用 polyfill
// npm install url-search-params-polyfill
// import 'url-search-params-polyfill';
```

---

## 问题 7：URLSearchParams 与其他方案的对比

了解 URLSearchParams 与**其他 URL 参数处理方案**的区别。

### 与手动解析对比

```javascript
// 手动解析
function parseQueryManual(search) {
  const params = {};
  const pairs = search.substring(1).split('&');
  
  for (let pair of pairs) {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  
  return params;
}

// URLSearchParams
function parseQueryParams(search) {
  const params = new URLSearchParams(search);
  const result = {};
  
  for (let [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}

// 优势：
// 1. 自动处理编码
// 2. 处理特殊字符
// 3. 支持数组参数
// 4. API 更简洁
```

### 与第三方库对比

```javascript
// qs 库
// import qs from 'qs';

// qs.parse('?q=js&tags[0]=web&tags[1]=frontend');
// { q: 'js', tags: ['web', 'frontend'] }

// URLSearchParams
const params = new URLSearchParams('q=js&tags=web&tags=frontend');
params.getAll('tags'); // ['web', 'frontend']

// 区别：
// - qs 支持嵌套对象和数组
// - URLSearchParams 是原生 API，无需安装
// - qs 功能更强大，URLSearchParams 更轻量
```

---

## 总结

**URLSearchParams 的核心要点**：

### 1. 基本概念
- Web API，处理 URL 查询字符串
- 自动处理 URL 编码
- 简洁可靠的 API

### 2. 创建方式
- 从字符串创建
- 从对象创建
- 从 URL 对象获取
- 从当前页面获取

### 3. 常用方法
- **get/set/has/delete**：基本操作
- **append**：添加参数
- **getAll**：获取所有值
- **forEach/keys/values/entries**：遍历

### 4. 自动编码
- 自动处理 URL 编码
- 正确处理特殊字符
- 空格编码为 +

### 5. 应用场景
- 解析 URL 参数
- 构建 URL
- API 请求
- 路由跳转
- 表单序列化

### 6. 注意事项
- 参数值都是字符串
- 不支持嵌套对象
- 数组参数需要 append
- 需要类型转换

### 7. 最佳实践
- 封装工具函数
- 处理类型转换
- 处理数组参数
- 检查浏览器兼容性

## 延伸阅读

- [MDN - URLSearchParams](https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams)
- [MDN - URL](https://developer.mozilla.org/zh-CN/docs/Web/API/URL)
- [URL Standard](https://url.spec.whatwg.org/)
- [Can I use - URLSearchParams](https://caniuse.com/urlsearchparams)
