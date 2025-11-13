---
title: 什么是匿名函数？
category: JavaScript
difficulty: 入门
updatedAt: 2025-01-09
summary: >-
  深入理解匿名函数的概念和特点，掌握匿名函数的各种使用场景，学会在合适的情况下使用匿名函数。
tags:
  - 匿名函数
  - 函数表达式
  - 回调函数
  - 闭包
estimatedTime: 20 分钟
keywords:
  - 匿名函数
  - 函数表达式
  - 回调函数
  - IIFE
highlight: 理解匿名函数的定义和特点，掌握匿名函数在回调、事件处理、IIFE 等场景中的应用
order: 43
---

## 问题 1：什么是匿名函数？

**匿名函数定义**

匿名函数是指没有名称的函数。在 JavaScript 中，函数可以不需要名称就能被创建和使用。

### 匿名函数 vs 具名函数

```javascript
// 具名函数（函数声明）
function namedFunction() {
  console.log("这是一个具名函数");
}

// 匿名函数（函数表达式）
const anonymousFunction = function () {
  console.log("这是一个匿名函数");
};

// 箭头函数（也是匿名函数）
const arrowFunction = () => {
  console.log("这是一个箭头函数（匿名）");
};

// 调用方式相同
namedFunction(); // 这是一个具名函数
anonymousFunction(); // 这是一个匿名函数
arrowFunction(); // 这是一个箭头函数（匿名）
```

### 匿名函数的特点

```javascript
// 1. 没有函数名
const func1 = function () {
  console.log("匿名函数");
};

// 2. 不会发生函数提升
console.log(typeof namedFunc); // 'function' (函数声明会提升)
console.log(typeof anonymousFunc); // 'undefined' (变量提升，但值为 undefined)

function namedFunc() {}
var anonymousFunc = function () {};

// 3. 可以立即执行
(function () {
  console.log("立即执行的匿名函数");
})();

// 4. 可以作为参数传递
function processCallback(callback) {
  callback();
}

processCallback(function () {
  console.log("作为参数的匿名函数");
});

// 5. 可以作为返回值
function createFunction() {
  return function () {
    console.log("作为返回值的匿名函数");
  };
}

const returnedFunc = createFunction();
returnedFunc();
```

---

## 问题 2：匿名函数的创建方式

### 函数表达式

```javascript
// 1. 基本函数表达式
const add = function (a, b) {
  return a + b;
};

// 2. 赋值给变量
let multiply = function (x, y) {
  return x * y;
};

// 3. 赋值给对象属性
const calculator = {
  subtract: function (a, b) {
    return a - b;
  },
  divide: function (a, b) {
    return a / b;
  },
};

// 4. 赋值给数组元素
const operations = [
  function (a, b) {
    return a + b;
  }, // 加法
  function (a, b) {
    return a - b;
  }, // 减法
  function (a, b) {
    return a * b;
  }, // 乘法
  function (a, b) {
    return a / b;
  }, // 除法
];

console.log(operations[0](5, 3)); // 8
console.log(operations[1](5, 3)); // 2
```

### 箭头函数

```javascript
// 1. 基本箭头函数
const greet = () => {
  console.log("Hello!");
};

// 2. 带参数的箭头函数
const square = (x) => {
  return x * x;
};

// 3. 简化语法
const double = (x) => x * 2; // 单参数可省略括号
const sum = (a, b) => a + b; // 单表达式可省略大括号和 return

// 4. 返回对象（需要用括号包裹）
const createUser = (name, age) => ({
  name: name,
  age: age,
  id: Math.random(),
});

// 5. 高阶函数中的箭头函数
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((x) => x * 2);
const evens = numbers.filter((x) => x % 2 === 0);
const total = numbers.reduce((sum, x) => sum + x, 0);

console.log(doubled); // [2, 4, 6, 8, 10]
console.log(evens); // [2, 4]
console.log(total); // 15
```

