---
title: Vue 组件之间的通信方式有哪些
category: Vue
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  全面介绍 Vue 组件间通信的各种方式，包括 props/emit、provide/inject、Vuex/Pinia、事件总线等，掌握不同场景下的最佳实践。
tags:
  - Vue
  - 组件通信
  - Props
  - Emit
  - Provide/Inject
estimatedTime: 25 分钟
keywords:
  - Vue 组件通信
  - Props Emit
  - Provide Inject
  - 状态管理
highlight: 掌握 Vue 组件通信的所有方式，理解不同场景的最佳选择
order: 19
---

## 问题 1：父子组件通信有哪些方式？

### 方式 1：Props / Emit（最常用）

```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const message = ref('Hello from parent');
const count = ref(0);

const handleUpdate = (newCount) => {
  count.value = newCount;
  console.log('Count updated:', newCount);
};
</script>

<template>
  <div>
    <h2>Parent Component</h2>
    <p>Count: {{ count }}</p>
    
    <!-- ✅ 通过 props 传递数据给子组件 -->
    <ChildComponent
      :message="message"
      :count="count"
      @update="handleUpdate"
    />
  </div>
</template>

<!-- 子组件 -->
<script setup>
// ✅ 接收 props
const props = defineProps({
  message: String,
  count: Number
});

// ✅ 定义 emits
const emit = defineEmits(['update']);

const increment = () => {
  // 向父组件发送事件
  emit('update', props.count + 1);
};
</script>

<template>
  <div>
    <h3>Child Component</h3>
    <p>{{ message }}</p>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### 方式 2：v-model（双向绑定）

```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import CustomInput from './CustomInput.vue';

const text = ref('');
</script>

<template>
  <div>
    <!-- ✅ v-model 语法糖 -->
    <CustomInput v-model="text" />
    <p>Text: {{ text }}</p>
  </div>
</template>

<!-- 子组件 CustomInput.vue -->
<script setup>
// ✅ v-model 的实现
const props = defineProps({
  modelValue: String
});

const emit = defineEmits(['update:modelValue']);

const updateValue = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <input
    :value="modelValue"
    @input="updateValue"
    placeholder="Type something..."
  />
</template>

<!-- 多个 v-model -->
<script setup>
// 父组件
const firstName = ref('');
const lastName = ref('');
</script>

<template>
  <UserForm
    v-model:first-name="firstName"
    v-model:last-name="lastName"
  />
</template>

<!-- UserForm.vue -->
<script setup>
const props = defineProps({
  firstName: String,
  lastName: String
});

const emit = defineEmits(['update:firstName', 'update:lastName']);
</script>

<template>
  <div>
    <input
      :value="firstName"
      @input="emit('update:firstName', $event.target.value)"
    />
    <input
      :value="lastName"
      @input="emit('update:lastName', $event.target.value)"
    />
  </div>
</template>
```

### 方式 3：Ref 访问子组件

```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import ChildComponent from './ChildComponent.vue';

const childRef = ref(null);

const callChildMethod = () => {
  // ✅ 直接调用子组件的方法
  childRef.value?.reset();
  console.log(childRef.value?.count);
};
</script>

<template>
  <div>
    <ChildComponent ref="childRef" />
    <button @click="callChildMethod">Call Child Method</button>
  </div>
</template>

<!-- 子组件 -->
<script setup>
import { ref } from 'vue';

const count = ref(0);

const increment = () => {
  count.value++;
};

const reset = () => {
  count.value = 0;
};

// ✅ 暴露给父组件的方法和属性
defineExpose({
  count,
  reset
});
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

---

## 问题 2：跨层级组件通信有哪些方式？

### 方式 1：Provide / Inject

