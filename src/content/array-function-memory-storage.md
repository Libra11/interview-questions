---
title: JS 中的数组和函数在内存中是如何存储的？
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 中数组和函数在内存中的存储机制，包括堆栈分配、引用传递、内存布局等核心概念。
tags:
  - 内存管理
  - 数组存储
  - 函数存储
  - 堆栈内存
estimatedTime: 30 分钟
keywords:
  - 内存存储
  - 数组内存
  - 函数内存
  - 堆内存
  - 栈内存
highlight: 掌握 JavaScript 数组和函数的内存存储机制，理解引用类型的内存分配和管理
order: 249
---

## 问题 1：JavaScript 内存模型概述

### 堆内存 vs 栈内存

```javascript
// JavaScript 内存模型演示
function memoryModelDemo() {
  console.log("=== JavaScript 内存模型演示 ===");

  // 栈内存存储：基本数据类型
  let number = 42; // 栈内存
  let string = "hello"; // 栈内存
  let boolean = true; // 栈内存
  let nullValue = null; // 栈内存
  let undefinedValue; // 栈内存

  console.log("基本类型存储在栈内存中：");
  console.log("number:", number, typeof number);
  console.log("string:", string, typeof string);
  console.log("boolean:", boolean, typeof boolean);

  // 堆内存存储：引用数据类型
  let array = [1, 2, 3]; // 堆内存，栈中存储引用
  let object = { name: "Alice" }; // 堆内存，栈中存储引用
  let func = function () {
    return "hello";
  }; // 堆内存，栈中存储引用

  console.log("引用类型存储在堆内存中：");
  console.log("array:", array, typeof array);
  console.log("object:", object, typeof object);
  console.log("func:", func, typeof func);

  // 演示引用传递
  let array1 = [1, 2, 3];
  let array2 = array1; // 复制引用，不是复制数组本身

  array2.push(4);
  console.log("修改 array2 后：");
  console.log("array1:", array1); // [1, 2, 3, 4] - 也被修改了
  console.log("array2:", array2); // [1, 2, 3, 4]
  console.log("array1 === array2:", array1 === array2); // true - 指向同一个对象
}

memoryModelDemo();
```

---

## 问题 2：数组在内存中的存储

### 数组的内存布局

```javascript
// 数组内存存储详解
function arrayMemoryDemo() {
  console.log("=== 数组内存存储演示 ===");

  // 1. 数组对象的基本结构
  let arr = [1, 2, 3, "hello", true];

  console.log("1. 数组的基本信息：");
  console.log("数组内容:", arr);
  console.log("数组长度:", arr.length);
  console.log("数组类型:", typeof arr);
  console.log("是否为数组:", Array.isArray(arr));

  // 2. 数组在内存中的实际结构
  console.log("2. 数组的内存结构：");
  console.log("数组索引访问:", arr[0], arr[1], arr[2]);
  console.log("数组属性访问:", arr.length);

  // 3. 稀疏数组的内存存储
  let sparseArray = [];
  sparseArray[0] = "first";
  sparseArray[100] = "last";

  console.log("3. 稀疏数组：");
  console.log("稀疏数组:", sparseArray);
  console.log("稀疏数组长度:", sparseArray.length); // 101
  console.log("实际元素数量:", Object.keys(sparseArray).length); // 2

  // 4. 数组的内部属性
  console.log("4. 数组的内部属性：");
  console.log("数组的所有属性:", Object.getOwnPropertyNames(arr));
  console.log("数组的描述符:", Object.getOwnPropertyDescriptor(arr, "length"));

  // 5. 不同类型元素的存储
  let mixedArray = [
    42, // 数字
    "string", // 字符串
    { name: "object" }, // 对象
    [1, 2, 3], // 嵌套数组
    function () {
      return "func";
    }, // 函数
    Symbol("symbol"), // Symbol
    null, // null
    undefined, // undefined
  ];

  console.log("5. 混合类型数组：");
  mixedArray.forEach((item, index) => {
    console.log(`索引 ${index}:`, typeof item, item);
  });
}

arrayMemoryDemo();
```

### 数组的内存优化

