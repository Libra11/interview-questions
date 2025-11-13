---
title: 副作用是什么概念？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解副作用的概念，掌握纯函数与副作用的关系，学会识别和管理副作用，编写更可预测和可维护的代码。
tags:
  - 副作用
  - 纯函数
  - 函数式编程
  - 代码质量
estimatedTime: 30 分钟
keywords:
  - 副作用
  - Side Effects
  - 纯函数
  - 函数式编程
highlight: 理解副作用的定义和影响，掌握纯函数的概念，学会管理和控制副作用
order: 45
---

## 问题 1：什么是副作用？

**副作用定义**

副作用（Side Effect）是指函数在执行过程中，除了返回值之外，还对外部环境产生了可观察的影响。这些影响包括修改全局变量、修改参数、进行 I/O 操作、调用其他有副作用的函数等。

### 副作用的常见表现

```javascript
// 1. 修改全局变量
let globalCounter = 0;

function incrementCounter() {
  globalCounter++; // 副作用：修改全局变量
  return globalCounter;
}

console.log(incrementCounter()); // 1
console.log(globalCounter); // 1 (全局状态被改变)

// 2. 修改传入的对象或数组
function addItem(array, item) {
  array.push(item); // 副作用：修改传入的数组
  return array;
}

const originalArray = [1, 2, 3];
const result = addItem(originalArray, 4);
console.log(originalArray); // [1, 2, 3, 4] (原数组被修改)

// 3. 进行 I/O 操作
function logMessage(message) {
  console.log(message); // 副作用：输出到控制台
  return message;
}

// 4. 修改 DOM
function updateElement(id, text) {
  const element = document.getElementById(id);
  element.textContent = text; // 副作用：修改 DOM
  return text;
}

// 5. 发起网络请求
function fetchUserData(userId) {
  fetch(`/api/users/${userId}`) // 副作用：网络请求
    .then((response) => response.json())
    .then((data) => console.log(data));
}

// 6. 修改对象属性
const user = { name: "Alice", age: 25 };

function updateUserAge(userObj, newAge) {
  userObj.age = newAge; // 副作用：修改对象属性
  return userObj;
}

updateUserAge(user, 26);
console.log(user.age); // 26 (原对象被修改)
```

---

## 问题 2：纯函数 vs 有副作用的函数

### 纯函数的特征

纯函数具有以下特征：

1. **相同输入总是产生相同输出**
2. **没有副作用**
3. **不依赖外部状态**

```javascript
// ✅ 纯函数示例
function add(a, b) {
  return a + b; // 只依赖参数，没有副作用
}

function multiply(x, y) {
  return x * y; // 相同输入总是相同输出
}

function getFullName(firstName, lastName) {
  return `${firstName} ${lastName}`; // 不修改外部状态
}

// 纯函数的数组操作
function addToArray(array, item) {
  return [...array, item]; // 返回新数组，不修改原数组
}

function removeFromArray(array, index) {
  return array.filter((_, i) => i !== index); // 返回新数组
}

// 纯函数的对象操作
function updateUser(user, updates) {
  return { ...user, ...updates }; // 返回新对象，不修改原对象
}

// 使用示例
const numbers = [1, 2, 3];
const newNumbers = addToArray(numbers, 4);
console.log(numbers); // [1, 2, 3] (原数组未变)
console.log(newNumbers); // [1, 2, 3, 4]

const user = { name: "Alice", age: 25 };
const updatedUser = updateUser(user, { age: 26 });
console.log(user); // { name: 'Alice', age: 25 } (原对象未变)
console.log(updatedUser); // { name: 'Alice', age: 26 }
```

### 有副作用的函数

