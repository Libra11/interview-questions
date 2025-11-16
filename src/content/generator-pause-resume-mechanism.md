---
title: Generator 是如何做到中断和恢复的？
category: JavaScript
difficulty: 高级
updatedAt: 2025-11-16
summary: >-
  深入探讨 Generator 函数的中断和恢复机制，从执行上下文、状态机、协程等角度理解 Generator 的底层实现原理，掌握其在异步编程和流程控制中的应用。
tags:
  - Generator
  - 协程
  - 执行上下文
  - 状态机
estimatedTime: 30 分钟
keywords:
  - Generator
  - yield
  - 中断恢复
  - 协程
  - 状态机
highlight: Generator 通过保存执行上下文和状态机实现函数的暂停和恢复，是 JavaScript 实现协程的基础
order: 102
---

## 问题 1：Generator 的基本中断和恢复行为是什么？

Generator 函数是 ES6 引入的一种特殊函数，它可以在执行过程中暂停，并在之后的某个时刻恢复执行。这种能力使得 Generator 成为实现协程和异步流程控制的重要工具。

### 基本语法和行为

```javascript
function* simpleGenerator() {
  console.log('开始执行');
  yield 1; // 第一次暂停点
  console.log('恢复执行 1');
  yield 2; // 第二次暂停点
  console.log('恢复执行 2');
  return 3; // 结束
}

const gen = simpleGenerator(); // 创建生成器对象，但不执行

// 第一次调用 next() - 执行到第一个 yield
console.log(gen.next()); // '开始执行' -> { value: 1, done: false }

// 第二次调用 next() - 从第一个 yield 恢复，执行到第二个 yield
console.log(gen.next()); // '恢复执行 1' -> { value: 2, done: false }

// 第三次调用 next() - 从第二个 yield 恢复，执行到 return
console.log(gen.next()); // '恢复执行 2' -> { value: 3, done: true }

// 第四次调用 next() - 生成器已结束
console.log(gen.next()); // { value: undefined, done: true }
```

### 中断和恢复的关键特征

- **惰性执行**：调用 Generator 函数不会立即执行，而是返回一个迭代器对象
- **yield 暂停**：遇到 yield 表达式时，函数暂停执行，并返回 yield 后面的值
- **next() 恢复**：调用 next() 方法时，函数从上次暂停的位置继续执行
- **状态保持**：暂停期间，函数内部的变量状态会被保存

### 与普通函数的对比

```javascript
// 普通函数 - 一次性执行完毕
function normalFunc() {
  console.log('步骤 1');
  console.log('步骤 2');
  console.log('步骤 3');
  return 'done';
}

normalFunc(); // 一次性输出所有内容

// Generator 函数 - 可以分步执行
function* generatorFunc() {
  console.log('步骤 1');
  yield;
  console.log('步骤 2');
  yield;
  console.log('步骤 3');
  return 'done';
}

const gen = generatorFunc();
gen.next(); // 只输出 '步骤 1'
gen.next(); // 只输出 '步骤 2'
gen.next(); // 只输出 '步骤 3'
```

---

## 问题 2：Generator 如何保存和恢复执行上下文？

Generator 能够中断和恢复的核心机制是**执行上下文的保存和恢复**。每次暂停时，JavaScript 引擎会保存当前的执行状态，包括变量、作用域链等信息。

### 执行上下文的保存

```javascript
function* contextExample() {
  let count = 0; // 局部变量
  
  console.log('第一次执行，count =', count);
  yield count++; // 暂停，保存 count 的状态
  
  console.log('第二次执行，count =', count); // count 的值被保留
  yield count++;
  
  console.log('第三次执行，count =', count);
  return count;
}

const gen = contextExample();

console.log(gen.next()); // '第一次执行，count = 0' -> { value: 0, done: false }
// 此时 count = 1 被保存

console.log(gen.next()); // '第二次执行，count = 1' -> { value: 1, done: false }
// count 的值从上次保存的状态恢复

console.log(gen.next()); // '第三次执行，count = 2' -> { value: 2, done: true }
```

### 保存的内容包括

1. **局部变量**：函数内部定义的所有变量及其当前值
2. **执行位置**：记录下次应该从哪里继续执行（程序计数器）
3. **作用域链**：保持对外部作用域的引用
4. **this 绑定**：保存 this 的指向

### 闭包与 Generator 的结合

