---
title: TypeScript 中 const 和 readonly 的区别
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 const 和 readonly 的本质区别，掌握它们在变量声明、对象属性、数组等不同场景下的使用方法。
tags:
  - TypeScript
  - const
  - readonly
  - 不可变性
estimatedTime: 18 分钟
keywords:
  - const关键字
  - readonly修饰符
  - 不可变性
  - 常量
highlight: 理解 const 和 readonly 的核心差异，掌握在不同场景下的正确使用
order: 691
---

## 问题 1：const 和 readonly 的基本定义是什么？

**const 关键字**

`const` 是 JavaScript/TypeScript 中的**变量声明关键字**，用于声明一个**不可重新赋值**的变量（常量）。

```typescript
// const 声明的变量不能重新赋值
const name = "Alice";
// name = "Bob"; // ❌ 错误：无法分配到 "name" ，因为它是常量

const age = 25;
// age = 30; // ❌ 错误

// 但对象的属性可以修改
const user = { name: "Alice", age: 25 };
user.name = "Bob"; // ✅ 可以修改属性
user.age = 30; // ✅ 可以修改属性

// 不能重新赋值整个对象
// user = { name: "Charlie", age: 35 }; // ❌ 错误
```

**readonly 修饰符**

`readonly` 是 TypeScript 特有的**类型修饰符**，用于标记对象属性或数组为**只读**，防止属性被修改。

```typescript
// readonly 修饰对象属性
interface User {
  readonly id: number;
  name: string;
}

const user: User = { id: 1, name: "Alice" };
user.name = "Bob"; // ✅ 可以修改非 readonly 属性
// user.id = 2; // ❌ 错误：无法分配到 "id" ，因为它是只读属性

// readonly 修饰数组
const numbers: readonly number[] = [1, 2, 3];
// numbers.push(4); // ❌ 错误：readonly 数组没有 push 方法
// numbers[0] = 10; // ❌ 错误：无法分配到索引
```

---

## 问题 2：const 和 readonly 的作用范围有什么区别？

**const 的作用范围**

`const` 作用于**变量绑定**，确保变量不能被重新赋值，但不保证值本身的不可变性。

```typescript
// 基本类型：const 确保值不可变
const num = 10;
// num = 20; // ❌ 错误

// 对象类型：const 只保证引用不变，属性可以修改
const obj = { x: 1, y: 2 };
obj.x = 10; // ✅ 可以修改属性
// obj = { x: 10, y: 20 }; // ❌ 错误：不能重新赋值

// 数组类型：const 只保证引用不变，元素可以修改
const arr = [1, 2, 3];
arr.push(4); // ✅ 可以添加元素
arr[0] = 10; // ✅ 可以修改元素
// arr = [4, 5, 6]; // ❌ 错误：不能重新赋值
```

**readonly 的作用范围**

`readonly` 作用于**类型系统**，确保属性或数组元素不能被修改（编译时检查）。

```typescript
// readonly 修饰对象属性
interface Point {
  readonly x: number;
  readonly y: number;
}

const point: Point = { x: 10, y: 20 };
// point.x = 30; // ❌ 错误：只读属性
// point.y = 40; // ❌ 错误：只读属性

// 但可以重新赋值整个对象（如果变量不是 const）
let point2: Point = { x: 10, y: 20 };
point2 = { x: 30, y: 40 }; // ✅ 可以重新赋值

// readonly 修饰数组
const readonlyArr: readonly number[] = [1, 2, 3];
// readonlyArr[0] = 10; // ❌ 错误：只读索引
// readonlyArr.push(4); // ❌ 错误：没有 push 方法
```

---

## 问题 3：const 和 readonly 如何结合使用？

**结合使用实现深度不可变**

```typescript
// 只用 const：引用不变，但属性可变
const user1 = { name: "Alice", age: 25 };
user1.name = "Bob"; // ✅ 可以修改

// 只用 readonly：属性不变，但引用可变（如果用 let）
let user2: { readonly name: string; readonly age: number } = {
  name: "Alice",
  age: 25,
};
// user2.name = "Bob"; // ❌ 错误：只读属性
user2 = { name: "Charlie", age: 30 }; // ✅ 可以重新赋值

// const + readonly：引用和属性都不变
const user3: { readonly name: string; readonly age: number } = {
  name: "Alice",
  age: 25,
};
// user3.name = "Bob"; // ❌ 错误：只读属性
// user3 = { name: "Charlie", age: 30 }; // ❌ 错误：常量不能重新赋值
```

**使用 Readonly 工具类型**

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

// Readonly<T> 将所有属性变为 readonly
const user: Readonly<User> = {
  name: "Alice",
  age: 25,
  email: "alice@example.com",
};

// user.name = "Bob"; // ❌ 错误：所有属性都是只读的
// user.age = 30; // ❌ 错误
```

**readonly 数组 vs const 数组**

```typescript
// const 数组：可以修改元素
const arr1 = [1, 2, 3];
arr1.push(4); // ✅
arr1[0] = 10; // ✅

