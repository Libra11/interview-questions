---
title: Vue ref、toRef 和 toRefs 有啥区别
category: Vue
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 Vue 3 中 ref、toRef 和 toRefs 的区别和使用场景，掌握如何在不同情况下正确使用这些响应式 API。
tags:
  - Vue
  - ref
  - toRef
  - toRefs
  - 响应式
estimatedTime: 20 分钟
keywords:
  - Vue ref
  - toRef
  - toRefs
  - 响应式系统
highlight: 掌握 ref、toRef 和 toRefs 的核心区别，理解响应式引用的创建和转换
order: 12
---

## 问题 1：ref、toRef 和 toRefs 分别是什么？

### ref：创建响应式引用

`ref` 用于创建一个响应式的引用对象。

```vue
<script setup>
import { ref } from 'vue';

// 创建基本类型的响应式引用
const count = ref(0);
console.log(count.value); // 0

count.value++; // 修改值
console.log(count.value); // 1

// 创建对象的响应式引用
const user = ref({
  name: 'John',
  age: 25
});

console.log(user.value.name); // 'John'
user.value.name = 'Jane'; // 修改对象属性
</script>
```

### toRef：创建对响应式对象属性的引用

`toRef` 用于为响应式对象的某个属性创建一个 ref。

```vue
<script setup>
import { reactive, toRef } from 'vue';

const state = reactive({
  count: 0,
  name: 'John'
});

// 创建对 state.count 的引用
const countRef = toRef(state, 'count');

console.log(countRef.value); // 0

// 修改 countRef 会影响原对象
countRef.value++;
console.log(state.count); // 1

// 修改原对象也会影响 countRef
state.count++;
console.log(countRef.value); // 2
</script>
```

### toRefs：将响应式对象的所有属性转换为 ref

`toRefs` 用于将响应式对象的所有属性都转换为 ref。

```vue
<script setup>
import { reactive, toRefs } from 'vue';

const state = reactive({
  count: 0,
  name: 'John',
  age: 25
});

// 将所有属性转换为 ref
const stateRefs = toRefs(state);

console.log(stateRefs.count.value); // 0
console.log(stateRefs.name.value);  // 'John'

// 修改 ref 会影响原对象
stateRefs.count.value++;
console.log(state.count); // 1
</script>
```

---

## 问题 2：它们之间有什么区别？

### 核心区别对比

```vue
<script setup>
import { ref, reactive, toRef, toRefs } from 'vue';

// 1. ref：创建新的响应式引用
const count1 = ref(0);
// 独立的响应式数据，不依赖其他对象

// 2. toRef：创建对现有响应式对象属性的引用
const state = reactive({ count: 0 });
const count2 = toRef(state, 'count');
// count2 和 state.count 指向同一个值，保持同步

// 3. toRefs：批量创建引用
const stateRefs = toRefs(state);
// 将 state 的所有属性都转换为 ref
</script>
```

### 响应式连接的区别

```vue
<script setup>
import { ref, reactive, toRef, toRefs } from 'vue';

// ref：独立的响应式数据
const count = ref(0);
const obj = { value: 10 };
// count 和 obj 没有关系

// toRef：保持与源对象的响应式连接
const state = reactive({
  count: 0
});

const countRef = toRef(state, 'count');

// ✅ 双向同步
countRef.value = 10;
console.log(state.count); // 10

state.count = 20;
console.log(countRef.value); // 20

// toRefs：批量保持响应式连接
const { count: countRef2, name: nameRef } = toRefs(state);
// 所有属性都保持与源对象的连接
</script>
```

### 解构时的区别

```vue
<script setup>
import { reactive, toRefs } from 'vue';

const state = reactive({
  count: 0,
  name: 'John'
});

// ❌ 直接解构会失去响应式
const { count, name } = state;
count++; // 不会触发更新
console.log(state.count); // 0（没有变化）

// ✅ 使用 toRefs 解构保持响应式
const { count: countRef, name: nameRef } = toRefs(state);
countRef.value++; // 会触发更新
console.log(state.count); // 1（已更新）
</script>
```

---

## 问题 3：各自的使用场景是什么？

