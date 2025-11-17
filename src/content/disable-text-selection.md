---
title: 如何实现页面文本不可选中，不可复制？
category: CSS
difficulty: 入门
updatedAt: 2025-11-17
summary: >-
  深入理解禁止文本选中和复制的多种实现方式，掌握 CSS、JavaScript 等方法，学习如何在实际项目中合理使用这些技术，以及需要注意的用户体验问题。
tags:
  - CSS
  - 文本选择
  - 用户体验
  - 防复制
estimatedTime: 16 分钟
keywords:
  - user-select
  - 禁止选中
  - 禁止复制
  - 文本保护
  - 防复制
highlight: 使用 CSS user-select 属性可以禁止文本选中，但需要注意用户体验和可访问性问题
order: 133
---

## 问题 1：如何使用 CSS 禁止文本选中？

使用 **user-select 属性**可以控制文本是否可选中。

### 基本使用

```css
/* 禁止选中文本 */
.no-select {
  user-select: none; /* 标准语法 */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE 10+ */
}

/* HTML */
/* <div class="no-select">这段文本无法选中</div> */
```

### user-select 的值

```css
/* auto: 默认值，文本可选中 */
.auto {
  user-select: auto;
}

/* none: 文本不可选中 */
.none {
  user-select: none;
}

/* text: 文本可选中 */
.text {
  user-select: text;
}

/* all: 点击时选中所有文本 */
.all {
  user-select: all;
}

/* contain: 选择范围限制在元素内 */
.contain {
  user-select: contain;
}

/* 示例 */
.code-block {
  user-select: all; /* 点击代码块时全选 */
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
}
```

### 应用场景

```css
/* 场景 1：按钮文本 */
button {
  user-select: none; /* 防止双击按钮时选中文本 */
}

/* 场景 2：导航菜单 */
.navbar {
  user-select: none;
}

/* 场景 3：图标文字 */
.icon-text {
  user-select: none;
}

/* 场景 4：拖拽元素 */
.draggable {
  user-select: none; /* 拖拽时不选中文本 */
  cursor: move;
}

/* 场景 5：游戏界面 */
.game-ui {
  user-select: none; /* 防止游戏操作时选中文本 */
}

/* 场景 6：代码编辑器行号 */
.line-numbers {
  user-select: none; /* 行号不可选中 */
}

.code-content {
  user-select: text; /* 代码内容可选中 */
}
```

---

## 问题 2：如何使用 JavaScript 禁止文本选中？

使用 **JavaScript 事件**可以阻止文本选中。

### 阻止选中事件

```javascript
// 方法 1：阻止 selectstart 事件
document.addEventListener('selectstart', (e) => {
  e.preventDefault();
});

// 方法 2：针对特定元素
const element = document.getElementById('protected');

element.addEventListener('selectstart', (e) => {
  e.preventDefault();
});

// 方法 3：使用 onselectstart
element.onselectstart = function() {
  return false;
};

// 方法 4：清除选中内容
document.addEventListener('mouseup', () => {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
});
```

### 封装工具函数

```javascript
// 禁止选中工具类
class SelectionControl {
  // 禁止选中
  static disable(element = document) {
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.mozUserSelect = 'none';
    element.style.msUserSelect = 'none';
    
    element.addEventListener('selectstart', this.preventSelect);
  }
  
  // 启用选中
  static enable(element = document) {
    element.style.userSelect = '';
    element.style.webkitUserSelect = '';
    element.style.mozUserSelect = '';
    element.style.msUserSelect = '';
    
    element.removeEventListener('selectstart', this.preventSelect);
  }
  
  // 阻止选中
  static preventSelect(e) {
    e.preventDefault();
    return false;
  }
  
  // 清除选中
  static clearSelection() {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection.removeAllRanges) {
        selection.removeAllRanges();
      } else if (selection.empty) {
        selection.empty();
      }
    } else if (document.selection) {
      document.selection.empty();
    }
  }
}

// 使用
const protectedDiv = document.getElementById('protected');
SelectionControl.disable(protectedDiv);

// 恢复选中
SelectionControl.enable(protectedDiv);

// 清除当前选中
SelectionControl.clearSelection();
```

