---
title: TypeScript 泛型深度解析
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面解析 TypeScript 泛型的核心概念、使用场景和高级技巧，掌握如何编写类型安全且可复用的代码。
tags:
  - TypeScript
  - 泛型
  - 类型系统
  - 类型参数
estimatedTime: 25 分钟
keywords:
  - Generics
  - 类型参数
  - 泛型约束
  - 泛型工具类型
highlight: 理解泛型的本质和使用场景，掌握泛型约束、默认值等高级特性
order: 302
---

## 问题 1：什么是泛型？为什么需要泛型？

**泛型的定义**

泛型（Generics）是一种**参数化类型**的机制，允许在定义函数、接口或类时不预先指定具体的类型，而是在使用时再指定类型。泛型使代码更加灵活和可复用，同时保持类型安全。

**为什么需要泛型？**

假设我们要实现一个返回输入值的函数：

```typescript
// ❌ 使用 any：失去类型安全
function identity(value: any): any {
  return value;
}

let result = identity("hello"); // result 类型是 any
result.toFixed(); // 编译通过，但运行时报错

// ❌ 为每种类型写重载：代码重复
function identityString(value: string): string {
  return value;
}
function identityNumber(value: number): number {
  return value;
}

// ✅ 使用泛型：类型安全 + 代码复用
function identity<T>(value: T): T {
  return value;
}

let str = identity("hello"); // str 类型是 string
let num = identity(123); // num 类型是 number
str.toUpperCase(); // ✅ 正确
// num.toUpperCase(); // ❌ 错误：number 没有 toUpperCase 方法
```

**泛型的核心价值**

1. **类型安全**：保留输入和输出的类型关系
2. **代码复用**：一份代码适用于多种类型
3. **更好的智能提示**：IDE 可以提供准确的类型提示

---

## 问题 2：泛型的基本使用方式有哪些?

**1. 泛型函数**

```typescript
// 基本语法：<T> 是类型参数
function wrapInArray<T>(value: T): T[] {
  return [value];
}

wrapInArray<string>("hello"); // string[]
wrapInArray<number>(123); // number[]
wrapInArray("hello"); // 类型推断：string[]

// 多个类型参数
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

pair<string, number>("age", 25); // [string, number]
pair("age", 25); // 类型推断：[string, number]
```

**2. 泛型接口**

```typescript
// 泛型接口定义
interface Box<T> {
  value: T;
}

// 使用时指定类型
const stringBox: Box<string> = { value: "hello" };
const numberBox: Box<number> = { value: 123 };

// 泛型函数接口
interface GenericIdentityFn<T> {
  (arg: T): T;
}

let myIdentity: GenericIdentityFn<number> = (x) => x;
```

**3. 泛型类**

```typescript
// 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;

  constructor(zeroValue: T, add: (x: T, y: T) => T) {
    this.zeroValue = zeroValue;
    this.add = add;
  }
}

// 使用
let myGenericNumber = new GenericNumber<number>(0, (x, y) => x + y);
console.log(myGenericNumber.add(5, 10)); // 15

let myGenericString = new GenericNumber<string>("", (x, y) => x + y);
console.log(myGenericString.add("Hello, ", "World")); // "Hello, World"
```

**4. 泛型类型别名**

```typescript
// 泛型类型别名
type Container<T> = {
  value: T;
  getValue: () => T;
};

const stringContainer: Container<string> = {
  value: "hello",
  getValue() {
    return this.value;
  },
};
```

---

## 问题 3：什么是泛型约束？如何使用？

**泛型约束的概念**

泛型约束（Generic Constraints）用于限制泛型参数必须满足特定条件，通过 `extends` 关键字实现。

**基本约束**

```typescript
// 约束 T 必须有 length 属性
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // ✅ 可以访问 length
  return arg;
}

logLength("hello"); // ✅ string 有 length
logLength([1, 2, 3]); // ✅ array 有 length
logLength({ length: 10, value: 3 }); // ✅ 对象有 length
// logLength(123); // ❌ 错误：number 没有 length
```

**使用 keyof 约束**

```typescript
// 约束 K 必须是 T 的键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: "Alice", age: 25 };
getProperty(person, "name"); // ✅ "Alice"
getProperty(person, "age"); // ✅ 25
// getProperty(person, "email"); // ❌ 错误："email" 不是 person 的键
```

**多重约束**

```typescript
// 约束 T 必须同时满足多个接口
interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

// 使用交叉类型实现多重约束
function process<T extends Printable & Loggable>(item: T): void {
  item.print();
  item.log();
}
```

**类型参数之间的约束**

```typescript
// K 被约束为 T 的键
function copyFields<T, K extends keyof T>(
  target: T,
  source: T,
  keys: K[]
): void {
  keys.forEach((key) => {
    target[key] = source[key];
  });
}

const obj1 = { a: 1, b: 2, c: 3 };
const obj2 = { a: 10, b: 20, c: 30 };
copyFields(obj1, obj2, ["a", "b"]); // ✅ 正确
// copyFields(obj1, obj2, ["d"]); // ❌ 错误："d" 不是键
```

---

## 问题 4：泛型的默认值和常见应用场景是什么？

**泛型默认值**

TypeScript 2.3+ 支持为泛型参数指定默认类型：

```typescript
// 泛型默认值
interface Container<T = string> {
  value: T;
}

const container1: Container = { value: "hello" }; // T 默认为 string
const container2: Container<number> = { value: 123 }; // T 指定为 number

// 函数泛型默认值
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

createArray(3, "x"); // string[]
createArray<number>(3, 0); // number[]
createArray(3, "x"); // 使用默认类型 string[]
```

**常见应用场景 1：API 响应处理**

```typescript
// 通用 API 响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 用户数据
interface User {
  id: number;
  name: string;
}

// 使用
async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// 列表数据
async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch("/api/users");
  return response.json();
}
```

**常见应用场景 2：数组操作工具函数**

```typescript
// 数组去重
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

unique([1, 2, 2, 3]); // number[]
unique(["a", "b", "a"]); // string[]

// 数组分组
function groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "admin" },
];

groupBy(users, "role");
// { admin: [...], user: [...] }
```

**常见应用场景 3：Promise 和异步操作**

```typescript
// 异步数据加载
class DataLoader<T> {
  private cache = new Map<string, T>();

  async load(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const data = await fetcher();
    this.cache.set(key, data);
    return data;
  }
}

// 使用
const userLoader = new DataLoader<User>();
const user = await userLoader.load("user:1", () => fetchUser(1));
```

**常见应用场景 4：React 组件**

```typescript
// 通用列表组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}

// 使用
<List items={users} renderItem={(user) => <div>{user.name}</div>} />;
```

---

## 总结

**核心概念**：

### 1. 泛型的本质

- 参数化类型，在使用时指定具体类型
- 保持类型安全的同时实现代码复用

### 2. 基本使用

- **泛型函数**：`function fn<T>(arg: T): T`
- **泛型接口**：`interface Box<T> { value: T }`
- **泛型类**：`class GenericClass<T> { }`
- **泛型类型别名**：`type Container<T> = { value: T }`

### 3. 高级特性

- **泛型约束**：`<T extends SomeType>` 限制类型范围
- **keyof 约束**：`<K extends keyof T>` 约束为对象的键
- **泛型默认值**：`<T = DefaultType>` 指定默认类型

### 4. 实际应用

- API 响应类型定义
- 通用工具函数
- React 组件 Props
- 数据结构和算法

## 延伸阅读

- [TypeScript 官方文档 - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Deep Dive - Generics](https://basarat.gitbook.io/typescript/type-system/generics)
- [TypeScript 泛型最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
