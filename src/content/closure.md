---
title: JavaScript 闭包深度解析
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入剖析 JavaScript 闭包的形成机制、作用域链、内存管理，掌握闭包在模块化、数据封装、函数式编程中的核心应用。
tags:
  - 闭包
  - 作用域
  - 内存管理
estimatedTime: 35 分钟
keywords:
  - Closure
  - 作用域链
  - 词法作用域
  - 内存泄漏
highlight: 理解闭包的形成条件与作用机制，掌握闭包在实际项目中的应用场景与内存管理最佳实践
order: 113
---

## 问题 1：什么是闭包（Closure）？闭包是如何形成的？

**核心定义**

闭包（Closure）是指**函数能够访问其外部（词法）作用域中的变量，即使外部函数已经执行完毕**。闭包由函数和其创建时的词法环境（Lexical Environment）组成。

**简单示例**：

```javascript
function outer() {
  const outerVar = "外部变量";

  function inner() {
    console.log(outerVar); // 访问外部函数的变量
  }

  return inner; // 返回内部函数
}

const innerFunc = outer(); // outer 执行完毕
innerFunc(); // "外部变量" - ✅ 仍然可以访问 outerVar
```

**闭包的形成条件**：

1. **嵌套函数**：内部函数定义在外部函数内部
2. **内部函数引用外部变量**：内部函数使用了外部函数的变量
3. **内部函数被外部引用**：内部函数被返回或传递给其他函数

```javascript
// ✅ 形成闭包
function createCounter() {
  let count = 0; // 外部变量

  return function () {
    // 内部函数引用了外部变量 count
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// ❌ 不形成闭包（内部函数没有引用外部变量）
function noClosure() {
  const local = "local";
  return function () {
    console.log("hello"); // 没有引用外部变量
  };
}
```

**词法作用域（Lexical Scoping）**：

```javascript
// JavaScript 使用词法作用域（静态作用域）
// 函数的作用域在定义时确定，而不是调用时

const globalVar = "全局变量";

function outer() {
  const outerVar = "外部变量";

  function inner() {
    const innerVar = "内部变量";
    console.log(globalVar); // ✅ 可以访问
    console.log(outerVar); // ✅ 可以访问
    console.log(innerVar); // ✅ 可以访问
  }

  inner();
}

outer();

// 作用域链：inner → outer → global
```

---

## 问题 2：闭包的作用域链是如何工作的？

### 作用域链（Scope Chain）

**作用域链的形成**：

```javascript
const globalVar = "全局";

function level1() {
  const level1Var = "第一层";

  function level2() {
    const level2Var = "第二层";

    function level3() {
      const level3Var = "第三层";
      console.log(level3Var); // 当前作用域
      console.log(level2Var); // 向上查找一级
      console.log(level1Var); // 向上查找两级
      console.log(globalVar); // 向上查找三级（全局）
    }

    level3();
  }

  level2();
}

level1();

// 作用域链：level3 → level2 → level1 → global
```

**闭包中的作用域链**：

```javascript
function outer() {
  const outerVar = "outer";

  function middle() {
    const middleVar = "middle";

    function inner() {
      const innerVar = "inner";
      console.log(innerVar); // 当前作用域
      console.log(middleVar); // 闭包：middle 的作用域
      console.log(outerVar); // 闭包：outer 的作用域
    }

    return inner; // 返回 inner，形成闭包
  }

  return middle();
}

const innerFunc = outer(); // outer 和 middle 都已执行完毕
innerFunc(); // ✅ 仍然可以访问 outerVar 和 middleVar

// 闭包链：inner 闭包 → middle 闭包 → outer 闭包
```

### 变量查找机制

**变量查找顺序**：

```javascript
const global = "全局变量";

function outer() {
  const outer = "外部变量";

  function inner() {
    const inner = "内部变量";
    console.log(inner); // 1. 当前作用域
    console.log(outer); // 2. 外部作用域（闭包）
    console.log(global); // 3. 全局作用域
  }

  return inner;
}

const func = outer();
func();
```