---

## 问题 3：如何禁止复制？

使用 **copy 事件**可以阻止复制操作。

### 阻止复制事件

```javascript
// 方法 1：阻止 copy 事件
document.addEventListener('copy', (e) => {
  e.preventDefault();
  alert('禁止复制');
});

// 方法 2：针对特定元素
const element = document.getElementById('protected');

element.addEventListener('copy', (e) => {
  e.preventDefault();
  console.log('禁止复制此内容');
});

// 方法 3：修改复制内容
document.addEventListener('copy', (e) => {
  e.preventDefault();
  
  // 自定义复制内容
  const customText = '版权所有，禁止复制';
  e.clipboardData.setData('text/plain', customText);
});

// 方法 4：添加版权信息
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  const copyright = '\n\n来源：https://example.com';
  
  e.clipboardData.setData('text/plain', selection + copyright);
  e.preventDefault();
});
```

### 禁止右键菜单

```javascript
// 禁止右键菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// 针对特定元素
const element = document.getElementById('protected');

element.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  
  // 可以显示自定义菜单
  showCustomMenu(e.clientX, e.clientY);
});

// 自定义右键菜单
function showCustomMenu(x, y) {
  const menu = document.createElement('div');
  menu.className = 'custom-menu';
  menu.style.position = 'fixed';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.innerHTML = '<div>自定义菜单</div>';
  
  document.body.appendChild(menu);
  
  // 点击其他地方关闭菜单
  document.addEventListener('click', () => {
    menu.remove();
  }, { once: true });
}
```

### 禁止快捷键

```javascript
// 禁止常见的复制快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl+C / Cmd+C
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault();
    alert('禁止复制');
    return false;
  }
  
  // Ctrl+A / Cmd+A（全选）
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+X / Cmd+X（剪切）
  if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
    e.preventDefault();
    return false;
  }
  
  // F12（开发者工具）
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+Shift+I / Cmd+Option+I（开发者工具）
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
    e.preventDefault();
    return false;
  }
});
```

---

## 问题 4：如何实现完整的防复制方案？

结合多种方法实现**更完善的防复制**。

### 综合防护

```javascript
// 完整的防复制类
class CopyProtection {
  constructor(element, options = {}) {
    this.element = element || document;
    this.options = {
      disableSelect: true,
      disableCopy: true,
      disableContextMenu: true,
      disableShortcuts: true,
      showAlert: true,
      ...options
    };
    
    this.init();
  }
  
  init() {
    if (this.options.disableSelect) {
      this.disableSelection();
    }
    
    if (this.options.disableCopy) {
      this.disableCopy();
    }
    
    if (this.options.disableContextMenu) {
      this.disableContextMenu();
    }
    
    if (this.options.disableShortcuts) {
      this.disableShortcuts();
    }
  }
  
  // 禁止选中
  disableSelection() {
    this.element.style.userSelect = 'none';
    this.element.style.webkitUserSelect = 'none';
    
    this.element.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
  }
  
  // 禁止复制
  disableCopy() {
    this.element.addEventListener('copy', (e) => {
      e.preventDefault();
      
      if (this.options.showAlert) {
        this.showMessage('禁止复制内容');
      }
    });
  }
  
  // 禁止右键
  disableContextMenu() {
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      if (this.options.showAlert) {
        this.showMessage('禁止右键操作');
      }
    });
  }
  
  // 禁止快捷键
  disableShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+C, Ctrl+X, Ctrl+A
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        
        if (this.options.showAlert) {
          this.showMessage('禁止使用快捷键');
        }
      }
    });
  }
  
  // 显示提示信息
  showMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 30px;
      border-radius: 4px;
      z-index: 9999;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
  
  // 销毁
  destroy() {
    this.element.style.userSelect = '';
    this.element.style.webkitUserSelect = '';
    // 移除所有事件监听器
  }
}

// 使用
const protection = new CopyProtection(document.getElementById('protected'), {
  disableSelect: true,
  disableCopy: true,
  disableContextMenu: true,
  disableShortcuts: true,
  showAlert: true
});

// 销毁防护
// protection.destroy();
```

