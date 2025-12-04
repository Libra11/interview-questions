---
title: TypeScript 内置工具类型详解
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面解析 TypeScript 内置的工具类型（Utility Types），包括 Partial、Required、Pick、Omit 等常用类型，掌握类型转换和操作技巧。
tags:
  - TypeScript
  - 工具类型
  - 类型转换
  - Utility Types
estimatedTime: 30 分钟
keywords:
  - Partial
  - Required
  - Pick
  - Omit
  - Record
highlight: 掌握 TypeScript 内置工具类型的使用方法和实现原理，提升类型编程能力
order: 304
---

## 问题 1：TypeScript 有哪些常用的内置工具类型？

TypeScript 提供了一系列内置的**工具类型（Utility Types）**，用于对已有类型进行转换和操作。这些工具类型基于**映射类型（Mapped Types）**和**条件类型（Conditional Types）**实现。

**常用工具类型分类**：

1. **属性修饰类型**：`Partial`、`Required`、`Readonly`
2. **属性选择类型**：`Pick`、`Omit`
3. **类型构造类型**：`Record`、`Exclude`、`Extract`
4. **函数相关类型**：`Parameters`、`ReturnType`、`ConstructorParameters`
5. **字符串操作类型**：`Uppercase`、`Lowercase`、`Capitalize`、`Uncapitalize`
6. **其他类型**：`NonNullable`、`Awaited`

---

## 问题 2：Partial、Required 和 Readonly 的作用是什么？

**Partial<T> - 将所有属性变为可选**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Partial 将所有属性变为可选
type PartialUser = Partial<User>;
// 等价于：
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }

// 使用场景：更新部分字段
function updateUser(id: number, updates: Partial<User>) {
  // 只需要传入需要更新的字段
}

updateUser(1, { name: "Alice" }); // ✅ 只更新 name
updateUser(2, { email: "bob@example.com" }); // ✅ 只更新 email

// 实现原理
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```

**Required<T> - 将所有属性变为必选**

```typescript
interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

// Required 将所有属性变为必选
type RequiredConfig = Required<Config>;
// 等价于：
// {
//   host: string;
//   port: number;
//   timeout: number;
// }

// 使用场景：确保配置完整
function validateConfig(config: Required<Config>) {
  // config 的所有属性都必须存在
  console.log(config.host, config.port, config.timeout);
}

// 实现原理
type MyRequired<T> = {
  [P in keyof T]-?: T[P]; // -? 移除可选修饰符
};
```

**Readonly<T> - 将所有属性变为只读**

```typescript
interface Point {
  x: number;
  y: number;
}

// Readonly 将所有属性变为只读
type ReadonlyPoint = Readonly<Point>;
// 等价于：
// {
//   readonly x: number;
//   readonly y: number;
// }

const point: ReadonlyPoint = { x: 10, y: 20 };
// point.x = 30; // ❌ 错误：无法分配到 "x" ，因为它是只读属性

// 使用场景：不可变数据
function processPoint(point: Readonly<Point>) {
  // 确保函数内部不会修改 point
  console.log(point.x, point.y);
}

// 实现原理
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

---

## 问题 3：Pick 和 Omit 的区别是什么？

**Pick<T, K> - 从类型中选择指定属性**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  address: string;
}

// 只选择 id 和 name
type UserPreview = Pick<User, "id" | "name">;
// 等价于：
// {
//   id: number;
//   name: string;
// }

// 使用场景：API 返回部分字段
function getUserPreview(id: number): UserPreview {
  return {
    id,
    name: "Alice",
  };
}

// 实现原理
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

**Omit<T, K> - 从类型中排除指定属性**

```typescript
// 排除 email 和 address
type UserWithoutContact = Omit<User, "email" | "address">;
// 等价于：
// {
//   id: number;
//   name: string;
//   age: number;
// }

// 使用场景：创建用户时不需要 id
type CreateUserDto = Omit<User, "id">;

function createUser(data: CreateUserDto): User {
  return {
    id: Date.now(), // 自动生成 id
    ...data,
  };
}

// 实现原理
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

**Pick vs Omit 对比**

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
}

// Pick：选择需要的属性（白名单）
type ProductCard = Pick<Product, "id" | "name" | "price">;

// Omit：排除不需要的属性（黑名单）
type ProductCard2 = Omit<Product, "description" | "stock">;

// 两者结果相同，选择使用哪个取决于哪个更简洁
```

---

## 问题 4：Record、Exclude 和 Extract 的作用是什么？

**Record<K, T> - 构造对象类型**

```typescript
// Record 用于创建键值对类型
type Role = "admin" | "user" | "guest";

// 为每个角色定义权限
type RolePermissions = Record<Role, string[]>;
// 等价于：
// {
//   admin: string[];
//   user: string[];
//   guest: string[];
// }

const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"],
};

// 使用场景：映射表
type HttpStatusMessages = Record<number, string>;

const statusMessages: HttpStatusMessages = {
  200: "OK",
  404: "Not Found",
  500: "Internal Server Error",
};

// 实现原理
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

**Exclude<T, U> - 从联合类型中排除**

```typescript
type AllTypes = string | number | boolean | null | undefined;

// 排除 null 和 undefined
type NonNullableTypes = Exclude<AllTypes, null | undefined>;
// 结果：string | number | boolean

// 使用场景：过滤联合类型
type EventType = "click" | "scroll" | "mousemove" | "keydown";
type MouseEventType = Exclude<EventType, "keydown">;
// 结果："click" | "scroll" | "mousemove"