```javascript
function* closureGenerator(initial) {
  let value = initial; // 闭包变量
  
  while (true) {
    // 每次 yield 都会保存 value 的当前状态
    const input = yield value;
    
    if (input !== undefined) {
      value = input; // 更新状态
    } else {
      value++; // 默认递增
    }
  }
}

const gen = closureGenerator(10);

console.log(gen.next());      // { value: 10, done: false }
console.log(gen.next());      // { value: 11, done: false } - 自动递增
console.log(gen.next(100));   // { value: 100, done: false } - 传入新值
console.log(gen.next());      // { value: 101, done: false } - 基于新值递增
```

---

## 问题 3：Generator 的状态机机制是如何工作的？

Generator 的中断和恢复本质上是一个**状态机**的实现。每个 yield 点代表一个状态，Generator 对象维护当前所处的状态，并根据状态决定下一步的执行。

### 状态机的概念

```javascript
function* trafficLight() {
  while (true) {
    yield '红灯'; // 状态 1
    yield '黄灯'; // 状态 2
    yield '绿灯'; // 状态 3
    // 循环回到状态 1
  }
}

const light = trafficLight();

console.log(light.next().value); // '红灯' - 状态 1
console.log(light.next().value); // '黄灯' - 状态 2
console.log(light.next().value); // '绿灯' - 状态 3
console.log(light.next().value); // '红灯' - 回到状态 1
```

### Generator 内部状态

Generator 对象内部维护了几个关键状态：

```javascript
function* stateExample() {
  console.log('状态：开始');
  yield 'A';
  console.log('状态：A 之后');
  yield 'B';
  console.log('状态：B 之后');
  return 'C';
}

const gen = stateExample();

// 内部状态：suspended-start（初始暂停状态）
console.log(gen.next()); // 执行到第一个 yield，状态变为 suspended-yield

// 内部状态：suspended-yield（在 yield 处暂停）
console.log(gen.next()); // 执行到第二个 yield，状态仍为 suspended-yield

// 内部状态：suspended-yield
console.log(gen.next()); // 执行到 return，状态变为 completed

// 内部状态：completed（已完成）
console.log(gen.next()); // 保持 completed 状态
```

### 状态转换图

```
[suspended-start] --next()--> [executing] --yield--> [suspended-yield]
                                    |
                                    | return/throw
                                    v
                              [completed]
```

### 用普通函数模拟状态机

```javascript
// Generator 的状态机本质
function* generatorStateMachine() {
  yield 1;
  yield 2;
  yield 3;
}

// 等价的状态机实现
function stateMachineSimulation() {
  let state = 0; // 当前状态
  
  return {
    next: function() {
      switch(state) {
        case 0:
          state = 1; // 转移到下一个状态
          return { value: 1, done: false };
        case 1:
          state = 2;
          return { value: 2, done: false };
        case 2:
          state = 3;
          return { value: 3, done: false };
        case 3:
          return { value: undefined, done: true };
        default:
          return { value: undefined, done: true };
      }
    }
  };
}

const gen1 = generatorStateMachine();
const gen2 = stateMachineSimulation();

console.log(gen1.next()); // { value: 1, done: false }
console.log(gen2.next()); // { value: 1, done: false }
```

---

## 问题 4：yield 表达式的双向通信机制

Generator 的中断和恢复不仅仅是单向的暂停，yield 表达式还支持**双向通信**：向外传递值，也可以从外部接收值。

### yield 的双向通信

```javascript
function* twoWayGenerator() {
  console.log('开始');
  
  // yield 向外传递值 'A'，同时接收外部传入的值
  const input1 = yield 'A';
  console.log('接收到:', input1);
  
  const input2 = yield 'B';
  console.log('接收到:', input2);
  
  return 'done';
}

const gen = twoWayGenerator();

// 第一次 next() 不传参，因为没有 yield 在等待接收
console.log(gen.next());        // '开始' -> { value: 'A', done: false }

// 第二次 next() 传参，值会被第一个 yield 接收
console.log(gen.next('参数1'));  // '接收到: 参数1' -> { value: 'B', done: false }

// 第三次 next() 传参，值会被第二个 yield 接收
console.log(gen.next('参数2'));  // '接收到: 参数2' -> { value: 'done', done: true }
```

### 执行流程详解

```javascript
function* communicationFlow() {
  // 步骤 1：执行到这里
  const a = yield 1; // 暂停，返回 1
  
  // 步骤 2：从这里恢复，a 接收 next() 传入的值
  console.log('a =', a);
  const b = yield 2; // 暂停，返回 2
  
  // 步骤 3：从这里恢复，b 接收 next() 传入的值
  console.log('b =', b);
  return a + b;
}

const gen = communicationFlow();

// 步骤 1：执行到第一个 yield
gen.next();      // { value: 1, done: false }

// 步骤 2：传入 10，赋值给 a，执行到第二个 yield
gen.next(10);    // 'a = 10' -> { value: 2, done: false }

// 步骤 3：传入 20，赋值给 b，执行到 return
gen.next(20);    // 'b = 20' -> { value: 30, done: true }
```

