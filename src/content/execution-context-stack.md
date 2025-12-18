---
title: 执行上下文栈是什么
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 执行上下文栈的工作原理，包括栈的结构、函数调用过程、栈溢出等核心概念。
tags:
  - 执行上下文
  - 调用栈
  - 函数调用
  - 栈溢出
estimatedTime: 25 分钟
keywords:
  - 执行上下文栈
  - 调用栈
  - call stack
  - 栈溢出
  - 函数调用
highlight: 掌握执行上下文栈的工作机制，理解 JavaScript 函数调用和执行的底层原理
order: 252
---

## 问题 1：执行上下文栈的基本概念

### 什么是执行上下文栈

```javascript
// 执行上下文栈演示
function executionContextStackDemo() {
  console.log("=== 执行上下文栈演示 ===");

  // 执行上下文栈（Call Stack）是一个 LIFO（后进先出）的数据结构
  // 用于管理函数调用和执行上下文的创建、销毁

  console.log("1. 程序开始 - 全局执行上下文入栈");
  console.log("当前栈: [Global Execution Context]");

  function firstFunction() {
    console.log("2. firstFunction 调用 - 创建新执行上下文");
    console.log("当前栈: [Global, firstFunction]");

    function secondFunction() {
      console.log("3. secondFunction 调用 - 创建新执行上下文");
      console.log("当前栈: [Global, firstFunction, secondFunction]");

      function thirdFunction() {
        console.log("4. thirdFunction 调用 - 创建新执行上下文");
        console.log(
          "当前栈: [Global, firstFunction, secondFunction, thirdFunction]"
        );

        console.log("5. thirdFunction 执行完毕 - 执行上下文出栈");
        return "third result";
      }

      const result3 = thirdFunction();
      console.log("6. 返回到 secondFunction");
      console.log("当前栈: [Global, firstFunction, secondFunction]");

      console.log("7. secondFunction 执行完毕 - 执行上下文出栈");
      return "second result: " + result3;
    }

    const result2 = secondFunction();
    console.log("8. 返回到 firstFunction");
    console.log("当前栈: [Global, firstFunction]");

    console.log("9. firstFunction 执行完毕 - 执行上下文出栈");
    return "first result: " + result2;
  }

  const result1 = firstFunction();
  console.log("10. 返回到全局执行上下文");
  console.log("当前栈: [Global]");
  console.log("最终结果:", result1);
}

executionContextStackDemo();
```

### 栈的 LIFO 特性

```javascript
// 演示栈的后进先出特性
function lifoDemo() {
  console.log("=== 栈的 LIFO 特性演示 ===");

  // 模拟执行上下文栈
  let callStack = [];

  function pushContext(functionName) {
    callStack.push(functionName);
    console.log(`${functionName} 入栈 - 当前栈:`, [...callStack]);
  }

  function popContext() {
    const popped = callStack.pop();
    console.log(`${popped} 出栈 - 当前栈:`, [...callStack]);
    return popped;
  }

  function functionA() {
    pushContext("functionA");

    function functionB() {
      pushContext("functionB");

      function functionC() {
        pushContext("functionC");

        console.log("functionC 执行中...");

        popContext(); // functionC 出栈
        return "C result";
      }

      const resultC = functionC();
      console.log("functionB 收到结果:", resultC);

      popContext(); // functionB 出栈
      return "B result: " + resultC;
    }

    const resultB = functionB();
    console.log("functionA 收到结果:", resultB);

    popContext(); // functionA 出栈
    return "A result: " + resultB;
  }

  // 全局执行上下文
  pushContext("Global");

  const finalResult = functionA();
  console.log("全局收到最终结果:", finalResult);

  popContext(); // Global 出栈（程序结束）
}

lifoDemo();
```

---

## 问题 2：执行上下文栈的工作过程

### 函数调用时的栈操作