```javascript
// 数组内存优化演示
function arrayOptimizationDemo() {
  console.log("=== 数组内存优化演示 ===");

  // 1. 密集数组 vs 稀疏数组的性能
  console.log("1. 密集数组 vs 稀疏数组：");

  // 密集数组 - 内存连续，性能更好
  let denseArray = new Array(1000);
  for (let i = 0; i < 1000; i++) {
    denseArray[i] = i;
  }

  // 稀疏数组 - 内存不连续，性能较差
  let sparseArray = [];
  for (let i = 0; i < 1000; i += 10) {
    sparseArray[i] = i;
  }

  console.log("密集数组长度:", denseArray.length);
  console.log("稀疏数组长度:", sparseArray.length);
  console.log("稀疏数组实际元素:", Object.keys(sparseArray).length);

  // 2. 数组预分配 vs 动态增长
  console.log("2. 数组预分配 vs 动态增长：");

  // 预分配数组
  console.time("预分配数组");
  let preAllocated = new Array(10000);
  for (let i = 0; i < 10000; i++) {
    preAllocated[i] = i;
  }
  console.timeEnd("预分配数组");

  // 动态增长数组
  console.time("动态增长数组");
  let dynamicArray = [];
  for (let i = 0; i < 10000; i++) {
    dynamicArray.push(i);
  }
  console.timeEnd("动态增长数组");

  // 3. 数组类型一致性的影响
  console.log("3. 数组类型一致性：");

  // 类型一致的数组 - 可能被优化为连续内存
  let homogeneousArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // 类型混合的数组 - 难以优化
  let heterogeneousArray = [1, "string", {}, [], function () {}, null];

  console.log("同质数组:", homogeneousArray);
  console.log("异质数组:", heterogeneousArray);

  // 4. 大数组的内存管理
  function createLargeArray() {
    console.log("4. 大数组内存管理：");

    // 创建大数组
    let largeArray = new Array(1000000).fill(0).map((_, i) => ({
      id: i,
      data: `item-${i}`,
      timestamp: Date.now(),
    }));

    console.log("大数组创建完成，长度:", largeArray.length);
    console.log("内存使用情况（近似）:", largeArray.length * 100 + " bytes");

    // 清理大数组
    largeArray = null;
    console.log("大数组已清理");

    // 建议手动触发垃圾回收（在支持的环境中）
    if (global.gc) {
      global.gc();
      console.log("手动触发垃圾回收");
    }
  }

  createLargeArray();
}

arrayOptimizationDemo();
```

### 数组的内存共享和复制

```javascript
// 数组内存共享和复制机制
function arrayMemorySharingDemo() {
  console.log("=== 数组内存共享和复制演示 ===");

  // 1. 引用共享
  console.log("1. 数组引用共享：");
  let originalArray = [1, 2, 3, { name: "shared" }];
  let sharedArray = originalArray; // 共享引用

  console.log("原数组:", originalArray);
  console.log("共享数组:", sharedArray);
  console.log("是否为同一对象:", originalArray === sharedArray); // true

  // 修改共享数组
  sharedArray.push(4);
  sharedArray[3].name = "modified";

  console.log("修改后的原数组:", originalArray); // 也被修改了
  console.log("修改后的共享数组:", sharedArray);

  // 2. 浅复制
  console.log("2. 数组浅复制：");
  let sourceArray = [1, 2, { nested: "object" }, [4, 5]];

  // 使用扩展运算符浅复制
  let shallowCopy1 = [...sourceArray];

  // 使用 Array.from 浅复制
  let shallowCopy2 = Array.from(sourceArray);

  // 使用 slice 浅复制
  let shallowCopy3 = sourceArray.slice();

  console.log("源数组:", sourceArray);
  console.log("浅复制1:", shallowCopy1);
  console.log("是否为同一对象:", sourceArray === shallowCopy1); // false
  console.log("嵌套对象是否共享:", sourceArray[2] === shallowCopy1[2]); // true

  // 修改浅复制数组
  shallowCopy1.push("new item");
  shallowCopy1[2].nested = "modified";

  console.log("修改后的源数组:", sourceArray); // 嵌套对象被修改
  console.log("修改后的浅复制:", shallowCopy1);

  // 3. 深复制
  console.log("3. 数组深复制：");
  let deepSource = [1, 2, { nested: { deep: "value" } }, [4, [5, 6]]];

  // 使用 JSON 方法深复制（有限制）
  let deepCopy1 = JSON.parse(JSON.stringify(deepSource));

  // 自定义深复制函数
  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map((item) => deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  let deepCopy2 = deepClone(deepSource);

  console.log("深复制源数组:", deepSource);
  console.log("深复制结果:", deepCopy2);
  console.log("是否为同一对象:", deepSource === deepCopy2); // false
  console.log("嵌套对象是否共享:", deepSource[2] === deepCopy2[2]); // false

  // 修改深复制数组
  deepCopy2[2].nested.deep = "modified deep";
  deepCopy2[3][1].push(7);

  console.log("修改后的源数组:", deepSource); // 不受影响
  console.log("修改后的深复制:", deepCopy2);
}

arrayMemorySharingDemo();
```

