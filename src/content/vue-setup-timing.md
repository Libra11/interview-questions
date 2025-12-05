---
title: setup() 的执行时机是什么？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 setup() 函数在组件生命周期中的执行时机，掌握它与其他生命周期钩子的关系。
tags:
  - Vue
  - setup
  - 生命周期
  - Composition API
estimatedTime: 12 分钟
keywords:
  - setup 执行时机
  - vue setup
  - 组件初始化
highlight: setup() 在 beforeCreate 之前执行，此时组件实例尚未创建，无法访问 this。
order: 203
---

## 问题 1：setup() 在什么时候执行？

`setup()` 在组件实例创建之前执行，具体来说是在 `beforeCreate` 钩子之前。

### 执行顺序

```javascript
export default {
  beforeCreate() {
    console.log("2. beforeCreate");
  },
  created() {
    console.log("3. created");
  },
  setup() {
    console.log("1. setup"); // 最先执行
    return {};
  },
};

// 输出顺序：
// 1. setup
// 2. beforeCreate
// 3. created
```

### 完整的生命周期顺序

```
setup()           ← 最先执行
    ↓
beforeCreate
    ↓
created
    ↓
beforeMount
    ↓
mounted
```

---

## 问题 2：为什么 setup() 中不能访问 this？

因为 `setup()` 执行时，组件实例**还没有创建**。

```javascript
export default {
  data() {
    return { count: 0 };
  },
  setup() {
    console.log(this); // undefined
    // 此时 data、computed、methods 都还不存在
  },
};
```

### 如何访问组件相关信息？

通过 `setup()` 的参数获取：

```javascript
export default {
  props: ["title"],
  setup(props, context) {
    // props：父组件传递的属性
    console.log(props.title);

    // context.attrs：非 prop 的属性
    // context.slots：插槽
    // context.emit：触发事件的方法
    // context.expose：暴露公共方法
  },
};
```

---

## 问题 3：setup() 的两个参数

### 参数一：props

```javascript
export default {
  props: {
    message: String,
    count: Number,
  },
  setup(props) {
    // props 是响应式的
    console.log(props.message);

    // ⚠️ 不要解构 props，会丢失响应性
    // const { message } = props  // 错误

    // 使用 toRefs 保持响应性
    const { message } = toRefs(props);
  },
};
```

### 参数二：context

```javascript
export default {
  setup(props, { attrs, slots, emit, expose }) {
    // attrs：非 prop 属性（class、style、事件监听器等）
    console.log(attrs.class);

    // slots：插槽内容
    const defaultSlot = slots.default?.();

    // emit：触发自定义事件
    function handleClick() {
      emit("update", newValue);
    }

    // expose：限制组件暴露的内容
    expose({
      publicMethod() {
        /* ... */
      },
    });
  },
};
```

---

## 问题 4：setup() 的返回值

### 返回对象

返回的对象属性可以在模板中使用：

```javascript
export default {
  setup() {
    const count = ref(0);
    const increment = () => count.value++;

    // 返回给模板使用
    return {
      count,
      increment,
    };
  },
};
```

```html
<template>
  <button @click="increment">{{ count }}</button>
</template>
```

### 返回渲染函数

也可以直接返回渲染函数：

```javascript
import { h, ref } from "vue";

export default {
  setup() {
    const count = ref(0);

    // 返回渲染函数，完全控制渲染逻辑
    return () => h("div", count.value);
  },
};
```

---

## 问题 5：`<script setup>` 语法糖

Vue 3.2+ 提供了更简洁的写法：

```vue
<script setup>
import { ref } from "vue";

// 顶层变量自动暴露给模板
const count = ref(0);
const increment = () => count.value++;

// props 和 emit 使用编译器宏
const props = defineProps(["title"]);
const emit = defineEmits(["update"]);
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

### `<script setup>` 的执行时机

与 `setup()` 相同，在组件实例创建之前执行。编译后本质上就是 `setup()` 函数的内容。

## 延伸阅读

- [Vue 官方文档 - setup()](https://cn.vuejs.org/api/composition-api-setup.html)
- [Vue 官方文档 - `<script setup>`](https://cn.vuejs.org/api/sfc-script-setup.html)