```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue';

const theme = ref('dark');
const user = ref({
  name: 'John',
  role: 'admin'
});

// ✅ 提供数据
provide('theme', theme);
provide('user', user);

// 提供方法
const updateTheme = (newTheme) => {
  theme.value = newTheme;
};
provide('updateTheme', updateTheme);
</script>

<template>
  <div :class="`theme-${theme}`">
    <MiddleComponent />
  </div>
</template>

<!-- 中间组件（不需要传递 props） -->
<template>
  <div>
    <DeepComponent />
  </div>
</template>

<!-- 深层子组件 -->
<script setup>
import { inject } from 'vue';

// ✅ 注入数据
const theme = inject('theme');
const user = inject('user');
const updateTheme = inject('updateTheme');

// 提供默认值
const config = inject('config', { timeout: 3000 });

const toggleTheme = () => {
  updateTheme(theme.value === 'dark' ? 'light' : 'dark');
};
</script>

<template>
  <div>
    <p>Theme: {{ theme }}</p>
    <p>User: {{ user.name }} ({{ user.role }})</p>
    <button @click="toggleTheme">Toggle Theme</button>
  </div>
</template>
```

### 方式 2：Vuex / Pinia（状态管理）

```javascript
// stores/counter.js (Pinia)
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    user: null
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++;
    },
    
    async fetchUser(id) {
      const response = await fetch(`/api/users/${id}`);
      this.user = await response.json();
    }
  }
});

// 组件 A
<script setup>
import { useCounterStore } from '@/stores/counter';

const store = useCounterStore();

const handleClick = () => {
  store.increment();
};
</script>

<template>
  <div>
    <p>Count: {{ store.count }}</p>
    <p>Double: {{ store.doubleCount }}</p>
    <button @click="handleClick">Increment</button>
  </div>
</template>

// 组件 B（任何位置）
<script setup>
import { useCounterStore } from '@/stores/counter';
import { storeToRefs } from 'pinia';

const store = useCounterStore();

// ✅ 使用 storeToRefs 保持响应式
const { count, doubleCount } = storeToRefs(store);
</script>

<template>
  <div>
    <p>Count from B: {{ count }}</p>
  </div>
</template>
```

---

## 问题 3：兄弟组件通信有哪些方式？

### 方式 1：通过父组件中转

```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue';
import ComponentA from './ComponentA.vue';
import ComponentB from './ComponentB.vue';

const sharedData = ref('');

const handleDataFromA = (data) => {
  sharedData.value = data;
};
</script>

<template>
  <div>
    <ComponentA @send-data="handleDataFromA" />
    <ComponentB :data="sharedData" />
  </div>
</template>

<!-- ComponentA.vue -->
<script setup>
const emit = defineEmits(['sendData']);

const sendToB = () => {
  emit('sendData', 'Hello from A');
};
</script>

<template>
  <button @click="sendToB">Send to B</button>
</template>

<!-- ComponentB.vue -->
<script setup>
const props = defineProps({
  data: String
});
</script>

<template>
  <div>Data from A: {{ data }}</div>
</template>
```

### 方式 2：事件总线（Vue 3 需要第三方库）

```javascript
// eventBus.js
import mitt from 'mitt';

export const eventBus = mitt();

// ComponentA.vue
<script setup>
import { eventBus } from './eventBus';

const sendMessage = () => {
  eventBus.emit('message', 'Hello from A');
};
</script>

<template>
  <button @click="sendMessage">Send Message</button>
</template>

// ComponentB.vue
<script setup>
import { onMounted, onUnmounted } from 'vue';
import { eventBus } from './eventBus';

const handleMessage = (data) => {
  console.log('Received:', data);
};

onMounted(() => {
  eventBus.on('message', handleMessage);
});

onUnmounted(() => {
  eventBus.off('message', handleMessage);
});
</script>
```

### 方式 3：使用 Pinia 共享状态

