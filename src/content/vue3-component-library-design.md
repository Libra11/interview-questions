---
title: 如何设计一个业务组件库？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 业务组件库的设计原则和最佳实践。
tags:
  - Vue
  - 组件库
  - 架构设计
  - 最佳实践
estimatedTime: 18 分钟
keywords:
  - 组件库设计
  - 业务组件
  - 可复用
highlight: 业务组件库需要考虑 API 设计、样式隔离、文档、测试和发布流程。
order: 618
---

## 问题 1：目录结构

```
packages/
├── components/           # 组件源码
│   ├── button/
│   │   ├── src/
│   │   │   ├── Button.vue
│   │   │   └── types.ts
│   │   ├── index.ts
│   │   └── style/
│   │       └── index.scss
│   └── table/
├── hooks/                # 公共 hooks
├── utils/                # 工具函数
├── styles/               # 全局样式
│   ├── variables.scss
│   └── mixins.scss
├── docs/                 # 文档
└── playground/           # 开发调试
```

---

## 问题 2：组件 API 设计

```typescript
// 类型定义
interface ButtonProps {
  type?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
}

interface ButtonEmits {
  click: [event: MouseEvent];
}

interface ButtonSlots {
  default: () => VNode;
  icon: () => VNode;
}

// 组件实现
defineOptions({ name: "MyButton" });

const props = withDefaults(defineProps<ButtonProps>(), {
  type: "primary",
  size: "medium",
});

const emit = defineEmits<ButtonEmits>();

defineSlots<ButtonSlots>();
```

---

## 问题 3：样式方案

```scss
// BEM 命名规范
.my-button {
  // Block

  &--primary {
    // Modifier
  }

  &__icon {
    // Element
  }
}

// CSS 变量支持主题
:root {
  --my-button-bg: #409eff;
  --my-button-color: #fff;
}

.my-button {
  background: var(--my-button-bg);
  color: var(--my-button-color);
}
```

---

## 问题 4：组件导出

```typescript
// components/button/index.ts
import Button from "./src/Button.vue";
import type { ButtonProps } from "./src/types";

export { Button, ButtonProps };
export default Button;

// 主入口
import { Button } from "./components/button";
import { Table } from "./components/table";

const components = { Button, Table };

export function install(app: App) {
  Object.entries(components).forEach(([name, comp]) => {
    app.component(name, comp);
  });
}

export { Button, Table };
export default { install };
```

---

## 问题 5：按需引入

```typescript
// vite.config.ts
import Components from "unplugin-vue-components/vite";
import { MyUIResolver } from "my-ui/resolver";

export default {
  plugins: [
    Components({
      resolvers: [MyUIResolver()],
    }),
  ],
};

// resolver 实现
export function MyUIResolver() {
  return {
    type: "component",
    resolve: (name: string) => {
      if (name.startsWith("My")) {
        return {
          name,
          from: "my-ui",
          sideEffects: `my-ui/es/${name}/style`,
        };
      }
    },
  };
}
```

---

## 问题 6：文档系统

```markdown
<!-- docs/button.md -->

# Button 按钮

## 基础用法

<demo src="./demos/basic.vue" />

## API

### Props

| 属性 | 说明 | 类型   | 默认值  |
| ---- | ---- | ------ | ------- |
| type | 类型 | string | primary |

### Events

| 事件名 | 说明     | 参数       |
| ------ | -------- | ---------- |
| click  | 点击事件 | MouseEvent |
```

---

## 问题 7：测试策略

```typescript
// Button.test.ts
import { mount } from "@vue/test-utils";
import Button from "../src/Button.vue";

describe("Button", () => {
  it("renders correctly", () => {
    const wrapper = mount(Button, {
      slots: { default: "Click me" },
    });
    expect(wrapper.text()).toBe("Click me");
  });

  it("emits click event", async () => {
    const wrapper = mount(Button);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("disabled state", async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeFalsy();
  });
});
```

---

## 问题 8：发布流程

```json
// package.json
{
  "name": "my-ui",
  "version": "1.0.0",
  "main": "lib/index.js",
  "module": "es/index.mjs",
  "types": "es/index.d.ts",
  "exports": {
    ".": {
      "import": "./es/index.mjs",
      "require": "./lib/index.js"
    },
    "./es/*": "./es/*",
    "./lib/*": "./lib/*"
  },
  "sideEffects": ["**/*.css", "**/*.scss"]
}
```

```bash
# 构建脚本
pnpm build:es    # ESM 格式
pnpm build:lib   # CJS 格式
pnpm build:types # 类型声明
pnpm publish
```

## 延伸阅读

- [Element Plus 源码](https://github.com/element-plus/element-plus)
- [Vant 源码](https://github.com/youzan/vant)