```javascript
// ❌ 有副作用的函数示例

// 1. 依赖外部状态
let config = { debug: true };

function log(message) {
  if (config.debug) {
    // 依赖外部变量
    console.log(message); // 副作用：输出
  }
}

// 2. 修改全局状态
let requestCount = 0;

function makeRequest(url) {
  requestCount++; // 副作用：修改全局变量
  return fetch(url); // 副作用：网络请求
}

// 3. 修改传入参数
function sortArray(array) {
  return array.sort(); // 副作用：修改原数组
}

// 4. 随机性（不可预测的输出）
function generateId() {
  return Math.random().toString(36); // 相同输入不同输出
}

function getCurrentTime() {
  return new Date(); // 每次调用结果不同
}

// 5. 抛出异常
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero"); // 副作用：抛出异常
  }
  return a / b;
}
```

---

## 问题 3：副作用的类型和影响

### 副作用的分类

```javascript
// 1. 状态修改类副作用
class StateModification {
  constructor() {
    this.count = 0;
    this.items = [];
  }

  // 修改实例状态
  increment() {
    this.count++; // 副作用：修改对象状态
    return this.count;
  }

  // 修改数组状态
  addItem(item) {
    this.items.push(item); // 副作用：修改数组
    return this.items.length;
  }
}

// 2. I/O 操作类副作用
function ioOperations() {
  // 文件操作
  const fs = require("fs");
  fs.writeFileSync("log.txt", "Hello World"); // 副作用：写文件

  // 网络请求
  fetch("/api/data"); // 副作用：网络请求

  // 数据库操作
  // database.save(data); // 副作用：数据库写入
}

// 3. 用户界面类副作用
function uiOperations() {
  // DOM 操作
  document.body.innerHTML = "<h1>Hello</h1>"; // 副作用：修改 DOM

  // 样式修改
  document.body.style.backgroundColor = "red"; // 副作用：修改样式

  // 事件监听
  document.addEventListener("click", handler); // 副作用：添加事件监听
}

// 4. 时间相关副作用
function timeRelatedSideEffects() {
  // 定时器
  setTimeout(() => {
    console.log("Timer executed");
  }, 1000); // 副作用：设置定时器

  // 获取当前时间
  const now = Date.now(); // 副作用：依赖系统时间

  return now;
}

// 5. 异常和错误处理
function errorHandling(data) {
  if (!data) {
    console.error("Data is required"); // 副作用：错误输出
    throw new Error("Invalid data"); // 副作用：抛出异常
  }

  return data.value;
}
```

### 副作用的影响

```javascript
// 副作用对代码的影响示例

// 1. 测试困难
let database = [];

function saveUser(user) {
  database.push(user); // 副作用：修改全局状态
  console.log("User saved:", user.name); // 副作用：输出
  return user.id;
}

// 测试时需要清理状态
function testSaveUser() {
  database = []; // 需要重置状态
  const user = { id: 1, name: "Alice" };
  const result = saveUser(user);
  // 难以验证 console.log 的输出
  console.assert(result === 1);
  console.assert(database.length === 1);
}

// 2. 并发问题
let sharedCounter = 0;

function incrementSharedCounter() {
  const current = sharedCounter; // 读取
  // 在多线程环境中，这里可能被其他线程修改
  sharedCounter = current + 1; // 写入
  return sharedCounter;
}

// 3. 调试困难
function complexFunction(data) {
  updateGlobalState(data); // 副作用：修改全局状态
  logToFile(data); // 副作用：写文件
  sendAnalytics(data); // 副作用：网络请求

  return processData(data);
}

// 调试时需要考虑所有副作用的影响

// 4. 缓存失效
const cache = new Map();

function expensiveCalculation(input) {
  if (cache.has(input)) {
    return cache.get(input);
  }

  const result = performCalculation(input);
  updateGlobalCounter(); // 副作用：修改全局状态
  cache.set(input, result);

  return result;
}

// 由于副作用，缓存可能不准确
```

---

## 问题 4：如何管理和控制副作用

### 策略 1：隔离副作用

