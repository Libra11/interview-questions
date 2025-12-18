---
title: 函数声明与函数表达式的区别
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 中函数声明和函数表达式的区别，包括提升机制、作用域、执行时机等方面的差异。
tags:
  - 函数声明
  - 函数表达式
  - 提升机制
  - 作用域
estimatedTime: 25 分钟
keywords:
  - 函数声明
  - 函数表达式
  - hoisting
  - 提升
  - 作用域
highlight: 掌握函数声明和函数表达式的本质区别，理解提升机制对代码执行的影响
order: 242
---

## 问题 1：基本语法差异

### 函数声明 (Function Declaration)

```javascript
// 函数声明的基本语法
function functionName() {
  // 函数体
}

// 示例
function greet() {
  return "Hello, World!";
}

function add(a, b) {
  return a + b;
}

// 函数声明的特点
console.log(typeof greet); // "function"
console.log(greet.name); // "greet"
```

### 函数表达式 (Function Expression)

```javascript
// 函数表达式的基本语法
const functionName = function () {
  // 函数体
};

// 匿名函数表达式
const greet = function () {
  return "Hello, World!";
};

// 具名函数表达式
const add = function addNumbers(a, b) {
  return a + b;
};

// 箭头函数表达式
const multiply = (a, b) => {
  return a * b;
};

// 简化的箭头函数表达式
const square = (x) => x * x;

console.log(typeof greet); // "function"
console.log(greet.name); // "greet" (变量名)
console.log(add.name); // "addNumbers" (函数名)
```

---

## 问题 2：提升机制 (Hoisting) 的差异

### 函数声明的提升

```javascript
// ✅ 函数声明会被完全提升
console.log(declaredFunction()); // "I'm declared!" - 正常执行

function declaredFunction() {
  return "I'm declared!";
}

// 等价于以下代码（JavaScript 引擎的处理方式）
/*
function declaredFunction() {
  return "I'm declared!";
}

console.log(declaredFunction()); // "I'm declared!"
*/

// 在任何地方都可以调用
if (true) {
  console.log(anotherDeclared()); // "Another declared!"

  function anotherDeclared() {
    return "Another declared!";
  }
}
```

### 函数表达式的提升

```javascript
// ❌ 函数表达式不会被提升
console.log(expressedFunction); // undefined
// console.log(expressedFunction()); // TypeError: expressedFunction is not a function

var expressedFunction = function () {
  return "I'm expressed!";
};

console.log(expressedFunction()); // "I'm expressed!" - 现在可以调用

// 等价于以下代码（JavaScript 引擎的处理方式）
/*
var expressedFunction; // undefined

console.log(expressedFunction); // undefined
// console.log(expressedFunction()); // TypeError

expressedFunction = function() {
  return "I'm expressed!";
};

console.log(expressedFunction()); // "I'm expressed!"
*/
```

### let/const 声明的函数表达式

```javascript
// ❌ 使用 let/const 的函数表达式
// console.log(letFunction()); // ReferenceError: Cannot access 'letFunction' before initialization

const letFunction = function () {
  return "I'm a const function!";
};

// console.log(constFunction()); // ReferenceError: Cannot access 'constFunction' before initialization

let constFunction = function () {
  return "I'm a let function!";
};

// 箭头函数也是函数表达式
// console.log(arrowFunction()); // ReferenceError

const arrowFunction = () => {
  return "I'm an arrow function!";
};
```

---

## 问题 3：作用域和块级作用域

### 函数声明在块级作用域中的行为

```javascript
// 函数声明在块级作用域中的复杂行为
console.log(typeof blockFunction); // "undefined"

if (true) {
  console.log(typeof blockFunction); // "function" (在块内部)

  function blockFunction() {
    return "I'm in a block!";
  }

  console.log(blockFunction()); // "I'm in a block!"
}

// 在现代 JavaScript 中，块级函数声明的行为类似于 let
console.log(typeof blockFunction); // "function" (在某些环境中)

// 更安全的做法
if (true) {
  const safeBlockFunction = function () {
    return "I'm safely in a block!";
  };

  console.log(safeBlockFunction()); // "I'm safely in a block!"
}

// console.log(safeBlockFunction()); // ReferenceError: safeBlockFunction is not defined
```

