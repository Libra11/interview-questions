---
title: JS 执行上下文的生命周期阶段有哪些
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 执行上下文的完整生命周期，包括创建阶段、执行阶段和销毁阶段的详细过程。
tags:
  - 执行上下文
  - 生命周期
  - 变量提升
  - 作用域链
estimatedTime: 35 分钟
keywords:
  - 执行上下文
  - 生命周期
  - 创建阶段
  - 执行阶段
  - 变量环境
highlight: 掌握执行上下文生命周期的各个阶段，理解 JavaScript 代码执行的底层机制
order: 57
---

## 问题 1：执行上下文生命周期概述

### 执行上下文的三个阶段

```javascript
// 执行上下文生命周期演示
function demonstrateLifecycle() {
  // 阶段1：创建阶段 (Creation Phase)
  // - 创建变量环境 (Variable Environment)
  // - 创建词法环境 (Lexical Environment)
  // - 确定 this 绑定
  // - 变量和函数提升

  console.log("=== 创建阶段完成，开始执行阶段 ===");

  // 阶段2：执行阶段 (Execution Phase)
  // - 逐行执行代码
  // - 变量赋值
  // - 函数调用

  var hoistedVar = "I am hoisted";
  let blockScoped = "I am block scoped";
  const constant = "I am constant";

  function innerFunction() {
    console.log("Inner function executed");
  }

  innerFunction();

  console.log("=== 执行阶段完成 ===");

  // 阶段3：销毁阶段 (Destruction Phase)
  // - 执行上下文从执行栈中弹出
  // - 垃圾回收清理不再使用的变量
}

demonstrateLifecycle();
```

---

## 问题 2：创建阶段 (Creation Phase)

### 变量环境和词法环境的创建

```javascript
// 创建阶段的详细过程演示
function creationPhaseDemo() {
  // 在创建阶段，JavaScript 引擎会：

  // 1. 创建变量环境 (Variable Environment)
  console.log("var 变量在创建阶段:", typeof varVariable); // "undefined"
  console.log("函数声明在创建阶段:", typeof functionDeclaration); // "function"

  // 2. 创建词法环境 (Lexical Environment)
  try {
    console.log("let 变量在创建阶段:", letVariable); // ReferenceError
  } catch (error) {
    console.log("let 变量错误:", error.message);
  }

  try {
    console.log("const 变量在创建阶段:", constVariable); // ReferenceError
  } catch (error) {
    console.log("const 变量错误:", error.message);
  }

  // 3. 函数声明被完全提升
  console.log("调用提升的函数:", functionDeclaration()); // "I'm hoisted!"

  // 4. 变量声明（var）被提升，但赋值不会
  var varVariable = "I am a var";

  // 5. let 和 const 在暂时性死区
  let letVariable = "I am a let";
  const constVariable = "I am a const";

  // 6. 函数声明
  function functionDeclaration() {
    return "I'm hoisted!";
  }

  // 7. 函数表达式不会被提升
  console.log("函数表达式:", typeof functionExpression); // "undefined"
  var functionExpression = function () {
    return "I'm not hoisted!";
  };
}

creationPhaseDemo();
```

### 作用域链的建立

```javascript
// 作用域链在创建阶段的建立
var globalVar = "Global";

function outerFunction(outerParam) {
  var outerVar = "Outer";

  function middleFunction(middleParam) {
    var middleVar = "Middle";

    function innerFunction(innerParam) {
      var innerVar = "Inner";

      // 在创建阶段，作用域链已经建立：
      // innerFunction 的作用域链：
      // [innerFunction的变量环境] -> [middleFunction的变量环境] -> [outerFunction的变量环境] -> [全局变量环境]

      console.log("=== 作用域链访问测试 ===");
      console.log("innerVar:", innerVar); // 当前作用域
      console.log("innerParam:", innerParam); // 当前作用域
      console.log("middleVar:", middleVar); // 上级作用域
      console.log("middleParam:", middleParam); // 上级作用域
      console.log("outerVar:", outerVar); // 上上级作用域
      console.log("outerParam:", outerParam); // 上上级作用域
      console.log("globalVar:", globalVar); // 全局作用域

      // 展示作用域链的查找过程
      function showScopeChain() {
        console.log("=== 作用域链查找过程 ===");

        // 查找 innerVar - 在当前作用域找到
        console.log("1. 查找 innerVar - 在当前作用域找到");

        // 查找 middleVar - 需要向上查找
        console.log("2. 查找 middleVar - 向上查找到 middleFunction 作用域");

        // 查找 globalVar - 需要查找到全局作用域
        console.log("3. 查找 globalVar - 向上查找到全局作用域");

        // 查找不存在的变量
        try {
          console.log("4. 查找 nonExistent:", nonExistent);
        } catch (error) {
          console.log(
            "4. 查找 nonExistent - 在整个作用域链中都未找到:",
            error.message
          );
        }
      }

      showScopeChain();
    }

    return innerFunction;
  }

  return middleFunction;
}

const inner = outerFunction("outer-param")("middle-param");
inner("inner-param");
```

