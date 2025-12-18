---
title: computed 如何实现缓存？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 computed 的缓存机制和惰性求值原理。
tags:
  - Vue
  - computed
  - 缓存
  - 响应式
estimatedTime: 12 分钟
keywords:
  - computed 缓存
  - 惰性求值
  - dirty 标记
highlight: computed 使用 dirty 标记实现缓存，依赖变化时标记为脏，下次访问时重新计算。
order: 613
---

## 问题 1：缓存的核心原理

computed 使用 **dirty 标记** 实现缓存：

```javascript
class ComputedRefImpl {
  constructor(getter) {
    this._dirty = true; // 是否需要重新计算
    this._value = undefined; // 缓存的值

    // 创建 effect，但不立即执行
    this.effect = new ReactiveEffect(getter, () => {
      // 依赖变化时的调度器
      if (!this._dirty) {
        this._dirty = true;
        // 触发依赖此 computed 的 effect
        triggerRefValue(this);
      }
    });
  }

  get value() {
    // 只有脏时才重新计算
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }
}
```

---

## 问题 2：惰性求值

```javascript
const count = ref(0);

// 创建 computed，此时不执行 getter
const double = computed(() => {
  console.log("计算");
  return count.value * 2;
});

// 不访问 double.value，不会输出 "计算"

console.log(double.value); // 输出 "计算"，然后输出 0
console.log(double.value); // 直接输出 0，不重新计算
console.log(double.value); // 直接输出 0，不重新计算
```

---

## 问题 3：依赖变化时的行为

```javascript
const count = ref(0);
const double = computed(() => count.value * 2);

console.log(double.value); // 0，_dirty = false

count.value = 1;
// 触发 computed 的 scheduler
// _dirty = true
// 但不立即重新计算

console.log(double.value); // 访问时才计算，输出 2
```

### 流程图

```
count.value = 1
      ↓
trigger(count)
      ↓
执行 computed 的 scheduler
      ↓
this._dirty = true
      ↓
triggerRefValue(computed)  // 通知依赖 computed 的 effect
      ↓
[等待访问]
      ↓
访问 double.value
      ↓
if (_dirty) → 重新计算
      ↓
_dirty = false
      ↓
返回新值
```

---

## 问题 4：computed 也是响应式的

```javascript
const count = ref(0);
const double = computed(() => count.value * 2);

// computed 可以被其他 effect 依赖
effect(() => {
  console.log(double.value); // 会收集依赖
});

count.value = 1;
// 1. count 变化，触发 computed 的 scheduler
// 2. computed._dirty = true
// 3. triggerRefValue(computed) 触发依赖 computed 的 effect
// 4. effect 执行，访问 double.value
// 5. 因为 _dirty = true，重新计算
```

---

## 问题 5：完整实现

```javascript
function computed(getterOrOptions) {
  let getter, setter;

  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
    setter = () => {
      console.warn("computed is readonly");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  constructor(getter, setter) {
    this._dirty = true;
    this._value = undefined;
    this._setter = setter;
    this.dep = new Set(); // 依赖此 computed 的 effect

    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        // 触发依赖
        this.dep.forEach((effect) => {
          if (effect.scheduler) {
            effect.scheduler();
          } else {
            effect.run();
          }
        });
      }
    });
  }

  get value() {
    // 收集依赖
    if (activeEffect) {
      this.dep.add(activeEffect);
    }

    // 惰性求值
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }

    return this._value;
  }

  set value(newValue) {
    this._setter(newValue);
  }
}
```

---

## 问题 6：与普通函数对比

```javascript
const count = ref(0);

// computed：有缓存
const double = computed(() => {
  console.log("computed");
  return count.value * 2;
});

// 普通函数：无缓存
function getDouble() {
  console.log("function");
  return count.value * 2;
}

// 多次访问
double.value; // 输出 "computed"
double.value; // 无输出（使用缓存）
double.value; // 无输出（使用缓存）

getDouble(); // 输出 "function"
getDouble(); // 输出 "function"
getDouble(); // 输出 "function"
```

---

## 问题 7：可写 computed

```javascript
const firstName = ref("John");
const lastName = ref("Doe");

const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  set(value) {
    const [first, last] = value.split(" ");
    firstName.value = first;
    lastName.value = last;
  },
});

console.log(fullName.value); // "John Doe"

fullName.value = "Jane Smith";
console.log(firstName.value); // "Jane"
console.log(lastName.value); // "Smith"
```

---

## 问题 8：性能优化建议

```javascript
// ✅ 适合 computed：依赖响应式数据的派生值
const filteredList = computed(() => list.value.filter((item) => item.active));

// ❌ 不适合 computed：无依赖的计算
const now = computed(() => Date.now()); // 不会更新

// ❌ 不适合 computed：有副作用
const bad = computed(() => {
  fetchData(); // 副作用
  return count.value;
});
```

## 延伸阅读

- [Vue 3 源码 - computed.ts](https://github.com/vuejs/core/blob/main/packages/reactivity/src/computed.ts)
- [Vue 官方文档 - computed](https://cn.vuejs.org/guide/essentials/computed.html)
