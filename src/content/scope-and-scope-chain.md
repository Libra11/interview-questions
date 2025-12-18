---
title: 作用域和作用域链
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-13
summary: >-
  深入理解 JavaScript 作用域和作用域链的核心机制，掌握变量查找、闭包形成的底层原理。
tags:
  - 作用域
  - 作用域链
  - 闭包
  - 词法作用域
  - 变量查找
estimatedTime: 30 分钟
keywords:
  - 作用域
  - 作用域链
  - 词法作用域
  - 闭包
  - 变量查找
highlight: 理解 JavaScript 作用域的本质和作用域链的查找机制，掌握闭包产生的根本原因
order: 248
---

## 问题 1：什么是作用域？JavaScript 有哪些作用域类型？

**答案：作用域是变量和函数的可访问范围，JavaScript 有全局作用域、函数作用域和块级作用域**

### 作用域类型

#### 1. 全局作用域

```javascript
var globalVar = "global";
function globalFunc() {}

// 在任何地方都可以访问
console.log(globalVar); // 'global'
```

#### 2. 函数作用域

```javascript
function outer() {
  var functionScoped = "function";

  function inner() {
    console.log(functionScoped); // 可以访问
  }
}

console.log(functionScoped); // ReferenceError
```

#### 3. 块级作用域（ES6+）

```javascript
{
  let blockScoped = "block";
  const alsoBlockScoped = "block";
  var notBlockScoped = "function"; // var 不受块级作用域限制
}

console.log(blockScoped); // ReferenceError
console.log(notBlockScoped); // 'function'
```

### 作用域的本质

作用域本质上是一个**变量存储和查找的规则系统**：

- **存储规则**：变量在哪里创建和存储
- **查找规则**：如何查找和访问变量
- **访问权限**：哪些代码可以访问哪些变量

---

## 问题 2：什么是词法作用域？

**答案：词法作用域是指作用域在代码编写时就确定了，而不是在运行时确定**

### 词法作用域的特点

```javascript
var x = "global";

function outer() {
  var x = "outer";

  function inner() {
    console.log(x); // 'outer' - 由定义位置决定，不是调用位置
  }

  return inner;
}

var fn = outer();
fn(); // 'outer' - 词法作用域，查找定义时的环境
```

### 与动态作用域的对比

```javascript
// JavaScript 使用词法作用域
function foo() {
  console.log(a); // 查找定义时的作用域
}

function bar() {
  var a = 3;
  foo(); // 如果是动态作用域，这里会输出 3
}

var a = 2;
bar(); // 输出 2 - 词法作用域
```

---

## 问题 3：什么是作用域链？变量查找是如何进行的？

**答案：作用域链是由当前作用域及其所有父作用域组成的链式结构，变量查找沿着这个链向上进行**

### 作用域链的形成

```javascript
var global = "global";

function level1() {
  var level1Var = "level1";

  function level2() {
    var level2Var = "level2";

    function level3() {
      var level3Var = "level3";

      // 作用域链：level3 -> level2 -> level1 -> global
      console.log(level3Var); // 当前作用域
      console.log(level2Var); // 父作用域
      console.log(level1Var); // 祖父作用域
      console.log(global); // 全局作用域
    }

    return level3;
  }

  return level2;
}
```

### 变量查找机制

```javascript
function outer() {
  var a = 1;
  var b = 2;

  function inner() {
    var b = 3; // 遮蔽外层的 b
    var c = 4;

    console.log(a); // 1 - 向上查找到 outer 作用域
    console.log(b); // 3 - 当前作用域找到，停止查找
    console.log(c); // 4 - 当前作用域
    console.log(d); // ReferenceError - 整个链都没找到
  }

  return inner;
}
```

### 查找规则

1. **从当前作用域开始**：首先在当前执行上下文中查找
2. **逐级向上查找**：如果没找到，向父作用域查找
3. **直到全局作用域**：一直查找到全局作用域
4. **找到即停止**：找到第一个匹配的变量就停止查找
5. **未找到报错**：如果整个链都没找到，抛出 ReferenceError

---

## 问题 4：作用域链是如何在内存中存储的？

