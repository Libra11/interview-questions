---
title: HTML 自定义属性的使用方法和应用场景
category: HTML
difficulty: 入门
updatedAt: 2025-11-18
summary: >-
  了解 HTML 自定义属性（data-*）的使用方法，掌握如何通过自定义属性存储和传递数据
tags:
  - HTML
  - 自定义属性
  - data属性
  - DOM操作
estimatedTime: 18 分钟
keywords:
  - 自定义属性
  - data属性
  - dataset
  - HTML5
  - DOM
highlight: 使用 data-* 属性可以在 HTML 元素上存储自定义数据，通过 dataset API 方便地读取和操作
order: 104
---

## 问题 1：什么是自定义属性？

### data-* 属性

```html
<!-- 使用 data- 前缀定义自定义属性 -->
<div 
  data-user-id="123"
  data-user-name="张三"
  data-user-role="admin"
>
  用户信息
</div>

<button data-action="delete" data-id="456">删除</button>

<article data-category="tech" data-tags="javascript,html,css">
  文章内容
</article>
```

### 为什么使用自定义属性

```html
<!-- ❌ 不推荐：使用非标准属性 -->
<div userid="123" username="张三">用户</div>

<!-- ✅ 推荐：使用 data-* 属性 -->
<div data-user-id="123" data-user-name="张三">用户</div>

<!-- 优点：
1. 符合 HTML5 规范
2. 不会与未来的 HTML 标准冲突
3. 通过 dataset API 方便访问
4. 语义清晰
-->
```

---

## 问题 2：如何读取和设置自定义属性？

### 使用 dataset API

```javascript
const element = document.querySelector('[data-user-id]');

// 读取属性
console.log(element.dataset.userId);      // "123"
console.log(element.dataset.userName);    // "张三"
console.log(element.dataset.userRole);    // "admin"

// 注意：data-user-id 转换为 userId（驼峰命名）

// 设置属性
element.dataset.userId = "456";
element.dataset.userEmail = "zhangsan@example.com";

// 删除属性
delete element.dataset.userRole;

// 检查属性是否存在
if ('userId' in element.dataset) {
  console.log('存在 user-id 属性');
}
```

### 使用 getAttribute/setAttribute

```javascript
const element = document.querySelector('[data-user-id]');

// 读取属性
const userId = element.getAttribute('data-user-id');

// 设置属性
element.setAttribute('data-user-id', '456');

// 删除属性
element.removeAttribute('data-user-id');

// 检查属性是否存在
if (element.hasAttribute('data-user-id')) {
  console.log('存在 data-user-id 属性');
}
```

### 两种方式的区别

```javascript
// dataset：自动转换驼峰命名
element.dataset.userId = "123";
// 等价于
element.setAttribute('data-user-id', '123');

// dataset：只能访问 data-* 属性
element.dataset.userId;  // ✅
element.dataset.id;      // ❌ 无法访问 id 属性

// getAttribute：可以访问任何属性
element.getAttribute('id');           // ✅
element.getAttribute('data-user-id'); // ✅
```

---

## 问题 3：有哪些实际应用场景？

### 1. 事件委托传递数据

```html
<ul id="user-list">
  <li data-user-id="1" data-user-name="张三">
    <button data-action="edit">编辑</button>
    <button data-action="delete">删除</button>
  </li>
  <li data-user-id="2" data-user-name="李四">
    <button data-action="edit">编辑</button>
    <button data-action="delete">删除</button>
  </li>
</ul>

<script>
document.getElementById('user-list').addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const action = e.target.dataset.action;
    const li = e.target.closest('li');
    const userId = li.dataset.userId;
    const userName = li.dataset.userName;
    
    if (action === 'edit') {
      console.log(`编辑用户：${userName} (ID: ${userId})`);
    } else if (action === 'delete') {
      console.log(`删除用户：${userName} (ID: ${userId})`);
    }
  }
});
</script>
```

### 2. 配置组件参数

```html
<!-- 轮播图配置 -->
<div 
  class="carousel"
  data-autoplay="true"
  data-interval="3000"
  data-animation="fade"
>
  <div class="slide">Slide 1</div>
  <div class="slide">Slide 2</div>
  <div class="slide">Slide 3</div>
</div>

<script>
class Carousel {
  constructor(element) {
    this.element = element;
    this.options = {
      autoplay: element.dataset.autoplay === 'true',
      interval: parseInt(element.dataset.interval) || 5000,
      animation: element.dataset.animation || 'slide'
    };
    
    this.init();
  }
  
  init() {
    console.log('轮播图配置:', this.options);
    // 初始化轮播图...
  }
}

// 使用
document.querySelectorAll('.carousel').forEach(el => {
  new Carousel(el);
});
</script>
```

### 3. 状态标记

