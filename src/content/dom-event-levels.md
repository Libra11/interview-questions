---
title: DOM 事件级别有哪些？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 DOM 0级、DOM 2级、DOM 3级事件的区别和演进，掌握不同事件级别的使用方法和特点，了解事件处理的历史和最佳实践。
tags:
  - DOM
  - 事件级别
  - 事件处理
  - 浏览器API
estimatedTime: 22 分钟
keywords:
  - DOM事件级别
  - DOM 0级事件
  - DOM 2级事件
  - DOM 3级事件
  - addEventListener
highlight: DOM 事件经历了从 0级到 3级的演进，DOM 2级引入了 addEventListener，是目前推荐的事件处理方式
order: 118
---

## 问题 1：什么是 DOM 事件级别？

DOM 事件级别描述了**事件处理方式的演进过程**，从最早的 DOM 0级到现在的 DOM 3级，每个级别都有不同的特点和能力。

### 事件级别概述

```javascript
// DOM 事件级别的演进：
// DOM 0级：最早的事件处理方式
// DOM 1级：没有定义事件相关内容
// DOM 2级：引入了 addEventListener
// DOM 3级：增加了更多事件类型和功能

// 注意：DOM 1级规范中没有定义事件相关的内容
// 所以通常说的是 DOM 0级、DOM 2级、DOM 3级
```

### 为什么需要了解事件级别

```javascript
// 1. 理解浏览器兼容性
// 不同级别的事件在不同浏览器中的支持情况不同

// 2. 选择合适的事件处理方式
// 根据需求选择 DOM 0级还是 DOM 2级

// 3. 理解事件机制的演进
// 了解为什么会有这些不同的方式

// 4. 维护遗留代码
// 很多老代码使用 DOM 0级事件
```

---

## 问题 2：什么是 DOM 0级事件？

DOM 0级事件是**最早的事件处理方式**，通过直接给元素的事件属性赋值来绑定事件。

### 两种方式

```javascript
// 方式 1：HTML 内联事件处理器
<button onclick="handleClick()">点击</button>

<script>
function handleClick() {
  console.log('按钮被点击');
}
</script>

// 方式 2：JavaScript 属性赋值
const button = document.getElementById('btn');

button.onclick = function() {
  console.log('按钮被点击');
};

// 或者使用箭头函数
button.onclick = () => {
  console.log('按钮被点击');
};
```

### DOM 0级事件的特点

```javascript
// 1. 只能绑定一个处理函数
const button = document.getElementById('btn');

button.onclick = function() {
  console.log('第一个处理函数');
};

button.onclick = function() {
  console.log('第二个处理函数'); // 会覆盖第一个
};

// 点击按钮，只会输出：第二个处理函数

// 2. 事件处理函数中的 this 指向当前元素
button.onclick = function() {
  console.log(this); // button 元素
  console.log(this === button); // true
};

// 3. 只支持事件冒泡，不支持事件捕获
button.onclick = function(event) {
  // 只在冒泡阶段触发
  console.log('冒泡阶段');
};

// 4. 移除事件处理器很简单
button.onclick = null; // 移除事件处理器
```

### DOM 0级事件的优缺点

```javascript
// 优点：
// 1. 简单易用
button.onclick = handleClick;

// 2. 兼容性好（所有浏览器都支持）
// 3. this 指向明确

// 缺点：
// 1. 只能绑定一个处理函数
button.onclick = handler1;
button.onclick = handler2; // handler1 被覆盖

// 2. 不支持事件捕获
// 3. HTML 和 JavaScript 耦合（内联方式）
<button onclick="alert('clicked')">点击</button>

// 4. 无法控制事件触发的阶段
```

---

## 问题 3：什么是 DOM 2级事件？

DOM 2级事件引入了 **addEventListener 和 removeEventListener**，提供了更强大和灵活的事件处理能力。

### 基本用法

```javascript
// 语法：element.addEventListener(type, listener, useCapture)
const button = document.getElementById('btn');

// 添加事件监听器
button.addEventListener('click', function(event) {
  console.log('按钮被点击');
});

// 第三个参数控制捕获或冒泡
button.addEventListener('click', function(event) {
  console.log('捕获阶段');
}, true); // true 表示捕获阶段

button.addEventListener('click', function(event) {
  console.log('冒泡阶段');
}, false); // false 表示冒泡阶段（默认）

// 移除事件监听器
function handleClick(event) {
  console.log('点击');
}

button.addEventListener('click', handleClick);
button.removeEventListener('click', handleClick);
```

### DOM 2级事件的特点