```javascript
// 将副作用从纯逻辑中分离出来

// ❌ 混合了纯逻辑和副作用
function processUserData(userData) {
  // 纯逻辑
  const processedData = {
    ...userData,
    name: userData.name.toUpperCase(),
    email: userData.email.toLowerCase(),
  };

  // 副作用
  console.log("Processing user:", processedData.name);
  localStorage.setItem("lastUser", JSON.stringify(processedData));

  return processedData;
}

// ✅ 分离纯逻辑和副作用
function transformUserData(userData) {
  // 纯函数：只处理数据转换
  return {
    ...userData,
    name: userData.name.toUpperCase(),
    email: userData.email.toLowerCase(),
  };
}

function logUser(userData) {
  // 副作用：日志记录
  console.log("Processing user:", userData.name);
}

function saveUser(userData) {
  // 副作用：数据持久化
  localStorage.setItem("lastUser", JSON.stringify(userData));
}

// 使用时组合
function processUserData(userData) {
  const processedData = transformUserData(userData); // 纯函数
  logUser(processedData); // 副作用
  saveUser(processedData); // 副作用
  return processedData;
}
```

### 策略 2：使用依赖注入

```javascript
// 通过依赖注入控制副作用

// ❌ 硬编码的副作用
function sendNotification(message) {
  // 硬编码的副作用
  console.log("Sending notification:", message);
  fetch("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ✅ 依赖注入
function createNotificationSender(logger, httpClient) {
  return function sendNotification(message) {
    logger.log("Sending notification:", message); // 注入的依赖
    return httpClient.post("/api/notifications", { message }); // 注入的依赖
  };
}

// 生产环境
const productionSender = createNotificationSender(console, fetch);

// 测试环境
const testLogger = { log: jest.fn() };
const testHttpClient = { post: jest.fn() };
const testSender = createNotificationSender(testLogger, testHttpClient);

// 测试更容易
testSender("Test message");
expect(testLogger.log).toHaveBeenCalledWith(
  "Sending notification:",
  "Test message"
);
expect(testHttpClient.post).toHaveBeenCalledWith("/api/notifications", {
  message: "Test message",
});
```

### 策略 3：使用高阶函数

```javascript
// 使用高阶函数包装副作用

// 日志装饰器
function withLogging(fn, logger = console) {
  return function (...args) {
    logger.log(`Calling ${fn.name} with args:`, args);
    const result = fn.apply(this, args);
    logger.log(`${fn.name} returned:`, result);
    return result;
  };
}

// 缓存装饰器
function withCache(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("Cache hit for:", key);
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    console.log("Cache miss for:", key);
    return result;
  };
}

// 错误处理装饰器
function withErrorHandling(fn, errorHandler = console.error) {
  return function (...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      errorHandler("Error in", fn.name, ":", error);
      throw error;
    }
  };
}

// 使用示例
function expensiveCalculation(n) {
  // 纯函数
  return n * n * n;
}

// 组合装饰器
const enhancedCalculation = withErrorHandling(
  withCache(withLogging(expensiveCalculation))
);

console.log(enhancedCalculation(5)); // 第一次调用
console.log(enhancedCalculation(5)); // 从缓存返回
```

### 策略 4：函数式编程模式

