---
title: 什么是 class 装饰器？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解装饰器的概念、语法和应用场景，掌握类装饰器、方法装饰器、属性装饰器的实现原理和使用技巧。
tags:
  - 装饰器
  - ES提案
  - 元编程
  - TypeScript
estimatedTime: 24 分钟
keywords:
  - 装饰器
  - Decorator
  - 类装饰器
  - 方法装饰器
  - 元编程
highlight: 装饰器是一种特殊的声明，可以附加到类、方法、属性上，用于修改或扩展其行为
order: 112
---

## 问题 1：什么是装饰器？

装饰器是一种**特殊的声明**，可以附加到类、方法、属性或参数上，用于修改或扩展它们的行为，本质上是一个函数。

### 基本概念

装饰器使用 `@` 符号标记，放在被装饰对象的前面。

```javascript
// 装饰器的基本形式
@decorator
class MyClass {
  @methodDecorator
  myMethod() {}
  
  @propertyDecorator
  myProperty = 'value';
}

// 装饰器本质上是一个函数
function decorator(target) {
  // target 是被装饰的类
  console.log('装饰类:', target.name);
  return target;
}
```

### 装饰器的作用

```javascript
// 装饰器可以：
// 1. 修改类的行为
// 2. 添加额外的属性或方法
// 3. 记录日志
// 4. 验证参数
// 5. 控制访问权限

// 示例：添加日志功能
function log(target) {
  const original = target.prototype.constructor;
  
  target.prototype.constructor = function(...args) {
    console.log(`创建 ${target.name} 实例，参数:`, args);
    return original.apply(this, args);
  };
  
  return target;
}

@log
class User {
  constructor(name) {
    this.name = name;
  }
}

const user = new User('Alice');
// 输出：创建 User 实例，参数: ['Alice']
```

### 装饰器的执行时机

```javascript
// 装饰器在类定义时执行，而不是实例化时
function decorator(target) {
  console.log('装饰器执行');
  return target;
}

@decorator  // 这里立即执行
class MyClass {}

console.log('类定义完成');

// 输出顺序：
// 装饰器执行
// 类定义完成
```

---

## 问题 2：如何实现类装饰器？

类装饰器应用于类的构造函数，可以用来修改或替换类的定义。

### 基础类装饰器

```javascript
// 类装饰器接收一个参数：类的构造函数
function sealed(constructor) {
  // 密封类，不能添加新属性
  Object.seal(constructor);
  Object.seal(constructor.prototype);
  
  return constructor;
}

@sealed
class Person {
  constructor(name) {
    this.name = name;
  }
}

// 尝试添加新属性会失败（严格模式下报错）
Person.newProperty = 'test'; // 无效
```

### 添加静态属性

```javascript
// 装饰器可以给类添加静态属性或方法
function addTimestamp(target) {
  target.timestamp = Date.now();
  
  target.getTimestamp = function() {
    return this.timestamp;
  };
  
  return target;
}

@addTimestamp
class Article {
  constructor(title) {
    this.title = title;
  }
}

console.log(Article.timestamp); // 时间戳
console.log(Article.getTimestamp()); // 时间戳
```

### 修改类的行为

```javascript
// 装饰器可以包装或替换类
function singleton(target) {
  let instance = null;
  
  // 返回一个新的构造函数
  return new Proxy(target, {
    construct(Target, args) {
      if (!instance) {
        instance = new Target(...args);
      }
      return instance;
    }
  });
}

@singleton
class Database {
  constructor(config) {
    this.config = config;
  }
}

const db1 = new Database({ host: 'localhost' });
const db2 = new Database({ host: 'remote' });

console.log(db1 === db2); // true（单例模式）
```

### 装饰器工厂

```javascript
// 装饰器工厂：返回装饰器的函数，可以接收参数
function log(prefix) {
  // 返回真正的装饰器
  return function(target) {
    const original = target.prototype.constructor;
    
    target.prototype.constructor = function(...args) {
      console.log(`${prefix}: 创建 ${target.name}`, args);
      return original.apply(this, args);
    };
    
    return target;
  };
}

@log('系统日志')
class User {
  constructor(name) {
    this.name = name;
  }
}

const user = new User('Alice');
// 输出：系统日志: 创建 User ['Alice']
```

---

## 问题 3：如何实现方法装饰器？

方法装饰器应用于方法的属性描述符，可以修改方法的行为。

