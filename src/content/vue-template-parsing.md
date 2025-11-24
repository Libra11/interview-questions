---
title: Vue 是怎么解析 template 的
category: Vue
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入理解 Vue 模板编译的完整流程，从模板字符串到渲染函数的转换过程。
  掌握编译原理有助于理解 Vue 的工作机制和性能优化。
tags:
  - Vue
  - 模板编译
  - 编译器
  - AST
estimatedTime: 26 分钟
keywords:
  - Vue 模板编译
  - template 解析
  - AST
  - 渲染函数
highlight: Vue 模板编译经历解析、优化、生成三个阶段，最终转换为渲染函数
order: 105
---

## 问题 1：Vue 模板编译的整体流程是什么？

**Vue 模板编译分为三个主要阶段：解析（Parse）、优化（Optimize）、生成（Generate）**。

### 编译流程图

```
模板字符串
    ↓
解析（Parse）
    ↓
抽象语法树（AST）
    ↓
优化（Optimize）
    ↓
优化后的 AST
    ↓
生成（Generate）
    ↓
渲染函数代码
```

### 简化的编译过程

```javascript
// 1. 模板字符串
const template = `
  <div id="app">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
  </div>
`;

// 2. 编译成渲染函数
const render = compile(template);

// 3. 渲染函数大致如下
function render() {
  return h('div', { id: 'app' }, [
    h('h1', this.title),
    h('p', this.message)
  ]);
}
```

---

## 问题 2：解析（Parse）阶段做了什么？

**解析阶段将模板字符串转换成抽象语法树（AST）**。

### 解析过程

```javascript
// 模板字符串
const template = '<div id="app"><span>{{ msg }}</span></div>';

// 解析后的 AST（简化版）
const ast = {
  type: 1,              // 元素节点
  tag: 'div',
  attrsList: [
    { name: 'id', value: 'app' }
  ],
  children: [
    {
      type: 1,
      tag: 'span',
      children: [
        {
          type: 2,      // 表达式节点
          expression: '_s(msg)',
          text: '{{ msg }}'
        }
      ]
    }
  ]
};
```

### 词法分析

```javascript
// 使用正则表达式匹配不同的标记
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

// 解析开始标签
function parseStartTag() {
  const start = html.match(startTagOpen);
  if (start) {
    const match = {
      tagName: start[1],
      attrs: []
    };
    // 解析属性
    // ...
    return match;
  }
}
```

### 语法分析

```javascript
// 构建 AST 树
function parse(template) {
  const stack = [];
  let currentParent;
  let root;

  parseHTML(template, {
    start(tag, attrs, unary) {
      // 创建 AST 元素
      const element = createASTElement(tag, attrs, currentParent);
      
      if (!root) {
        root = element;
      }
      
      if (currentParent) {
        currentParent.children.push(element);
        element.parent = currentParent;
      }
      
      if (!unary) {
        currentParent = element;
        stack.push(element);
      }
    },
    
    end() {
      // 闭合标签，出栈
      stack.pop();
      currentParent = stack[stack.length - 1];
    },
    
    chars(text) {
      // 处理文本节点
      if (text.trim()) {
        currentParent.children.push({
          type: 3,
          text
        });
      }
    }
  });

  return root;
}
```

---

## 问题 3：优化（Optimize）阶段做了什么？

**优化阶段标记静态节点和静态根节点，提升渲染性能**。

### 为什么需要优化

```vue
<template>
  <div>
    <!-- 静态节点：内容永远不变 -->
    <h1>标题</h1>
    <p>这是静态内容</p>
    
    <!-- 动态节点：内容会变化 -->
    <span>{{ message }}</span>
  </div>
</template>
```

静态节点在更新时可以跳过 diff 过程，直接复用。

### 标记静态节点

```javascript
function markStatic(node) {
  // 判断节点是否是静态的
  node.static = isStatic(node);
  
  if (node.type === 1) {
    // 遍历子节点
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      markStatic(child);
      
      // 如果子节点不是静态的，父节点也不是静态的
      if (!child.static) {
        node.static = false;
      }
    }
  }
}

function isStatic(node) {
  if (node.type === 2) {
    // 表达式节点，不是静态的
    return false;
  }
  if (node.type === 3) {
    // 纯文本节点，是静态的
    return true;
  }
  
  // 元素节点需要满足以下条件
  return !!(
    !node.hasBindings &&           // 没有动态绑定
    !node.if && !node.for &&       // 没有 v-if 或 v-for
    !isBuiltInTag(node.tag) &&     // 不是内置标签
    !isComponent(node) &&          // 不是组件
    Object.keys(node).every(key => {
      return isStaticKey(key);     // 所有属性都是静态的
    })
  );
}
```

### 标记静态根节点

```javascript
function markStaticRoots(node) {
  if (node.type === 1) {
    // 节点本身是静态的，且有子节点
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      // 标记为静态根节点
      node.staticRoot = true;
      return;
    } else {
      node.staticRoot = false;
    }
    
    // 递归处理子节点
    for (let i = 0; i < node.children.length; i++) {
      markStaticRoots(node.children[i]);
    }
  }
}
```

---

## 问题 4：生成（Generate）阶段做了什么？

**生成阶段将 AST 转换成渲染函数的代码字符串**。

### 生成渲染函数