### ref 的使用场景

```vue
<script setup>
import { ref } from 'vue';

// 场景 1：组件的本地状态
const count = ref(0);
const isOpen = ref(false);
const message = ref('Hello');

// 场景 2：DOM 元素引用
const inputRef = ref(null);

onMounted(() => {
  inputRef.value?.focus();
});

// 场景 3：独立的响应式数据
const user = ref({
  name: 'John',
  age: 25
});

// 场景 4：组合式函数的返回值
function useCounter() {
  const count = ref(0);
  const increment = () => count.value++;
  
  return { count, increment };
}
</script>

<template>
  <input ref="inputRef" v-model="message" />
  <button @click="count++">{{ count }}</button>
</template>
```

### toRef 的使用场景

```vue
<script setup>
import { reactive, toRef } from 'vue';

// 场景 1：从 props 创建响应式引用
const props = defineProps({
  count: Number
});

// ✅ 保持与 props 的响应式连接
const countRef = toRef(props, 'count');

// 场景 2：从 reactive 对象中提取单个属性
const state = reactive({
  user: {
    name: 'John',
    age: 25
  },
  settings: {
    theme: 'dark'
  }
});

// 只需要 theme 属性
const theme = toRef(state.settings, 'theme');

// 场景 3：可选的响应式引用
const maybeReactive = toRef(someObject, 'property');
// 如果 someObject 不是响应式的，toRef 会创建一个普通的 ref
</script>
```

### toRefs 的使用场景

```vue
<script setup>
import { reactive, toRefs } from 'vue';

// 场景 1：组合式函数返回响应式对象
function useUser() {
  const state = reactive({
    user: null,
    loading: false,
    error: null
  });
  
  const fetchUser = async (id) => {
    state.loading = true;
    try {
      state.user = await api.getUser(id);
    } catch (e) {
      state.error = e;
    } finally {
      state.loading = false;
    }
  };
  
  // ✅ 返回时使用 toRefs，方便解构
  return {
    ...toRefs(state),
    fetchUser
  };
}

// 使用时可以直接解构
const { user, loading, error, fetchUser } = useUser();

// 场景 2：setup 返回值
export default {
  setup() {
    const state = reactive({
      count: 0,
      name: 'John'
    });
    
    // ✅ 返回时转换为 refs
    return {
      ...toRefs(state)
    };
  }
};

// 场景 3：从 props 批量创建引用
const props = defineProps({
  user: Object,
  settings: Object
});

const { user, settings } = toRefs(props);
</script>
```

---

## 问题 4：常见的使用陷阱有哪些？

### 陷阱 1：直接解构 reactive 对象

```vue
<script setup>
import { reactive, toRefs } from 'vue';

const state = reactive({
  count: 0,
  name: 'John'
});

// ❌ 错误：失去响应式
const { count, name } = state;
count++; // 不会触发更新

// ✅ 正确：使用 toRefs
const { count: countRef, name: nameRef } = toRefs(state);
countRef.value++; // 会触发更新
</script>
```

### 陷阱 2：toRef 用于非响应式对象

```vue
<script setup>
import { toRef } from 'vue';

// ❌ 普通对象
const obj = { count: 0 };
const countRef = toRef(obj, 'count');

countRef.value++; // 修改 ref
console.log(obj.count); // 1（obj 被修改了）
// 但是没有响应式，不会触发更新

// ✅ 应该使用 ref
import { ref } from 'vue';
const count = ref(obj.count);
</script>
```

### 陷阱 3：ref 的 .value

```vue
<script setup>
import { ref, reactive, toRef } from 'vue';

const count = ref(0);

// ❌ 忘记 .value
console.log(count); // Ref 对象
count++; // 错误

// ✅ 使用 .value
console.log(count.value); // 0
count.value++; // 正确

// 在模板中不需要 .value
</script>

<template>
  <!-- ✅ 模板中自动解包 -->
  <div>{{ count }}</div>
  
  <!-- ❌ 不要写 .value -->
  <div>{{ count.value }}</div>
</template>
```

### 陷阱 4：toRefs 的性能