```javascript
// 详细展示函数调用时的栈操作
function stackOperationsDemo() {
  console.log("=== 执行上下文栈操作演示 ===");

  // 模拟 JavaScript 引擎的栈操作
  class ExecutionContextStack {
    constructor() {
      this.stack = [];
      this.currentContext = null;
    }

    push(context) {
      this.stack.push(context);
      this.currentContext = context;
      console.log(`📥 入栈: ${context.name}`);
      this.printStack();
    }

    pop() {
      const popped = this.stack.pop();
      this.currentContext = this.stack[this.stack.length - 1] || null;
      console.log(`📤 出栈: ${popped.name}`);
      this.printStack();
      return popped;
    }

    printStack() {
      const stackNames = this.stack.map((ctx) => ctx.name);
      console.log(`   栈状态: [${stackNames.join(" → ")}]`);
      console.log(`   栈深度: ${this.stack.length}`);
      console.log("");
    }

    getCurrentContext() {
      return this.currentContext;
    }
  }

  const stack = new ExecutionContextStack();

  // 创建执行上下文对象
  function createContext(name, variables = {}) {
    return {
      name: name,
      variables: variables,
      created: Date.now(),
    };
  }

  // 模拟函数执行
  function simulateFunction(name, variables, callback) {
    const context = createContext(name, variables);
    stack.push(context);

    // 执行函数体
    const result = callback ? callback() : `${name} executed`;

    stack.pop();
    return result;
  }

  // 全局执行上下文
  stack.push(createContext("Global", { globalVar: "global value" }));

  // 模拟复杂的函数调用
  const result = simulateFunction(
    "outerFunction",
    { outerVar: "outer" },
    () => {
      return simulateFunction("middleFunction", { middleVar: "middle" }, () => {
        return simulateFunction("innerFunction", { innerVar: "inner" }, () => {
          console.log("🔍 在 innerFunction 中访问变量:");
          console.log("   当前上下文:", stack.getCurrentContext().name);
          console.log(
            "   可访问的变量: innerVar, middleVar, outerVar, globalVar"
          );
          return "inner result";
        });
      });
    }
  );

  console.log("🎯 最终结果:", result);

  // 程序结束，全局上下文出栈
  stack.pop();
}

stackOperationsDemo();
```

### 递归调用的栈行为

```javascript
// 递归调用中的执行上下文栈
function recursionStackDemo() {
  console.log("=== 递归调用栈演示 ===");

  let callDepth = 0;
  const maxDepthToShow = 5;

  function factorial(n) {
    callDepth++;

    if (callDepth <= maxDepthToShow) {
      console.log(`📞 递归调用 factorial(${n}) - 栈深度: ${callDepth}`);
      console.log(
        `   当前栈: [Global, ${Array(callDepth).fill("factorial").join(", ")}]`
      );
    }

    // 基础情况
    if (n <= 1) {
      if (callDepth <= maxDepthToShow) {
        console.log(`🛑 到达基础情况 factorial(${n}) = 1`);
        console.log(`📤 开始返回，栈深度: ${callDepth}`);
      }
      callDepth--;
      return 1;
    }

    // 递归情况
    const result = n * factorial(n - 1);

    if (callDepth <= maxDepthToShow) {
      console.log(`📤 factorial(${n}) 返回 ${result} - 栈深度: ${callDepth}`);
    }

    callDepth--;
    return result;
  }

  console.log("计算 factorial(6):");
  const result = factorial(6);
  console.log("🎯 最终结果:", result);
  console.log("📊 总调用次数:", 6);

  // 演示尾递归优化的概念
  console.log("\n=== 尾递归优化概念 ===");

  // 普通递归（不是尾递归）
  function normalFactorial(n) {
    if (n <= 1) return 1;
    return n * normalFactorial(n - 1); // 递归调用后还有乘法操作
  }

  // 尾递归版本
  function tailRecursiveFactorial(n, accumulator = 1) {
    if (n <= 1) return accumulator;
    return tailRecursiveFactorial(n - 1, n * accumulator); // 递归调用是最后一个操作
  }

  console.log("普通递归 factorial(5):", normalFactorial(5));
  console.log("尾递归 factorial(5):", tailRecursiveFactorial(5));
  console.log("注意: JavaScript 引擎可能会优化尾递归，减少栈使用");
}

recursionStackDemo();
```

---

## 问题 3：栈溢出和错误处理

### 栈溢出的原因和演示

