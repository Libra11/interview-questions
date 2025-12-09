---
title: React 如何跨多个 Renderer（web、native、canvas）？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  理解 React 的渲染器架构，掌握跨平台渲染的原理。
tags:
  - React
  - Renderer
  - 跨平台
  - 架构
estimatedTime: 15 分钟
keywords:
  - React Renderer
  - cross platform
  - React Native
  - custom renderer
highlight: React 将核心协调算法与渲染器分离，通过 react-reconciler 包支持自定义渲染目标。
order: 307
---

## 问题 1：React 的分层架构

### 核心分层

```
┌─────────────────────────────────────┐
│           React (核心)               │
│  - 组件模型                          │
│  - Hooks                            │
│  - 状态管理                          │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       React Reconciler              │
│  - Fiber 架构                        │
│  - Diff 算法                         │
│  - 调度系统                          │
└─────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │react-dom│ │react-   │ │ custom  │
   │         │ │native   │ │renderer │
   └─────────┘ └─────────┘ └─────────┘
        │         │         │
        ▼         ▼         ▼
      DOM      Native     Canvas
               Views      /WebGL
```

---

## 问题 2：react-reconciler 的作用

### 提供协调算法

```javascript
// react-reconciler 提供核心算法
// 渲染器只需实现宿主配置

import Reconciler from "react-reconciler";

const hostConfig = {
  // 创建实例
  createInstance(type, props) {},

  // 创建文本节点
  createTextInstance(text) {},

  // 添加子节点
  appendChild(parent, child) {},

  // 更新属性
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {},

  // ... 更多方法
};

const reconciler = Reconciler(hostConfig);
```

---

## 问题 3：不同渲染器的实现

### react-dom

```javascript
// 简化的 react-dom 实现
const hostConfig = {
  createInstance(type, props) {
    const element = document.createElement(type);
    // 设置属性
    Object.keys(props).forEach((key) => {
      if (key !== "children") {
        element[key] = props[key];
      }
    });
    return element;
  },

  appendChild(parent, child) {
    parent.appendChild(child);
  },

  removeChild(parent, child) {
    parent.removeChild(child);
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
  },
};
```

### react-native

```javascript
// 简化的 react-native 实现
const hostConfig = {
  createInstance(type, props) {
    // 创建原生视图
    return UIManager.createView(type, props);
  },

  appendChild(parent, child) {
    UIManager.setChildren(parent, [child]);
  },

  commitUpdate(instance, updatePayload) {
    UIManager.updateView(instance, updatePayload);
  },
};
```

---

## 问题 4：自定义渲染器示例

### Canvas 渲染器

```javascript
import Reconciler from "react-reconciler";

const canvasHostConfig = {
  supportsMutation: true,

  createInstance(type, props) {
    // 创建 Canvas 图形对象
    return {
      type,
      props,
      children: [],
    };
  },

  appendChild(parent, child) {
    parent.children.push(child);
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    instance.props = newProps;
  },

  // 渲染到 Canvas
  prepareForCommit(containerInfo) {
    const ctx = containerInfo.getContext("2d");
    ctx.clearRect(0, 0, containerInfo.width, containerInfo.height);
  },

  resetAfterCommit(containerInfo) {
    // 绘制所有图形
    renderToCanvas(containerInfo, root);
  },
};

const reconciler = Reconciler(canvasHostConfig);

// 使用
function App() {
  return (
    <canvas-container>
      <rect x={10} y={10} width={100} height={100} fill="red" />
      <circle cx={200} cy={100} r={50} fill="blue" />
    </canvas-container>
  );
}
```

---

## 问题 5：跨平台组件设计

### 抽象组件

```jsx
// 定义跨平台组件接口
interface ButtonProps {
  onPress: () => void;
  title: string;
}

// Web 实现
function WebButton({ onPress, title }: ButtonProps) {
  return <button onClick={onPress}>{title}</button>;
}

// Native 实现
function NativeButton({ onPress, title }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}

// 统一导出
export const Button = Platform.select({
  web: WebButton,
  native: NativeButton,
});
```

### React Native Web

```jsx
// 使用 react-native-web 实现跨平台
import { View, Text, TouchableOpacity } from "react-native";

// 同一套代码运行在 Web 和 Native
function App() {
  return (
    <View>
      <Text>Hello World</Text>
      <TouchableOpacity onPress={() => {}}>
        <Text>Press Me</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 问题 6：现有的 React 渲染器

| 渲染器            | 目标平台       |
| ----------------- | -------------- |
| react-dom         | Web DOM        |
| react-native      | iOS/Android    |
| react-three-fiber | Three.js/WebGL |
| react-konva       | Canvas 2D      |
| ink               | 终端 CLI       |
| react-pdf         | PDF 文档       |
| react-figma       | Figma 插件     |

## 总结

**React 跨平台的关键**：

1. **核心分离**：协调算法与渲染分离
2. **react-reconciler**：提供可复用的协调逻辑
3. **宿主配置**：渲染器实现平台特定操作
4. **统一 API**：组件模型和 Hooks 跨平台通用

## 延伸阅读

- [react-reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler)
- [Building a Custom React Renderer](https://agent-hunt.medium.com/hello-world-custom-react-renderer-9a95b7cd04bc)