```javascript
// 1. 可以绑定多个处理函数
const button = document.getElementById('btn');

button.addEventListener('click', function() {
  console.log('第一个处理函数');
});

button.addEventListener('click', function() {
  console.log('第二个处理函数');
});

// 点击按钮，两个函数都会执行

// 2. 支持事件捕获和冒泡
button.addEventListener('click', function() {
  console.log('冒泡阶段');
}, false);

button.addEventListener('click', function() {
  console.log('捕获阶段');
}, true);

// 3. 可以控制事件触发的阶段
// 捕获阶段：从外到内
// 冒泡阶段：从内到外

// 4. 事件对象更加丰富
button.addEventListener('click', function(event) {
  console.log(event.type);        // 事件类型
  console.log(event.target);      // 触发事件的元素
  console.log(event.currentTarget); // 绑定事件的元素
  console.log(event.eventPhase);  // 事件阶段
});
```

### 事件传播机制

```javascript
// DOM 2级事件定义了完整的事件传播机制
// 三个阶段：捕获 → 目标 → 冒泡

// HTML 结构
// <div id="outer">
//   <div id="inner">
//     <button id="btn">点击</button>
//   </div>
// </div>

const outer = document.getElementById('outer');
const inner = document.getElementById('inner');
const btn = document.getElementById('btn');

// 捕获阶段
outer.addEventListener('click', () => {
  console.log('outer 捕获');
}, true);

inner.addEventListener('click', () => {
  console.log('inner 捕获');
}, true);

btn.addEventListener('click', () => {
  console.log('btn 捕获');
}, true);

// 冒泡阶段
outer.addEventListener('click', () => {
  console.log('outer 冒泡');
}, false);

inner.addEventListener('click', () => {
  console.log('inner 冒泡');
}, false);

btn.addEventListener('click', () => {
  console.log('btn 冒泡');
}, false);

// 点击按钮，输出顺序：
// outer 捕获
// inner 捕获
// btn 捕获
// btn 冒泡
// inner 冒泡
// outer 冒泡
```

### DOM 2级事件的优缺点

```javascript
// 优点：
// 1. 可以绑定多个处理函数
button.addEventListener('click', handler1);
button.addEventListener('click', handler2);

// 2. 支持事件捕获和冒泡
button.addEventListener('click', handler, true);  // 捕获
button.addEventListener('click', handler, false); // 冒泡

// 3. 事件对象功能更强大
button.addEventListener('click', (event) => {
  event.stopPropagation();  // 阻止传播
  event.preventDefault();   // 阻止默认行为
});

// 4. 更好的代码组织
// 事件处理逻辑与 HTML 分离

// 缺点：
// 1. IE8 及以下不支持（需要使用 attachEvent）
// 2. 移除事件需要保存函数引用
const handler = () => console.log('click');
button.addEventListener('click', handler);
button.removeEventListener('click', handler);

// 3. 箭头函数和匿名函数无法移除
button.addEventListener('click', () => {
  console.log('无法移除');
});
```

---

## 问题 4：什么是 DOM 3级事件？

DOM 3级事件在 DOM 2级的基础上**增加了更多事件类型和功能**。

### 新增的事件类型

```javascript
// DOM 3级新增了许多事件类型：

// 1. UI 事件
// - load、unload、abort、error、select、resize、scroll

// 2. 焦点事件
// - focus、blur、focusin、focusout
element.addEventListener('focusin', (event) => {
  console.log('获得焦点（冒泡）');
});

element.addEventListener('focusout', (event) => {
  console.log('失去焦点（冒泡）');
});

// 3. 鼠标事件
// - click、dblclick、mousedown、mouseup、mousemove
// - mouseenter、mouseleave、mouseover、mouseout

// 4. 滚轮事件
element.addEventListener('wheel', (event) => {
  console.log('滚轮滚动', event.deltaY);
});

// 5. 文本事件
element.addEventListener('textInput', (event) => {
  console.log('文本输入', event.data);
});

// 6. 键盘事件
// - keydown、keyup、keypress（已废弃）
element.addEventListener('keydown', (event) => {
  console.log('按键', event.key, event.code);
});

// 7. 合成事件（输入法相关）
element.addEventListener('compositionstart', (event) => {
  console.log('开始输入');
});

element.addEventListener('compositionupdate', (event) => {
  console.log('输入中', event.data);
});

element.addEventListener('compositionend', (event) => {
  console.log('输入结束', event.data);
});
```

### DOM 3级的新特性