**变量遮蔽（Variable Shadowing）**：

```javascript
const name = "全局 name";

function outer() {
  const name = "外部 name"; // 遮蔽全局变量

  function inner() {
    const name = "内部 name"; // 遮蔽外部变量
    console.log(name); // "内部 name"
  }

  inner();
  console.log(name); // "外部 name"
}

outer();
console.log(name); // "全局 name"
```

**闭包中的变量查找**：

```javascript
function createFunc() {
  let x = 1;

  function inner() {
    console.log(x); // 查找 x
  }

  x = 2; // 修改 x
  return inner;
}

const func = createFunc();
func(); // 2 - 访问的是最终值，不是定义时的值
```

---

## 问题 3：闭包的常见应用场景有哪些？

### 场景 1：数据封装和私有变量

**使用闭包实现私有变量**：

```javascript
function createCounter() {
  let count = 0; // 私有变量，外部无法直接访问

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getValue() {
      return count;
    },
  };
}

const counter = createCounter();
console.log(counter.getValue()); // 0
counter.increment();
counter.increment();
console.log(counter.getValue()); // 2
console.log(counter.count); // undefined - 无法直接访问
```

**模块模式（Module Pattern）**：

```javascript
const UserModule = (function () {
  // 私有变量
  let users = [];
  let nextId = 1;

  // 私有方法
  function validateUser(user) {
    return user && user.name && user.email;
  }

  // 公共 API
  return {
    add(user) {
      if (validateUser(user)) {
        users.push({ ...user, id: nextId++ });
        return true;
      }
      return false;
    },
    getAll() {
      return [...users]; // 返回副本，防止外部修改
    },
    getById(id) {
      return users.find((u) => u.id === id);
    },
    remove(id) {
      users = users.filter((u) => u.id !== id);
    },
  };
})();

UserModule.add({ name: "Alice", email: "alice@example.com" });
console.log(UserModule.getAll());
```

### 场景 2：函数工厂（Function Factory）

**创建具有不同配置的函数**：

```javascript
function createMultiplier(multiplier) {
  return function (number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

**创建具有预设参数的函数**：

```javascript
function createGreeter(greeting) {
  return function (name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHello = createGreeter("Hello");
const sayHi = createGreeter("Hi");

console.log(sayHello("Alice")); // "Hello, Alice!"
console.log(sayHi("Bob")); // "Hi, Bob!"
```

### 场景 3：回调函数和事件处理

**在循环中使用闭包**：

```javascript
// ❌ 问题：循环中的异步回调
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 3, 3, 3 - 所有回调都访问同一个 i
  }, 100);
}

// ✅ 解决方案 1：使用 let（块级作用域）
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 0, 1, 2
  }, 100);
}

// ✅ 解决方案 2：使用闭包
for (var i = 0; i < 3; i++) {
  (function (index) {
    // 立即执行函数创建闭包
    setTimeout(() => {
      console.log(index); // 0, 1, 2
    }, 100);
  })(i);
}

// ✅ 解决方案 3：使用 bind
for (var i = 0; i < 3; i++) {
  setTimeout(
    function (index) {
      console.log(index);
    }.bind(null, i),
    100,
  );
}
```

**事件处理中的闭包**：

```javascript
function createButtonHandlers(buttons) {
  const handlers = [];

  for (let i = 0; i < buttons.length; i++) {
    handlers.push(function () {
      // 闭包捕获了 i 的值
      console.log(`按钮 ${i} 被点击`);
    });
  }

  return handlers;
}

const buttons = [document.createElement("button"), document.createElement("button")];
const handlers = createButtonHandlers(buttons);

handlers[0](); // "按钮 0 被点击"
handlers[1](); // "按钮 1 被点击"
```

### 场景 4：函数式编程

**高阶函数**：

```javascript
function map(array, transform) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(transform(array[i], i));
  }
  return result;
}