---

## 问题 3：函数在内存中的存储

### 函数对象的内存结构

```javascript
// 函数内存存储详解
function functionMemoryDemo() {
  console.log("=== 函数内存存储演示 ===");

  // 1. 函数的基本存储
  function namedFunction(param1, param2) {
    return param1 + param2;
  }

  let functionExpression = function (param1, param2) {
    return param1 * param2;
  };

  let arrowFunction = (param1, param2) => param1 - param2;

  console.log("1. 函数的基本信息：");
  console.log("函数声明:", namedFunction);
  console.log("函数表达式:", functionExpression);
  console.log("箭头函数:", arrowFunction);
  console.log("函数类型:", typeof namedFunction);

  // 2. 函数的属性
  console.log("2. 函数的属性：");
  console.log("函数名称:", namedFunction.name);
  console.log("函数长度（参数个数）:", namedFunction.length);
  console.log("函数原型:", namedFunction.prototype);
  console.log("函数构造器:", namedFunction.constructor);

  // 3. 函数的内部属性
  console.log("3. 函数的内部属性：");
  console.log("函数的所有属性:", Object.getOwnPropertyNames(namedFunction));

  // 4. 函数作为对象的特性
  console.log("4. 函数作为对象：");
  namedFunction.customProperty = "custom value";
  namedFunction.customMethod = function () {
    return "custom method result";
  };

  console.log("自定义属性:", namedFunction.customProperty);
  console.log("自定义方法:", namedFunction.customMethod());

  // 5. 函数的内存地址比较
  console.log("5. 函数的内存地址比较：");
  let func1 = function () {
    return "hello";
  };
  let func2 = function () {
    return "hello";
  };
  let func3 = func1;

  console.log("func1 === func2:", func1 === func2); // false - 不同的内存地址
  console.log("func1 === func3:", func1 === func3); // true - 相同的内存地址
}

functionMemoryDemo();
```

### 函数的闭包和内存

```javascript
// 函数闭包的内存管理
function closureMemoryDemo() {
  console.log("=== 函数闭包内存演示 ===");

  // 1. 简单闭包
  function createSimpleClosure() {
    let outerVariable = "outer value";
    let largeData = new Array(1000).fill("data"); // 大数据

    return function innerFunction() {
      console.log("访问外部变量:", outerVariable);
      // 注意：largeData 虽然没有被使用，但可能仍然被保留在内存中
      return outerVariable;
    };
  }

  console.log("1. 简单闭包：");
  let simpleClosure = createSimpleClosure();
  console.log("闭包调用结果:", simpleClosure());

  // 2. 优化的闭包
  function createOptimizedClosure() {
    let outerVariable = "outer value";
    let largeData = new Array(1000).fill("data");

    // 处理大数据后清理
    let processedData = largeData.length;
    largeData = null; // 显式清理

    return function innerFunction() {
      console.log("访问外部变量:", outerVariable);
      console.log("处理后的数据大小:", processedData);
      return outerVariable;
    };
  }

  console.log("2. 优化的闭包：");
  let optimizedClosure = createOptimizedClosure();
  console.log("优化闭包调用结果:", optimizedClosure());

  // 3. 多个闭包共享外部变量
  function createMultipleClosures() {
    let sharedVariable = 0;
    let sharedArray = [];

    return {
      increment: function () {
        sharedVariable++;
        sharedArray.push(sharedVariable);
        return sharedVariable;
      },

      decrement: function () {
        sharedVariable--;
        sharedArray.push(sharedVariable);
        return sharedVariable;
      },

      getHistory: function () {
        return [...sharedArray]; // 返回副本
      },

      reset: function () {
        sharedVariable = 0;
        sharedArray.length = 0; // 清空数组但保持引用
      },
    };
  }

  console.log("3. 多个闭包共享变量：");
  let counter = createMultipleClosures();
  console.log("递增:", counter.increment()); // 1
  console.log("递增:", counter.increment()); // 2
  console.log("递减:", counter.decrement()); // 1
  console.log("历史记录:", counter.getHistory()); // [1, 2, 1]

  // 4. 闭包内存泄漏的例子
  function memoryLeakExample() {
    let largeObject = {
      data: new Array(10000).fill("large data"),
      timestamp: Date.now(),
    };

    // ❌ 可能导致内存泄漏的闭包
    function createLeakyClosure() {
      return function () {
        // 即使不使用 largeObject，它也可能被保留
        return "closure result";
      };
    }

    // ✅ 避免内存泄漏的闭包
    function createSafeClosure() {
      let timestamp = largeObject.timestamp; // 只保留需要的数据
      largeObject = null; // 清理大对象

      return function () {
        return `closure result at ${timestamp}`;
      };
    }

    return {
      leaky: createLeakyClosure(),
      safe: createSafeClosure(),
    };
  }

  console.log("4. 闭包内存泄漏示例：");
  let closures = memoryLeakExample();
  console.log("泄漏闭包结果:", closures.leaky());
  console.log("安全闭包结果:", closures.safe());
}

closureMemoryDemo();
```