```javascript
// 1. 自定义事件
const event = new CustomEvent('myEvent', {
  detail: { message: 'Hello' },
  bubbles: true,
  cancelable: true
});

element.addEventListener('myEvent', (event) => {
  console.log('自定义事件', event.detail.message);
});

element.dispatchEvent(event);

// 2. 事件对象的增强
element.addEventListener('click', (event) => {
  // DOM 3级新增的属性
  console.log(event.defaultPrevented); // 是否已阻止默认行为
  console.log(event.isTrusted);        // 是否为用户触发
});

// 3. 键盘事件的改进
element.addEventListener('keydown', (event) => {
  // DOM 3级使用 key 和 code
  console.log(event.key);   // 'a', 'Enter', 'ArrowUp'
  console.log(event.code);  // 'KeyA', 'Enter', 'ArrowUp'
  
  // DOM 2级使用 keyCode（已废弃）
  console.log(event.keyCode); // 65
});
```

---

## 问题 5：三种事件级别的区别是什么？

对比三种事件级别的主要区别。

### 功能对比

```javascript
// DOM 0级
const button = document.getElementById('btn');

// 只能绑定一个处理函数
button.onclick = function() {
  console.log('点击');
};

// 只支持冒泡
// 无法控制事件阶段
// 移除简单：button.onclick = null

// ---

// DOM 2级
// 可以绑定多个处理函数
button.addEventListener('click', handler1);
button.addEventListener('click', handler2);

// 支持捕获和冒泡
button.addEventListener('click', handler, true);  // 捕获
button.addEventListener('click', handler, false); // 冒泡

// 移除需要函数引用
button.removeEventListener('click', handler);

// ---

// DOM 3级
// 在 DOM 2级基础上增加了更多事件类型
button.addEventListener('wheel', handler);
button.addEventListener('compositionstart', handler);

// 支持自定义事件
const event = new CustomEvent('myEvent');
button.dispatchEvent(event);
```

### 兼容性对比

```javascript
// DOM 0级：所有浏览器都支持
button.onclick = function() {
  console.log('兼容性最好');
};

// DOM 2级：IE9+ 支持
// IE8 及以下使用 attachEvent
if (button.addEventListener) {
  button.addEventListener('click', handler);
} else if (button.attachEvent) {
  // IE8 及以下
  button.attachEvent('onclick', handler);
}

// DOM 3级：现代浏览器支持
// 某些新事件类型可能需要检查兼容性
if ('onwheel' in document) {
  element.addEventListener('wheel', handler);
}
```

### 使用场景对比

```javascript
// DOM 0级适用场景：
// 1. 简单的事件处理
button.onclick = () => alert('clicked');

// 2. 需要快速移除事件
button.onclick = handler;
button.onclick = null; // 快速移除

// 3. 兼容老旧浏览器

// ---

// DOM 2级适用场景：
// 1. 需要绑定多个处理函数
button.addEventListener('click', handler1);
button.addEventListener('click', handler2);

// 2. 需要控制事件阶段
button.addEventListener('click', handler, true); // 捕获

// 3. 现代 Web 应用（推荐）

// ---

// DOM 3级适用场景：
// 1. 使用新的事件类型
element.addEventListener('wheel', handler);

// 2. 自定义事件
element.dispatchEvent(new CustomEvent('myEvent'));

// 3. 需要更详细的事件信息
element.addEventListener('keydown', (event) => {
  console.log(event.key, event.code);
});
```

---

## 问题 6：如何处理浏览器兼容性？

处理不同浏览器对事件级别的支持差异。

### 兼容性封装

```javascript
// 封装跨浏览器的事件处理函数
const EventUtil = {
  // 添加事件监听器
  addHandler(element, type, handler) {
    if (element.addEventListener) {
      // DOM 2级
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      // IE8 及以下
      element.attachEvent('on' + type, handler);
    } else {
      // DOM 0级
      element['on' + type] = handler;
    }
  },
  
  // 移除事件监听器
  removeHandler(element, type, handler) {
    if (element.removeEventListener) {
      element.removeEventListener(type, handler, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + type, handler);
    } else {
      element['on' + type] = null;
    }
  },
  
  // 获取事件对象
  getEvent(event) {
    return event || window.event;
  },
  
  // 获取事件目标
  getTarget(event) {
    return event.target || event.srcElement;
  },
  
  // 阻止默认行为
  preventDefault(event) {
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
  },
  
  // 阻止事件传播
  stopPropagation(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }
  }
};

// 使用
const button = document.getElementById('btn');

EventUtil.addHandler(button, 'click', function(event) {
  event = EventUtil.getEvent(event);
  const target = EventUtil.getTarget(event);
  
  EventUtil.preventDefault(event);
  EventUtil.stopPropagation(event);
  
  console.log('按钮被点击', target);
});
```

