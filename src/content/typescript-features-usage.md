---
title: 你在开发过程中使用过哪些 TS 的特性或者能力
category: TypeScript
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  分享在实际项目开发中常用的 TypeScript 特性和能力，包括类型推断、泛型、工具类型、装饰器等，以及它们的实际应用场景。
tags:
  - TypeScript
  - 实践经验
  - 类型系统
  - 开发技巧
estimatedTime: 24 分钟
keywords:
  - TypeScript 特性
  - TypeScript 实践
  - 泛型
  - 工具类型
highlight: 总结实际项目中常用的 TypeScript 特性，帮助提升开发效率和代码质量
order: 119
---

## 问题 1：类型推断和类型注解

### 类型推断

TypeScript 能够自动推断变量类型，减少冗余代码。

```typescript
// 基本类型推断
const name = "Alice"; // string
const age = 25; // number
const isActive = true; // boolean

// 数组推断
const numbers = [1, 2, 3]; // number[]
const mixed = [1, "two"]; // (string | number)[]

// 对象推断
const user = {
  id: 1,
  name: "Alice",
}; // { id: number; name: string }

// 函数返回值推断
function add(a: number, b: number) {
  return a + b; // 推断返回 number
}
```

### 实际应用

```typescript
// API 响应处理
async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // 自动推断为 Promise<any>
}

// 配合 as const 获得更精确的类型
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;
// { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }
```

---

## 问题 2：泛型（Generics）

### 基本用法

```typescript
// 泛型函数
function identity<T>(value: T): T {
  return value;
}

const num = identity(123); // number
const str = identity("hello"); // string

// 泛型接口
interface Response<T> {
  data: T;
  code: number;
  message: string;
}

type UserResponse = Response<{ id: number; name: string }>;
```

### 实际应用

**1. API 请求封装**

```typescript
async function request<T>(url: string): Promise<Response<T>> {
  const res = await fetch(url);
  return res.json();
}

interface User {
  id: number;
  name: string;
}

const userResponse = await request<User>("/api/user");
// userResponse.data 的类型是 User
```

**2. React 组件**

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// 使用
<List items={users} renderItem={(user) => <span>{user.name}</span>} />;
```

---

## 问题 3：工具类型（Utility Types）

### 常用工具类型

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial：所有属性可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }

// Required：所有属性必选
type RequiredUser = Required<PartialUser>;

// Pick：选择部分属性
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

// Omit：排除部分属性
type UserWithoutEmail = Omit<User, "email">;
// { id: number; name: string; age: number }

// Record：创建对象类型
type UserMap = Record<string, User>;
// { [key: string]: User }
```

### 实际应用

**1. 表单更新**

```typescript
interface FormData {
  username: string;
  email: string;
  password: string;
}

// 更新时所有字段可选
function updateForm(data: Partial<FormData>) {
  // ...
}

updateForm({ username: "newName" }); // ✅
```

**2. API 响应类型**

```typescript
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

type UserListResponse = ApiResponse<User[]>;
type UserDetailResponse = ApiResponse<User>;
```

---

## 问题 4：联合类型和交叉类型

### 联合类型

```typescript
type Status = "pending" | "success" | "error";

function handleStatus(status: Status) {
  switch (status) {
    case "pending":
      // ...
      break;
    case "success":
      // ...
      break;
    case "error":
      // ...
      break;
  }
}

// 判别联合类型
type Success = { type: "success"; data: string };
type Error = { type: "error"; message: string };
type Result = Success | Error;

function handleResult(result: Result) {
  if (result.type === "success") {
    console.log(result.data); // 类型收窄
  } else {
    console.log(result.message);
  }
}
```

### 交叉类型

```typescript
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: number;
  name: string;
}

type TimestampedUser = User & Timestamped;
// {
//   id: number;
//   name: string;
//   createdAt: Date;
//   updatedAt: Date;
// }
```

---

## 问题 5：类型守卫和类型收窄

### 类型守卫

```typescript
// typeof 守卫
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase(); // string
  } else {
    return value.toFixed(2); // number
  }
}

// instanceof 守卫
class Dog {
  bark() {}
}

class Cat {
  meow() {}
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// 自定义类型守卫
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // string
  }
}
```

---

## 问题 6：高级类型特性

### 映射类型

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};

// 实际应用
interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>;
// { readonly id: number; readonly name: string }
```

### 条件类型

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null>; // string
type B = NonNullable<number | undefined>; // number
```

### 模板字符串类型

```typescript
type EventName = "click" | "scroll" | "mousemove";
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onScroll' | 'onMousemove'

// 实际应用：路由类型
type Route = "/user" | "/post" | "/comment";
type RouteWithId = `${Route}/${string}`;
// '/user/${string}' | '/post/${string}' | '/comment/${string}'
```

---

## 问题 7：装饰器（Decorators）

### 类装饰器

```typescript
function logged(constructor: Function) {
  console.log(`Creating instance of ${constructor.name}`);
}

@logged
class User {
  constructor(public name: string) {}
}
```

### 方法装饰器

```typescript
function measure(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = original.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} took ${end - start}ms`);
    return result;
  };
}

class Calculator {
  @measure
  complexCalculation() {
    // ...
  }
}
```

---

## 问题 8：实际项目经验总结

### 1. 类型定义文件

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  code: number;
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

// types/index.ts
export * from "./api";
export * from "./user";
```

### 2. 严格模式配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 3. 类型复用

```typescript
// 基础类型
interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// 继承复用
interface User extends BaseEntity {
  name: string;
  email: string;
}

interface Post extends BaseEntity {
  title: string;
  content: string;
}
```

---

## 总结

**常用特性总结**：

### 1. 基础特性

- 类型推断和注解
- 接口和类型别名
- 联合类型和交叉类型

### 2. 高级特性

- 泛型
- 工具类型
- 类型守卫
- 条件类型

### 3. 实践技巧

- 使用严格模式
- 合理使用类型推断
- 复用类型定义
- 利用工具类型简化代码

### 4. 提升效率

- 配置好 tsconfig.json
- 使用 IDE 的类型提示
- 编写类型定义文件
- 善用第三方类型库（@types）

## 延伸阅读

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