```html
<button 
  id="toggle-btn"
  data-state="collapsed"
  data-target="#content"
>
  展开
</button>

<div id="content" style="display: none;">
  内容区域
</div>

<script>
const btn = document.getElementById('toggle-btn');
const content = document.querySelector(btn.dataset.target);

btn.addEventListener('click', () => {
  const state = btn.dataset.state;
  
  if (state === 'collapsed') {
    content.style.display = 'block';
    btn.textContent = '收起';
    btn.dataset.state = 'expanded';
  } else {
    content.style.display = 'none';
    btn.textContent = '展开';
    btn.dataset.state = 'collapsed';
  }
});
</script>
```

### 4. 表单验证规则

```html
<form>
  <input 
    type="text"
    name="username"
    data-required="true"
    data-min-length="3"
    data-max-length="20"
    data-pattern="^[a-zA-Z0-9_]+$"
  >
  
  <input 
    type="email"
    name="email"
    data-required="true"
    data-type="email"
  >
  
  <button type="submit">提交</button>
</form>

<script>
function validateInput(input) {
  const value = input.value.trim();
  const rules = input.dataset;
  
  // 必填验证
  if (rules.required === 'true' && !value) {
    return '此字段不能为空';
  }
  
  // 最小长度
  if (rules.minLength && value.length < parseInt(rules.minLength)) {
    return `最少 ${rules.minLength} 个字符`;
  }
  
  // 最大长度
  if (rules.maxLength && value.length > parseInt(rules.maxLength)) {
    return `最多 ${rules.maxLength} 个字符`;
  }
  
  // 正则验证
  if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
    return '格式不正确';
  }
  
  return null;
}
</script>
```

### 5. 存储 JSON 数据

```html
<div 
  id="user-card"
  data-user='{"id": 123, "name": "张三", "role": "admin"}'
>
  用户卡片
</div>

<script>
const card = document.getElementById('user-card');

// 读取 JSON 数据
const user = JSON.parse(card.dataset.user);
console.log(user.name); // "张三"

// 更新 JSON 数据
user.role = 'editor';
card.dataset.user = JSON.stringify(user);
</script>
```

---

## 问题 4：在 CSS 中如何使用自定义属性？

### 属性选择器

```css
/* 选择具有特定 data 属性的元素 */
[data-status="active"] {
  background-color: green;
}

[data-status="inactive"] {
  background-color: gray;
}

/* 选择具有任意 data-priority 属性的元素 */
[data-priority] {
  font-weight: bold;
}

/* 选择 data-priority 以 high 开头的元素 */
[data-priority^="high"] {
  color: red;
}
```

### 使用 attr() 函数

```html
<div data-tooltip="这是提示信息">鼠标悬停</div>

<style>
[data-tooltip] {
  position: relative;
  cursor: help;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

[data-tooltip]:hover::after {
  opacity: 1;
}
</style>
```

---

## 问题 5：使用自定义属性需要注意什么？

### 1. 命名规范

```html
<!-- ✅ 推荐：使用小写字母和连字符 -->
<div data-user-id="123"></div>
<div data-max-length="100"></div>

<!-- ❌ 不推荐：使用驼峰命名 -->
<div data-userId="123"></div>

<!-- ❌ 不推荐：使用大写字母 -->
<div data-USER-ID="123"></div>
```

### 2. 数据类型转换

```javascript
// dataset 返回的都是字符串
const element = document.querySelector('[data-count="5"]');

console.log(element.dataset.count);        // "5" (字符串)
console.log(typeof element.dataset.count); // "string"

// 需要手动转换类型
const count = parseInt(element.dataset.count);  // 5 (数字)
const isActive = element.dataset.active === 'true'; // 布尔值
```

### 3. 性能考虑

```javascript
// ❌ 不推荐：存储大量数据
element.dataset.largeData = JSON.stringify(hugeObject);

// ✅ 推荐：只存储必要的标识
element.dataset.dataId = '123';
// 通过 ID 从其他地方获取完整数据
const data = dataStore.get(element.dataset.dataId);
```

### 4. 安全性

```javascript
// ⚠️ 注意：不要存储敏感信息
// ❌ 不要这样做
element.dataset.password = 'secret123';
element.dataset.apiKey = 'sk-xxx';

// ✅ 只存储非敏感的标识
element.dataset.userId = '123';
```

---

## 总结

**核心要点**：

### 1. 基本使用
```html
<div data-user-id="123" data-user-name="张三"></div>
```

### 2. JavaScript 访问
```javascript
element.dataset.userId;      // 读取
element.dataset.userId = "456"; // 设置
delete element.dataset.userId;  // 删除
```

### 3. 应用场景
- 事件委托传递数据
- 组件配置参数
- 状态标记
- 表单验证规则

### 4. 注意事项
- 使用小写和连字符命名
- 注意类型转换
- 不存储敏感信息
- 避免存储大量数据

---

## 延伸阅读

- [MDN - data-* 属性](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/data-*)
- [MDN - HTMLElement.dataset](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/dataset)
- [HTML5 自定义属性规范](https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