### this 绑定的确定

```javascript
// this 绑定在创建阶段的确定
console.log("=== this 绑定演示 ===");

// 全局执行上下文中的 this
console.log("全局 this:", this === globalThis); // true (Node.js) 或 window (浏览器)

// 函数执行上下文中的 this
function regularFunction() {
  console.log("普通函数中的 this:", this === globalThis); // 非严格模式下为 true
}

function strictFunction() {
  "use strict";
  console.log("严格模式函数中的 this:", this); // undefined
}

// 对象方法中的 this
const obj = {
  name: "Object",
  method: function () {
    console.log("对象方法中的 this:", this === obj); // true
    console.log("this.name:", this.name); // "Object"
  },

  arrowMethod: () => {
    console.log("箭头函数方法中的 this:", this === globalThis); // true
  },
};

// 构造函数中的 this
function Constructor(name) {
  this.name = name;
  console.log("构造函数中的 this:", this instanceof Constructor); // true
}

// 测试不同情况下的 this 绑定
regularFunction();
strictFunction();
obj.method();
obj.arrowMethod();
new Constructor("Instance");

// call/apply/bind 改变 this 绑定
const customThis = { name: "Custom" };
obj.method.call(customThis); // this 指向 customThis
```

---

## 问题 3：执行阶段 (Execution Phase)

### 代码逐行执行

```javascript
// 执行阶段的详细过程
function executionPhaseDemo() {
  console.log("=== 执行阶段开始 ===");

  // 1. 变量赋值
  console.log("1. 开始变量赋值");
  var step1 = "第一步完成";
  console.log("step1:", step1);

  let step2 = "第二步完成";
  console.log("step2:", step2);

  const step3 = "第三步完成";
  console.log("step3:", step3);

  // 2. 函数调用创建新的执行上下文
  console.log("2. 调用函数，创建新执行上下文");

  function nestedFunction(param) {
    console.log("  嵌套函数执行，参数:", param);

    // 这里又会创建新的执行上下文
    var nestedVar = "嵌套变量";
    console.log("  嵌套变量:", nestedVar);

    return "嵌套函数返回值";
  }

  const result = nestedFunction("传递的参数");
  console.log("函数返回值:", result);

  // 3. 条件执行
  console.log("3. 条件执行");
  if (true) {
    let blockVar = "块级变量";
    console.log("块级变量:", blockVar);
  }

  // 4. 循环执行
  console.log("4. 循环执行");
  for (let i = 0; i < 3; i++) {
    console.log("循环第", i + 1, "次");
  }

  console.log("=== 执行阶段结束 ===");
}

executionPhaseDemo();
```

### 变量赋值和更新

```javascript
// 变量在执行阶段的赋值和更新过程
function variableAssignmentDemo() {
  console.log("=== 变量赋值演示 ===");

  // var 变量的赋值
  console.log("var 变量赋值前:", varVariable); // undefined (已提升)
  var varVariable = "初始值";
  console.log("var 变量赋值后:", varVariable); // "初始值"

  varVariable = "更新值";
  console.log("var 变量更新后:", varVariable); // "更新值"

  // let 变量的赋值
  let letVariable = "let 初始值";
  console.log("let 变量赋值后:", letVariable); // "let 初始值"

  letVariable = "let 更新值";
  console.log("let 变量更新后:", letVariable); // "let 更新值"

  // const 变量的赋值（只能赋值一次）
  const constVariable = "const 值";
  console.log("const 变量赋值后:", constVariable); // "const 值"

  try {
    // constVariable = 'const 更新值'; // TypeError
  } catch (error) {
    console.log("const 变量更新错误:", error.message);
  }

  // 对象和数组的引用赋值
  const objRef = { name: "Original" };
  console.log("对象引用赋值后:", objRef);

  objRef.name = "Modified"; // 可以修改对象属性
  console.log("对象属性修改后:", objRef);

  const arrRef = [1, 2, 3];
  console.log("数组引用赋值后:", arrRef);

  arrRef.push(4); // 可以修改数组内容
  console.log("数组内容修改后:", arrRef);
}

variableAssignmentDemo();
```