### 基础方法装饰器

```javascript
// 方法装饰器接收三个参数：
// target: 类的原型对象（实例方法）或类本身（静态方法）
// propertyKey: 方法名
// descriptor: 属性描述符
function readonly(target, propertyKey, descriptor) {
  descriptor.writable = false;
  return descriptor;
}

class Person {
  constructor(name) {
    this.name = name;
  }
  
  @readonly
  getName() {
    return this.name;
  }
}

const person = new Person('Alice');
console.log(person.getName()); // 'Alice'

// 尝试修改方法会失败
person.getName = function() {
  return 'Bob';
}; // 无效（严格模式下报错）
```

### 日志装饰器

```javascript
// 记录方法的调用
function log(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    console.log(`调用 ${propertyKey}，参数:`, args);
    
    const result = originalMethod.apply(this, args);
    
    console.log(`${propertyKey} 返回:`, result);
    return result;
  };
  
  return descriptor;
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// 输出：
// 调用 add，参数: [2, 3]
// add 返回: 5
```

### 性能监控装饰器

```javascript
// 测量方法执行时间
function measure(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    const start = performance.now();
    
    const result = originalMethod.apply(this, args);
    
    const end = performance.now();
    console.log(`${propertyKey} 执行时间: ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
  
  return descriptor;
}

class DataProcessor {
  @measure
  processLargeData(data) {
    // 模拟耗时操作
    return data.map(item => item * 2);
  }
}

const processor = new DataProcessor();
processor.processLargeData([1, 2, 3, 4, 5]);
// 输出：processLargeData 执行时间: 0.15ms
```

### 参数化方法装饰器

```javascript
// 装饰器工厂：接收参数
function debounce(delay) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    let timer = null;
    
    descriptor.value = function(...args) {
      clearTimeout(timer);
      
      timer = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };
    
    return descriptor;
  };
}

class SearchBox {
  @debounce(500)
  search(keyword) {
    console.log('搜索:', keyword);
    // 发起搜索请求
  }
}

const searchBox = new SearchBox();
searchBox.search('a');
searchBox.search('ab');
searchBox.search('abc');
// 只会执行最后一次：搜索: abc
```

---

## 问题 4：如何实现属性装饰器？

属性装饰器应用于类的属性，可以修改属性的行为或添加元数据。

### 基础属性装饰器

```javascript
// 属性装饰器接收两个参数：
// target: 类的原型对象
// propertyKey: 属性名
function defaultValue(value) {
  return function(target, propertyKey) {
    // 使用 Object.defineProperty 定义属性
    let val = value;
    
    Object.defineProperty(target, propertyKey, {
      get() {
        return val;
      },
      set(newValue) {
        val = newValue !== undefined ? newValue : value;
      },
      enumerable: true,
      configurable: true
    });
  };
}

class User {
  @defaultValue('匿名用户')
  name;
  
  @defaultValue(0)
  age;
}

const user = new User();
console.log(user.name); // '匿名用户'
console.log(user.age);  // 0

user.name = undefined;
console.log(user.name); // '匿名用户'（恢复默认值）
```

### 验证装饰器

```javascript
// 属性值验证
function validate(validator) {
  return function(target, propertyKey) {
    let value;
    
    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(newValue) {
        if (!validator(newValue)) {
          throw new Error(`${propertyKey} 验证失败`);
        }
        value = newValue;
      },
      enumerable: true,
      configurable: true
    });
  };
}

class Person {
  @validate(value => typeof value === 'string' && value.length > 0)
  name;
  
  @validate(value => typeof value === 'number' && value >= 0 && value <= 150)
  age;
}

const person = new Person();
person.name = 'Alice'; // 正常
person.age = 25;       // 正常

// person.age = 200;   // 抛出错误：age 验证失败
// person.name = '';   // 抛出错误：name 验证失败
```

### 只读属性装饰器

```javascript
// 创建只读属性
function readonly(target, propertyKey) {
  Object.defineProperty(target, propertyKey, {
    writable: false,
    configurable: false
  });
}

class Config {
  @readonly
  API_URL = 'https://api.example.com';
  
  @readonly
  MAX_RETRY = 3;
}

const config = new Config();
console.log(config.API_URL); // 'https://api.example.com'