```javascript
// 栈溢出演示和处理
function stackOverflowDemo() {
  console.log("=== 栈溢出演示 ===");

  // 1. 无限递归导致栈溢出
  function infiniteRecursion(count = 0) {
    if (count % 1000 === 0) {
      console.log(`递归深度: ${count}`);
    }

    // 无终止条件的递归
    return infiniteRecursion(count + 1);
  }

  console.log("1. 无限递归栈溢出测试:");
  try {
    infiniteRecursion();
  } catch (error) {
    console.log("❌ 捕获栈溢出错误:", error.name);
    console.log("   错误信息:", error.message);
  }

  // 2. 深度递归导致栈溢出
  function deepRecursion(n) {
    if (n <= 0) return 0;
    return 1 + deepRecursion(n - 1);
  }

  console.log("2. 深度递归测试:");
  try {
    const result = deepRecursion(100000); // 尝试深度递归
    console.log("✅ 深度递归成功:", result);
  } catch (error) {
    console.log("❌ 深度递归栈溢出:", error.name);
  }

  // 3. 相互递归导致栈溢出
  function functionA(n) {
    if (n <= 0) return "A done";
    return functionB(n - 1);
  }

  function functionB(n) {
    if (n <= 0) return "B done";
    return functionA(n - 1);
  }

  console.log("3. 相互递归测试:");
  try {
    const result = functionA(50000);
    console.log("✅ 相互递归成功:", result);
  } catch (error) {
    console.log("❌ 相互递归栈溢出:", error.name);
  }

  // 4. 检测栈深度的方法
  function measureStackDepth() {
    let depth = 0;

    function recurse() {
      depth++;
      try {
        recurse();
      } catch (error) {
        if (error.name === "RangeError") {
          console.log(`📏 最大栈深度约为: ${depth}`);
        }
        throw error;
      }
    }

    try {
      recurse();
    } catch (error) {
      // 栈溢出已被处理
    }

    return depth;
  }

  console.log("4. 测量栈深度:");
  measureStackDepth();
}

stackOverflowDemo();
```

### 避免栈溢出的策略

```javascript
// 避免栈溢出的策略
function avoidStackOverflowDemo() {
  console.log("=== 避免栈溢出策略演示 ===");

  // 1. 使用迭代替代递归
  console.log("1. 迭代替代递归:");

  // 递归版本（可能栈溢出）
  function recursiveSum(n) {
    if (n <= 0) return 0;
    return n + recursiveSum(n - 1);
  }

  // 迭代版本（不会栈溢出）
  function iterativeSum(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += i;
    }
    return sum;
  }

  console.log("递归求和 sum(100):", recursiveSum(100));
  console.log("迭代求和 sum(100):", iterativeSum(100));
  console.log("迭代求和 sum(1000000):", iterativeSum(1000000));

  // 2. 使用蹦床技术（Trampoline）
  console.log("2. 蹦床技术:");

  function trampoline(fn) {
    while (typeof fn === "function") {
      fn = fn();
    }
    return fn;
  }

  function trampolineFactorial(n, acc = 1) {
    if (n <= 1) return acc;
    return () => trampolineFactorial(n - 1, n * acc);
  }

  const trampolineResult = trampoline(trampolineFactorial(10000));
  console.log("蹦床技术计算大数阶乘成功");

  // 3. 分批处理大量数据
  console.log("3. 分批处理:");

  function processBatch(data, batchSize = 1000) {
    const results = [];

    function processBatchRecursive(startIndex) {
      if (startIndex >= data.length) {
        return results;
      }

      const endIndex = Math.min(startIndex + batchSize, data.length);
      const batch = data.slice(startIndex, endIndex);

      // 处理当前批次
      const batchResult = batch.map((item) => item * 2);
      results.push(...batchResult);

      // 使用 setTimeout 避免栈积累
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(processBatchRecursive(endIndex));
        }, 0);
      });
    }

    return processBatchRecursive(0);
  }

  const largeData = Array.from({ length: 100000 }, (_, i) => i);
  processBatch(largeData).then((results) => {
    console.log("分批处理完成，结果长度:", results.length);
  });

  // 4. 使用栈深度限制
  console.log("4. 栈深度限制:");

  function safeRecursion(n, maxDepth = 1000, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      throw new Error(`递归深度超过限制: ${maxDepth}`);
    }

    if (n <= 0) return 0;
    return n + safeRecursion(n - 1, maxDepth, currentDepth + 1);
  }

  try {
    console.log("安全递归 sum(500):", safeRecursion(500));
    console.log("安全递归 sum(2000):", safeRecursion(2000)); // 会抛出错误
  } catch (error) {
    console.log("❌ 安全递归错误:", error.message);
  }
}

avoidStackOverflowDemo();
```

---

## 问题 4：异步代码和执行上下文栈

### 异步操作对栈的影响

