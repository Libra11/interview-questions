---
title: 生命周期钩子在 setup 中如何使用？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Composition API 中生命周期钩子的使用方式，理解与 Options API 的对应关系。
tags:
  - Vue
  - 生命周期
  - setup
  - Composition API
estimatedTime: 12 分钟
keywords:
  - 生命周期钩子
  - onMounted
  - setup 生命周期
highlight: Composition API 提供 onXxx 形式的生命周期函数，可在 setup 中多次调用。
order: 472
---

## 问题 1：生命周期钩子的对应关系

| Options API   | Composition API      |
| ------------- | -------------------- |
| beforeCreate  | 不需要（setup 本身） |
| created       | 不需要（setup 本身） |
| beforeMount   | onBeforeMount        |
| mounted       | onMounted            |
| beforeUpdate  | onBeforeUpdate       |
| updated       | onUpdated            |
| beforeUnmount | onBeforeUnmount      |
| unmounted     | onUnmounted          |

### 为什么没有 onBeforeCreate 和 onCreated？

因为 `setup()` 本身就在这两个阶段之间执行：

```javascript
export default {
  setup() {
    // 这里的代码相当于 beforeCreate 和 created 之间
    console.log("setup 执行");

    // 初始化逻辑直接写在这里
    const data = ref(null);
    fetchData().then((res) => (data.value = res));
  },
};
```

---

## 问题 2：基本使用方式

```javascript
import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
} from "vue";

export default {
  setup() {
    onBeforeMount(() => {
      console.log("DOM 挂载前");
    });

    onMounted(() => {
      console.log("DOM 已挂载");
      // 可以访问 DOM
    });

    onBeforeUpdate(() => {
      console.log("DOM 更新前");
    });

    onUpdated(() => {
      console.log("DOM 已更新");
    });

    onBeforeUnmount(() => {
      console.log("组件卸载前");
    });

    onUnmounted(() => {
      console.log("组件已卸载");
      // 清理副作用
    });
  },
};
```

---

## 问题 3：可以多次调用同一个钩子

这是 Composition API 的优势之一：

```javascript
setup() {
  // 功能 A 的清理逻辑
  onUnmounted(() => {
    clearInterval(timerA)
  })

  // 功能 B 的清理逻辑
  onUnmounted(() => {
    unsubscribe()
  })

  // 功能 C 的清理逻辑
  onUnmounted(() => {
    socket.close()
  })
}
```

### 在 composable 中使用

```javascript
// useEventListener.js
export function useEventListener(target, event, callback) {
  onMounted(() => {
    target.addEventListener(event, callback)
  })

  onUnmounted(() => {
    target.removeEventListener(event, callback)
  })
}

// 组件中使用
setup() {
  useEventListener(window, 'resize', handleResize)
  useEventListener(document, 'click', handleClick)
  // 每个 composable 都注册自己的清理逻辑
}
```

---

## 问题 4：`<script setup>` 中的使用

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const data = ref(null);

onMounted(async () => {
  data.value = await fetchData();
});

onUnmounted(() => {
  // 清理逻辑
});
</script>
```

---

## 问题 5：特殊的生命周期钩子

### onErrorCaptured

捕获后代组件的错误：

```javascript
import { onErrorCaptured } from 'vue'

setup() {
  onErrorCaptured((err, instance, info) => {
    console.error('捕获到错误:', err)
    // 返回 false 阻止错误继续传播
    return false
  })
}
```

### onRenderTracked / onRenderTriggered

调试用，追踪渲染依赖：

```javascript
import { onRenderTracked, onRenderTriggered } from 'vue'

setup() {
  // 开发模式下有效
  onRenderTracked((event) => {
    console.log('依赖被追踪:', event)
  })

  onRenderTriggered((event) => {
    console.log('触发重新渲染:', event)
  })
}
```

### onActivated / onDeactivated

配合 `<KeepAlive>` 使用：

```javascript
import { onActivated, onDeactivated } from 'vue'

setup() {
  onActivated(() => {
    console.log('组件被激活')
    // 恢复状态、重新获取数据等
  })

  onDeactivated(() => {
    console.log('组件被缓存')
    // 暂停定时器等
  })
}
```

---

## 问题 6：执行顺序

```javascript
setup() {
  console.log('1. setup')

  onBeforeMount(() => console.log('2. onBeforeMount'))
  onMounted(() => console.log('3. onMounted'))
}

// 输出顺序：
// 1. setup
// 2. onBeforeMount
// 3. onMounted
```

### 父子组件的执行顺序

```
父 setup
父 onBeforeMount
  子 setup
  子 onBeforeMount
  子 onMounted
父 onMounted
```

## 延伸阅读

- [Vue 官方文档 - 生命周期钩子](https://cn.vuejs.org/api/composition-api-lifecycle.html)
- [Vue 官方文档 - 组件生命周期图示](https://cn.vuejs.org/guide/essentials/lifecycle.html)
