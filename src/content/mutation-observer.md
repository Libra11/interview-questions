---
title: 介绍一下 MutationObserver
category: JavaScript
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 MutationObserver API 的工作原理,包括如何监听 DOM 变化、配置选项、使用场景,以及与传统 DOM 事件的区别。
tags:
  - MutationObserver
  - DOM
  - JavaScript
  - Web API
estimatedTime: 22 分钟
keywords:
  - MutationObserver
  - DOM监听
  - DOM变化
  - 异步回调
highlight: 掌握现代浏览器监听 DOM 变化的标准方案
order: 6
---

## 问题 1：什么是 MutationObserver

`MutationObserver` 是一个用于监听 DOM 树变化的 API。当 DOM 发生变化时(如节点添加、删除、属性修改等),它会异步触发回调函数。

**核心特点**:

- 异步执行,不会阻塞页面渲染
- 可以监听多种类型的 DOM 变化
- 性能优于传统的 DOM 事件监听

```javascript
// 创建观察器实例
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    console.log("DOM 发生了变化:", mutation.type);
  });
});

// 配置并启动观察
const targetNode = document.getElementById("app");
observer.observe(targetNode, {
  childList: true, // 监听子节点的添加和删除
  attributes: true, // 监听属性变化
  characterData: true, // 监听文本内容变化
});
```

---

## 问题 2：MutationObserver 的基本用法

### 创建观察器

```javascript
const observer = new MutationObserver((mutations, observer) => {
  // mutations: MutationRecord 数组,记录所有变化
  // observer: 观察器实例本身

  mutations.forEach((mutation) => {
    console.log("变化类型:", mutation.type);
    console.log("目标节点:", mutation.target);
  });
});
```

### 配置选项

```javascript
const config = {
  // 1. 监听子节点的添加和删除
  childList: true,

  // 2. 监听属性变化
  attributes: true,

  // 3. 监听文本内容变化
  characterData: true,

  // 4. 监听所有后代节点(不仅是直接子节点)
  subtree: true,

  // 5. 记录属性的旧值
  attributeOldValue: true,

  // 6. 记录文本的旧值
  characterDataOldValue: true,

  // 7. 只监听特定属性(不设置则监听所有属性)
  attributeFilter: ["class", "style"],
};

observer.observe(targetNode, config);
```

### 停止观察

```javascript
// 停止观察
observer.disconnect();

// 清空已记录但未处理的变化
const mutations = observer.takeRecords();
console.log("未处理的变化:", mutations);
```

---

## 问题 3：MutationRecord 对象包含哪些信息

每次 DOM 变化都会生成一个 `MutationRecord` 对象,包含以下属性:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // 1. type: 变化类型
    console.log(mutation.type);
    // 'childList' | 'attributes' | 'characterData'

    // 2. target: 发生变化的节点
    console.log(mutation.target);

    // 3. addedNodes: 新增的节点(NodeList)
    console.log(mutation.addedNodes);

    // 4. removedNodes: 删除的节点(NodeList)
    console.log(mutation.removedNodes);

    // 5. previousSibling: 前一个兄弟节点
    console.log(mutation.previousSibling);

    // 6. nextSibling: 后一个兄弟节点
    console.log(mutation.nextSibling);

    // 7. attributeName: 变化的属性名
    console.log(mutation.attributeName);

    // 8. attributeNamespace: 属性的命名空间
    console.log(mutation.attributeNamespace);

    // 9. oldValue: 旧值(需要配置 attributeOldValue 或 characterDataOldValue)
    console.log(mutation.oldValue);
  });
});
```

**示例**:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      // 处理子节点变化
      mutation.addedNodes.forEach((node) => {
        console.log("新增节点:", node);
      });

      mutation.removedNodes.forEach((node) => {
        console.log("删除节点:", node);
      });
    }

    if (mutation.type === "attributes") {
      // 处理属性变化
      console.log(
        `属性 ${mutation.attributeName} 从 ${
          mutation.oldValue
        } 变为 ${mutation.target.getAttribute(mutation.attributeName)}`
      );
    }

    if (mutation.type === "characterData") {
      // 处理文本变化
      console.log(
        `文本从 ${mutation.oldValue} 变为 ${mutation.target.textContent}`
      );
    }
  });
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
});
```

---

## 问题 4：MutationObserver 的常见使用场景

### 场景 1: 监听元素的添加和删除