### 严格模式下的差异

```javascript
"use strict";

// 严格模式下，块级函数声明不会提升到函数作用域
function testStrictMode() {
  // console.log(strictBlockFunction()); // ReferenceError

  if (true) {
    function strictBlockFunction() {
      return "Strict mode block function";
    }

    console.log(strictBlockFunction()); // "Strict mode block function"
  }

  // console.log(strictBlockFunction()); // ReferenceError
}

testStrictMode();
```

---

## 问题 4：条件创建和动态创建

### 条件创建函数

```javascript
// 函数声明 - 总是会被创建
function conditionalTest() {
  if (false) {
    function declaredFunction() {
      return "This will still be hoisted!";
    }
  }

  // 在某些环境中仍然可以访问
  console.log(typeof declaredFunction); // 可能是 "function"
}

// 函数表达式 - 只在条件满足时创建
function conditionalExpressionTest() {
  let expressedFunction;

  if (Math.random() > 0.5) {
    expressedFunction = function () {
      return "I'm conditionally created!";
    };
  } else {
    expressedFunction = function () {
      return "I'm the alternative!";
    };
  }

  return expressedFunction();
}

console.log(conditionalExpressionTest());
```

### 动态创建函数

```javascript
// 使用函数表达式动态创建函数
function createFunction(operation) {
  const operations = {
    add: function (a, b) {
      return a + b;
    },
    subtract: function (a, b) {
      return a - b;
    },
    multiply: function (a, b) {
      return a * b;
    },
    divide: function (a, b) {
      return b !== 0 ? a / b : "Cannot divide by zero";
    },
  };

  return (
    operations[operation] ||
    function () {
      return "Unknown operation";
    }
  );
}

const addFunction = createFunction("add");
const unknownFunction = createFunction("unknown");

console.log(addFunction(5, 3)); // 8
console.log(unknownFunction()); // "Unknown operation"

// 工厂模式创建函数
function createValidator(type) {
  const validators = {
    email: function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    phone: function (value) {
      return /^\d{10,11}$/.test(value);
    },
    required: function (value) {
      return value != null && value !== "";
    },
  };

  return validators[type];
}

const emailValidator = createValidator("email");
console.log(emailValidator("test@example.com")); // true
console.log(emailValidator("invalid-email")); // false
```

---

## 问题 5：性能和内存考虑

### 内存使用差异

```javascript
// 函数声明 - 在解析阶段创建
function performanceTest() {
  // 这些函数在函数解析时就已经创建
  function method1() {
    return "method1";
  }
  function method2() {
    return "method2";
  }
  function method3() {
    return "method3";
  }

  return {
    method1,
    method2,
    method3,
  };
}

// 函数表达式 - 在执行阶段创建
function performanceTestExpression() {
  // 这些函数在代码执行到这里时才创建
  const method1 = function () {
    return "method1";
  };
  const method2 = function () {
    return "method2";
  };
  const method3 = function () {
    return "method3";
  };

  return {
    method1,
    method2,
    method3,
  };
}

// 性能测试
function measurePerformance() {
  const iterations = 100000;

  // 测试函数声明
  console.time("Function Declaration");
  for (let i = 0; i < iterations; i++) {
    performanceTest();
  }
  console.timeEnd("Function Declaration");

  // 测试函数表达式
  console.time("Function Expression");
  for (let i = 0; i < iterations; i++) {
    performanceTestExpression();
  }
  console.timeEnd("Function Expression");
}

// measurePerformance();
```

### 闭包中的差异