// 实现原理（使用条件类型）
type MyExclude<T, U> = T extends U ? never : T;
```

**Extract<T, U> - 从联合类型中提取**

```typescript
type AllTypes = string | number | boolean | null | undefined;

// 提取可以为 null 的类型
type NullableTypes = Extract<AllTypes, null | undefined>;
// 结果：null | undefined

// 使用场景：提取特定类型
type PrimitiveTypes = string | number | boolean | object | symbol;
type StringOrNumber = Extract<PrimitiveTypes, string | number>;
// 结果：string | number

// 实现原理
type MyExtract<T, U> = T extends U ? T : never;
```

**Exclude vs Extract 对比**

```typescript
type Colors = "red" | "blue" | "green" | "yellow";

// Exclude：排除（取差集）
type WarmColors = Exclude<Colors, "blue" | "green">;
// 结果："red" | "yellow"

// Extract：提取（取交集）
type CoolColors = Extract<Colors, "blue" | "green" | "purple">;
// 结果："blue" | "green"
```

---

## 问题 5：Parameters、ReturnType 等函数相关工具类型如何使用？

**Parameters<T> - 获取函数参数类型**

```typescript
// 获取函数参数类型（返回元组）
function createUser(name: string, age: number, email: string) {
  return { name, age, email };
}

type CreateUserParams = Parameters<typeof createUser>;
// 结果：[name: string, age: number, email: string]

// 使用场景：复用函数参数类型
function logUserCreation(...args: CreateUserParams) {
  console.log("Creating user with:", args);
  createUser(...args);
}

// 实现原理
type MyParameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

**ReturnType<T> - 获取函数返回值类型**

```typescript
function getUser() {
  return {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
  };
}

type User = ReturnType<typeof getUser>;
// 结果：{ id: number; name: string; email: string; }

// 使用场景：从函数推断类型
async function fetchData() {
  return { data: [1, 2, 3], total: 3 };
}

type FetchDataResult = ReturnType<typeof fetchData>;
// 结果：Promise<{ data: number[]; total: number; }>

// 获取 Promise 的值类型（需要配合 Awaited）
type FetchDataValue = Awaited<ReturnType<typeof fetchData>>;
// 结果：{ data: number[]; total: number; }

// 实现原理
type MyReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : never;
```

**ConstructorParameters<T> - 获取构造函数参数类型**

```typescript
class User {
  constructor(public name: string, public age: number) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>;
// 结果：[name: string, age: number]

// 使用场景：工厂函数
function createInstance<T extends new (...args: any) => any>(
  constructor: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new constructor(...args);
}

const user = createInstance(User, "Alice", 25);

// 实现原理
type MyConstructorParameters<T extends new (...args: any) => any> =
  T extends new (...args: infer P) => any ? P : never;
```

**InstanceType<T> - 获取构造函数的实例类型**

```typescript
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

type UserInstance = InstanceType<typeof User>;
// 结果：User

// 使用场景：泛型约束
function processInstance<T extends new (...args: any) => any>(
  instance: InstanceType<T>
) {
  // instance 是 T 的实例
}

// 实现原理
type MyInstanceType<T extends new (...args: any) => any> = T extends new (
  ...args: any
) => infer R
  ? R
  : never;
```

---

## 问题 6：NonNullable 和 Awaited 的作用是什么？

**NonNullable<T> - 排除 null 和 undefined**

```typescript
type MaybeString = string | null | undefined;

type DefiniteString = NonNullable<MaybeString>;
// 结果：string

// 使用场景：确保值非空
function processValue(value: string | null | undefined) {
  // 过滤掉 null 和 undefined
  const definiteValue: NonNullable<typeof value> = value!;
  console.log(definiteValue.toUpperCase());
}

// 实现原理
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

**Awaited<T> - 递归解包 Promise 类型**

```typescript
// 单层 Promise
type P1 = Awaited<Promise<string>>;
// 结果：string

// 嵌套 Promise
type P2 = Awaited<Promise<Promise<number>>>;
// 结果：number

// 多层嵌套
type P3 = Awaited<Promise<Promise<Promise<boolean>>>>;
// 结果：boolean

// 使用场景：获取异步函数的返回值类型
async function fetchUser() {
  return { id: 1, name: "Alice" };
}

type User = Awaited<ReturnType<typeof fetchUser>>;
// 结果：{ id: number; name: string; }

// 实现原理（递归条件类型）
type MyAwaited<T> = T extends Promise<infer U>
  ? U extends Promise<any>
    ? MyAwaited<U>
    : U
  : T;
```

---

## 总结

**核心工具类型**：

### 1. 属性修饰

- **Partial<T>**：所有属性可选
- **Required<T>**：所有属性必选
- **Readonly<T>**：所有属性只读

### 2. 属性选择

- **Pick<T, K>**：选择指定属性
- **Omit<T, K>**：排除指定属性

### 3. 类型构造

- **Record<K, T>**：构造键值对类型
- **Exclude<T, U>**：从联合类型排除
- **Extract<T, U>**：从联合类型提取

### 4. 函数相关

- **Parameters<T>**：获取函数参数类型
- **ReturnType<T>**：获取函数返回值类型
- **ConstructorParameters<T>**：获取构造函数参数
- **InstanceType<T>**：获取构造函数实例类型

### 5. 其他

- **NonNullable<T>**：排除 null 和 undefined
- **Awaited<T>**：解包 Promise 类型

## 延伸阅读

- [TypeScript 官方文档 - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Deep Dive - Mapped Types](https://basarat.gitbook.io/typescript/type-system/mapped-types)
- [TypeScript 类型体操](https://github.com/type-challenges/type-challenges)