### 现代浏览器的处理

```javascript
// 现代浏览器直接使用 DOM 2级/3级
// 不需要考虑 IE8 及以下的兼容性

const button = document.getElementById('btn');

// 直接使用 addEventListener
button.addEventListener('click', (event) => {
  console.log('点击');
});

// 使用现代事件 API
button.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  
  console.log(event.target);
  console.log(event.currentTarget);
});

// 使用 DOM 3级的新特性
button.addEventListener('wheel', (event) => {
  console.log('滚轮', event.deltaY);
});

// 自定义事件
const customEvent = new CustomEvent('myEvent', {
  detail: { data: 'value' }
});

button.dispatchEvent(customEvent);
```

---

## 问题 7：实际开发中应该如何选择？

根据实际需求选择合适的事件级别。

### 推荐做法

```javascript
// 1. 现代项目：优先使用 DOM 2级/3级
const button = document.getElementById('btn');

// ✅ 推荐
button.addEventListener('click', handleClick);

// ❌ 不推荐（除非有特殊需求）
button.onclick = handleClick;

// 2. 需要多个处理函数：使用 DOM 2级
button.addEventListener('click', handler1);
button.addEventListener('click', handler2);
button.addEventListener('click', handler3);

// 3. 需要控制事件阶段：使用 DOM 2级
// 捕获阶段处理
button.addEventListener('click', captureHandler, true);

// 冒泡阶段处理
button.addEventListener('click', bubbleHandler, false);

// 4. 简单场景：可以使用 DOM 0级
// 快速原型开发
button.onclick = () => console.log('clicked');

// 临时调试
button.onclick = function() {
  debugger;
};
```

### 最佳实践

```javascript
// 1. 统一使用 addEventListener
class Component {
  constructor(element) {
    this.element = element;
    this.handlers = [];
  }
  
  on(eventType, handler) {
    this.element.addEventListener(eventType, handler);
    this.handlers.push({ eventType, handler });
  }
  
  off(eventType, handler) {
    this.element.removeEventListener(eventType, handler);
    this.handlers = this.handlers.filter(
      h => h.eventType !== eventType || h.handler !== handler
    );
  }
  
  destroy() {
    this.handlers.forEach(({ eventType, handler }) => {
      this.element.removeEventListener(eventType, handler);
    });
    this.handlers = [];
  }
}

// 2. 使用事件委托
const list = document.getElementById('list');

// ✅ 好：事件委托
list.addEventListener('click', (event) => {
  const item = event.target.closest('.item');
  if (item) {
    handleItemClick(item);
  }
});

// ❌ 不好：为每个元素添加监听器
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('click', handleItemClick);
});

// 3. 及时移除事件监听器
class Modal {
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }
  
  show() {
    document.addEventListener('click', this.handleClick);
  }
  
  hide() {
    // 移除监听器，避免内存泄漏
    document.removeEventListener('click', this.handleClick);
  }
  
  handleClick(event) {
    console.log('点击');
  }
}
```

---

## 总结

**DOM 事件级别的核心要点**：

### 1. DOM 0级事件
- 通过 `onclick` 等属性绑定
- 只能绑定一个处理函数
- 只支持冒泡阶段
- 兼容性最好

### 2. DOM 2级事件
- 使用 `addEventListener`
- 可以绑定多个处理函数
- 支持捕获和冒泡
- 定义了完整的事件传播机制

### 3. DOM 3级事件
- 在 DOM 2级基础上扩展
- 新增更多事件类型
- 支持自定义事件
- 事件对象功能更强大

### 4. 主要区别
- **绑定方式**：属性 vs addEventListener
- **处理函数数量**：单个 vs 多个
- **事件阶段**：仅冒泡 vs 捕获+冒泡
- **功能丰富度**：基础 vs 完整

### 5. 选择建议
- 现代项目使用 DOM 2级/3级
- 简单场景可以使用 DOM 0级
- 需要多个处理函数用 DOM 2级
- 需要新事件类型用 DOM 3级

### 6. 最佳实践
- 统一使用 addEventListener
- 使用事件委托优化性能
- 及时移除监听器避免内存泄漏
- 保存函数引用以便移除

## 延伸阅读

- [DOM Level 2 Events Specification](https://www.w3.org/TR/DOM-Level-2-Events/)
- [DOM Level 3 Events Specification](https://www.w3.org/TR/DOM-Level-3-Events/)
- [MDN - addEventListener](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
- [JavaScript 事件处理的演进](https://javascript.info/introduction-browser-events)