### 函数的原型和继承内存

```javascript
// 函数原型和继承的内存管理
function prototypeMemoryDemo() {
  console.log("=== 函数原型内存演示 ===");

  // 1. 构造函数和原型
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }

  // 原型方法 - 所有实例共享
  Person.prototype.greet = function () {
    return `Hello, I'm ${this.name}`;
  };

  Person.prototype.getAge = function () {
    return this.age;
  };

  console.log("1. 构造函数和原型：");
  let person1 = new Person("Alice", 25);
  let person2 = new Person("Bob", 30);

  console.log(
    "person1.greet === person2.greet:",
    person1.greet === person2.greet
  ); // true
  console.log("共享原型方法，节省内存");

  // 2. 实例方法 vs 原型方法的内存使用
  function PersonWithInstanceMethods(name, age) {
    this.name = name;
    this.age = age;

    // ❌ 每个实例都有自己的方法副本
    this.greet = function () {
      return `Hello, I'm ${this.name}`;
    };

    this.getAge = function () {
      return this.age;
    };
  }

  console.log("2. 实例方法 vs 原型方法：");
  let personA = new PersonWithInstanceMethods("Alice", 25);
  let personB = new PersonWithInstanceMethods("Bob", 30);

  console.log(
    "personA.greet === personB.greet:",
    personA.greet === personB.greet
  ); // false
  console.log("每个实例都有方法副本，浪费内存");

  // 3. 原型链的内存结构
  function Animal(name) {
    this.name = name;
  }

  Animal.prototype.speak = function () {
    return `${this.name} makes a sound`;
  };

  function Dog(name, breed) {
    Animal.call(this, name);
    this.breed = breed;
  }

  // 设置原型链
  Dog.prototype = Object.create(Animal.prototype);
  Dog.prototype.constructor = Dog;

  Dog.prototype.bark = function () {
    return `${this.name} barks`;
  };

  console.log("3. 原型链内存结构：");
  let dog = new Dog("Buddy", "Golden Retriever");

  console.log("dog.speak():", dog.speak()); // 从 Animal.prototype
  console.log("dog.bark():", dog.bark()); // 从 Dog.prototype

  // 检查原型链
  console.log("原型链查找路径:");
  console.log(
    "dog.__proto__ === Dog.prototype:",
    dog.__proto__ === Dog.prototype
  );
  console.log(
    "Dog.prototype.__proto__ === Animal.prototype:",
    Dog.prototype.__proto__ === Animal.prototype
  );

  // 4. ES6 类的内存结构
  class ModernPerson {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }

    greet() {
      return `Hello, I'm ${this.name}`;
    }

    static getSpecies() {
      return "Homo sapiens";
    }
  }

  console.log("4. ES6 类的内存结构：");
  let modernPerson1 = new ModernPerson("Charlie", 35);
  let modernPerson2 = new ModernPerson("Diana", 28);

  console.log(
    "modernPerson1.greet === modernPerson2.greet:",
    modernPerson1.greet === modernPerson2.greet
  ); // true
  console.log("ES6 类方法也是原型方法，共享内存");

  // 静态方法存储在构造函数上
  console.log("静态方法:", ModernPerson.getSpecies());
  console.log("ModernPerson.getSpecies === ModernPerson.getSpecies:", true);
}

