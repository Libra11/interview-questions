---
title: TypeScript 中 infer 关键字详解
category: TypeScript
difficulty: 高级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 infer 关键字的作用和使用方法，掌握条件类型中的类型推断技巧，提升高级类型编程能力。
tags:
  - TypeScript
  - infer关键字
  - 条件类型
  - 类型推断
estimatedTime: 25 分钟
keywords:
  - infer关键字
  - 条件类型
  - 类型推断
  - 高级类型
highlight: 掌握 infer 在条件类型中的使用，实现复杂的类型推断和转换
order: 678
---

## 问题 1：TypeScript 中 infer 关键字是什么？

**infer 的定义**

`infer` 是 TypeScript 2.8 引入的关键字，用于在**条件类型（Conditional Types）**中**声明类型变量**，让 TypeScript 自动推断类型。它只能在 `extends` 条件类型的 `true` 分支中使用。

**基本语法**

```typescript
type TypeName<T> = T extends SomeType<infer U> ? U : never;
```

**简单示例**

```typescript
// 推断数组元素类型
type ArrayElementType<T> = T extends (infer U)[] ? U : never;

type StringArray = ArrayElementType<string[]>; // string
type NumberArray = ArrayElementType<number[]>; // number
type NotArray = ArrayElementType<string>; // never
```

**为什么需要 infer？**

在条件类型中，我们经常需要提取某个类型的一部分。`infer` 让我们可以声明一个待推断的类型变量，TypeScript 会自动推断出这个类型。

```typescript
// ❌ 没有 infer，无法提取类型
type GetReturnType<T> = T extends (...args: any[]) => any ? ??? : never;

// ✅ 使用 infer，可以推断返回值类型
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { name: "Alice", age: 25 };
}

type UserType = GetReturnType<typeof getUser>;
// 结果：{ name: string; age: number; }
```

---

## 问题 2：infer 在函数类型中如何使用？

**推断函数返回值类型**

```typescript
// 实现 ReturnType 工具类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

type User = MyReturnType<typeof createUser>;
// 结果：{ name: string; age: number; createdAt: Date; }

// 异步函数
async function fetchData() {
  return { data: [1, 2, 3] };
}

type FetchResult = MyReturnType<typeof fetchData>;
// 结果：Promise<{ data: number[]; }>
```

**推断函数参数类型**

```typescript
// 实现 Parameters 工具类型
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

function createPost(title: string, content: string, tags: string[]) {
  return { title, content, tags };
}

type CreatePostParams = MyParameters<typeof createPost>;
// 结果：[title: string, content: string, tags: string[]]

// 使用
function logParams(...args: CreatePostParams) {
  console.log("Creating post with:", args);
}
```

**推断第一个参数类型**

```typescript
// 提取第一个参数的类型
type FirstParameter<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

function process(id: number, name: string, active: boolean) {
  // ...
}

type FirstParam = FirstParameter<typeof process>;
// 结果：number
```

**推断构造函数参数类型**

```typescript
// 实现 ConstructorParameters
type MyConstructorParameters<T> = T extends new (...args: infer P) => any
  ? P
  : never;

class User {
  constructor(public name: string, public age: number) {}
}

type UserConstructorParams = MyConstructorParameters<typeof User>;
// 结果：[name: string, age: number]
```

**推断实例类型**

```typescript
// 实现 InstanceType
type MyInstanceType<T> = T extends new (...args: any[]) => infer R ? R : never;

class Product {
  constructor(public name: string, public price: number) {}
}

type ProductInstance = MyInstanceType<typeof Product>;
// 结果：Product
```

---

## 问题 3：infer 在复杂类型中如何使用？

**推断 Promise 的值类型**

```typescript
// 实现 Awaited（解包 Promise）
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;

type P1 = MyAwaited<Promise<string>>; // string
type P2 = MyAwaited<Promise<Promise<number>>>; // number
type P3 = MyAwaited<Promise<Promise<Promise<boolean>>>>; // boolean

// 实际应用
async function fetchUser() {
  return { id: 1, name: "Alice" };
}

type User = MyAwaited<ReturnType<typeof fetchUser>>;
// 结果：{ id: number; name: string; }
```

**推断数组元素类型**

```typescript
// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type StringElement = ElementType<string[]>; // string
type NumberElement = ElementType<number[]>; // number

// 提取嵌套数组的元素类型
type DeepElementType<T> = T extends (infer E)[]
  ? E extends any[]
    ? DeepElementType<E>
    : E
  : never;

type Deep = DeepElementType<number[][][]>; // number
```

**推断元组类型**