```javascript
// 异步操作和执行上下文栈
function asyncStackDemo() {
  console.log("=== 异步操作和执行上下文栈演示 ===");

  // 1. 同步代码的栈行为
  console.log("1. 同步代码栈行为:");

  function syncFunction1() {
    console.log("📞 syncFunction1 调用");
    syncFunction2();
    console.log("📤 syncFunction1 返回");
  }

  function syncFunction2() {
    console.log("📞 syncFunction2 调用");
    console.log("📤 syncFunction2 返回");
  }

  console.log("🚀 开始同步执行");
  syncFunction1();
  console.log("✅ 同步执行完成");

  // 2. 异步代码的栈行为
  console.log("\n2. 异步代码栈行为:");

  function asyncFunction1() {
    console.log("📞 asyncFunction1 调用");

    setTimeout(() => {
      console.log("⏰ setTimeout 回调执行 - 新的执行上下文栈");
      console.log("   当前栈: [Global, setTimeout callback]");
    }, 100);

    console.log("📤 asyncFunction1 返回（不等待 setTimeout）");
  }

  console.log("🚀 开始异步执行");
  asyncFunction1();
  console.log("✅ 异步函数调用完成（但回调还未执行）");

  // 3. Promise 和执行上下文栈
  console.log("\n3. Promise 和执行上下文栈:");

  function promiseFunction() {
    console.log("📞 promiseFunction 调用");

    return new Promise((resolve) => {
      console.log("📞 Promise executor 执行（同步）");

      setTimeout(() => {
        console.log("⏰ Promise resolve 在 setTimeout 中");
        resolve("promise result");
      }, 50);

      console.log("📤 Promise executor 完成");
    }).then((result) => {
      console.log("📞 Promise then 回调执行");
      console.log("   结果:", result);
      console.log("📤 Promise then 回调完成");
      return result;
    });
  }

  console.log("🚀 开始 Promise 执行");
  promiseFunction();
  console.log("✅ Promise 函数调用完成");

  // 4. async/await 和执行上下文栈
  console.log("\n4. async/await 和执行上下文栈:");

  async function asyncAwaitFunction() {
    console.log("📞 asyncAwaitFunction 开始");

    console.log("⏳ 等待 Promise 解决...");
    const result = await new Promise((resolve) => {
      setTimeout(() => {
        console.log("⏰ async/await Promise 解决");
        resolve("async result");
      }, 30);
    });

    console.log("📞 asyncAwaitFunction 恢复执行");
    console.log("   结果:", result);
    console.log("📤 asyncAwaitFunction 完成");

    return result;
  }

  console.log("🚀 开始 async/await 执行");
  asyncAwaitFunction().then((result) => {
    console.log("✅ async/await 最终结果:", result);
  });
  console.log("✅ async/await 函数调用完成");
}

asyncStackDemo();
```

### 事件循环和调用栈的关系

```javascript
// 事件循环和调用栈的关系
function eventLoopStackDemo() {
  console.log("=== 事件循环和调用栈关系演示 ===");

  // 模拟事件循环的工作过程
  console.log("1. 事件循环工作过程:");

  console.log("📋 任务队列状态演示:");

  // 同步任务
  console.log("🔄 同步任务1 - 立即执行");

  // 宏任务
  setTimeout(() => {
    console.log("⏰ 宏任务1 - setTimeout 0ms");
  }, 0);

  setTimeout(() => {
    console.log("⏰ 宏任务2 - setTimeout 10ms");
  }, 10);

  // 微任务
  Promise.resolve().then(() => {
    console.log("🚀 微任务1 - Promise.resolve");
  });

  Promise.resolve().then(() => {
    console.log("🚀 微任务2 - Promise.resolve");

    // 微任务中的微任务
    Promise.resolve().then(() => {
      console.log("🚀 嵌套微任务 - 在微任务中创建");
    });
  });

  // 同步任务
  console.log("🔄 同步任务2 - 立即执行");

  // 2. 调用栈为空时的事件循环
  console.log("\n2. 调用栈清空后的事件循环:");

  function demonstrateStackEmptying() {
    console.log("📞 demonstrateStackEmptying 开始");

    // 创建多层嵌套的异步任务
    setTimeout(() => {
      console.log("⏰ 第一层 setTimeout");

      Promise.resolve().then(() => {
        console.log("🚀 第一层中的微任务");

        setTimeout(() => {
          console.log("⏰ 第二层 setTimeout");
        }, 0);
      });
    }, 0);

    console.log("📤 demonstrateStackEmptying 结束");
  }

  demonstrateStackEmptying();

  // 3. 长时间运行任务对栈的影响
  console.log("\n3. 长时间运行任务:");

  function longRunningTask() {
    console.log("⏳ 开始长时间运行任务");

    const start = Date.now();
    while (Date.now() - start < 100) {
      // 模拟长时间运行的同步任务
    }

    console.log("✅ 长时间运行任务完成");
  }

  setTimeout(() => {
    console.log("⏰ 长任务前的 setTimeout");
  }, 0);

  longRunningTask();

  setTimeout(() => {
    console.log("⏰ 长任务后的 setTimeout");
  }, 0);

  console.log("📋 注意: 长时间运行的同步任务会阻塞事件循环");
}

eventLoopStackDemo();
```