function filter(array, predicate) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      result.push(array[i]);
    }
  }
  return result;
}

// 使用闭包创建特定的转换函数
const numbers = [1, 2, 3, 4, 5];
const doubled = map(numbers, (n) => n * 2); // [2, 4, 6, 8, 10]
const evens = filter(numbers, (n) => n % 2 === 0); // [2, 4]
// 在 JavaScript 中，只要一个函数访问了其外部作用域的变量，它就是闭包。transform 是在外部创建的函数
```

**柯里化（Currying）**：

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function (...nextArgs) {
        return curried.apply(this, args.concat(nextArgs));
      };
    }
  };
}

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6
```

### 场景 5：防抖和节流

**防抖（Debounce）**：

```javascript
function debounce(func, delay) {
  let timeoutId; // 闭包保存 timeoutId

  return function (...args) {
    clearTimeout(timeoutId); // 清除之前的定时器
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 使用
const debouncedSearch = debounce((query) => {
  console.log("搜索:", query);
}, 300);

debouncedSearch("a"); // 不会执行
debouncedSearch("ab"); // 不会执行
debouncedSearch("abc"); // 300ms 后执行 "搜索: abc"
```

**节流（Throttle）**：

```javascript
function throttle(func, delay) {
  let lastCall = 0; // 闭包保存上次调用时间

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// 使用
const throttledScroll = throttle(() => {
  console.log("滚动事件");
}, 100);

// 快速滚动时，每 100ms 最多执行一次
```

---

## 问题 4：闭包会导致内存泄漏吗？如何避免？

### 内存泄漏的原因

**闭包会阻止垃圾回收**：

```javascript
function createHandler() {
  const largeData = new Array(1000000).fill("data"); // 大量数据

  return function () {
    console.log("handler");
    // 即使不使用 largeData，闭包也会保留它
  };
}

const handler = createHandler();
// largeData 无法被回收，因为 handler 的闭包引用了它
```

**DOM 引用导致的内存泄漏**：

```javascript
// ❌ 问题：闭包持有 DOM 引用
function attachHandler() {
  const button = document.getElementById("button");
  const largeData = new Array(1000000).fill("data");

  button.addEventListener("click", function () {
    // 闭包持有 button 和 largeData 的引用
    console.log("clicked");
    // 即使不需要 largeData，它也无法被回收
  });
}

// ✅ 解决方案：只保留必要的引用
function attachHandlerFixed() {
  const button = document.getElementById("button");

  button.addEventListener("click", function () {
    console.log("clicked");
    // 不引用不必要的数据
  });
}
```

### 避免内存泄漏的方法

**1. 及时清理引用**：

```javascript
function createHandler() {
  const data = { large: new Array(1000000).fill("data") };

  const handler = function () {
    console.log("handler");
  };

  // 使用完后清理
  handler.cleanup = function () {
    data.large = null; // 清除引用
  };

  return handler;
}

const handler = createHandler();
// 使用完后
handler.cleanup();
handler = null; // 清除 handler 引用
```

**2. 使用 WeakMap 存储私有数据**：

```javascript
const privateData = new WeakMap();

function createObject() {
  const obj = {};
  privateData.set(obj, {
    large: new Array(1000000).fill("data"),
  });

  obj.getData = function () {
    return privateData.get(this);
  };

  return obj;
}

const instance = createObject();
// 当 instance 被回收时，WeakMap 中的关联数据也会被回收
```

**3. 避免在闭包中持有不必要的引用**：

```javascript
// ❌ 问题：闭包持有整个对象
function createHandler(user) {
  return function () {
    console.log(user.name); // 只需要 name，但闭包持有整个 user
  };
}

// ✅ 解决方案：只保留需要的值
function createHandlerFixed(user) {
  const name = user.name; // 只保留需要的值
  return function () {
    console.log(name);
  };
}
```

**4. 使用事件委托代替多个闭包**：