### 立即执行函数表达式 (IIFE)

```javascript
// 1. 基本 IIFE
(function () {
  console.log("立即执行的匿名函数");
})();

// 2. 带参数的 IIFE
(function (name) {
  console.log("Hello, " + name);
})("World");

// 3. 返回值的 IIFE
const result = (function (a, b) {
  return a + b;
})(5, 3);

console.log(result); // 8

// 4. 箭头函数的 IIFE
(() => {
  console.log("箭头函数的 IIFE");
})();

// 5. 模块模式的 IIFE
const MyModule = (function () {
  let privateVariable = 0;

  function privateFunction() {
    console.log("私有函数");
  }

  return {
    publicMethod: function () {
      privateVariable++;
      console.log("公共方法，私有变量值：" + privateVariable);
    },
    getPrivateValue: function () {
      return privateVariable;
    },
  };
})();

MyModule.publicMethod(); // 公共方法，私有变量值：1
console.log(MyModule.getPrivateValue()); // 1
```

---

## 问题 3：匿名函数的使用场景

### 场景 1：回调函数

```javascript
// 1. 数组方法中的回调
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 35 },
];

// 使用匿名函数作为回调
const adults = users.filter(function (user) {
  return user.age >= 18;
});

const names = users.map(function (user) {
  return user.name;
});

// 使用箭头函数（更简洁）
const youngAdults = users.filter((user) => user.age < 30);
const ages = users.map((user) => user.age);

// 2. 定时器回调
setTimeout(function () {
  console.log("3秒后执行");
}, 3000);

// 3. 事件处理回调
document.addEventListener("click", function (event) {
  console.log("页面被点击了");
});

// 4. Promise 回调
fetch("/api/data")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    console.log("数据：", data);
  })
  .catch(function (error) {
    console.error("错误：", error);
  });

// 使用箭头函数的 Promise 链
fetch("/api/data")
  .then((response) => response.json())
  .then((data) => console.log("数据：", data))
  .catch((error) => console.error("错误：", error));
```

### 场景 2：事件处理

```javascript
// 1. DOM 事件处理
const button = document.getElementById("myButton");

// 匿名函数作为事件处理器
button.addEventListener("click", function () {
  console.log("按钮被点击了");
});

// 箭头函数作为事件处理器
button.addEventListener("mouseover", () => {
  console.log("鼠标悬停在按钮上");
});

// 2. 事件委托
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete-btn")) {
    console.log("删除按钮被点击");
  }
});

// 3. 自定义事件
const eventEmitter = {
  events: {},

  on: function (event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },

  emit: function (event, data) {
    if (this.events[event]) {
      this.events[event].forEach(function (callback) {
        callback(data);
      });
    }
  },
};

// 使用匿名函数注册事件监听器
eventEmitter.on("userLogin", function (user) {
  console.log("用户登录：", user.name);
});

eventEmitter.on("userLogin", function (user) {
  console.log("记录登录时间：", new Date());
});

eventEmitter.emit("userLogin", { name: "Alice" });
```

### 场景 3：高阶函数

```javascript
// 1. 函数作为参数
function processArray(arr, processor) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(processor(arr[i], i));
  }
  return result;
}

// 使用匿名函数
const numbers = [1, 2, 3, 4, 5];
const squared = processArray(numbers, function (num) {
  return num * num;
});

const indexed = processArray(numbers, function (num, index) {
  return `${index}: ${num}`;
});

console.log(squared); // [1, 4, 9, 16, 25]
console.log(indexed); // ['0: 1', '1: 2', '2: 3', '3: 4', '4: 5']

// 2. 函数作为返回值
function createMultiplier(factor) {
  return function (number) {
    return number * factor;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(4)); // 12

// 3. 柯里化
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function (...nextArgs) {
        return curried(...args, ...nextArgs);
      };
    }
  };
}

const add = function (a, b, c) {
  return a + b + c;
};

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
```