```vue
<script setup>
import { reactive, toRefs } from 'vue';

const state = reactive({
  // 假设有很多属性
  prop1: 1,
  prop2: 2,
  // ... 100 个属性
  prop100: 100
});

// ❌ 如果只需要少数几个属性，不要全部转换
const allRefs = toRefs(state); // 创建了 100 个 ref

// ✅ 只转换需要的属性
import { toRef } from 'vue';
const prop1 = toRef(state, 'prop1');
const prop2 = toRef(state, 'prop2');
</script>
```

---

## 问题 5：实际应用示例

### 示例 1：组合式函数

```vue
<script setup>
import { reactive, toRefs } from 'vue';

// ✅ 组合式函数最佳实践
function useMouse() {
  const state = reactive({
    x: 0,
    y: 0
  });
  
  const update = (e) => {
    state.x = e.pageX;
    state.y = e.pageY;
  };
  
  onMounted(() => {
    window.addEventListener('mousemove', update);
  });
  
  onUnmounted(() => {
    window.removeEventListener('mousemove', update);
  });
  
  // 返回时使用 toRefs，方便解构
  return toRefs(state);
}

// 使用
const { x, y } = useMouse();
</script>

<template>
  <div>Mouse position: {{ x }}, {{ y }}</div>
</template>
```

### 示例 2：Props 转 Ref

```vue
<script setup>
import { toRef, watch } from 'vue';

const props = defineProps({
  modelValue: String,
  disabled: Boolean
});

const emit = defineEmits(['update:modelValue']);

// ✅ 将 prop 转为 ref，保持响应式
const modelValue = toRef(props, 'modelValue');
const disabled = toRef(props, 'disabled');

// 可以直接 watch
watch(modelValue, (newValue) => {
  console.log('modelValue changed:', newValue);
});

// 创建本地副本
const localValue = ref(modelValue.value);

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>
```

### 示例 3：表单处理

```vue
<script setup>
import { reactive, toRefs } from 'vue';

function useForm(initialValues) {
  const state = reactive({
    values: { ...initialValues },
    errors: {},
    touched: {},
    isSubmitting: false
  });
  
  const setFieldValue = (field, value) => {
    state.values[field] = value;
    state.touched[field] = true;
  };
  
  const setFieldError = (field, error) => {
    state.errors[field] = error;
  };
  
  const handleSubmit = async (onSubmit) => {
    state.isSubmitting = true;
    try {
      await onSubmit(state.values);
    } finally {
      state.isSubmitting = false;
    }
  };
  
  return {
    ...toRefs(state),
    setFieldValue,
    setFieldError,
    handleSubmit
  };
}

// 使用
const {
  values,
  errors,
  touched,
  isSubmitting,
  setFieldValue,
  handleSubmit
} = useForm({
  username: '',
  email: ''
});
</script>
```

---

## 总结

**核心区别**：

### 1. ref

- **作用**：创建独立的响应式引用
- **用途**：组件状态、DOM 引用、独立数据
- **特点**：需要 `.value` 访问，模板中自动解包

### 2. toRef

- **作用**：为响应式对象的单个属性创建引用
- **用途**：从 props 或 reactive 提取单个属性
- **特点**：保持与源对象的响应式连接

### 3. toRefs

- **作用**：批量转换响应式对象的所有属性为 ref
- **用途**：组合式函数返回值、解构 reactive 对象
- **特点**：方便解构，保持响应式

### 4. 使用建议

- 独立状态 → ref
- 提取单个属性 → toRef
- 解构对象 → toRefs
- 组合式函数返回 → toRefs

### 5. 注意事项

- 不要直接解构 reactive
- toRef 用于响应式对象
- 记得使用 .value
- 考虑性能，按需转换

## 延伸阅读

- [Vue 官方文档 - ref](https://cn.vuejs.org/api/reactivity-core.html#ref)
- [Vue 官方文档 - toRef](https://cn.vuejs.org/api/reactivity-utilities.html#toref)
- [Vue 官方文档 - toRefs](https://cn.vuejs.org/api/reactivity-utilities.html#torefs)
- [Vue 官方文档 - 响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)