---

## 问题 5：调试和性能优化

### 调用栈的调试技巧

```javascript
// 调用栈调试技巧
function debuggingStackDemo() {
  console.log("=== 调用栈调试技巧演示 ===");

  // 1. 使用 console.trace() 查看调用栈
  console.log("1. 使用 console.trace():");

  function level1() {
    level2();
  }

  function level2() {
    level3();
  }

  function level3() {
    console.log("📍 在 level3 中查看调用栈:");
    console.trace("调用栈追踪");
  }

  level1();

  // 2. 使用 Error.stack 获取调用栈信息
  console.log("\n2. 使用 Error.stack:");

  function getCallStack() {
    const error = new Error();
    return error.stack;
  }

  function functionA() {
    return functionB();
  }

  function functionB() {
    return functionC();
  }

  function functionC() {
    const stack = getCallStack();
    console.log("📋 当前调用栈:");
    console.log(stack);
    return "result from C";
  }

  functionA();

  // 3. 自定义栈追踪器
  console.log("\n3. 自定义栈追踪器:");

  class StackTracker {
    constructor() {
      this.calls = [];
    }

    enter(functionName) {
      this.calls.push({
        name: functionName,
        timestamp: Date.now(),
        type: "enter",
      });
      console.log(`📥 进入 ${functionName} - 栈深度: ${this.getDepth()}`);
    }

    exit(functionName) {
      const enterCall = this.calls.find(
        (call) => call.name === functionName && call.type === "enter"
      );

      if (enterCall) {
        const duration = Date.now() - enterCall.timestamp;
        console.log(`📤 退出 ${functionName} - 耗时: ${duration}ms`);
      }

      this.calls.push({
        name: functionName,
        timestamp: Date.now(),
        type: "exit",
      });
    }

    getDepth() {
      const enters = this.calls.filter((call) => call.type === "enter").length;
      const exits = this.calls.filter((call) => call.type === "exit").length;
      return enters - exits;
    }

    printSummary() {
      console.log("📊 调用总结:");
      const functionCalls = {};

      this.calls.forEach((call) => {
        if (call.type === "enter") {
          functionCalls[call.name] = (functionCalls[call.name] || 0) + 1;
        }
      });

      Object.entries(functionCalls).forEach(([name, count]) => {
        console.log(`   ${name}: ${count} 次调用`);
      });
    }
  }

  const tracker = new StackTracker();

  function trackedFunction1() {
    tracker.enter("trackedFunction1");
    trackedFunction2();
    tracker.exit("trackedFunction1");
  }

  function trackedFunction2() {
    tracker.enter("trackedFunction2");
    trackedFunction3();
    tracker.exit("trackedFunction2");
  }

  function trackedFunction3() {
    tracker.enter("trackedFunction3");
    // 模拟一些工作
    const start = Date.now();
    while (Date.now() - start < 10) {}
    tracker.exit("trackedFunction3");
  }

  trackedFunction1();
  tracker.printSummary();
}

debuggingStackDemo();
```

### 栈性能优化