```javascript
// 使用函数式编程模式管理副作用

// Maybe/Option 模式处理可能的副作用
class Maybe {
  constructor(value) {
    this.value = value;
  }

  static of(value) {
    return new Maybe(value);
  }

  static nothing() {
    return new Maybe(null);
  }

  isNothing() {
    return this.value === null || this.value === undefined;
  }

  map(fn) {
    return this.isNothing() ? Maybe.nothing() : Maybe.of(fn(this.value));
  }

  flatMap(fn) {
    return this.isNothing() ? Maybe.nothing() : fn(this.value);
  }

  getOrElse(defaultValue) {
    return this.isNothing() ? defaultValue : this.value;
  }
}

// 使用 Maybe 处理可能失败的操作
function safeParseJSON(jsonString) {
  try {
    return Maybe.of(JSON.parse(jsonString));
  } catch (error) {
    console.error("JSON parse error:", error); // 副作用：错误日志
    return Maybe.nothing();
  }
}

function processUserData(jsonString) {
  return safeParseJSON(jsonString)
    .map((data) => ({ ...data, processed: true })) // 纯函数转换
    .map((data) => ({ ...data, timestamp: Date.now() })) // 添加时间戳
    .getOrElse({ error: "Invalid data" });
}

// IO Monad 模式（简化版）
class IO {
  constructor(effect) {
    this.effect = effect;
  }

  static of(value) {
    return new IO(() => value);
  }

  map(fn) {
    return new IO(() => fn(this.effect()));
  }

  flatMap(fn) {
    return new IO(() => fn(this.effect()).effect());
  }

  run() {
    return this.effect(); // 执行副作用
  }
}

// 将副作用包装在 IO 中
const readFile = (filename) =>
  new IO(() => {
    // 副作用：文件读取
    return require("fs").readFileSync(filename, "utf8");
  });

const writeFile = (filename, content) =>
  new IO(() => {
    // 副作用：文件写入
    require("fs").writeFileSync(filename, content);
    return content;
  });

const log = (message) =>
  new IO(() => {
    // 副作用：日志输出
    console.log(message);
    return message;
  });

// 组合 IO 操作（延迟执行副作用）
const fileOperation = readFile("input.txt")
  .map((content) => content.toUpperCase()) // 纯函数转换
  .flatMap((content) => writeFile("output.txt", content))
  .flatMap((content) => log(`Processed: ${content.length} characters`));

// 只有调用 run() 时才执行副作用
fileOperation.run();
```

---

## 问题 5：副作用在实际开发中的应用

### React 中的副作用管理

```javascript
// React 中使用 useEffect 管理副作用
import React, { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 副作用：数据获取
  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();

        if (!cancelled) {
          setUser(userData);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch user:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // 清理函数：取消请求
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 副作用：文档标题更新
  useEffect(() => {
    if (user) {
      document.title = `Profile - ${user.name}`;
    }

    // 清理函数：恢复标题
    return () => {
      document.title = "My App";
    };
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 自定义 Hook 封装副作用
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const userData = await response.json();

        if (!cancelled) {
          setUser(userData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      fetchUser();
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading, error };
}
```

### Node.js 中的副作用管理

```javascript
// Node.js 中管理副作用的模式

// 1. 错误优先回调模式
const fs = require("fs");

function readFileWithCallback(filename, callback) {
  fs.readFile(filename, "utf8", (error, data) => {
    if (error) {
      return callback(error, null); // 副作用：错误处理
    }

    try {
      const processedData = data.toUpperCase(); // 纯函数处理
      callback(null, processedData); // 副作用：回调执行
    } catch (processError) {
      callback(processError, null);
    }
  });
}

// 2. Promise 模式
function readFileWithPromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (error, data) => {
      if (error) {
        reject(error); // 副作用：错误处理
      } else {
        resolve(data.toUpperCase()); // 副作用：成功处理
      }
    });
  });
}

// 3. async/await 模式
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);

async function processFile(filename) {
  try {
    const data = await readFileAsync(filename, "utf8"); // 副作用：文件读取
    const processedData = data.toUpperCase(); // 纯函数处理

    console.log("File processed successfully"); // 副作用：日志
    return processedData;
  } catch (error) {
    console.error("Error processing file:", error); // 副作用：错误日志
    throw error;
  }
}

// 4. 流式处理（管理大文件的副作用）
const { Transform } = require("stream");

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // 纯函数转换
    const upperChunk = chunk.toString().toUpperCase();

    // 副作用：数据传递
    this.push(upperChunk);
    callback();
  }
}

function processLargeFile(inputFile, outputFile) {
  const readStream = fs.createReadStream(inputFile); // 副作用：文件读取
  const writeStream = fs.createWriteStream(outputFile); // 副作用：文件写入
  const transformer = new UpperCaseTransform();

  // 副作用：流管道
  readStream
    .pipe(transformer)
    .pipe(writeStream)
    .on("finish", () => {
      console.log("File processing completed"); // 副作用：日志
    })
    .on("error", (error) => {
      console.error("Error processing file:", error); // 副作用：错误处理
    });
}
```