### 实际应用：数据处理管道

```javascript
function* dataProcessor() {
  let data = yield; // 等待接收初始数据
  
  while (data !== null) {
    // 处理数据
    const processed = data * 2;
    console.log(`处理: ${data} -> ${processed}`);
    
    // 返回处理结果，同时等待下一个数据
    data = yield processed;
  }
  
  return '处理完成';
}

const processor = dataProcessor();

processor.next();        // 启动生成器
processor.next(5);       // '处理: 5 -> 10' -> { value: 10, done: false }
processor.next(10);      // '处理: 10 -> 20' -> { value: 20, done: false }
processor.next(15);      // '处理: 15 -> 30' -> { value: 30, done: false }
processor.next(null);    // { value: '处理完成', done: true }
```

---

## 问题 5：Generator 与协程的关系

Generator 的中断和恢复机制实际上是**协程（Coroutine）**的一种实现。协程是一种比线程更轻量的并发执行单元，可以在执行过程中主动让出控制权。

### 协程的概念

协程与线程的区别：
- **线程**：由操作系统调度，抢占式多任务
- **协程**：由程序自己调度，协作式多任务

```javascript
// Generator 实现协程：两个任务协作执行
function* task1() {
  console.log('任务1：步骤1');
  yield; // 让出控制权
  console.log('任务1：步骤2');
  yield;
  console.log('任务1：步骤3');
}

function* task2() {
  console.log('任务2：步骤1');
  yield;
  console.log('任务2：步骤2');
  yield;
  console.log('任务2：步骤3');
}

// 协程调度器
function scheduler(gen1, gen2) {
  const g1 = gen1();
  const g2 = gen2();
  
  // 交替执行两个协程
  g1.next(); // 任务1：步骤1
  g2.next(); // 任务2：步骤1
  g1.next(); // 任务1：步骤2
  g2.next(); // 任务2：步骤2
  g1.next(); // 任务1：步骤3
  g2.next(); // 任务2：步骤3
}

scheduler(task1, task2);
```

### 协程的执行栈

```javascript
function* coroutineA() {
  console.log('A: 开始');
  yield* coroutineB(); // 委托给另一个协程
  console.log('A: 结束');
}

function* coroutineB() {
  console.log('B: 开始');
  yield 1;
  console.log('B: 中间');
  yield 2;
  console.log('B: 结束');
}

const gen = coroutineA();

gen.next(); // 'A: 开始' -> 'B: 开始'
gen.next(); // 'B: 中间'
gen.next(); // 'B: 结束' -> 'A: 结束'
```

### Generator 实现的协程特点

1. **保存执行状态**：每个 Generator 对象维护自己的执行上下文
2. **主动让出控制权**：通过 yield 主动暂停
3. **恢复执行**：通过 next() 恢复到暂停点
4. **轻量级**：不需要操作系统级别的上下文切换

---

## 问题 6：Generator 的底层实现原理

从 JavaScript 引擎的角度看，Generator 的中断和恢复是通过**闭包 + 状态机 + 迭代器协议**实现的。

### Babel 转译后的实现

```javascript
// 原始 Generator 代码
function* simpleGen() {
  yield 1;
  yield 2;
  return 3;
}

// Babel 转译后的等价实现（简化版）
function simpleGen() {
  let context = {
    next: 0,        // 当前状态（程序计数器）
    sent: undefined, // next() 传入的值
    done: false,     // 是否完成
    stop: function() { this.done = true; } // 停止函数
  };
  
  return {
    next: function(value) {
      context.sent = value; // 保存传入的值
      
      // 状态机：根据当前状态执行对应代码
      while (true) {
        switch (context.next) {
          case 0:
            context.next = 1; // 更新状态
            return { value: 1, done: false }; // 第一个 yield
            
          case 1:
            context.next = 2;
            return { value: 2, done: false }; // 第二个 yield
            
          case 2:
            context.stop(); // 标记完成
            return { value: 3, done: true }; // return 语句
            
          default:
            return { value: undefined, done: true };
        }
      }
    }
  };
}
```

### 执行上下文的保存机制

```javascript
// 带有局部变量的 Generator
function* counterGen() {
  let count = 0;
  yield count++;
  yield count++;
  return count;
}

// 转译后的实现
function counterGen() {
  let context = {
    next: 0,
    vars: { count: 0 }, // 局部变量保存在 context 中
    done: false
  };
  
  return {
    next: function() {
      switch (context.next) {
        case 0:
          context.next = 1;
          return { value: context.vars.count++, done: false };
          
        case 1:
          context.next = 2;
          return { value: context.vars.count++, done: false };
          
        case 2:
          context.done = true;
          return { value: context.vars.count, done: true };
          
        default:
          return { value: undefined, done: true };
      }
    }
  };
}
```