### 场景 4：闭包和私有变量

```javascript
// 1. 创建私有变量
function createCounter() {
  let count = 0;

  return {
    increment: function () {
      count++;
      return count;
    },
    decrement: function () {
      count--;
      return count;
    },
    getCount: function () {
      return count;
    },
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount()); // 2

// 2. 模块模式
const Calculator = (function () {
  let history = [];

  function addToHistory(operation, result) {
    history.push({ operation, result, timestamp: new Date() });
  }

  return {
    add: function (a, b) {
      const result = a + b;
      addToHistory(`${a} + ${b}`, result);
      return result;
    },

    subtract: function (a, b) {
      const result = a - b;
      addToHistory(`${a} - ${b}`, result);
      return result;
    },

    getHistory: function () {
      return [...history]; // 返回副本
    },

    clearHistory: function () {
      history = [];
    },
  };
})();

console.log(Calculator.add(5, 3)); // 8
console.log(Calculator.subtract(10, 4)); // 6
console.log(Calculator.getHistory()); // 历史记录数组
```

### 场景 5：函数式编程

```javascript
// 1. 函数组合
const compose =
  (...fns) =>
  (value) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

const addOne = (x) => x + 1;
const multiplyByTwo = (x) => x * 2;
const square = (x) => x * x;

const pipeline = compose(square, multiplyByTwo, addOne);
console.log(pipeline(3)); // ((3 + 1) * 2)² = 64

// 2. 偏函数应用
const partial =
  (fn, ...args1) =>
  (...args2) =>
    fn(...args1, ...args2);

const multiply = (a, b, c) => a * b * c;
const multiplyByTwo = partial(multiply, 2);
const multiplyByTwoAndThree = partial(multiply, 2, 3);

console.log(multiplyByTwo(3, 4)); // 2 * 3 * 4 = 24
console.log(multiplyByTwoAndThree(5)); // 2 * 3 * 5 = 30

// 3. 函数管道
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

const processData = pipe(
  (data) => data.filter((x) => x > 0), // 过滤正数
  (data) => data.map((x) => x * 2), // 乘以2
  (data) => data.reduce((sum, x) => sum + x, 0) // 求和
);

const numbers = [-1, 2, -3, 4, 5];
console.log(processData(numbers)); // (2 + 4 + 5) * 2 = 22
```

---

## 问题 4：匿名函数的优缺点

### 优点

```javascript
// 1. 简洁性 - 减少代码量
const numbers = [1, 2, 3, 4, 5];

// 使用匿名函数
const doubled = numbers.map((x) => x * 2);

// 如果使用具名函数
function doubleNumber(x) {
  return x * 2;
}
const doubled2 = numbers.map(doubleNumber);

// 2. 避免全局命名空间污染
// 匿名函数不会在全局作用域中创建变量名

// 3. 适合一次性使用的场景
setTimeout(() => {
  console.log("只执行一次的代码");
}, 1000);

// 4. 支持闭包
function createHandler(message) {
  return function () {
    console.log(message);
  };
}

const handler = createHandler("Hello World");
handler(); // Hello World

// 5. 函数式编程风格
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 30 },
];

const adultNames = users
  .filter((user) => user.age >= 18)
  .map((user) => user.name)
  .sort();

console.log(adultNames); // ['Alice', 'Charlie']
```

### 缺点