```javascript
// 执行上下文栈性能优化
function stackPerformanceDemo() {
  console.log("=== 执行上下文栈性能优化演示 ===");

  // 1. 减少函数调用深度
  console.log("1. 减少函数调用深度:");

  // ❌ 深度嵌套的函数调用
  function deepNesting(data) {
    function level1(data) {
      return level2(data);
    }

    function level2(data) {
      return level3(data);
    }

    function level3(data) {
      return level4(data);
    }

    function level4(data) {
      return data.map((x) => x * 2);
    }

    return level1(data);
  }

  // ✅ 扁平化的函数调用
  function flatProcessing(data) {
    return data.map((x) => x * 2);
  }

  const testData = Array.from({ length: 10000 }, (_, i) => i);

  console.time("深度嵌套");
  deepNesting(testData);
  console.timeEnd("深度嵌套");

  console.time("扁平化处理");
  flatProcessing(testData);
  console.timeEnd("扁平化处理");

  // 2. 避免不必要的函数包装
  console.log("\n2. 避免不必要的函数包装:");

  // ❌ 不必要的函数包装
  function unnecessaryWrapper(arr) {
    function processItem(item) {
      return item * 2;
    }

    function filterItem(item) {
      return item > 10;
    }

    return arr.map(processItem).filter(filterItem);
  }

  // ✅ 直接使用内联函数或方法
  function directProcessing(arr) {
    return arr.map((item) => item * 2).filter((item) => item > 10);
  }

  console.time("函数包装");
  unnecessaryWrapper(testData);
  console.timeEnd("函数包装");

  console.time("直接处理");
  directProcessing(testData);
  console.timeEnd("直接处理");

  // 3. 使用尾递归优化
  console.log("\n3. 尾递归优化:");

  // 普通递归
  function normalSum(n) {
    if (n <= 0) return 0;
    return n + normalSum(n - 1);
  }

  // 尾递归
  function tailSum(n, acc = 0) {
    if (n <= 0) return acc;
    return tailSum(n - 1, acc + n);
  }

  // 迭代版本（最优）
  function iterativeSum(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += i;
    }
    return sum;
  }

  const n = 10000;

  console.time("普通递归");
  try {
    normalSum(n);
  } catch (error) {
    console.log("普通递归栈溢出");
  }
  console.timeEnd("普通递归");

  console.time("尾递归");
  try {
    tailSum(n);
  } catch (error) {
    console.log("尾递归栈溢出");
  }
  console.timeEnd("尾递归");

  console.time("迭代版本");
  iterativeSum(n);
  console.timeEnd("迭代版本");

  // 4. 栈内存使用监控
  console.log("\n4. 栈内存使用监控:");

  function monitorStackUsage() {
    let maxDepth = 0;
    let currentDepth = 0;

    function trackCall(functionName) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);

      return function () {
        currentDepth--;
      };
    }

    function recursiveFunction(n) {
      const cleanup = trackCall("recursiveFunction");

      if (n <= 0) {
        cleanup();
        return 0;
      }

      const result = n + recursiveFunction(n - 1);
      cleanup();
      return result;
    }

    recursiveFunction(100);
    console.log(`📊 最大栈深度: ${maxDepth}`);
  }

  monitorStackUsage();
}

stackPerformanceDemo();
```

---

## 总结

### 执行上下文栈总结

```javascript
// 执行上下文栈总结
function stackSummary() {
  console.log("=== 执行上下文栈总结 ===");

  console.log(`
  执行上下文栈的关键特性：
  
  1. 数据结构特性：
     - LIFO（后进先出）栈结构
     - 管理函数调用和执行上下文
     - 栈顶是当前执行的上下文
  
  2. 工作机制：
     - 函数调用时：创建新上下文并入栈
     - 函数返回时：当前上下文出栈
     - 全局上下文始终在栈底
  
  3. 栈溢出原因：
     - 无限递归
     - 过深的函数调用
     - 相互递归没有终止条件
  
  4. 优化策略：
     - 使用迭代替代深度递归
     - 实现尾递归优化
     - 使用蹦床技术
     - 分批处理大量数据
  
  5. 异步处理：
     - 异步操作不会阻塞调用栈
     - 回调函数创建新的执行上下文
     - 事件循环管理异步任务执行
  
  6. 调试技巧：
     - console.trace() 查看调用栈
     - Error.stack 获取栈信息
     - 自定义栈追踪器
     - 性能监控和优化
  `);
}

stackSummary();
```

### 关键要点

| 概念           | 描述                   | 重要性           |
| -------------- | ---------------------- | ---------------- |
| **LIFO 结构**  | 后进先出的栈结构       | 理解函数调用顺序 |
| **上下文管理** | 创建、执行、销毁上下文 | 掌握代码执行流程 |
| **栈溢出**     | 栈空间耗尽的错误       | 避免无限递归     |
| **异步处理**   | 异步操作与栈的关系     | 理解事件循环机制 |
| **性能优化**   | 减少栈使用的策略       | 提高代码执行效率 |

理解执行上下文栈有助于：

- 深入理解 JavaScript 代码执行机制
- 有效调试复杂的函数调用问题
- 避免栈溢出等运行时错误
- 优化代码性能和内存使用
- 更好地处理异步编程场景