### 关键实现要点

1. **闭包保存状态**：使用闭包保存 context 对象，包含所有局部变量
2. **状态机控制流程**：使用 switch-case 实现状态转换
3. **程序计数器**：context.next 记录当前执行到哪个状态
4. **迭代器协议**：返回符合迭代器协议的对象（有 next 方法）

---

## 问题 7：Generator 中断恢复的性能考虑

Generator 的中断和恢复虽然强大，但也有性能开销。理解这些开销有助于更好地使用 Generator。

### 性能开销来源

```javascript
// 普通函数 - 一次性执行，栈帧在执行完后立即释放
function normalSum(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += i;
  }
  return sum;
}

// Generator 函数 - 需要保存状态，栈帧长期存在
function* generatorSum(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += i;
    yield sum; // 每次迭代都可能暂停
  }
  return sum;
}

// 性能对比
console.time('normal');
normalSum(1000000);
console.timeEnd('normal'); // 更快

console.time('generator');
const gen = generatorSum(1000000);
while (!gen.next().done) {} // 需要多次调用 next()
console.timeEnd('generator'); // 较慢
```

### 内存占用

```javascript
// Generator 对象会持续占用内存，直到完成或被垃圾回收
function* infiniteGenerator() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

const gen1 = infiniteGenerator();
const gen2 = infiniteGenerator();
const gen3 = infiniteGenerator();

// 每个 Generator 对象都保存自己的执行上下文
// 如果不及时释放，会占用内存
gen1.next(); // i = 0
gen2.next(); // i = 0（独立的状态）
gen3.next(); // i = 0（独立的状态）
```

### 适用场景

**适合使用 Generator 的场景**：

```javascript
// 1. 惰性计算 - 按需生成数据
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
// 只计算需要的值，不会一次性生成所有数据

// 2. 异步流程控制
function* asyncFlow() {
  const user = yield fetchUser();
  const posts = yield fetchPosts(user.id);
  const comments = yield fetchComments(posts[0].id);
  return comments;
}

// 3. 状态机实现
function* gameStateMachine() {
  while (true) {
    yield 'menu';
    yield 'playing';
    yield 'paused';
    yield 'gameOver';
  }
}
```

**不适合使用 Generator 的场景**：

```javascript
// 1. 简单的同步计算 - 使用普通函数更高效
// ❌ 不推荐
function* simpleAdd(a, b) {
  yield a + b;
}

// ✅ 推荐
function simpleAdd(a, b) {
  return a + b;
}

// 2. 需要立即获取所有结果的场景
// ❌ 不推荐
function* getAllItems() {
  yield 1;
  yield 2;
  yield 3;
}

// ✅ 推荐
function getAllItems() {
  return [1, 2, 3];
}
```

---

## 总结

**Generator 中断和恢复的核心机制**：

### 1. 执行上下文保存

- 保存局部变量和执行位置
- 通过闭包维护状态
- 作用域链和 this 绑定的保持

### 2. 状态机实现

- 每个 yield 点代表一个状态
- 通过程序计数器记录当前状态
- switch-case 实现状态转换

### 3. 迭代器协议

- Generator 对象实现迭代器接口
- next() 方法控制执行流程
- 返回 { value, done } 格式的对象

### 4. 双向通信

- yield 向外传递值
- next() 向内传递值
- 实现生产者-消费者模式

### 5. 协程特性

- 主动让出控制权
- 协作式多任务
- 轻量级并发

### 6. 底层实现

- 闭包 + 状态机 + 迭代器
- 编译时转换为状态机代码
- 运行时维护执行上下文

### 7. 性能权衡

- 有额外的内存和性能开销
- 适合惰性计算和异步控制
- 不适合简单的同步计算

**Generator 的价值**：

- 提供了函数执行的可控性
- 简化异步编程（async/await 的基础）
- 实现惰性求值和无限序列
- 优雅的状态机实现方式

## 延伸阅读

- [MDN - Generator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- [MDN - function*](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*)
- [MDN - yield](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/yield)
- [ES6 Generator 函数的语法 - 阮一峰](https://es6.ruanyifeng.com/#docs/generator)
- [深入理解 Generator 原理](https://github.com/mqyqingfeng/Blog/issues/99)
- [Babel 转译 Generator 的实现](https://babeljs.io/docs/en/babel-plugin-transform-regenerator)