```javascript
// 1. 调试困难 - 匿名函数在调用栈中显示为 "anonymous"
function problematicCode() {
  const operations = [
    function (x) {
      throw new Error("Error in operation 1");
    },
    function (x) {
      throw new Error("Error in operation 2");
    },
    function (x) {
      throw new Error("Error in operation 3");
    },
  ];

  operations[1](5); // 错误信息中显示 "anonymous function"
}

// 更好的做法：给函数命名
function betterCode() {
  const operations = [
    function operation1(x) {
      throw new Error("Error in operation 1");
    },
    function operation2(x) {
      throw new Error("Error in operation 2");
    },
    function operation3(x) {
      throw new Error("Error in operation 3");
    },
  ];

  operations[1](5); // 错误信息中显示 "operation2"
}

// 2. 无法递归调用自身
// ❌ 匿名函数无法直接递归
const factorial = function (n) {
  if (n <= 1) return 1;
  // return n * factorial(n - 1); // 这样可以工作，但依赖外部变量名
  // return n * arguments.callee(n - 1); // arguments.callee 已废弃
};

// ✅ 具名函数表达式可以递归
const factorial2 = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1); // 可以使用函数名 fact
};

// 3. 不利于代码复用
// 如果同样的逻辑需要在多处使用，匿名函数需要重复定义

// ❌ 重复的匿名函数
const result1 = data.filter((item) => item.active && item.age > 18);
const result2 = otherData.filter((item) => item.active && item.age > 18);

// ✅ 提取为具名函数
function isActiveAdult(item) {
  return item.active && item.age > 18;
}

const result3 = data.filter(isActiveAdult);
const result4 = otherData.filter(isActiveAdult);
```

### 最佳实践

```javascript
// 1. 简单的一次性操作使用匿名函数
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, num) => acc + num, 0);

// 2. 复杂逻辑或需要复用的使用具名函数
function calculateTax(income, rate) {
  if (income <= 0) return 0;
  return income * rate;
}

const taxes = incomes.map((income) => calculateTax(income, 0.2));

// 3. 调试时给匿名函数命名
const processData = (data) => {
  return data
    .filter(function isValid(item) {
      return item && item.id;
    })
    .map(function transform(item) {
      return {
        id: item.id,
        name: item.name.toUpperCase(),
      };
    });
};

// 4. 使用箭头函数简化语法
const users = [
  { name: "Alice", posts: 5 },
  { name: "Bob", posts: 3 },
  { name: "Charlie", posts: 8 },
];

// 简洁的链式调用
const topUsers = users
  .filter((user) => user.posts > 4)
  .sort((a, b) => b.posts - a.posts)
  .map((user) => user.name);

console.log(topUsers); // ['Charlie', 'Alice']

// 5. 在需要 this 绑定时谨慎使用箭头函数
const obj = {
  name: "MyObject",

  // ✅ 普通方法
  regularMethod: function () {
    console.log(this.name); // 'MyObject'
  },

  // ❌ 箭头函数方法
  arrowMethod: () => {
    console.log(this.name); // undefined (this 不指向 obj)
  },
};
```

---

## 总结

**匿名函数的核心特点**：

1. **定义**：没有名称的函数，通过函数表达式或箭头函数创建
2. **特性**：不会发生函数提升，可以立即执行，适合作为参数和返回值
3. **创建方式**：函数表达式、箭头函数、IIFE

**主要使用场景**：

1. **回调函数**：数组方法、事件处理、异步操作
2. **事件处理**：DOM 事件、自定义事件
3. **高阶函数**：函数作为参数或返回值
4. **闭包**：创建私有变量和模块
5. **函数式编程**：函数组合、管道操作

**优缺点对比**：

**优点**：

- 代码简洁，减少命名空间污染
- 适合一次性使用的场景
- 支持闭包和函数式编程

**缺点**：

- 调试困难，错误信息不明确
- 无法直接递归调用
- 不利于代码复用

**使用建议**：

1. **简单操作**：使用匿名函数，特别是箭头函数
2. **复杂逻辑**：使用具名函数，便于调试和复用
3. **调试需要**：给匿名函数命名或使用具名函数表达式
4. **this 绑定**：注意箭头函数的 this 绑定特性
5. **代码可读性**：在简洁性和可读性之间找到平衡

匿名函数是 JavaScript 中非常重要的概念，掌握其特点和使用场景能够让你写出更简洁、更优雅的代码。