```javascript
// stores/shared.js
import { defineStore } from 'pinia';

export const useSharedStore = defineStore('shared', {
  state: () => ({
    message: ''
  }),
  
  actions: {
    setMessage(msg) {
      this.message = msg;
    }
  }
});

// ComponentA.vue
<script setup>
import { useSharedStore } from '@/stores/shared';

const store = useSharedStore();

const sendMessage = () => {
  store.setMessage('Hello from A');
};
</script>

// ComponentB.vue
<script setup>
import { useSharedStore } from '@/stores/shared';
import { storeToRefs } from 'pinia';

const store = useSharedStore();
const { message } = storeToRefs(store);
</script>

<template>
  <div>Message: {{ message }}</div>
</template>
```

---

## 问题 4：不同场景应该选择哪种通信方式？

### 场景选择指南

```javascript
// 1. 父子组件通信
// ✅ 首选：Props / Emit
// 适用：大多数父子组件通信场景

// 2. 双向绑定
// ✅ 首选：v-model
// 适用：表单组件、自定义输入组件

// 3. 访问子组件实例
// ✅ 首选：Ref + defineExpose
// 适用：需要调用子组件方法的场景

// 4. 跨多层组件通信
// ✅ 首选：Provide / Inject
// 适用：主题、配置、用户信息等跨层传递

// 5. 全局状态管理
// ✅ 首选：Pinia / Vuex
// 适用：复杂应用、多组件共享状态

// 6. 兄弟组件通信
// ✅ 首选：通过父组件中转（简单场景）
// ✅ 次选：Pinia（复杂场景）
// ❌ 避免：事件总线（难以维护）
```

### 实际应用示例

```vue
<!-- 示例：表单组件通信 -->
<script setup>
import { ref, provide } from 'vue';

// 表单级别的状态
const formData = ref({});
const errors = ref({});

// ✅ 使用 provide 向所有表单项提供上下文
provide('formContext', {
  formData,
  errors,
  updateField: (name, value) => {
    formData.value[name] = value;
  },
  setError: (name, error) => {
    errors.value[name] = error;
  }
});
</script>

<template>
  <form>
    <FormInput name="username" label="Username" />
    <FormInput name="email" label="Email" type="email" />
    <FormInput name="password" label="Password" type="password" />
  </form>
</template>

<!-- FormInput.vue -->
<script setup>
import { inject, computed } from 'vue';

const props = defineProps({
  name: String,
  label: String,
  type: { type: String, default: 'text' }
});

// ✅ 注入表单上下文
const formContext = inject('formContext');

const value = computed({
  get: () => formContext.formData.value[props.name] || '',
  set: (val) => formContext.updateField(props.name, val)
});

const error = computed(() => formContext.errors.value[props.name]);
</script>

<template>
  <div class="form-input">
    <label>{{ label }}</label>
    <input v-model="value" :type="type" />
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>
```

---

## 总结

**通信方式总结**：

### 1. 父子组件

- **Props / Emit**：最常用，单向数据流
- **v-model**：双向绑定，适合表单组件
- **Ref**：直接访问子组件实例

### 2. 跨层级组件

- **Provide / Inject**：依赖注入，适合配置传递
- **Pinia / Vuex**：全局状态管理

### 3. 兄弟组件

- **父组件中转**：简单场景
- **Pinia**：复杂场景
- **事件总线**：不推荐（难维护）

### 4. 选择建议

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 父传子 | Props | 单向数据流，清晰 |
| 子传父 | Emit | 事件机制，解耦 |
| 双向绑定 | v-model | 语法糖，简洁 |
| 跨层传递 | Provide/Inject | 避免 props 层层传递 |
| 全局状态 | Pinia | 类型安全，DevTools 支持 |
| 兄弟通信 | 父组件中转 | 简单直接 |

### 5. 最佳实践

- 优先使用 Props/Emit
- 避免过度使用全局状态
- 合理使用 Provide/Inject
- 保持数据流向清晰
- 避免循环依赖

## 延伸阅读

- [Vue 官方文档 - 组件通信](https://cn.vuejs.org/guide/components/events.html)
- [Vue 官方文档 - Provide / Inject](https://cn.vuejs.org/guide/components/provide-inject.html)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [mitt - 事件总线库](https://github.com/developit/mitt)