prototypeMemoryDemo();
```

---

## 问题 4：内存优化和最佳实践

### 数组和函数的内存优化策略

```javascript
// 内存优化最佳实践
function memoryOptimizationDemo() {
  console.log("=== 内存优化最佳实践演示 ===");

  // 1. 数组内存优化
  console.log("1. 数组内存优化：");

  // ✅ 预分配数组大小
  function createOptimizedArray(size) {
    let arr = new Array(size);
    for (let i = 0; i < size; i++) {
      arr[i] = i * 2;
    }
    return arr;
  }

  // ❌ 动态增长数组（可能导致多次内存重分配）
  function createDynamicArray(size) {
    let arr = [];
    for (let i = 0; i < size; i++) {
      arr.push(i * 2);
    }
    return arr;
  }

  console.time("优化数组创建");
  let optimizedArr = createOptimizedArray(10000);
  console.timeEnd("优化数组创建");

  console.time("动态数组创建");
  let dynamicArr = createDynamicArray(10000);
  console.timeEnd("动态数组创建");

  // 2. 函数内存优化
  console.log("2. 函数内存优化：");

  // ✅ 使用原型方法
  function OptimizedClass(data) {
    this.data = data;
  }

  OptimizedClass.prototype.process = function () {
    return this.data.map((item) => item * 2);
  };

  OptimizedClass.prototype.filter = function (predicate) {
    return this.data.filter(predicate);
  };

  // ❌ 使用实例方法
  function UnoptimizedClass(data) {
    this.data = data;

    this.process = function () {
      return this.data.map((item) => item * 2);
    };

    this.filter = function (predicate) {
      return this.data.filter(predicate);
    };
  }

  // 创建多个实例测试内存使用
  let optimizedInstances = [];
  let unoptimizedInstances = [];

  for (let i = 0; i < 1000; i++) {
    optimizedInstances.push(new OptimizedClass([1, 2, 3, 4, 5]));
    unoptimizedInstances.push(new UnoptimizedClass([1, 2, 3, 4, 5]));
  }

  console.log("创建了 1000 个优化实例和 1000 个未优化实例");
  console.log("优化实例共享原型方法，节省内存");
  console.log("未优化实例每个都有方法副本，浪费内存");

  // 3. 内存清理策略
  console.log("3. 内存清理策略：");

  function createTemporaryData() {
    let largeArray = new Array(100000).fill(0).map((_, i) => ({
      id: i,
      data: `item-${i}`,
      timestamp: Date.now(),
    }));

    // 处理数据
    let processedData = largeArray
      .filter((item) => item.id % 2 === 0)
      .map((item) => ({ id: item.id, processed: true }))
      .slice(0, 100); // 只保留前100个

    // 清理原始大数组
    largeArray = null;

    return processedData;
  }

  let result = createTemporaryData();
  console.log("处理结果长度:", result.length);
  console.log("大数组已被清理，只保留处理结果");

  // 4. 避免内存泄漏
  console.log("4. 避免内存泄漏：");

  // ✅ 正确的事件监听器管理
  function createEventManager() {
    let listeners = new Map();

    return {
      addEventListener: function (event, callback) {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event).add(callback);
      },

      removeEventListener: function (event, callback) {
        if (listeners.has(event)) {
          listeners.get(event).delete(callback);
          if (listeners.get(event).size === 0) {
            listeners.delete(event);
          }
        }
      },

      emit: function (event, data) {
        if (listeners.has(event)) {
          listeners.get(event).forEach((callback) => callback(data));
        }
      },

      destroy: function () {
        listeners.clear();
        listeners = null;
      },
    };
  }

  let eventManager = createEventManager();

  let handler = function (data) {
    console.log("事件处理:", data);
  };

  eventManager.addEventListener("test", handler);
  eventManager.emit("test", "hello");
  eventManager.removeEventListener("test", handler);
  eventManager.destroy(); // 清理所有引用

  console.log("事件管理器已正确清理");
}