**答案：作用域链通过执行上下文的外部环境引用（Outer Environment Reference）来维护**

### 执行上下文与作用域链

```javascript
// 每个执行上下文都包含：
ExecutionContext = {
  LexicalEnvironment: {
    EnvironmentRecord: {}, // 存储变量和函数声明
    OuterEnvironmentReference: null, // 指向外部作用域
  },
  VariableEnvironment: {},
  ThisBinding: {},
};
```

### 作用域链的构建过程

```javascript
function createCounter() {
  var count = 0; // 存储在 createCounter 的环境记录中

  return function increment() {
    count++; // 通过作用域链访问外部变量
    return count;
  };
}

// 内存结构示意：
// increment 执行上下文 -> createCounter 执行上下文 -> 全局执行上下文
```

### 闭包与作用域链

```javascript
function outer(x) {
  return function inner(y) {
    return x + y; // inner 保持对 outer 作用域的引用
  };
}

var add5 = outer(5);
// add5 函数对象内部保存了指向 outer 作用域的引用
// 即使 outer 执行完毕，其作用域仍然被 inner 引用着
```

---

## 问题 5：let/const 的块级作用域是如何实现的？

**答案：let/const 通过创建新的词法环境来实现块级作用域，每个块都有独立的环境记录**

### 块级作用域的实现

```javascript
function example() {
  var a = 1;

  {
    // 新的词法环境
    let b = 2;
    const c = 3;

    {
      // 又一个新的词法环境
      let d = 4;
      console.log(a, b, c, d); // 1, 2, 3, 4
    }

    console.log(d); // ReferenceError
  }

  console.log(b); // ReferenceError
}
```

### 暂时性死区（TDZ）

```javascript
function example() {
  console.log(a); // undefined - var 声明提升
  console.log(b); // ReferenceError - TDZ

  var a = 1;
  let b = 2;
}

// let/const 在声明前访问会进入暂时性死区
```

### for 循环中的块级作用域

```javascript
// var 版本 - 共享同一个作用域
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// let 版本 - 每次迭代创建新的块级作用域
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

---

## 问题 6：作用域链对性能有什么影响？

**答案：作用域链越长，变量查找越慢；频繁访问外层变量会影响性能**

### 性能影响因素

#### 1. 查找深度

```javascript
// 性能较差 - 需要向上查找多层
function level1() {
  var data = getData();

  function level2() {
    function level3() {
      function level4() {
        return data.length; // 需要查找 4 层
      }
      return level4;
    }
    return level3;
  }
  return level2;
}

// 性能优化 - 缓存外层变量
function level1() {
  var data = getData();

  function level2() {
    var cachedData = data; // 缓存到当前作用域

    function level3() {
      function level4() {
        return cachedData.length; // 只需查找 1 层
      }
      return level4;
    }
    return level3;
  }
  return level2;
}
```

#### 2. with 语句的性能问题

```javascript
// 避免使用 with - 会动态改变作用域链
var obj = { a: 1, b: 2 };

// 性能差
with (obj) {
  console.log(a + b); // 作用域链被动态修改
}

// 性能好
console.log(obj.a + obj.b);
```

#### 3. try-catch 的影响

```javascript
// catch 块会创建新的作用域
try {
  riskyOperation();
} catch (e) {
  // e 只在这个块中可见
  console.log(e.message);
}
```

### 优化建议

1. **减少作用域链深度**：避免过深的嵌套
2. **缓存外层变量**：频繁使用的外层变量缓存到当前作用域
3. **避免 with 语句**：不要动态修改作用域链
4. **合理使用闭包**：避免不必要的闭包创建

---

## 总结

作用域和作用域链的核心要点：

1. **作用域本质**：变量存储和查找的规则系统
2. **词法作用域**：作用域在编写时确定，不是运行时
3. **作用域链**：由当前作用域到全局作用域的引用链
4. **查找机制**：从内向外逐级查找，找到即停止
5. **块级作用域**：let/const 通过新词法环境实现
6. **性能考虑**：作用域链长度影响变量查找效率

理解这些概念是掌握闭包、变量提升、模块化等高级特性的基础。