```javascript
// ❌ 问题：为每个元素创建闭包
const buttons = document.querySelectorAll("button");
buttons.forEach((button, index) => {
  button.addEventListener("click", function () {
    // 每个按钮都有一个闭包
    console.log(`按钮 ${index} 被点击`);
  });
});

// ✅ 解决方案：使用事件委托
document.addEventListener("click", function (event) {
  if (event.target.tagName === "BUTTON") {
    const index = Array.from(document.querySelectorAll("button")).indexOf(event.target);
    console.log(`按钮 ${index} 被点击`);
  }
});
```

---

## 问题 5：闭包与 this 的关系是什么？

### this 的绑定问题

**闭包中的 this**：

```javascript
const obj = {
  name: "Object",
  getName: function () {
    return function () {
      // 普通函数中的 this 指向全局对象（严格模式下为 undefined）
      return this.name; // undefined 或 window.name
    };
  },
};

console.log(obj.getName()()); // undefined

// ✅ 解决方案 1：使用箭头函数
const obj2 = {
  name: "Object",
  getName: function () {
    return () => {
      // 箭头函数继承外层的 this
      return this.name; // "Object"
    };
  },
};

console.log(obj2.getName()()); // "Object"

// ✅ 解决方案 2：保存 this
const obj3 = {
  name: "Object",
  getName: function () {
    const self = this; // 保存 this
    return function () {
      return self.name; // 通过闭包访问 self
    };
  },
};

console.log(obj3.getName()()); // "Object"

// ✅ 解决方案 3：使用 bind
const obj4 = {
  name: "Object",
  getName: function () {
    return function () {
      return this.name;
    }.bind(this); // 绑定 this
  },
};

console.log(obj4.getName()()); // "Object"
```

**事件处理中的 this**：

```javascript
class Button {
  constructor(name) {
    this.name = name;
  }

  // ❌ 问题：this 丢失
  addEventListener() {
    const button = document.createElement("button");
    button.addEventListener("click", function () {
      console.log(this.name); // undefined
    });
  }

  // ✅ 解决方案 1：箭头函数
  addEventListenerFixed1() {
    const button = document.createElement("button");
    button.addEventListener("click", () => {
      console.log(this.name); // 正确
    });
  }

  // ✅ 解决方案 2：bind
  addEventListenerFixed2() {
    const button = document.createElement("button");
    button.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick() {
    console.log(this.name);
  }

  // ✅ 解决方案 3：闭包保存 this
  addEventListenerFixed3() {
    const button = document.createElement("button");
    const self = this;
    button.addEventListener("click", function () {
      console.log(self.name); // 通过闭包访问 self
    });
  }
}
```

---

## 总结

**面试回答框架**

1. **闭包的定义**：
   - 函数能够访问其外部（词法）作用域中的变量，即使外部函数已经执行完毕
   - 由函数和其创建时的词法环境组成
   - 形成条件：嵌套函数、内部函数引用外部变量、内部函数被外部引用

2. **作用域链**：
   - JavaScript 使用词法作用域（静态作用域）
   - 变量查找顺序：当前作用域 → 外部作用域 → 全局作用域
   - 闭包会保留整个作用域链的引用

3. **常见应用场景**：
   - **数据封装**：实现私有变量和模块模式
   - **函数工厂**：创建具有不同配置的函数
   - **回调函数**：在循环和事件处理中保持变量状态
   - **函数式编程**：高阶函数、柯里化、记忆化
   - **工具函数**：防抖、节流

4. **内存泄漏**：
   - 闭包会阻止垃圾回收，导致内存泄漏
   - 避免方法：及时清理引用、使用 WeakMap、避免不必要的引用、使用事件委托

5. **this 绑定**：
   - 普通函数中的 this 在闭包中可能丢失
   - 解决方案：箭头函数、保存 this、bind、call/apply

---

## 延伸阅读

- MDN：[闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)
- 【练习】实现一个完整的模块系统，包括私有变量、公共 API 和清理方法。
- 【练习】使用闭包实现一个状态管理库，支持订阅和更新。
