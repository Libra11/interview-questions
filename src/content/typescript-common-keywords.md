---
title: TypeScript 有哪些常用的关键词
category: TypeScript
difficulty: 入门
updatedAt: 2024-12-02
summary: >-
  全面了解 TypeScript 中常用的关键词，包括类型定义、类型操作、访问修饰符等，掌握这些关键词的用法是熟练使用 TypeScript 的基础。
tags:
  - TypeScript
  - 关键词
  - 类型系统
  - 语法
estimatedTime: 22 分钟
keywords:
  - TypeScript 关键词
  - interface
  - type
  - enum
  - readonly
highlight: TypeScript 的关键词是构建类型系统的基础，理解它们的用法能够写出更安全和可维护的代码
order: 109
---

## 问题 1：类型定义相关的关键词有哪些？

### interface

定义对象类型的接口。

```typescript
interface User {
  id: number;
  name: string;
  email?: string; // 可选属性
}

const user: User = {
  id: 1,
  name: "Alice",
};
```

**特点**：

- 可以被继承和实现
- 支持声明合并
- 主要用于定义对象结构

### type

类型别名，可以定义任何类型。

```typescript
// 基本类型别名
type ID = number | string;

// 对象类型
type Point = {
  x: number;
  y: number;
};

// 联合类型
type Status = "pending" | "success" | "error";

// 函数类型
type Callback = (data: string) => void;
```

**特点**：

- 更灵活，可以定义联合类型、交叉类型等
- 不支持声明合并
- 可以使用工具类型

### enum

枚举类型，定义一组命名常量。

```typescript
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

// 字符串枚举
enum Status {
  Pending = "PENDING",
  Success = "SUCCESS",
  Error = "ERROR",
}

const status: Status = Status.Pending;
```

### class

定义类，同时也是类型。

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

const dog: Animal = new Animal("Dog");
```

---

## 问题 2：类型操作相关的关键词有哪些？

### typeof

获取值的类型。

```typescript
const person = {
  name: "Alice",
  age: 25,
};

// 获取 person 的类型
type Person = typeof person;
// { name: string; age: number; }

// 获取函数类型
function greet(name: string) {
  return `Hello, ${name}`;
}

type GreetType = typeof greet;
// (name: string) => string
```

### keyof

获取对象类型的所有键。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User;
// 'id' | 'name' | 'email'

// 实际应用
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
const name = getProperty(user, "name"); // string
```

### extends

类型约束和条件类型。

```typescript
// 泛型约束
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength("hello"); // ✅
getLength([1, 2, 3]); // ✅
getLength(123); // ❌ 错误

// 条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```

### infer

在条件类型中推断类型。

```typescript
// 推断函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getData(): { id: number; name: string } {
  return { id: 1, name: "Alice" };
}

type DataType = ReturnType<typeof getData>;
// { id: number; name: string }

// 推断数组元素类型
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type NumArray = ArrayElement<number[]>; // number
```

### in

遍历联合类型。

```typescript
type Keys = "name" | "age" | "email";

type Person = {
  [K in Keys]: string;
};
// { name: string; age: string; email: string; }

// 映射类型
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

---

## 问题 3：访问修饰符有哪些？

### public

公共属性，默认修饰符。

```typescript
class Person {
  public name: string; // 可以省略 public

  constructor(name: string) {
    this.name = name;
  }
}

const person = new Person("Alice");
console.log(person.name); // ✅ 可以访问
```

### private

私有属性，只能在类内部访问。

```typescript
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  public getBalance(): number {
    return this.balance; // ✅ 类内部可以访问
  }
}

const account = new BankAccount(1000);
console.log(account.balance); // ❌ 错误：私有属性
console.log(account.getBalance()); // ✅ 通过公共方法访问
```

### protected

受保护属性，可以在类和子类中访问。

```typescript
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class Dog extends Animal {
  bark() {
    console.log(`${this.name} barks`); // ✅ 子类可以访问
  }
}