### 函数调用和执行上下文栈

```javascript
// 函数调用时执行上下文栈的变化
function executionStackDemo() {
  console.log("=== 执行上下文栈演示 ===");

  function level1() {
    console.log("进入 level1 执行上下文");
    console.log("当前执行栈: [Global, level1]");

    function level2() {
      console.log("进入 level2 执行上下文");
      console.log("当前执行栈: [Global, level1, level2]");

      function level3() {
        console.log("进入 level3 执行上下文");
        console.log("当前执行栈: [Global, level1, level2, level3]");

        // 模拟执行上下文的变量访问
        var level3Var = "Level 3 Variable";
        console.log("level3Var:", level3Var);

        console.log("退出 level3 执行上下文");
        return "level3 返回值";
      }

      const result3 = level3();
      console.log("level3 返回值:", result3);
      console.log("当前执行栈: [Global, level1, level2]");

      console.log("退出 level2 执行上下文");
      return "level2 返回值";
    }

    const result2 = level2();
    console.log("level2 返回值:", result2);
    console.log("当前执行栈: [Global, level1]");

    console.log("退出 level1 执行上下文");
    return "level1 返回值";
  }

  const result1 = level1();
  console.log("level1 返回值:", result1);
  console.log("当前执行栈: [Global]");
}

executionStackDemo();
```

---

## 问题 4：销毁阶段 (Destruction Phase)

### 执行上下文的清理

```javascript
// 执行上下文销毁阶段的演示
function destructionPhaseDemo() {
  console.log("=== 销毁阶段演示 ===");

  function createContext() {
    // 创建大量变量和对象
    var largeArray = new Array(1000).fill("data");
    let objectData = {
      name: "Test Object",
      data: new Array(500).fill("more data"),
    };
    const functionData = function () {
      return "function data";
    };

    console.log("执行上下文创建完成，包含大量数据");
    console.log("largeArray 长度:", largeArray.length);
    console.log("objectData:", objectData.name);
    console.log("functionData:", functionData());

    // 函数执行完毕，准备销毁执行上下文
    console.log("函数即将结束，执行上下文将被销毁");

    return "context result";
  }

  // 调用函数，创建并销毁执行上下文
  const result = createContext();
  console.log("函数返回值:", result);
  console.log("执行上下文已销毁，变量已被清理");

  // 尝试访问已销毁上下文中的变量（当然会失败）
  try {
    // console.log(largeArray); // ReferenceError
  } catch (error) {
    console.log("无法访问已销毁上下文中的变量");
  }
}

destructionPhaseDemo();
```

### 闭包对销毁阶段的影响

```javascript
// 闭包如何影响执行上下文的销毁
function closureImpactDemo() {
  console.log("=== 闭包对销毁阶段的影响 ===");

  function createClosure() {
    var outerVar = "外部变量";
    var largeData = new Array(1000).fill("large data");
    var unusedData = new Array(1000).fill("unused data");

    console.log("创建闭包函数的执行上下文");

    // 返回闭包函数
    return function innerFunction() {
      // 只使用 outerVar，不使用 largeData 和 unusedData
      console.log("闭包中访问:", outerVar);
      return outerVar;
    };
  }

  // 创建闭包
  const closure = createClosure();
  console.log("createClosure 执行完毕");
  console.log("但由于闭包的存在，outerVar 不会被销毁");
  console.log("largeData 和 unusedData 可能会被垃圾回收（取决于 JS 引擎优化）");

  // 使用闭包
  console.log("调用闭包:", closure());

  // 演示没有闭包的情况
  function withoutClosure() {
    var localVar = "局部变量";
    var localData = new Array(1000).fill("local data");

    console.log("没有闭包的函数执行");
    console.log("localVar:", localVar);

    // 函数结束，没有返回闭包
  }

  withoutClosure();
  console.log("withoutClosure 执行完毕，所有变量都被销毁");
}

closureImpactDemo();
```

### 内存泄漏的预防

