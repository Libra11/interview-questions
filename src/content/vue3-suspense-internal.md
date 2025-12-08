---
title: Suspense 内部逻辑如何实现？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 Suspense 组件的内部实现原理。
tags:
  - Vue
  - Suspense
  - 异步组件
  - 源码
estimatedTime: 15 分钟
keywords:
  - Suspense 原理
  - 异步依赖
  - 内部实现
highlight: Suspense 追踪异步依赖，在所有依赖 resolve 前显示 fallback，之后切换到默认内容。
order: 265
---

## 问题 1：Suspense 的核心概念

Suspense 管理两种内容：

- **default**：主内容（可能包含异步依赖）
- **fallback**：加载状态

```vue
<Suspense>
  <template #default>
    <AsyncComponent />
  </template>
  <template #fallback>
    <Loading />
  </template>
</Suspense>
```

---

## 问题 2：异步依赖追踪

```javascript
// Suspense 组件简化实现
const Suspense = {
  setup(props, { slots }) {
    const suspense = {
      deps: 0, // 异步依赖计数
      resolved: false, // 是否已解决
      effects: [], // 待执行的 effects

      // 注册异步依赖
      registerDep(instance, setupRenderEffect) {
        suspense.deps++;

        instance.asyncDep
          .then(() => {
            suspense.deps--;
            if (suspense.deps === 0) {
              suspense.resolve();
            }
          })
          .catch((err) => {
            suspense.handleError(err);
          });
      },

      resolve() {
        suspense.resolved = true;
        // 切换到 default 内容
        // 执行收集的 effects
      },
    };

    // 提供给子组件
    provide(SuspenseSymbol, suspense);

    return () => {
      if (suspense.resolved) {
        return slots.default();
      } else {
        return slots.fallback();
      }
    };
  },
};
```

---

## 问题 3：async setup 处理

```javascript
// 组件使用 async setup
const AsyncComponent = {
  async setup() {
    const data = await fetchData();
    return { data };
  },
};

// Vue 内部处理
function setupComponent(instance) {
  const setupResult = setup();

  if (isPromise(setupResult)) {
    // 标记为异步依赖
    instance.asyncDep = setupResult;

    // 如果有 Suspense 父组件
    const suspense = instance.suspense;
    if (suspense) {
      suspense.registerDep(instance, setupRenderEffect);
    }
  }
}
```

---

## 问题 4：状态机

```
                    ┌─────────────┐
                    │   pending   │
                    └──────┬──────┘
                           │
              deps > 0     │     deps === 0
         ┌─────────────────┼─────────────────┐
         ▼                 │                 ▼
┌─────────────────┐        │        ┌─────────────────┐
│ show fallback   │        │        │  show default   │
└────────┬────────┘        │        └─────────────────┘
         │                 │
         │  all deps resolved
         │                 │
         ▼                 │
┌─────────────────┐        │
│    resolved     │◄───────┘
└─────────────────┘
```

---

## 问题 5：事件触发

```javascript
const Suspense = {
  setup(props, { emit }) {
    const suspense = {
      registerDep() {
        if (suspense.deps === 1) {
          // 第一个异步依赖，触发 pending
          emit("pending");
        }
      },

      resolve() {
        emit("resolve");

        // 执行收集的 effects
        suspense.effects.forEach((effect) => effect());
        suspense.effects = [];
      },

      handleError(err) {
        emit("fallback");
        // 错误处理
      },
    };
  },
};
```

```vue
<Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
  <AsyncComponent />
  <template #fallback>Loading...</template>
</Suspense>
```

---

## 问题 6：嵌套 Suspense

```vue
<Suspense>
  <template #default>
    <AsyncOuter>
      <Suspense>
        <AsyncInner />
        <template #fallback>Inner Loading...</template>
      </Suspense>
    </AsyncOuter>
  </template>
  <template #fallback>Outer Loading...</template>
</Suspense>
```

```javascript
// 内部处理
function findSuspense(instance) {
  let parent = instance.parent;
  while (parent) {
    if (parent.type === Suspense) {
      return parent.suspense;
    }
    parent = parent.parent;
  }
  return null;
}

// 每个异步组件只注册到最近的 Suspense
```

---

## 问题 7：timeout 处理

```vue
<Suspense :timeout="3000">
  <AsyncComponent />
  <template #fallback>Loading...</template>
</Suspense>
```

```javascript
// timeout 实现
const Suspense = {
  props: ["timeout"],

  setup(props) {
    const suspense = {
      timeoutId: null,

      registerDep() {
        if (props.timeout != null && suspense.deps === 1) {
          suspense.timeoutId = setTimeout(() => {
            // 超时后强制显示 fallback
            suspense.showFallback = true;
          }, props.timeout);
        }
      },

      resolve() {
        if (suspense.timeoutId) {
          clearTimeout(suspense.timeoutId);
        }
        // ...
      },
    };
  },
};
```

---

## 问题 8：与 KeepAlive 配合

```vue
<KeepAlive>
  <Suspense>
    <component :is="currentComponent" />
    <template #fallback>Loading...</template>
  </Suspense>
</KeepAlive>
```

```javascript
// 缓存的组件重新激活时
function activateComponent(instance) {
  const suspense = instance.suspense;

  if (suspense && !suspense.resolved) {
    // 重新等待异步依赖
    suspense.recede();
  } else {
    // 直接激活
    instance.activate();
  }
}
```

## 延伸阅读

- [Vue 3 源码 - Suspense](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/components/Suspense.ts)
- [Vue 官方文档 - Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)