// 尝试修改会失败
config.API_URL = 'https://other.com'; // 无效
console.log(config.API_URL); // 仍然是 'https://api.example.com'
```

---

## 问题 5：装饰器的执行顺序是什么？

多个装饰器的执行顺序遵循特定的规则。

### 同一目标的多个装饰器

```javascript
// 多个装饰器从下到上执行（装饰器工厂从上到下）
function first() {
  console.log('first(): 工厂函数');
  return function(target, propertyKey, descriptor) {
    console.log('first(): 装饰器执行');
  };
}

function second() {
  console.log('second(): 工厂函数');
  return function(target, propertyKey, descriptor) {
    console.log('second(): 装饰器执行');
  };
}

class Example {
  @first()
  @second()
  method() {}
}

// 输出顺序：
// first(): 工厂函数
// second(): 工厂函数
// second(): 装饰器执行
// first(): 装饰器执行
```

### 不同类型装饰器的顺序

```javascript
// 执行顺序：属性 > 方法 > 参数 > 类
function classDecorator(target) {
  console.log('4. 类装饰器');
  return target;
}

function propertyDecorator(target, propertyKey) {
  console.log('1. 属性装饰器:', propertyKey);
}

function methodDecorator(target, propertyKey, descriptor) {
  console.log('2. 方法装饰器:', propertyKey);
  return descriptor;
}

function parameterDecorator(target, propertyKey, parameterIndex) {
  console.log('3. 参数装饰器:', propertyKey, parameterIndex);
}

@classDecorator
class Example {
  @propertyDecorator
  property = 'value';
  
  @methodDecorator
  method(@parameterDecorator param) {}
}

// 输出：
// 1. 属性装饰器: property
// 3. 参数装饰器: method 0
// 2. 方法装饰器: method
// 4. 类装饰器
```

### 装饰器组合

```javascript
// 装饰器可以组合使用，形成装饰器链
function validate(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    console.log('验证参数');
    if (args.some(arg => arg === undefined)) {
      throw new Error('参数不能为 undefined');
    }
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

function log(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    console.log(`调用 ${propertyKey}`);
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

class Service {
  @log
  @validate
  process(data) {
    console.log('处理数据:', data);
    return data;
  }
}

const service = new Service();
service.process('test');
// 输出：
// 调用 process
// 验证参数
// 处理数据: test
```

---

## 问题 6：装饰器的实际应用场景有哪些？

装饰器在实际开发中有很多实用的应用场景。

### 权限控制

```javascript
// 检查用户权限
function requireAuth(roles) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const user = this.currentUser; // 假设有当前用户信息
      
      if (!user) {
        throw new Error('未登录');
      }
      
      if (!roles.includes(user.role)) {
        throw new Error('权限不足');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

class AdminPanel {
  currentUser = { role: 'admin' };
  
  @requireAuth(['admin'])
  deleteUser(userId) {
    console.log('删除用户:', userId);
  }
  
  @requireAuth(['admin', 'moderator'])
  editPost(postId) {
    console.log('编辑帖子:', postId);
  }
}

const panel = new AdminPanel();
panel.deleteUser(123); // 正常执行

panel.currentUser = { role: 'user' };
// panel.deleteUser(123); // 抛出错误：权限不足
```

### 缓存装饰器

```javascript
// 缓存方法的返回值
function memoize(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  const cache = new Map();
  
  descriptor.value = function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      console.log('从缓存获取:', key);
      return cache.get(key);
    }
    
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
  
  return descriptor;
}

class Calculator {
  @memoize
  fibonacci(n) {
    console.log('计算 fibonacci:', n);
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const calc = new Calculator();
calc.fibonacci(5); // 计算多次
calc.fibonacci(5); // 从缓存获取
```

### 异步错误处理

```javascript
// 自动捕获异步方法的错误
function catchError(errorHandler) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (errorHandler) {
          errorHandler.call(this, error, propertyKey, args);
        } else {
          console.error(`${propertyKey} 发生错误:`, error);
        }
      }
    };
    
    return descriptor;
  };
}

class ApiService {
  @catchError((error, method, args) => {
    console.log(`API 调用失败: ${method}`, args);
    console.error(error);
  })
  async fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('请求失败');
    }
    return response.json();
  }
}

const api = new ApiService();
api.fetchUser(123); // 错误会被自动捕获
```

### 依赖注入

```javascript
// 简单的依赖注入实现
const container = new Map();

function injectable(target) {
  container.set(target.name, target);
  return target;
}