```javascript
// 预防执行上下文相关的内存泄漏
function memoryLeakPreventionDemo() {
  console.log("=== 内存泄漏预防演示 ===");

  // ❌ 可能导致内存泄漏的情况
  function potentialMemoryLeak() {
    var largeData = new Array(10000).fill("large data");

    // 全局变量引用，阻止垃圾回收
    globalThis.leakyReference = {
      data: largeData,
      timestamp: Date.now(),
    };

    // 循环引用
    var obj1 = {};
    var obj2 = {};
    obj1.ref = obj2;
    obj2.ref = obj1;

    console.log("创建了可能的内存泄漏");
  }

  // ✅ 正确的内存管理
  function properMemoryManagement() {
    var largeData = new Array(10000).fill("large data");

    // 使用局部变量，函数结束后自动清理
    var localReference = {
      data: largeData,
      timestamp: Date.now(),
    };

    // 处理数据
    console.log("处理数据，长度:", localReference.data.length);

    // 显式清理引用（可选）
    localReference = null;
    largeData = null;

    console.log("正确管理内存，变量将被自动清理");
  }

  // 演示清理全局引用
  function cleanupGlobalReferences() {
    // 清理之前创建的全局引用
    if (globalThis.leakyReference) {
      globalThis.leakyReference = null;
      console.log("清理全局引用");
    }
  }

  potentialMemoryLeak();
  properMemoryManagement();
  cleanupGlobalReferences();
}

memoryLeakPreventionDemo();
```

---

## 问题 5：执行上下文类型和特殊情况

### 不同类型执行上下文的生命周期

```javascript
// 不同类型执行上下文的生命周期差异
console.log("=== 不同类型执行上下文演示 ===");

// 1. 全局执行上下文
console.log("1. 全局执行上下文 - 程序开始时创建，程序结束时销毁");
var globalVar = "全局变量";

// 2. 函数执行上下文
function functionContext() {
  console.log("2. 函数执行上下文 - 函数调用时创建，函数返回时销毁");
  var functionVar = "函数变量";

  return functionVar;
}

// 3. eval 执行上下文（不推荐使用）
function evalContext() {
  console.log("3. eval 执行上下文 - eval 调用时创建");
  var evalVar = "用于 eval 的变量";

  // eval 创建新的执行上下文
  eval('console.log("eval 中的代码:", evalVar)');
}

// 4. 模块执行上下文（ES6 模块）
// 每个模块都有自己的执行上下文
console.log("4. 模块执行上下文 - 模块加载时创建");

functionContext();
evalContext();
```

### 异步代码的执行上下文

```javascript
// 异步代码中的执行上下文管理
function asyncContextDemo() {
  console.log("=== 异步执行上下文演示 ===");

  var outerVar = "外部变量";

  console.log("1. 同步代码执行");

  // setTimeout 创建新的执行上下文
  setTimeout(function timeoutCallback() {
    console.log("2. setTimeout 回调执行上下文");
    console.log("   可以访问外部变量:", outerVar);

    var timeoutVar = "setTimeout 变量";
    console.log("   setTimeout 变量:", timeoutVar);
  }, 100);

  // Promise 创建新的执行上下文
  Promise.resolve("Promise 值").then(function promiseCallback(value) {
    console.log("3. Promise 回调执行上下文");
    console.log("   Promise 值:", value);
    console.log("   可以访问外部变量:", outerVar);

    var promiseVar = "Promise 变量";
    console.log("   Promise 变量:", promiseVar);
  });

  // async/await 的执行上下文
  async function asyncFunction() {
    console.log("4. async 函数执行上下文开始");

    var asyncVar = "async 变量";
    console.log("   async 变量:", asyncVar);

    await new Promise((resolve) => setTimeout(resolve, 50));

    console.log("5. async 函数执行上下文恢复");
    console.log("   恢复后仍可访问:", asyncVar);
    console.log("   仍可访问外部变量:", outerVar);
  }

  asyncFunction();

  console.log("6. 主执行上下文继续");
}

asyncContextDemo();
```

---

## 问题 6：实际应用和调试

### 执行上下文的调试技巧