### 测试中的副作用处理

```javascript
// 测试有副作用的函数

// 被测试的函数（有副作用）
class UserService {
  constructor(database, logger, emailService) {
    this.database = database;
    this.logger = logger;
    this.emailService = emailService;
  }

  async createUser(userData) {
    try {
      // 副作用：数据库操作
      const user = await this.database.save(userData);

      // 副作用：日志记录
      this.logger.info("User created:", user.id);

      // 副作用：发送邮件
      await this.emailService.sendWelcomeEmail(user.email);

      return user;
    } catch (error) {
      // 副作用：错误日志
      this.logger.error("Failed to create user:", error);
      throw error;
    }
  }
}

// 测试代码
describe("UserService", () => {
  let userService;
  let mockDatabase;
  let mockLogger;
  let mockEmailService;

  beforeEach(() => {
    // 模拟所有副作用
    mockDatabase = {
      save: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
    };

    userService = new UserService(mockDatabase, mockLogger, mockEmailService);
  });

  test("should create user successfully", async () => {
    const userData = { name: "Alice", email: "alice@example.com" };
    const savedUser = { id: 1, ...userData };

    mockDatabase.save.mockResolvedValue(savedUser);
    mockEmailService.sendWelcomeEmail.mockResolvedValue();

    const result = await userService.createUser(userData);

    // 验证返回值
    expect(result).toEqual(savedUser);

    // 验证副作用
    expect(mockDatabase.save).toHaveBeenCalledWith(userData);
    expect(mockLogger.info).toHaveBeenCalledWith("User created:", 1);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      "alice@example.com"
    );
  });

  test("should handle database error", async () => {
    const userData = { name: "Alice", email: "alice@example.com" };
    const error = new Error("Database error");

    mockDatabase.save.mockRejectedValue(error);

    await expect(userService.createUser(userData)).rejects.toThrow(
      "Database error"
    );

    // 验证错误处理副作用
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to create user:",
      error
    );
    expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
```

---

## 问题 6：副作用的最佳实践

### 最佳实践总结