const dog = new Dog("Buddy");
console.log(dog.name); // ❌ 错误：受保护属性
dog.bark(); // ✅
```

### readonly

只读属性，只能在初始化时赋值。

```typescript
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

const config: Config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};

config.apiUrl = "https://new-api.com"; // ❌ 错误：只读属性

// 类中的只读属性
class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
```

---

## 问题 4：其他常用关键词有哪些？

### as

类型断言，告诉编译器变量的类型。

```typescript
// 基本用法
const value: any = "hello";
const length = (value as string).length;

// DOM 操作
const input = document.querySelector("#input") as HTMLInputElement;
input.value = "text";

// const 断言
const colors = ["red", "green", "blue"] as const;
// readonly ['red', 'green', 'blue']
```

### is

类型谓词，用于类型守卫。

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(value: string | number) {
  if (isString(value)) {
    // 这里 value 被推断为 string
    console.log(value.toUpperCase());
  } else {
    // 这里 value 被推断为 number
    console.log(value.toFixed(2));
  }
}
```

### namespace

命名空间，组织代码。

```typescript
namespace Utils {
  export function log(message: string) {
    console.log(message);
  }

  export function error(message: string) {
    console.error(message);
  }
}

Utils.log("Hello"); // ✅
```

**注意**：现代 TypeScript 推荐使用 ES6 模块而不是命名空间。

### declare

声明全局变量或模块。

```typescript
// 声明全局变量
declare const API_URL: string;
declare function jQuery(selector: string): any;

// 声明模块
declare module "my-library" {
  export function doSomething(): void;
}

// 使用
import { doSomething } from "my-library";
```

### abstract

抽象类和抽象方法。

```typescript
abstract class Shape {
  abstract getArea(): number; // 抽象方法

  describe(): void {
    console.log(`Area: ${this.getArea()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

const circle = new Circle(5);
circle.describe(); // Area: 78.54...
```

### implements

类实现接口。

```typescript
interface Printable {
  print(): void;
}

class Document implements Printable {
  print(): void {
    console.log("Printing document...");
  }
}

// 实现多个接口
interface Saveable {
  save(): void;
}

class File implements Printable, Saveable {
  print(): void {
    console.log("Printing...");
  }

  save(): void {
    console.log("Saving...");
  }
}
```

### never

表示永远不会发生的类型。

```typescript
// 永远不会返回的函数
function throwError(message: string): never {
  throw new Error(message);
}

// 用于穷尽性检查
type Shape = "circle" | "square" | "triangle";

function getArea(shape: Shape): number {
  switch (shape) {
    case "circle":
      return 0;
    case "square":
      return 0;
    case "triangle":
      return 0;
    default:
      // 如果有遗漏的 case，这里会报错
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

### unknown

类型安全的 any。

```typescript
let value: unknown;

value = "hello";
value = 123;
value = true; // ✅ 可以赋任何值

// 但使用前需要类型检查
if (typeof value === "string") {
  console.log(value.toUpperCase()); // ✅
}

// 直接使用会报错
console.log(value.toUpperCase()); // ❌ 错误
```

---

## 总结

**核心概念总结**：

### 1. 类型定义

- **interface**：定义对象类型
- **type**：类型别名，更灵活
- **enum**：枚举类型
- **class**：类定义

### 2. 类型操作

- **typeof**：获取值的类型
- **keyof**：获取对象键
- **extends**：类型约束和条件类型
- **infer**：类型推断
- **in**：遍历联合类型

### 3. 访问修饰符

- **public**：公共（默认）
- **private**：私有
- **protected**：受保护
- **readonly**：只读

### 4. 其他重要关键词

- **as**：类型断言
- **is**：类型谓词
- **declare**：声明
- **abstract**：抽象
- **implements**：实现接口
- **never**：永不类型
- **unknown**：安全的 any

## 延伸阅读

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript 关键词参考](https://www.typescriptlang.org/docs/handbook/2/keywords.html)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
- [TypeScript 类型体操](https://github.com/type-challenges/type-challenges)