```javascript
// 函数声明在闭包中的行为
function createCounterWithDeclaration() {
  let count = 0;

  // 函数声明会被提升
  return {
    increment: increment,
    decrement: decrement,
    getCount: getCount,
  };

  function increment() {
    count++;
    return count;
  }

  function decrement() {
    count--;
    return count;
  }

  function getCount() {
    return count;
  }
}

// 函数表达式在闭包中的行为
function createCounterWithExpression() {
  let count = 0;

  const increment = function () {
    count++;
    return count;
  };

  const decrement = function () {
    count--;
    return count;
  };

  const getCount = function () {
    return count;
  };

  return {
    increment,
    decrement,
    getCount,
  };
}

const counter1 = createCounterWithDeclaration();
const counter2 = createCounterWithExpression();

console.log(counter1.increment()); // 1
console.log(counter2.increment()); // 1
```

---

## 问题 6：实际应用场景

### 模块模式中的应用

```javascript
// 使用函数表达式的模块模式
const Calculator = (function () {
  // 私有变量
  let result = 0;

  // 私有函数（函数表达式）
  const validate = function (num) {
    return typeof num === "number" && !isNaN(num);
  };

  const logOperation = function (operation, num) {
    console.log(`${operation}: ${num}, Result: ${result}`);
  };

  // 公共接口
  return {
    add: function (num) {
      if (validate(num)) {
        result += num;
        logOperation("Add", num);
      }
      return this;
    },

    subtract: function (num) {
      if (validate(num)) {
        result -= num;
        logOperation("Subtract", num);
      }
      return this;
    },

    multiply: function (num) {
      if (validate(num)) {
        result *= num;
        logOperation("Multiply", num);
      }
      return this;
    },

    getResult: function () {
      return result;
    },

    reset: function () {
      result = 0;
      console.log("Calculator reset");
      return this;
    },
  };
})();

// 使用
Calculator.add(10).multiply(2).subtract(5);
console.log(Calculator.getResult()); // 15
```

### 事件处理中的应用

```javascript
// 函数声明 vs 函数表达式在事件处理中的应用
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  // 使用函数声明定义方法
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        callback(data);
      });
    }
  }
}

const eventManager = new EventManager();

// 使用函数表达式定义事件处理器
const userLoginHandler = function (userData) {
  console.log("User logged in:", userData.username);
  // 可以在这里访问外部变量
};

const userLogoutHandler = function (userData) {
  console.log("User logged out:", userData.username);
};

// 注册事件处理器
eventManager.addEventListener("login", userLoginHandler);
eventManager.addEventListener("logout", userLogoutHandler);

// 触发事件
eventManager.emit("login", { username: "alice", id: 1 });
eventManager.emit("logout", { username: "alice", id: 1 });
```

### 递归函数的差异

```javascript
// 函数声明的递归
function factorialDeclaration(n) {
  if (n <= 1) return 1;
  return n * factorialDeclaration(n - 1);
}

// 匿名函数表达式的递归（需要使用 arguments.callee 或外部变量）
const factorialExpression = function (n) {
  if (n <= 1) return 1;
  return n * arguments.callee(n - 1); // 严格模式下不可用
};

// 具名函数表达式的递归（推荐）
const factorialNamed = function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 可以使用函数名进行递归
};

// 箭头函数的递归（需要使用外部变量）
const factorialArrow = (n) => {
  if (n <= 1) return 1;
  return n * factorialArrow(n - 1);
};

console.log(factorialDeclaration(5)); // 120
console.log(factorialExpression(5)); // 120
console.log(factorialNamed(5)); // 120
console.log(factorialArrow(5)); // 120
```

---

## 问题 7：最佳实践和选择指南

### 何时使用函数声明

```javascript
// ✅ 适合使用函数声明的场景

// 1. 工具函数和辅助函数
function formatDate(date) {
  return date.toLocaleDateString();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 2. 主要的业务逻辑函数
function processUserData(userData) {
  // 可以在定义前调用其他声明的函数
  const isValid = validateUserData(userData);
  if (!isValid) return null;

  return {
    ...userData,
    processedAt: formatDate(new Date()),
  };
}

function validateUserData(userData) {
  return userData && userData.email && validateEmail(userData.email);
}

// 3. 递归函数
function traverseTree(node, callback) {
  callback(node);
  if (node.children) {
    node.children.forEach((child) => traverseTree(child, callback));
  }
}
```