```typescript
// 提取元组的第一个元素
type First<T> = T extends [infer F, ...any[]] ? F : never;

type T1 = First<[string, number, boolean]>; // string
type T2 = First<[number]>; // number
type T3 = First<[]>; // never

// 提取元组的最后一个元素
type Last<T> = T extends [...any[], infer L] ? L : never;

type L1 = Last<[string, number, boolean]>; // boolean
type L2 = Last<[number]>; // number

// 提取元组的剩余部分
type Tail<T> = T extends [any, ...infer Rest] ? Rest : never;

type Tail1 = Tail<[string, number, boolean]>; // [number, boolean]
type Tail2 = Tail<[number]>; // []
```

**推断对象属性类型**

```typescript
// 提取对象某个属性的类型
type PropertyType<T, K extends keyof T> = T extends { [P in K]: infer V }
  ? V
  : never;

interface User {
  name: string;
  age: number;
  email: string;
}

type NameType = PropertyType<User, "name">; // string
type AgeType = PropertyType<User, "age">; // number

// 提取函数类型的属性
type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

interface Methods {
  name: string;
  getName: () => string;
  age: number;
  getAge: () => number;
}

type MethodKeys = FunctionProperties<Methods>;
// 结果："getName" | "getAge"
```

**推断字符串字面量类型**

```typescript
// 提取字符串模板的部分
type ExtractRouteParams<T> = T extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractRouteParams<`/${Rest}`>
  : T extends `${string}:${infer Param}`
  ? Param
  : never;

type Route1 = ExtractRouteParams<"/users/:id/posts/:postId">;
// 结果："id" | "postId"

type Route2 = ExtractRouteParams<"/products/:productId">;
// 结果："productId"
```

---

## 问题 4：infer 的高级应用场景有哪些？

**场景 1：实现 Flatten 类型**

```typescript
// 将嵌套数组展平
type Flatten<T> = T extends (infer U)[]
  ? U extends any[]
    ? Flatten<U>
    : U
  : T;

type Flat1 = Flatten<number[]>; // number
type Flat2 = Flatten<number[][]>; // number
type Flat3 = Flatten<number[][][]>; // number
```

**场景 2：实现函数柯里化类型**

```typescript
// 柯里化函数类型
type Curry<F> = F extends (...args: infer Args) => infer R
  ? Args extends [infer First, ...infer Rest]
    ? (arg: First) => Curry<(...args: Rest) => R>
    : R
  : never;

function add(a: number, b: number, c: number): number {
  return a + b + c;
}

type CurriedAdd = Curry<typeof add>;
// 结果：(arg: number) => (arg: number) => (arg: number) => number

// 使用
declare const curriedAdd: CurriedAdd;
const result = curriedAdd(1)(2)(3); // number
```

**场景 3：实现 UnionToIntersection**

```typescript
// 将联合类型转换为交叉类型
type UnionToIntersection<U> = (
  U extends any ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

type Union = { a: string } | { b: number };
type Intersection = UnionToIntersection<Union>;
// 结果：{ a: string } & { b: number }
```

**场景 4：实现 GetRequired（提取必选属性）**

```typescript
// 提取对象的必选属性
type GetRequired<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

type RequiredUserProps = GetRequired<User>;
// 结果：{ id: number; name: string; }
```

**场景 5：实现 PromiseAll 类型**

```typescript
// 为 Promise.all 提供精确的类型推断
type PromiseAllType<T extends readonly unknown[]> = Promise<{
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
}>;

// 使用
declare function promiseAll<T extends readonly unknown[]>(
  values: T
): PromiseAllType<T>;

const result = promiseAll([
  Promise.resolve(1),
  Promise.resolve("hello"),
  Promise.resolve(true),
]);
// result 类型：Promise<[number, string, boolean]>
```

**场景 6：实现深度 Readonly**

```typescript
// 递归将所有属性变为只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface NestedObject {
  user: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
}

type ReadonlyNested = DeepReadonly<NestedObject>;
// 所有嵌套属性都变为 readonly
```

---

## 总结

**核心概念**：

### 1. infer 的作用

- 在条件类型中声明类型变量
- 让 TypeScript 自动推断类型
- 只能在 `extends` 的 true 分支中使用

### 2. 基本语法

```typescript
type TypeName<T> = T extends Pattern<infer U> ? U : DefaultType;
```

### 3. 常见应用

- **函数类型**：推断参数、返回值、构造函数
- **数组类型**：推断元素类型、元组类型
- **Promise 类型**：解包 Promise 值
- **对象类型**：提取属性类型
- **字符串类型**：提取模板字符串部分

### 4. 高级应用

- Flatten（数组展平）
- Curry（函数柯里化）
- UnionToIntersection（联合转交叉）
- DeepReadonly（深度只读）
- PromiseAll（Promise.all 类型推断）

### 5. 使用技巧

- 结合条件类型使用
- 可以声明多个 infer 变量
- 支持递归类型推断
- 配合映射类型实现复杂转换

## 延伸阅读

- [TypeScript 官方文档 - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Deep Dive - Infer](https://basarat.gitbook.io/typescript/type-system/conditional-types#infer)
- [TypeScript 类型体操](https://github.com/type-challenges/type-challenges)