```javascript
// 调试执行上下文的技巧
function debuggingDemo() {
  console.log("=== 执行上下文调试演示 ===");

  function debugFunction(param1, param2) {
    // 1. 查看当前执行上下文的变量
    console.log("1. 当前执行上下文变量:");
    console.log("   参数 param1:", param1);
    console.log("   参数 param2:", param2);

    var localVar = "局部变量";
    let blockVar = "块级变量";
    const constVar = "常量";

    console.log("   局部变量:", localVar);
    console.log("   块级变量:", blockVar);
    console.log("   常量:", constVar);

    // 2. 查看作用域链
    console.log("2. 作用域链访问:");
    console.log(
      "   全局变量 globalVar:",
      typeof globalVar !== "undefined" ? globalVar : "未定义"
    );

    // 3. 查看 this 绑定
    console.log("3. this 绑定:", this);

    // 4. 使用 debugger 语句（在浏览器开发者工具中有效）
    // debugger; // 取消注释以在调试器中暂停

    // 5. 查看调用栈
    console.log("4. 调用栈信息:");
    console.trace("当前调用栈");

    function nestedDebug() {
      console.log("5. 嵌套函数执行上下文:");
      console.log("   可以访问外层变量:", localVar);
      console.log("   可以访问参数:", param1);

      // 再次查看调用栈
      console.trace("嵌套函数调用栈");
    }

    nestedDebug();
  }

  debugFunction("参数1", "参数2");
}

debuggingDemo();
```

### 性能优化相关的执行上下文

```javascript
// 执行上下文相关的性能优化
function performanceOptimizationDemo() {
  console.log("=== 执行上下文性能优化演示 ===");

  // ❌ 性能较差的写法
  function inefficientFunction() {
    // 在循环中创建大量执行上下文
    for (let i = 0; i < 1000; i++) {
      (function (index) {
        var temp = index * 2;
        return temp;
      })(i);
    }
  }

  // ✅ 性能较好的写法
  function efficientFunction() {
    // 避免不必要的函数调用和执行上下文创建
    var results = [];
    for (let i = 0; i < 1000; i++) {
      results.push(i * 2);
    }
    return results;
  }

  // 性能测试
  console.time("低效函数");
  inefficientFunction();
  console.timeEnd("低效函数");

  console.time("高效函数");
  efficientFunction();
  console.timeEnd("高效函数");

  // 内存使用优化
  function memoryEfficientFunction() {
    // 及时清理不需要的变量
    var largeData = new Array(10000).fill("data");

    // 处理数据
    var processedData = largeData.map((item) => item.toUpperCase());

    // 清理原始数据
    largeData = null;

    return processedData.slice(0, 10); // 只返回需要的部分
  }

  console.log("内存优化函数结果:", memoryEfficientFunction().length);
}

performanceOptimizationDemo();
```

---

## 总结

### 执行上下文生命周期总结

```javascript
// 执行上下文生命周期完整总结
function lifecycleSummary() {
  console.log("=== 执行上下文生命周期总结 ===");

  console.log(`
  执行上下文生命周期的三个阶段：
  
  1. 创建阶段 (Creation Phase):
     - 创建变量环境 (Variable Environment)
     - 创建词法环境 (Lexical Environment)
     - 建立作用域链 (Scope Chain)
     - 确定 this 绑定
     - 变量和函数提升 (Hoisting)
     
  2. 执行阶段 (Execution Phase):
     - 逐行执行代码
     - 变量赋值和更新
     - 函数调用和返回
     - 表达式计算
     
  3. 销毁阶段 (Destruction Phase):
     - 执行上下文从执行栈中弹出
     - 清理局部变量和函数
     - 垃圾回收处理
     - 闭包变量的特殊处理
  `);
}

lifecycleSummary();
```

### 关键要点

| 阶段         | 主要活动                  | 关键特点                     |
| ------------ | ------------------------- | ---------------------------- |
| **创建阶段** | 环境创建、提升、this 绑定 | 变量为 undefined，函数可调用 |
| **执行阶段** | 代码执行、变量赋值        | 逐行执行，变量获得实际值     |
| **销毁阶段** | 清理内存、垃圾回收        | 局部变量清理，闭包变量保留   |

### 最佳实践

1. **理解提升机制**：合理利用函数声明提升，避免变量提升陷阱
2. **管理作用域链**：避免过深的嵌套，优化变量查找性能
3. **正确处理 this**：理解不同情况下的 this 绑定规则
4. **防止内存泄漏**：及时清理引用，避免意外的全局变量
5. **优化性能**：减少不必要的函数调用和执行上下文创建

理解执行上下文的生命周期有助于：

- 更好地理解 JavaScript 代码的执行过程
- 避免常见的作用域和提升相关的错误
- 优化代码性能和内存使用
- 更有效地调试复杂的 JavaScript 应用