// readonly 数组：不能修改元素
const arr2: readonly number[] = [1, 2, 3];
// arr2.push(4); // ❌ 错误：没有 push 方法
// arr2[0] = 10; // ❌ 错误：只读索引

// ReadonlyArray 类型
const arr3: ReadonlyArray<number> = [1, 2, 3];
// arr3.push(4); // ❌ 错误
// arr3[0] = 10; // ❌ 错误
```

---

## 问题 4：const 和 readonly 在类中的使用有什么区别？

**类属性中的 readonly**

```typescript
class User {
  readonly id: number; // readonly 属性
  name: string;

  constructor(id: number, name: string) {
    this.id = id; // ✅ 构造函数中可以赋值
    this.name = name;
  }

  updateName(newName: string) {
    this.name = newName; // ✅ 可以修改普通属性
    // this.id = 999; // ❌ 错误：只读属性不能修改
  }
}

const user = new User(1, "Alice");
// user.id = 2; // ❌ 错误：只读属性
user.name = "Bob"; // ✅ 可以修改
```

**类中的 const（静态常量）**

```typescript
class Config {
  // 使用 static readonly 实现类常量
  static readonly API_URL = "https://api.example.com";
  static readonly MAX_RETRIES = 3;

  // ❌ 不能使用 const 声明类属性
  // const API_URL = "..."; // 语法错误
}

// 使用
console.log(Config.API_URL);
// Config.API_URL = "..."; // ❌ 错误：只读属性
```

**参数属性中的 readonly**

```typescript
class Point {
  // 构造函数参数属性
  constructor(public readonly x: number, public readonly y: number) {}
}

const point = new Point(10, 20);
console.log(point.x, point.y); // 10, 20
// point.x = 30; // ❌ 错误：只读属性
```

---

## 问题 5：const 断言（as const）是什么？

**const 断言的作用**

`as const` 是 TypeScript 3.4 引入的**常量断言**，可以将类型推断为**最窄的字面量类型**，并使所有属性变为 `readonly`。

```typescript
// 不使用 as const
const obj1 = { x: 10, y: 20 };
// obj1 的类型：{ x: number; y: number }
obj1.x = 30; // ✅ 可以修改

// 使用 as const
const obj2 = { x: 10, y: 20 } as const;
// obj2 的类型：{ readonly x: 10; readonly y: 20 }
// obj2.x = 30; // ❌ 错误：只读属性
```

**数组的 const 断言**

```typescript
// 不使用 as const
const arr1 = [1, 2, 3];
// arr1 的类型：number[]
arr1.push(4); // ✅ 可以修改

// 使用 as const
const arr2 = [1, 2, 3] as const;
// arr2 的类型：readonly [1, 2, 3]
// arr2.push(4); // ❌ 错误：只读数组
// arr2[0] = 10; // ❌ 错误：只读索引
```

**字符串字面量的 const 断言**

```typescript
// 不使用 as const
const status1 = "loading";
// status1 的类型：string

// 使用 as const
const status2 = "loading" as const;
// status2 的类型："loading"（字面量类型）

// 实际应用：定义常量
const COLORS = {
  RED: "red",
  GREEN: "green",
  BLUE: "blue",
} as const;

// COLORS 的类型：
// {
//   readonly RED: "red";
//   readonly GREEN: "green";
//   readonly BLUE: "blue";
// }

type Color = (typeof COLORS)[keyof typeof COLORS];
// Color 类型："red" | "green" | "blue"
```

**嵌套对象的 const 断言**

```typescript
const config = {
  api: {
    url: "https://api.example.com",
    timeout: 5000,
  },
  features: {
    darkMode: true,
    notifications: false,
  },
} as const;

// 所有嵌套属性都变为 readonly
// config.api.url = "..."; // ❌ 错误
// config.features.darkMode = false; // ❌ 错误
```

---

## 总结

**核心区别**：

### 1. 作用对象

- **const**：作用于变量声明，防止重新赋值
- **readonly**：作用于类型系统，防止属性修改

### 2. 作用时机

- **const**：运行时和编译时都生效
- **readonly**：仅编译时检查，运行时不生效

### 3. 作用范围

- **const**：保证变量引用不变，不保证值的不可变性
- **readonly**：保证属性或数组元素不可修改

### 4. 使用场景

**const**：

- 声明不会重新赋值的变量
- 防止意外的变量重新赋值

**readonly**：

- 标记对象的只读属性
- 创建不可变的数据结构
- 函数参数中防止修改

**as const**：

- 创建深度只读的常量对象
- 推断最窄的字面量类型
- 定义配置常量

### 5. 最佳实践

- 优先使用 `const` 声明变量
- 使用 `readonly` 保护不应修改的属性
- 使用 `as const` 创建真正的常量对象
- 结合使用实现深度不可变性

## 延伸阅读

- [TypeScript 官方文档 - readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
- [TypeScript 官方文档 - const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [MDN - const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
