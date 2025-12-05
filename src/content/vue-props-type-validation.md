---
title: props 是如何做类型校验的？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue props 的类型校验机制，掌握运行时校验和 TypeScript 类型检查的区别。
tags:
  - Vue
  - props
  - 类型校验
  - TypeScript
estimatedTime: 12 分钟
keywords:
  - props 校验
  - defineProps
  - 类型检查
highlight: Vue props 支持运行时类型校验和 TypeScript 编译时类型检查两种方式。
order: 216
---

## 问题 1：运行时类型校验

Vue 在**运行时**检查 props 的类型，如果不匹配会在控制台警告。

```javascript
export default {
  props: {
    // 基础类型检查
    propA: Number,

    // 多种类型
    propB: [String, Number],

    // 必填
    propC: {
      type: String,
      required: true,
    },

    // 带默认值
    propD: {
      type: Number,
      default: 100,
    },

    // 对象默认值必须用工厂函数
    propE: {
      type: Object,
      default: () => ({ message: "hello" }),
    },

    // 自定义校验函数
    propF: {
      validator(value) {
        return ["success", "warning", "danger"].includes(value);
      },
    },
  },
};
```

---

## 问题 2：校验的执行时机

props 校验在**组件实例创建之前**执行，所以在 `default` 或 `validator` 中无法访问组件实例。

```javascript
props: {
  value: {
    type: Number,
    // ❌ 无法访问 this
    default() {
      return this.someData  // undefined
    },
    // ❌ 无法访问组件数据
    validator(val) {
      return val > this.min  // 错误
    }
  }
}
```

### 校验流程

```
接收 props → 类型检查 → required 检查 → default 处理 → validator 校验 → 创建组件实例
```

---

## 问题 3：`<script setup>` 中的类型校验

### 运行时声明

```vue
<script setup>
const props = defineProps({
  title: String,
  count: {
    type: Number,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>
```

### TypeScript 类型声明

```vue
<script setup lang="ts">
// 纯类型声明，编译时检查
const props = defineProps<{
  title: string;
  count: number;
  items?: string[];
}>();
</script>
```

### 带默认值的类型声明

```vue
<script setup lang="ts">
// 使用 withDefaults
const props = withDefaults(
  defineProps<{
    title: string;
    count?: number;
    items?: string[];
  }>(),
  {
    count: 0,
    items: () => [],
  }
);
</script>
```

---

## 问题 4：运行时 vs 编译时类型检查

| 特性       | 运行时校验   | TypeScript   |
| ---------- | ------------ | ------------ |
| 检查时机   | 运行时       | 编译时       |
| 错误提示   | 控制台警告   | IDE 报错     |
| 自定义校验 | ✅ validator | ❌ 不支持    |
| 复杂类型   | 有限支持     | 完整支持     |
| 生产环境   | 可禁用       | 无运行时开销 |

### 两者可以结合使用

```vue
<script setup lang="ts">
// TypeScript 类型（编译时）
interface Props {
  status: "active" | "inactive";
  count: number;
}

// 运行时校验（可选，用于自定义校验）
const props = defineProps<Props>();

// 如果需要运行时校验，使用对象语法
const props2 = defineProps({
  status: {
    type: String as PropType<"active" | "inactive">,
    required: true,
    validator: (v: string) => ["active", "inactive"].includes(v),
  },
});
</script>
```

---

## 问题 5：复杂类型的校验

### 对象类型

```javascript
// 运行时只能检查是否为对象
props: {
  user: {
    type: Object,  // 只检查是否为对象
    required: true
  }
}

// TypeScript 可以检查对象结构
interface User {
  id: number
  name: string
  email: string
}

defineProps<{
  user: User
}>()
```

### 数组类型

```javascript
// 运行时
props: {
  items: {
    type: Array,  // 只检查是否为数组
    default: () => []
  }
}

// TypeScript
defineProps<{
  items: string[]  // 检查数组元素类型
}>()
```

### 函数类型

```javascript
// 运行时
props: {
  callback: {
    type: Function,
    required: true
  }
}

// TypeScript
defineProps<{
  callback: (value: string) => void  // 检查函数签名
}>()
```

---

## 问题 6：生产环境的校验

默认情况下，props 校验在生产环境也会执行。可以通过配置禁用：

```javascript
// vite.config.js
export default {
  define: {
    __VUE_PROD_DEVTOOLS__: false,
    // 禁用生产环境的 props 校验
    __VUE_OPTIONS_API__: true,
  },
};
```

### 建议

- **开发环境**：启用完整校验，帮助发现问题
- **生产环境**：可以禁用以提升性能
- **TypeScript 项目**：依赖编译时检查，运行时校验可选

## 延伸阅读

- [Vue 官方文档 - Props](https://cn.vuejs.org/guide/components/props.html)
- [Vue 官方文档 - TypeScript 与组合式 API](https://cn.vuejs.org/guide/typescript/composition-api.html)
