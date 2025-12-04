---
title: TypeScript 中 void 和 never 的区别
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 void 和 never 类型的本质区别，掌握它们在函数返回值、类型系统中的正确使用方式。
tags:
  - TypeScript
  - 类型系统
  - void
  - never
estimatedTime: 18 分钟
keywords:
  - void类型
  - never类型
  - 函数返回值
  - 底层类型
highlight: 理解 void 和 never 的核心差异，掌握在不同场景下的正确使用
order: 303
---

## 问题 1：void 和 never 的基本定义是什么？

**void 类型**

`void` 表示**没有返回值**的函数类型。当函数不返回任何值（或只返回 `undefined`）时，使用 `void` 类型。

```typescript
// 函数没有 return 语句
function logMessage(message: string): void {
  console.log(message);
  // 隐式返回 undefined
}

// 显式返回 undefined
function doSomething(): void {
  console.log("doing something");
  return undefined; // ✅ 可以返回 undefined
}

// ❌ 不能返回其他值
function invalid(): void {
  return 123; // 错误：不能将 number 赋值给 void
}
```

**never 类型**

`never` 表示**永远不会有返回值**的类型，是 TypeScript 的**底层类型（Bottom Type）**。函数如果抛出异常或进入无限循环，返回值类型就是 `never`。

```typescript
// 函数抛出异常，永远不会正常返回
function throwError(message: string): never {
  throw new Error(message);
  // 不会执行到这里
}

// 函数进入无限循环，永远不会返回
function infiniteLoop(): never {
  while (true) {
    // 无限循环
  }
}

// ❌ 不能有任何返回值（包括 undefined）
function invalid(): never {
  return undefined; // 错误：不能将 undefined 赋值给 never
}
```

---

## 问题 2：void 和 never 在类型系统中的差异是什么？

**void：表示"无值"**

`void` 是一个**单元类型（Unit Type）**，它的值只能是 `undefined`（在非严格模式下也可以是 `null`）。

```typescript
// void 类型的变量
let voidValue: void;

voidValue = undefined; // ✅ 正确
// voidValue = null; // 仅在 strictNullChecks: false 时允许
// voidValue = 123; // ❌ 错误

// 函数返回 void
function getValue(): void {
  return; // 等同于 return undefined
}

const result = getValue(); // result 类型是 void
console.log(result); // undefined
```

**never：表示"不可能存在的值"**

`never` 是**底层类型（Bottom Type）**，表示永远不会出现的值。它是所有类型的子类型，但没有任何类型是 `never` 的子类型（除了 `never` 自身）。

```typescript
// never 类型的变量不能被赋值
let neverValue: never;

// neverValue = undefined; // ❌ 错误
// neverValue = null; // ❌ 错误
// neverValue = 123; // ❌ 错误
// 没有任何值可以赋给 never 类型

// never 是所有类型的子类型
function fail(): never {
  throw new Error("Failed");
}

let num: number = fail(); // ✅ never 可以赋值给任何类型
let str: string = fail(); // ✅ never 可以赋值给任何类型
```

**类型兼容性对比**

```typescript
// void 可以被赋值为 undefined
let v: void = undefined; // ✅

// never 不能被赋值为任何值
// let n: never = undefined; // ❌

// never 可以赋值给任何类型
let num: number = (() => {
  throw new Error();
})(); // ✅

// void 不能赋值给其他类型（除了 any 和 unknown）
let num2: number = (() => {})(); // ❌ void 不能赋值给 number
```

---

## 问题 3：void 和 never 的实际使用场景有哪些？

**void 的使用场景**

1. **无返回值的函数**

```typescript
// 事件处理函数
function handleClick(event: MouseEvent): void {
  console.log("Clicked", event.target);
}

// 副作用函数
function saveToLocalStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}

// 回调函数
function forEach<T>(arr: T[], callback: (item: T) => void): void {
  for (const item of arr) {
    callback(item);
  }
}
```