memoryOptimizationDemo();
```

### 内存监控和调试

```javascript
// 内存监控和调试技巧
function memoryMonitoringDemo() {
  console.log("=== 内存监控和调试演示 ===");

  // 1. 内存使用监控（Node.js 环境）
  if (typeof process !== "undefined" && process.memoryUsage) {
    console.log("1. 内存使用监控：");

    function logMemoryUsage(label) {
      const usage = process.memoryUsage();
      console.log(`${label}:`);
      console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)} MB`);
      console.log(
        `  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)} MB`
      );
      console.log(
        `  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)} MB`
      );
      console.log(`  External: ${Math.round(usage.external / 1024 / 1024)} MB`);
    }

    logMemoryUsage("初始内存使用");

    // 创建大量数据
    let largeData = [];
    for (let i = 0; i < 100000; i++) {
      largeData.push({
        id: i,
        data: new Array(100).fill(`data-${i}`),
      });
    }

    logMemoryUsage("创建大量数据后");

    // 清理数据
    largeData = null;

    // 手动触发垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
      logMemoryUsage("垃圾回收后");
    } else {
      logMemoryUsage("清理数据后（等待垃圾回收）");
    }
  }

  // 2. 对象引用追踪
  console.log("2. 对象引用追踪：");

  let referenceTracker = new WeakMap();

  function trackObject(obj, label) {
    referenceTracker.set(obj, {
      label: label,
      created: Date.now(),
    });
  }

  function getObjectInfo(obj) {
    return referenceTracker.get(obj);
  }

  // 创建和追踪对象
  let trackedArray = [1, 2, 3, 4, 5];
  let trackedFunction = function () {
    return "tracked";
  };

  trackObject(trackedArray, "Test Array");
  trackObject(trackedFunction, "Test Function");

  console.log("数组信息:", getObjectInfo(trackedArray));
  console.log("函数信息:", getObjectInfo(trackedFunction));

  // 3. 内存泄漏检测
  console.log("3. 内存泄漏检测：");

  function detectPotentialLeaks() {
    let potentialLeaks = [];

    // 检查全局对象上的意外属性
    if (typeof globalThis !== "undefined") {
      for (let key in globalThis) {
        if (key.startsWith("temp") || key.startsWith("test")) {
          potentialLeaks.push(`全局变量: ${key}`);
        }
      }
    }

    // 检查大型对象
    function checkObjectSize(obj, path = "") {
      if (obj && typeof obj === "object") {
        let size = 0;
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            size++;
            if (size > 1000) {
              potentialLeaks.push(`大型对象: ${path}.${key} (${size}+ 属性)`);
              break;
            }
          }
        }
      }
    }

    return potentialLeaks;
  }

  let leaks = detectPotentialLeaks();
  if (leaks.length > 0) {
    console.log("检测到潜在内存泄漏:", leaks);
  } else {
    console.log("未检测到明显的内存泄漏");
  }

  // 4. 性能分析工具使用建议
  console.log("4. 性能分析建议：");
  console.log(`
  浏览器环境：
  - 使用 Chrome DevTools 的 Memory 面板
  - 进行堆快照对比分析
  - 使用 Performance 面板监控内存使用
  
  Node.js 环境：
  - 使用 --inspect 标志启动调试
  - 使用 clinic.js 进行性能分析
  - 使用 heapdump 模块生成堆转储
  
  通用建议：
  - 定期监控内存使用情况
  - 及时清理不需要的引用
  - 避免创建不必要的闭包
  - 使用对象池重用对象
  `);
}

memoryMonitoringDemo();
```

---

## 总结

### 内存存储机制总结

```javascript
// 数组和函数内存存储总结
function memorySummary() {
  console.log("=== 数组和函数内存存储总结 ===");

  console.log(`
  数组内存存储：
  1. 存储位置：堆内存中，栈中存储引用
  2. 内存布局：连续或非连续，取决于数组类型
  3. 元素访问：通过索引快速访问
  4. 内存优化：
     - 预分配大小
     - 保持类型一致性
     - 避免稀疏数组
     - 及时清理大数组
  
  函数内存存储：
  1. 存储位置：堆内存中，包含代码和环境
  2. 原型共享：原型方法被所有实例共享
  3. 闭包影响：保持对外部变量的引用
  4. 内存优化：
     - 使用原型方法而非实例方法
     - 避免不必要的闭包
     - 及时清理事件监听器
     - 合理管理作用域链
  
  最佳实践：
  1. 理解引用传递机制
  2. 合理使用浅复制和深复制
  3. 避免内存泄漏
  4. 定期进行内存监控
  5. 使用性能分析工具
  `);
}

memorySummary();
```

### 关键要点

| 类型         | 存储位置 | 特点               | 优化建议                   |
| ------------ | -------- | ------------------ | -------------------------- |
| **数组**     | 堆内存   | 引用传递，动态大小 | 预分配、类型一致、避免稀疏 |
| **函数**     | 堆内存   | 包含代码和环境     | 使用原型、避免闭包泄漏     |
| **原型方法** | 共享内存 | 所有实例共享       | 优先使用原型方法           |
| **闭包变量** | 持久保存 | 阻止垃圾回收       | 及时清理不需要的引用       |

理解数组和函数的内存存储机制有助于：

- 编写更高效的代码
- 避免内存泄漏问题
- 优化应用性能
- 进行有效的内存管理