```javascript
// AST 节点
const ast = {
  type: 1,
  tag: 'div',
  attrsList: [{ name: 'id', value: 'app' }],
  children: [
    {
      type: 1,
      tag: 'span',
      children: [
        { type: 2, expression: '_s(msg)' }
      ]
    }
  ]
};

// 生成的代码字符串
const code = generate(ast);
// "_c('div',{attrs:{"id":"app"}},[_c('span',[_v(_s(msg))])])"

// 最终的渲染函数
function render() {
  with(this) {
    return _c('div', {attrs:{"id":"app"}}, [
      _c('span', [_v(_s(msg))])
    ]);
  }
}
```

### 代码生成函数

```javascript
function generate(ast) {
  const code = genElement(ast);
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: []
  };
}

function genElement(el) {
  if (el.staticRoot && !el.staticProcessed) {
    // 静态根节点
    return genStatic(el);
  } else if (el.for && !el.forProcessed) {
    // v-for 节点
    return genFor(el);
  } else if (el.if && !el.ifProcessed) {
    // v-if 节点
    return genIf(el);
  } else {
    // 普通元素
    const data = genData(el);
    const children = genChildren(el);
    return `_c('${el.tag}'${
      data ? `,${data}` : ''
    }${
      children ? `,${children}` : ''
    })`;
  }
}
```

### 处理指令

```javascript
// 处理 v-for
function genFor(el) {
  const exp = el.for;
  const alias = el.alias;
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : '';
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : '';

  return `_l((${exp}),function(${alias}${iterator1}${iterator2}){
    return ${genElement(el)}
  })`;
}

// v-for="item in items" 生成：
// _l((items),function(item){return _c('div',[_v(_s(item))])})

// 处理 v-if
function genIf(el) {
  el.ifProcessed = true;
  return genIfConditions(el.ifConditions.slice());
}

function genIfConditions(conditions) {
  if (!conditions.length) {
    return '_e()'; // 空节点
  }

  const condition = conditions.shift();
  if (condition.exp) {
    return `(${condition.exp})?${
      genElement(condition.block)
    }:${
      genIfConditions(conditions)
    }`;
  }
}

// v-if="show" 生成：
// (show)?_c('div'):_e()
```

---

## 问题 5：渲染函数中的辅助函数是什么？

**Vue 在渲染函数中使用了一些简写的辅助函数来创建 VNode**。

### 常用辅助函数

```javascript
// _c: createElement - 创建元素 VNode
_c('div', { attrs: { id: 'app' } }, [...])

// _v: createTextVNode - 创建文本 VNode
_v("Hello")

// _s: toString - 转换为字符串
_s(message)  // 相当于 String(message)

// _l: renderList - 渲染列表
_l(items, function(item) { return _c('div', [_v(_s(item))]) })

// _e: createEmptyVNode - 创建空 VNode
_e()

// _t: renderSlot - 渲染插槽
_t('default')

// _m: renderStatic - 渲染静态节点
_m(0)  // 渲染第 0 个静态节点
```

### 完整示例

```vue
<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    <p v-if="show">显示</p>
  </div>
</template>

<!-- 编译后的渲染函数 -->
<script>
function render() {
  with(this) {
    return _c('div', { attrs: { "id": "app" } }, [
      _c('h1', [_v(_s(title))]),
      _c('ul', _l((items), function(item) {
        return _c('li', { key: item.id }, [
          _v(_s(item.name))
        ])
      }), 0),
      (show) ? _c('p', [_v("显示")]) : _e()
    ])
  }
}
</script>
```

---

## 问题 6：编译时机有哪些？

**Vue 模板编译可以在运行时或构建时进行**。

### 运行时编译

```javascript
// 使用完整版 Vue（包含编译器）
import Vue from 'vue/dist/vue.esm.js';

new Vue({
  el: '#app',
  // 模板在浏览器中编译
  template: '<div>{{ message }}</div>',
  data: {
    message: 'Hello'
  }
});
```

### 构建时编译（推荐）

```vue
<!-- 单文件组件 -->
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
```

```javascript
// 构建工具（Vite/Webpack）在打包时编译
// 最终打包的代码只包含渲染函数，不包含编译器
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

### 两种方式的对比

| 特性 | 运行时编译 | 构建时编译 |
|------|-----------|-----------|
| 包体积 | 大（包含编译器） | 小（不包含编译器） |
| 性能 | 首次渲染慢 | 首次渲染快 |
| 灵活性 | 可动态编译模板 | 模板固定 |
| 推荐度 | 不推荐 | 推荐 |

---

## 总结

**核心流程**：

### 1. 解析阶段（Parse）
- 词法分析：识别标签、属性、文本
- 语法分析：构建 AST 树
- 处理指令和表达式

### 2. 优化阶段（Optimize）
- 标记静态节点
- 标记静态根节点
- 提升渲染性能

### 3. 生成阶段（Generate）
- 将 AST 转换为代码字符串
- 生成渲染函数
- 处理各种指令

### 4. 辅助函数
- `_c`: 创建元素
- `_v`: 创建文本
- `_s`: 转字符串
- `_l`: 渲染列表

### 5. 编译时机
- 运行时编译：灵活但体积大
- 构建时编译：性能好且体积小（推荐）

## 延伸阅读

- [Vue 模板编译原理](https://vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 编译器源码](https://github.com/vuejs/core/tree/main/packages/compiler-core)
- [Vue 3 模板编译在线工具](https://template-explorer.vuejs.org/)
- [深入理解 Vue 编译器](https://vue-compiler.iamouyang.cn/)