```javascript
// 1. 明确标识副作用
// ✅ 使用命名约定标识有副作用的函数
function saveUserToDatabase(user) {
  // 名称暗示副作用
  return database.save(user);
}

function logUserAction(action) {
  // 名称暗示副作用
  console.log("User action:", action);
}

function calculateTax(income, rate) {
  // 纯函数，名称不暗示副作用
  return income * rate;
}

// 2. 最小化副作用的范围
// ❌ 副作用分散在各处
function processOrder(order) {
  console.log("Processing order:", order.id); // 副作用1

  const tax = order.amount * 0.1;
  const total = order.amount + tax;

  database.save({ ...order, tax, total }); // 副作用2

  emailService.send(order.email, "Order processed"); // 副作用3

  return { ...order, tax, total };
}

// ✅ 集中管理副作用
function calculateOrderTotal(order) {
  // 纯函数：计算逻辑
  const tax = order.amount * 0.1;
  const total = order.amount + tax;
  return { ...order, tax, total };
}

async function processOrder(order) {
  // 纯函数处理
  const processedOrder = calculateOrderTotal(order);

  // 集中的副作用处理
  await performOrderSideEffects(processedOrder);

  return processedOrder;
}

async function performOrderSideEffects(order) {
  // 所有副作用集中在这里
  console.log("Processing order:", order.id);
  await database.save(order);
  await emailService.send(order.email, "Order processed");
}

// 3. 使用纯函数进行核心逻辑
// ✅ 将业务逻辑实现为纯函数
const businessLogic = {
  calculateDiscount: (price, discountRate) => price * discountRate,

  applyDiscount: (item, discount) => ({
    ...item,
    originalPrice: item.price,
    discount: discount,
    finalPrice: item.price - discount,
  }),

  validateOrder: (order) => {
    const errors = [];
    if (!order.items || order.items.length === 0) {
      errors.push("Order must have items");
    }
    if (!order.email) {
      errors.push("Email is required");
    }
    return { isValid: errors.length === 0, errors };
  },
};

// 副作用层
const sideEffects = {
  logError: (error) => console.error("Error:", error),
  saveOrder: (order) => database.save(order),
  sendEmail: (email, message) => emailService.send(email, message),
};

// 4. 使用函数组合
// ✅ 组合纯函数和副作用
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

const processOrderPipeline = pipe(
  businessLogic.validateOrder,
  (validation) => {
    if (!validation.isValid) {
      sideEffects.logError(validation.errors);
      throw new Error("Invalid order");
    }
    return validation.order;
  },
  businessLogic.calculateOrderTotal,
  (order) => {
    sideEffects.saveOrder(order); // 副作用
    sideEffects.sendEmail(order.email, "Order confirmed"); // 副作用
    return order;
  }
);

// 5. 错误边界和恢复
// ✅ 优雅处理副作用中的错误
async function robustProcessOrder(order) {
  try {
    // 纯函数处理
    const processedOrder = calculateOrderTotal(order);

    // 副作用处理，带错误恢复
    await performOrderSideEffectsWithRecovery(processedOrder);

    return { success: true, order: processedOrder };
  } catch (error) {
    // 错误处理副作用
    console.error("Order processing failed:", error);

    // 尝试恢复或补偿操作
    await attemptOrderRecovery(order, error);

    return { success: false, error: error.message };
  }
}

async function performOrderSideEffectsWithRecovery(order) {
  const operations = [
    () => database.save(order),
    () => emailService.send(order.email, "Order processed"),
    () => inventoryService.updateStock(order.items),
  ];

  const results = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error });

      // 执行补偿操作
      await compensateFailedOperations(results);
      throw error;
    }
  }

  return results;
}

async function compensateFailedOperations(results) {
  // 回滚已成功的操作
  for (const result of results) {
    if (result.success) {
      try {
        await rollbackOperation(result);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
  }
}
```

---

## 总结

**副作用的核心概念**：

### 1. 定义

- 函数执行时对外部环境产生的可观察影响
- 包括状态修改、I/O 操作、异常抛出等

### 2. 常见类型

- **状态修改**：全局变量、对象属性、数组内容
- **I/O 操作**：文件读写、网络请求、数据库操作
- **用户界面**：DOM 操作、样式修改、事件监听
- **系统交互**：日志输出、时间获取、随机数生成

### 3. 影响

- **测试困难**：需要模拟外部依赖
- **调试复杂**：状态变化难以追踪
- **并发问题**：共享状态的竞争条件
- **可预测性差**：相同输入可能产生不同结果

### 4. 管理策略

- **隔离副作用**：分离纯逻辑和副作用
- **依赖注入**：通过参数传递副作用依赖
- **高阶函数**：使用装饰器模式包装副作用
- **函数式模式**：使用 Maybe、IO 等模式管理副作用

### 5. 最佳实践

- **明确标识**：使用命名约定标识有副作用的函数
- **最小化范围**：集中管理副作用，减少分散
- **纯函数优先**：核心业务逻辑使用纯函数
- **错误处理**：优雅处理副作用中的错误
- **测试友好**：设计易于测试的副作用接口

理解和管理副作用是编写高质量、可维护代码的关键。通过合理的设计模式和最佳实践，可以在保持代码功能完整的同时，提高代码的可测试性和可预测性。
