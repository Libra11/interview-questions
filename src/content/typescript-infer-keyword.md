---
title: TypeScript 中 infer 是什么关键词，怎么用
category: TypeScript
difficulty: 高级
updatedAt: 2024-12-02
summary: >-
  深入理解 TypeScript 中 infer 关键词的作用和使用方法，掌握如何在条件类型中进行类型推断，以及在实际项目中的高级应用。
tags:
  - TypeScript
  - infer
  - 条件类型
  - 类型推断
estimatedTime: 24 分钟
keywords:
  - TypeScript infer
  - 类型推断
  - 条件类型
  - 工具类型
highlight: infer 是 TypeScript 类型编程的核心特性，掌握它能够实现强大的类型推断和转换
order: 374
---

## 问题 1：infer 是什么？

### 基本概念

`infer` 是 TypeScript 中用于在条件类型中进行类型推断的关键词。它只能在条件类型的 `extends` 子句中使用。

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
//                                                  ^^^^^^^ 推断返回类型
```

### 基本语法

```typescript
type MyType<T> = T extends SomeType<infer U> ? U : never;
//                                  ^^^^^^^ 声明要推断的类型变量
```

---

## 问题 2：infer 的基本用法

### 推断函数返回类型

```typescript
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function add(a: number, b: number): number {
  return a + b;
}

type Result = GetReturnType<typeof add>; // number
```

### 推断函数参数类型

```typescript
type GetFirstParam<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

function greet(name: string, age: number) {
  return `Hello ${name}, ${age}`;
}

type FirstParam = GetFirstParam<typeof greet>; // string
```

### 推断数组元素类型

```typescript
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type NumArray = ArrayElement<number[]>; // number
type StrArray = ArrayElement<string[]>; // string
type MixedArray = ArrayElement<(string | number)[]>; // string | number
```

### 推断 Promise 类型

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<Promise<number>>; // number
type C = UnwrapPromise<boolean>; // boolean（不是 Promise）
```

---

## 问题 3：infer 的高级用法

### 推断对象属性类型

```typescript
type GetProperty<T, K extends keyof T> = T extends { [key in K]: infer V }
  ? V
  : never;

interface User {
  id: number;
  name: string;
  email: string;
}

type NameType = GetProperty<User, "name">; // string
type IdType = GetProperty<User, "id">; // number
```

### 推断元组类型

```typescript
// 推断第一个元素
type First<T> = T extends [infer F, ...any[]] ? F : never;

type A = First<[string, number, boolean]>; // string
type B = First<[number]>; // number

// 推断最后一个元素
type Last<T> = T extends [...any[], infer L] ? L : never;

type C = Last<[string, number, boolean]>; // boolean
type D = Last<[number]>; // number

// 推断除第一个外的元素
type Tail<T> = T extends [any, ...infer Rest] ? Rest : never;

type E = Tail<[string, number, boolean]>; // [number, boolean]
```

### 多个 infer

```typescript
// 推断函数的参数和返回类型
type FunctionInfo<T> = T extends (...args: infer P) => infer R
  ? { params: P; return: R }
  : never;

function example(a: string, b: number): boolean {
  return true;
}

type Info = FunctionInfo<typeof example>;
// { params: [string, number]; return: boolean }
```

### 递归推断

```typescript
// 深度展开 Promise
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type A = DeepUnwrapPromise<Promise<Promise<Promise<string>>>>;
// string
```

---

## 问题 4：实际应用场景

### 场景 1：提取 Redux Action 类型

```typescript
const actions = {
  increment: (amount: number) => ({
    type: "INCREMENT" as const,
    payload: amount,
  }),
  decrement: (amount: number) => ({
    type: "DECREMENT" as const,
    payload: amount,
  }),
};

// 提取所有 action 的返回类型
type ActionCreators = typeof actions;
type ActionTypes = {
  [K in keyof ActionCreators]: ReturnType<ActionCreators[K]>;
}[keyof ActionCreators];

// ActionTypes =
// | { type: 'INCREMENT'; payload: number }
// | { type: 'DECREMENT'; payload: number }
```