### CSS + JavaScript 组合

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .protected {
      /* CSS 防选中 */
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      
      /* 防止拖拽选中 */
      -webkit-user-drag: none;
      
      /* 防止长按选中（移动端） */
      -webkit-touch-callout: none;
    }
  </style>
</head>
<body>
  <div class="protected" id="content">
    这是受保护的内容
  </div>
  
  <script>
    const content = document.getElementById('content');
    
    // 禁止选中
    content.onselectstart = () => false;
    
    // 禁止复制
    content.oncopy = () => false;
    
    // 禁止右键
    content.oncontextmenu = () => false;
    
    // 禁止拖拽
    content.ondragstart = () => false;
  </script>
</body>
</html>
```

---

## 问题 5：如何处理移动端的防复制？

移动端需要**额外的处理**。

### 移动端防复制

```css
/* 移动端防选中 */
.protected-mobile {
  /* 禁止选中 */
  user-select: none;
  -webkit-user-select: none;
  
  /* 禁止长按弹出菜单 */
  -webkit-touch-callout: none;
  
  /* 禁止点击高亮 */
  -webkit-tap-highlight-color: transparent;
}
```

```javascript
// 移动端防复制
class MobileCopyProtection {
  constructor(element) {
    this.element = element;
    this.init();
  }
  
  init() {
    // 禁止长按选中
    this.element.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
    
    // 禁止长按菜单
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // 禁止选中
    this.element.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
    
    // 监听选中变化
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
        selection.removeAllRanges();
      }
    });
  }
}

// 使用
const mobileProtection = new MobileCopyProtection(
  document.getElementById('protected')
);
```

---

## 问题 6：防复制的注意事项有哪些？

了解防复制的**局限性和最佳实践**。

### 局限性

```javascript
// 1. 无法完全防止复制
// 用户可以通过以下方式绕过：
// - 查看页面源代码
// - 使用开发者工具
// - 截图 + OCR
// - 禁用 JavaScript
// - 使用浏览器插件

// 2. 影响用户体验
// - 无法复制有用的信息
// - 影响可访问性
// - 可能引起用户反感

// 3. 影响 SEO
// - 搜索引擎可能无法正确索引
// - 影响页面排名
```

### 最佳实践

```javascript
// 1. 仅对关键内容使用防复制
// ❌ 不好：全站禁止复制
document.addEventListener('copy', (e) => {
  e.preventDefault();
});

// ✅ 好：仅对特定内容禁止复制
const protectedContent = document.querySelector('.protected');
protectedContent.addEventListener('copy', (e) => {
  e.preventDefault();
});

// 2. 提供合理的提示
document.addEventListener('copy', (e) => {
  e.preventDefault();
  
  // 友好的提示
  showNotification('此内容受版权保护，如需使用请联系我们');
});

// 3. 允许部分复制
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  
  // 允许复制少量内容
  if (selection.length <= 100) {
    return; // 允许复制
  }
  
  e.preventDefault();
  showNotification('请勿复制大量内容');
});

// 4. 添加版权信息而非完全禁止
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  const copyright = '\n\n版权所有 © 2024 Example.com';
  
  e.clipboardData.setData('text/plain', selection + copyright);
  e.preventDefault();
});

// 5. 考虑可访问性
// 不要影响屏幕阅读器等辅助工具
const content = document.querySelector('.content');

// 只在非辅助工具环境下禁用
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  content.style.userSelect = 'none';
}
```

### 合理的使用场景

```javascript
// 适合使用防复制的场景：
// 1. 付费内容
// 2. 考试系统
// 3. 版权保护的文章
// 4. 敏感信息展示

// 不适合使用防复制的场景：
// 1. 公开的博客文章
// 2. 技术文档
// 3. 教程和指南
// 4. 需要分享的内容

// 示例：付费内容的合理保护
class PaidContentProtection {
  constructor(element) {
    this.element = element;
    this.init();
  }
  