2. **Promise 无返回值**

```typescript
// 异步操作无返回值
async function updateUser(id: number, data: UserData): Promise<void> {
  await fetch(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  // 不返回任何值
}
```

**never 的使用场景**

1. **永远不会正常返回的函数**

```typescript
// 抛出错误的工具函数
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// 程序终止
function exit(code: number): never {
  process.exit(code);
}
```

2. **详尽性检查（Exhaustive Checks）**

```typescript
type Shape = Circle | Square | Triangle;

interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  size: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // 如果所有情况都处理了，shape 类型会被收窄为 never
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}

// 如果添加新类型但忘记处理，会报错
type Shape2 = Circle | Square | Triangle | Rectangle; // 新增 Rectangle

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

function getArea2(shape: Shape2): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // ❌ 错误：Rectangle 不能赋值给 never
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

3. **类型守卫中的不可达分支**

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    // 这个分支永远不会执行，value 类型是 never
    const _unreachable: never = value;
    throw new Error("Unreachable code");
  }
}
```

4. **联合类型中的过滤**

```typescript
// 从联合类型中排除某些类型
type NonNullable<T> = T extends null | undefined ? never : T;

type Result = NonNullable<string | number | null | undefined>;
// Result = string | number
```

---

## 问题 4：函数返回值为 void 时，可以返回值吗？

**void 的特殊行为**

在 TypeScript 中，当函数返回类型声明为 `void` 时，实际上**可以返回值，但返回值会被忽略**。这是为了支持回调函数的灵活性。

```typescript
// 声明返回 void 的函数类型
type VoidFunc = () => void;

// ✅ 实现可以返回值，但会被忽略
const f1: VoidFunc = () => {
  return 123; // 不会报错
};

const f2: VoidFunc = () => {
  return "hello"; // 不会报错
};

// 调用时返回值类型仍然是 void
const result = f1(); // result 类型是 void
// const num: number = f1(); // ❌ 错误：void 不能赋值给 number
```

**实际应用场景**

这个特性在数组方法中非常有用：

```typescript
const numbers = [1, 2, 3];

// Array.prototype.push 返回 number（新数组长度）
// 但 forEach 的回调要求返回 void
numbers.forEach((num) => {
  return numbers.push(num * 2); // ✅ 不会报错，返回值被忽略
});

// 如果严格要求 void，这会很不方便
const arr: number[] = [];
[1, 2, 3].forEach((x) => arr.push(x)); // ✅ push 返回 number，但被忽略
```

**显式声明 void 返回值时的行为**

```typescript
// 显式声明返回 void 时，不能返回非 undefined 的值
function explicitVoid(): void {
  // return 123; // ❌ 错误
  return undefined; // ✅ 正确
  // 或者不写 return
}

// 但函数类型声明为 void 时，可以返回值
const implicitVoid: () => void = () => 123; // ✅ 正确
```

---

## 总结

**核心差异**：

### 1. 语义区别

- **void**：函数没有返回值（返回 `undefined`）
- **never**：函数永远不会正常返回（抛出异常或无限循环）

### 2. 类型系统中的位置

- **void**：单元类型，值为 `undefined`
- **never**：底层类型，没有任何值

### 3. 赋值规则

- **void**：只能赋值 `undefined`（或 `null` 在非严格模式）
- **never**：不能被赋任何值，但可以赋值给任何类型

### 4. 使用场景

- **void**：无返回值的函数、回调函数、Promise<void>
- **never**：抛出异常、无限循环、详尽性检查、类型过滤

### 5. 特殊行为

- **void** 作为函数类型时，实现可以返回值（但会被忽略）
- **never** 用于编译时的类型检查和类型收窄

## 延伸阅读

- [TypeScript 官方文档 - void](https://www.typescriptlang.org/docs/handbook/2/functions.html#void)
- [TypeScript 官方文档 - never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [TypeScript Deep Dive - never](https://basarat.gitbook.io/typescript/type-system/never)