```javascript
// 监听动态添加的元素
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // 只处理元素节点
      if (node.nodeType === 1) {
        console.log("新增元素:", node.tagName);

        // 为新增的按钮添加事件监听
        if (node.matches("button")) {
          node.addEventListener("click", handleClick);
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

### 场景 2: 监听属性变化

```javascript
// 监听 class 变化,实现主题切换
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "class") {
      const classList = mutation.target.classList;

      if (classList.contains("dark-mode")) {
        console.log("切换到暗色主题");
        updateTheme("dark");
      } else {
        console.log("切换到亮色主题");
        updateTheme("light");
      }
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});
```

### 场景 3: 监听内容变化

```javascript
// 监听可编辑区域的内容变化
const editor = document.getElementById("editor");

const observer = new MutationObserver((mutations) => {
  // 内容发生变化,自动保存
  const content = editor.textContent;
  localStorage.setItem("draft", content);
  console.log("自动保存:", content);
});

observer.observe(editor, {
  characterData: true,
  childList: true,
  subtree: true,
});
```

### 场景 4: 检测元素是否进入 DOM

```javascript
// 等待某个元素出现在 DOM 中
function waitForElement(selector) {
  return new Promise((resolve) => {
    // 先检查元素是否已存在
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// 使用
waitForElement("#dynamic-element").then((element) => {
  console.log("元素已加载:", element);
  element.classList.add("active");
});
```

### 场景 5: 实现虚拟滚动的可见性检测

```javascript
// 监听滚动容器中元素的可见性
const container = document.getElementById("scroll-container");

const observer = new MutationObserver((mutations) => {
  // 检查新增的元素是否在可视区域
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        const rect = node.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
          // 懒加载图片
          const img = node.querySelector("img[data-src]");
          if (img) {
            img.src = img.dataset.src;
          }
        }
      }
    });
  });
});

observer.observe(container, {
  childList: true,
});
```

---

## 问题 5：MutationObserver 与传统方法的对比

### 1. 与 DOM 事件的对比

```javascript
// ❌ 传统方法:使用 DOMNodeInserted 事件(已废弃)
document.addEventListener(
  "DOMNodeInserted",
  (event) => {
    console.log("节点插入:", event.target);
  },
  false
);

// 缺点:
// - 同步执行,会阻塞页面渲染
// - 性能差,每次插入都触发
// - 已被废弃

// ✅ 使用 MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      console.log("节点插入:", node);
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 优点:
// - 异步执行,不阻塞渲染
// - 批量处理变化,性能更好
// - 标准 API,持续维护
```

### 2. 与定时器轮询的对比

```javascript
// ❌ 传统方法:定时器轮询
let oldValue = element.textContent;
setInterval(() => {
  const newValue = element.textContent;
  if (newValue !== oldValue) {
    console.log("内容变化:", newValue);
    oldValue = newValue;
  }
}, 100);

// 缺点:
// - 浪费资源,即使没有变化也在检查
// - 延迟响应,取决于轮询间隔
// - 难以维护

// ✅ 使用 MutationObserver
const observer = new MutationObserver((mutations) => {
  console.log("内容变化:", element.textContent);
});

observer.observe(element, {
  characterData: true,
  childList: true,
  subtree: true,
});

// 优点:
// - 实时响应,变化时立即触发
// - 不浪费资源
// - 代码简洁
```

### 3. 性能对比

```javascript
// 批量 DOM 操作
const container = document.getElementById("container");

// MutationObserver 只触发一次回调
const observer = new MutationObserver((mutations) => {
  console.log("共 " + mutations.length + " 次变化");
  // 输出: 共 1000 次变化(但只触发一次回调)
});

observer.observe(container, {
  childList: true,
});

// 批量添加 1000 个元素
for (let i = 0; i < 1000; i++) {
  const div = document.createElement("div");
  container.appendChild(div);
}

// MutationObserver 会在微任务队列中批量处理所有变化
// 而 DOMNodeInserted 会同步触发 1000 次
```

## 总结

**核心概念总结**:

### 1. MutationObserver 特点

- 异步执行,不阻塞渲染
- 批量处理 DOM 变化
- 性能优于传统 DOM 事件

### 2. 监听类型

- `childList`: 子节点的添加和删除
- `attributes`: 属性变化
- `characterData`: 文本内容变化
- `subtree`: 监听所有后代节点

### 3. 常见场景

- 监听动态元素的添加
- 监听属性变化(如主题切换)
- 监听内容变化(如自动保存)
- 等待元素出现
- 懒加载实现

### 4. 最佳实践

- 使用 `disconnect()` 及时停止观察
- 使用 `attributeFilter` 限制监听的属性
- 避免在回调中修改被观察的 DOM(可能导致无限循环)

## 延伸阅读

- [MDN - MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)
- [MDN - MutationRecord](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationRecord)
- [DOM Standard - Mutation observers](https://dom.spec.whatwg.org/#mutation-observers)
- [JavaScript.info - Mutation observer](https://javascript.info/mutation-observer)