  init() {
    // 基础防护
    this.element.style.userSelect = 'none';
    
    // 添加水印
    this.addWatermark();
    
    // 监控异常行为
    this.monitorBehavior();
  }
  
  addWatermark() {
    const watermark = document.createElement('div');
    watermark.textContent = `用户ID: ${this.getUserId()}`;
    watermark.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 48px;
      color: rgba(0, 0, 0, 0.05);
      pointer-events: none;
      z-index: 9999;
    `;
    
    document.body.appendChild(watermark);
  }
  
  monitorBehavior() {
    let copyAttempts = 0;
    
    this.element.addEventListener('copy', (e) => {
      copyAttempts++;
      
      if (copyAttempts > 3) {
        // 记录异常行为
        this.reportAbuse();
      }
    });
  }
  
  getUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9);
  }
  
  reportAbuse() {
    console.log('检测到异常复制行为');
    // 上报到服务器
  }
}
```

---

## 问题 7：如何实现更优雅的内容保护？

使用**更友好的方式**保护内容。

### 添加版权信息

```javascript
// 在复制时自动添加来源
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  
  if (selection.length > 0) {
    const source = `\n\n————————————————\n来源：${document.title}\n链接：${window.location.href}`;
    
    e.clipboardData.setData('text/plain', selection + source);
    e.preventDefault();
  }
});
```

### 添加水印

```javascript
// 动态水印
class Watermark {
  constructor(options = {}) {
    this.options = {
      text: 'Watermark',
      fontSize: 16,
      color: 'rgba(0, 0, 0, 0.1)',
      rotate: -20,
      ...options
    };
    
    this.create();
  }
  
  create() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 150;
    
    ctx.font = `${this.options.fontSize}px Arial`;
    ctx.fillStyle = this.options.color;
    ctx.rotate((this.options.rotate * Math.PI) / 180);
    ctx.fillText(this.options.text, 0, canvas.height / 2);
    
    const dataUrl = canvas.toDataURL();
    
    const style = document.createElement('style');
    style.textContent = `
      body::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url(${dataUrl});
        background-repeat: repeat;
        pointer-events: none;
        z-index: 9999;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// 使用
new Watermark({
  text: '版权所有 © 2024',
  fontSize: 14,
  color: 'rgba(0, 0, 0, 0.08)'
});
```

### 限制复制长度

```javascript
// 限制复制内容长度
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  const maxLength = 200;
  
  if (selection.length > maxLength) {
    e.preventDefault();
    
    // 只允许复制部分内容
    const truncated = selection.substring(0, maxLength) + '...';
    e.clipboardData.setData('text/plain', truncated);
    
    showNotification(`已复制前 ${maxLength} 个字符`);
  }
});

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 9999;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
```

---

## 总结

**防止文本选中和复制的核心要点**：

### 1. CSS 方法
- **user-select: none**：禁止选中
- 添加浏览器前缀
- 适用于按钮、导航等 UI 元素

### 2. JavaScript 方法
- 阻止 **selectstart** 事件
- 阻止 **copy** 事件
- 阻止 **contextmenu** 事件
- 禁止快捷键

### 3. 综合方案
- CSS + JavaScript 结合
- 封装工具类
- 移动端特殊处理

### 4. 局限性
- 无法完全防止复制
- 用户可以通过多种方式绕过
- 影响用户体验和可访问性

### 5. 最佳实践
- 仅对关键内容使用
- 提供友好的提示
- 考虑可访问性
- 添加版权信息而非完全禁止

### 6. 优雅的方案
- 添加版权信息
- 添加水印
- 限制复制长度
- 监控异常行为

### 7. 使用场景
- 付费内容
- 考试系统
- 版权保护
- 敏感信息展示

## 延伸阅读

- [MDN - user-select](https://developer.mozilla.org/zh-CN/docs/Web/CSS/user-select)
- [MDN - copy event](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/copy_event)
- [MDN - Selection API](https://developer.mozilla.org/zh-CN/docs/Web/API/Selection)
- [Web 内容可访问性指南](https://www.w3.org/WAI/WCAG21/quickref/)