function inject(serviceName) {
  return function(target, propertyKey) {
    Object.defineProperty(target, propertyKey, {
      get() {
        const Service = container.get(serviceName);
        if (!Service) {
          throw new Error(`服务 ${serviceName} 未注册`);
        }
        return new Service();
      },
      enumerable: true,
      configurable: true
    });
  };
}

@injectable
class Logger {
  log(message) {
    console.log('[LOG]', message);
  }
}

@injectable
class UserService {
  @inject('Logger')
  logger;
  
  getUser(id) {
    this.logger.log(`获取用户 ${id}`);
    return { id, name: 'Alice' };
  }
}

const userService = new UserService();
userService.getUser(123);
// 输出：[LOG] 获取用户 123
```

---

## 问题 7：装饰器的兼容性和注意事项是什么？

装饰器目前还是 ES 提案，使用时需要注意兼容性和一些限制。

### 浏览器兼容性

```javascript
// 装饰器目前是 Stage 3 提案，需要转译工具支持

// Babel 配置
// .babelrc
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "version": "2023-05" }]
  ]
}

// TypeScript 配置
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### 装饰器的限制

```javascript
// 1. 不能装饰函数（只能装饰类相关的内容）
// @decorator  // 错误
// function myFunction() {}

// 2. 装饰器表达式必须是可调用的
// @123  // 错误：不是函数
// class MyClass {}

// 3. 装饰器在类定义时执行，不是实例化时
let counter = 0;

function count(target) {
  counter++;
  console.log('装饰器执行次数:', counter);
  return target;
}

@count
class A {}

@count
class B {}

new A();
new A();

// 输出：
// 装饰器执行次数: 1
// 装饰器执行次数: 2
// （创建实例时不会再执行装饰器）
```

### 装饰器的最佳实践

```javascript
// 1. 装饰器应该是纯函数，不依赖外部状态
// ❌ 不好的做法
let globalState = 0;
function badDecorator(target) {
  globalState++; // 依赖外部状态
  return target;
}

// ✅ 好的做法
function goodDecorator(target) {
  // 只依赖参数
  target.timestamp = Date.now();
  return target;
}

// 2. 使用装饰器工厂提供配置
// ✅ 推荐
function configurable(options) {
  return function(target) {
    Object.assign(target.prototype, options);
    return target;
  };
}

@configurable({ debug: true, timeout: 5000 })
class Service {}

// 3. 保持装饰器的单一职责
// ✅ 每个装饰器只做一件事
@log
@validate
@cache
class DataService {
  @authorize
  @rateLimit
  getData() {}
}

// 4. 注意装饰器的执行顺序
// 装饰器从下到上执行，要考虑依赖关系
@outer
@inner  // inner 先执行
class MyClass {}
```

### TypeScript 中的装饰器

```typescript
// TypeScript 对装饰器有更好的类型支持
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`调用 ${propertyKey}`, args);
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

@sealed
class Example {
  @log
  method(param: string): void {
    console.log('方法执行:', param);
  }
}
```

---

## 总结

**装饰器的核心要点**：

### 1. 基本概念
- 装饰器是一种特殊的声明，使用 `@` 符号
- 本质是一个函数，用于修改或扩展目标的行为
- 在类定义时执行，不是实例化时

### 2. 装饰器类型
- **类装饰器**：修改类的构造函数
- **方法装饰器**：修改方法的属性描述符
- **属性装饰器**：修改属性的行为
- **参数装饰器**：记录参数的元数据

### 3. 执行顺序
- 同一目标：从下到上执行
- 不同类型：属性 > 方法 > 参数 > 类
- 装饰器工厂：先执行工厂函数，再执行装饰器

### 4. 实际应用
- 日志记录和性能监控
- 权限控制和验证
- 缓存和防抖节流
- 依赖注入
- 错误处理

### 5. 注意事项
- 目前是 Stage 3 提案，需要转译工具
- 不能装饰普通函数
- 保持装饰器的纯函数特性
- 注意执行顺序和依赖关系

### 6. 最佳实践
- 使用装饰器工厂提供配置
- 保持单一职责
- 合理组合多个装饰器
- TypeScript 中使用类型注解

## 延伸阅读

- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Babel Decorators Plugin](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)
- [装饰器模式详解](https://refactoringguru.cn/design-patterns/decorator)
- [深入理解 JavaScript 装饰器](https://github.com/mqyqingfeng/Blog/issues/109)