### 场景 2：提取组件 Props

```typescript
import React from "react";

// 提取组件的 Props 类型
type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

const Button: React.FC<{ label: string; onClick: () => void }> = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};

type ButtonProps = ComponentProps<typeof Button>;
// { label: string; onClick: () => void }
```

### 场景 3：字符串类型操作

```typescript
// 提取字符串模板的参数
type ExtractParams<T> = T extends `${string}{${infer Param}}${infer Rest}`
  ? Param | ExtractParams<Rest>
  : never;

type Route = "/user/{id}/post/{postId}";
type Params = ExtractParams<Route>; // 'id' | 'postId'
```

### 场景 4：构建类型安全的事件系统

```typescript
type EventMap = {
  click: { x: number; y: number };
  input: { value: string };
  submit: { data: Record<string, any> };
};

type EventHandler<T> = T extends keyof EventMap
  ? (event: EventMap[T]) => void
  : never;

// 提取事件数据类型
type ExtractEventData<T> = T extends EventHandler<infer E>
  ? EventMap[E]
  : never;

const handleClick: EventHandler<"click"> = (e) => {
  console.log(e.x, e.y);
};

type ClickData = ExtractEventData<typeof handleClick>;
// { x: number; y: number }
```

---

## 问题 5：infer 的限制和注意事项

### 限制 1：只能在条件类型中使用

```typescript
// ❌ 错误：infer 只能在条件类型中使用
type Wrong<T> = infer U;

// ✅ 正确
type Right<T> = T extends Array<infer U> ? U : never;
```

### 限制 2：必须在 extends 子句中

```typescript
// ❌ 错误
type Wrong<T> = T extends Array<U> ? infer U : never;

// ✅ 正确
type Right<T> = T extends Array<infer U> ? U : never;
```

### 注意协变和逆变

```typescript
// 函数参数是逆变的
type GetParam<T> = T extends (param: infer P) => any ? P : never;

type A = GetParam<(x: string) => void>; // string
type B = GetParam<(x: string | number) => void>; // string | number

// 函数返回值是协变的
type GetReturn<T> = T extends (...args: any[]) => infer R ? R : never;

type C = GetReturn<() => string>; // string
type D = GetReturn<() => string | number>; // string | number
```

### 多个候选类型

```typescript
// 当有多个候选类型时，会推断为联合类型
type Union<T> = T extends { a: infer U; b: infer U } ? U : never;

type Result = Union<{ a: string; b: number }>;
// string | number
```

---

## 问题 6：infer 与其他特性结合

### 配合映射类型

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type User = {
  name: string;
  age: number;
};

type UserGetters = Getters<User>;
// {
//   getName: () => string;
//   getAge: () => number;
// }

// 提取 getter 返回类型
type ExtractGetterReturn<T> = T extends () => infer R ? R : never;
```

### 配合模板字符串类型

```typescript
type ParseRoute<T extends string> =
  T extends `${infer Start}/{${infer Param}}/${infer Rest}`
    ? { [K in Param]: string } & ParseRoute<Rest>
    : T extends `${infer Start}/{${infer Param}}`
    ? { [K in Param]: string }
    : {};

type Route = ParseRoute<"/user/{userId}/post/{postId}">;
// { userId: string; postId: string }
```

---

## 总结

**核心概念总结**：

### 1. infer 的作用

- 在条件类型中推断类型
- 提取类型的一部分
- 实现复杂的类型转换

### 2. 常见用法

- 推断函数返回类型
- 推断函数参数类型
- 推断数组/元组元素类型
- 推断 Promise 包装的类型

### 3. 高级应用

- 递归类型推断
- 多个 infer 组合使用
- 配合模板字符串类型
- 构建类型安全的 API

### 4. 注意事项

- 只能在条件类型中使用
- 必须在 extends 子句中声明
- 注意协变和逆变
- 多个候选会推断为联合类型

## 延伸阅读

- [TypeScript 官方文档 - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript 类型体操](https://github.com/type-challenges/type-challenges)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