### 何时使用函数表达式

```javascript
// ✅ 适合使用函数表达式的场景

// 1. 条件性创建函数
const apiClient = (function () {
  const isProduction = process.env.NODE_ENV === "production";

  const request = isProduction
    ? function (url) {
        /* 生产环境实现 */
      }
    : function (url) {
        /* 开发环境实现 */
      };

  return { request };
})();

// 2. 作为参数传递的函数
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(function (num) {
  return num * 2;
});

const filtered = numbers.filter((num) => num > 3);

// 3. 对象方法
const calculator = {
  result: 0,

  add: function (num) {
    this.result += num;
    return this;
  },

  multiply: function (num) {
    this.result *= num;
    return this;
  },

  // 箭头函数不适合作为对象方法（this 绑定问题）
  getValue: function () {
    return this.result;
  },
};

// 4. 闭包和私有作用域
const createCounter = function () {
  let count = 0;

  return {
    increment: function () {
      return ++count;
    },
    decrement: function () {
      return --count;
    },
    getCount: function () {
      return count;
    },
  };
};
```

### 现代 JavaScript 的推荐做法

```javascript
// 现代 JavaScript 推荐的函数定义方式

// 1. 顶层工具函数 - 使用函数声明
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 2. 模块导出 - 使用函数声明或 const + 箭头函数
export function publicUtility(data) {
  return processData(data);
}

export const anotherUtility = (data) => {
  return transformData(data);
};

// 3. 类方法 - 使用方法简写
class DataProcessor {
  constructor(options) {
    this.options = options;
  }

  // 方法简写（推荐）
  process(data) {
    return this.transform(data);
  }

  transform(data) {
    return data.map((item) => this.processItem(item));
  }

  // 箭头函数作为类字段（保持 this 绑定）
  processItem = (item) => {
    return {
      ...item,
      processed: true,
      timestamp: Date.now(),
    };
  };
}

// 4. 异步函数
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
}

const fetchUserDataExpression = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw error;
  }
};
```

---

## 总结

### 主要区别对比

| 特性           | 函数声明                 | 函数表达式                   |
| -------------- | ------------------------ | ---------------------------- |
| **提升**       | 完全提升，可在声明前调用 | 不提升，只有变量声明提升     |
| **语法**       | `function name() {}`     | `const name = function() {}` |
| **块级作用域** | 复杂的提升行为           | 遵循 let/const 规则          |
| **条件创建**   | 总是创建（提升）         | 只在执行时创建               |
| **递归**       | 可直接使用函数名         | 需要具名表达式或外部引用     |
| **性能**       | 解析时创建               | 执行时创建                   |

### 选择建议

```javascript
// ✅ 使用函数声明的场景
// - 顶层工具函数
// - 主要业务逻辑函数
// - 需要提升的函数
// - 递归函数

function utilityFunction() {
  // 工具函数
}

// ✅ 使用函数表达式的场景
// - 条件性创建
// - 作为参数传递
// - 对象方法
// - 需要严格控制创建时机

const conditionalFunction = condition
  ? function () {
      /* 实现A */
    }
  : function () {
      /* 实现B */
    };

// ✅ 现代推荐
// - 优先使用 const + 箭头函数
// - 需要 this 绑定时使用 function
// - 类中使用方法简写

const modernFunction = (param) => {
  return processParam(param);
};
```

### 最佳实践

1. **一致性**：在同一项目中保持函数定义风格的一致性
2. **可读性**：选择最能表达意图的方式
3. **性能考虑**：在性能敏感的场景中考虑提升的影响
4. **现代语法**：优先使用 ES6+ 的语法特性
5. **工具支持**：考虑 ESLint 等工具的规则配置

理解函数声明和函数表达式的区别，能够帮助你写出更可预测、更高效的 JavaScript 代码，避免因提升机制导致的意外行为。
