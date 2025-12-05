---
title: 如何在 setup 中访问组件实例？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 setup 中无法直接访问 this 的原因，掌握获取组件实例和相关信息的正确方式。
tags:
  - Vue
  - setup
  - getCurrentInstance
  - 组件实例
estimatedTime: 12 分钟
keywords:
  - setup this
  - getCurrentInstance
  - 组件实例
highlight: setup 中无法使用 this，应通过 getCurrentInstance() 或 setup 参数获取所需信息。
order: 206
---

## 问题 1：为什么 setup 中不能用 this？

`setup()` 在组件实例创建之前执行，此时 `this` 是 `undefined`。

```javascript
export default {
  setup() {
    console.log(this); // undefined
  },
  mounted() {
    console.log(this); // 组件实例
  },
};
```

这是设计上的选择：Composition API 鼓励使用**函数式**的方式组织代码，而不是依赖 `this`。

---

## 问题 2：如何获取组件实例？

### 方法一：getCurrentInstance()

```javascript
import { getCurrentInstance, onMounted } from "vue";

export default {
  setup() {
    const instance = getCurrentInstance();

    // ⚠️ 注意：setup 执行时实例还未完全初始化
    console.log(instance.proxy); // 类似 this 的代理对象

    onMounted(() => {
      // 此时实例已完全初始化
      console.log(instance.proxy.$el); // DOM 元素
    });
  },
};
```

### ⚠️ 重要警告

`getCurrentInstance()` 只应用于**高级用例**，如开发库或调试：

```javascript
// ❌ 不推荐：在业务代码中使用
const instance = getCurrentInstance();
instance.proxy.$forceUpdate();

// ✅ 推荐：使用 Composition API 提供的方式
import { ref } from "vue";
const count = ref(0); // 响应式数据自动触发更新
```

---

## 问题 3：setup 参数提供了什么？

大多数情况下，setup 的参数已经足够：

```javascript
export default {
  props: ["title"],
  emits: ["update"],
  setup(props, context) {
    // props：响应式的属性
    console.log(props.title);

    // context.attrs：非 prop 属性
    console.log(context.attrs.class);

    // context.slots：插槽
    const defaultSlot = context.slots.default?.();

    // context.emit：触发事件
    function handleClick() {
      context.emit("update", newValue);
    }

    // context.expose：控制暴露给父组件的内容
    context.expose({
      publicMethod() {
        /* ... */
      },
    });
  },
};
```

### 使用解构简化

```javascript
setup(props, { attrs, slots, emit, expose }) {
  // 直接使用解构后的变量
  emit('update', value)
}
```

---

## 问题 4：如何访问 DOM 元素？

### 使用 ref

```vue
<script setup>
import { ref, onMounted } from "vue";

const inputRef = ref(null);

onMounted(() => {
  // 访问 DOM 元素
  inputRef.value.focus();
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

### 使用 useTemplateRef（Vue 3.5+）

```vue
<script setup>
import { useTemplateRef, onMounted } from "vue";

const input = useTemplateRef("input");

onMounted(() => {
  input.value.focus();
});
</script>

<template>
  <input ref="input" />
</template>
```

---

## 问题 5：如何访问父/子组件？

### 访问子组件

```vue
<script setup>
import { ref } from "vue";
import ChildComponent from "./Child.vue";

const childRef = ref(null);

function callChildMethod() {
  // 调用子组件暴露的方法
  childRef.value.someMethod();
}
</script>

<template>
  <ChildComponent ref="childRef" />
</template>
```

子组件需要使用 `expose` 暴露方法：

```vue
<!-- Child.vue -->
<script setup>
defineExpose({
  someMethod() {
    console.log("被父组件调用");
  },
});
</script>
```

### 访问父组件（不推荐）

```javascript
import { getCurrentInstance } from 'vue'

setup() {
  const instance = getCurrentInstance()
  // ⚠️ 不推荐，破坏组件封装性
  const parent = instance.parent
}
```

更好的方式是使用 **props/emit** 或 **provide/inject**。

## 延伸阅读

- [Vue 官方文档 - getCurrentInstance](https://cn.vuejs.org/api/composition-api-helpers.html#getcurrentinstance)
- [Vue 官方文档 - 模板引用](https://cn.vuejs.org/guide/essentials/template-refs.html)
