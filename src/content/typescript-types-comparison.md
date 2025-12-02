---
title: TypeScript 中 any、never、unknown、null & undefined 和 void 有什么区别
category: TypeScript
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  全面理解 TypeScript 中特殊类型的区别和使用场景，包括 any、never、unknown、null、undefined 和 void，掌握它们的特性和最佳实践。
tags:
  - TypeScript
  - 类型系统
  - any
  - never
  - unknown
estimatedTime: 20 分钟
keywords:
  - TypeScript 类型
  - any
  - never
  - unknown
  - void
highlight: 理解这些特殊类型的区别是编写类型安全代码的基础
order: 117
---

## 问题 1：any 类型

### 特点

`any` 类型可以赋值给任何类型，也可以被任何类型赋值，**关闭了类型检查**。

```typescript
let value: any;

value = 123; // ✅
value = "hello"; // ✅
value = true; // ✅
value = {}; // ✅

let num: number = value; // ✅ 不会报错
let str: string = value; // ✅ 不会报错
```

### 使用场景

- 迁移 JavaScript 代码
- 第三方库没有类型定义
- 临时跳过类型检查（不推荐）

```typescript
// 第三方库
declare const jQuery: any;
jQuery("#app").hide();

// 动态内容
function parseJSON(json: string): any {
  return JSON.parse(json);
}
```

### 注意事项

**尽量避免使用 any**，它会失去 TypeScript 的类型保护。

```typescript
// ❌ 失去类型安全
let data: any = "hello";
data.toFixed(2); // 运行时错误，但编译不报错

// ✅ 使用具体类型
let data: string = "hello";
data.toFixed(2); // ❌ 编译时就会报错
```

---

## 问题 2：unknown 类型

### 特点

`unknown` 是类型安全的 `any`，可以被任何类型赋值，但**不能直接使用**，必须先进行类型检查。

```typescript
let value: unknown;

value = 123; // ✅
value = "hello"; // ✅
value = true; // ✅

// ❌ 不能直接使用
value.toFixed(2);
value.toUpperCase();

// ✅ 需要类型检查
if (typeof value === "string") {
  value.toUpperCase(); // ✅ 现在可以使用
}
```

### 与 any 的区别

```typescript
// any：不安全
let anyValue: any = "hello";
anyValue.toFixed(2); // 编译通过，运行时错误

// unknown：安全
let unknownValue: unknown = "hello";
unknownValue.toFixed(2); // ❌ 编译错误

if (typeof unknownValue === "string") {
  unknownValue.toUpperCase(); // ✅ 类型收窄后可以使用
}
```

### 使用场景

```typescript
// API 响应
async function fetchData(): Promise<unknown> {
  const response = await fetch("/api/data");
  return response.json();
}

const data = await fetchData();

// 使用前需要验证
if (isValidData(data)) {
  console.log(data.name); // ✅
}
```

---

## 问题 3：never 类型

### 特点

`never` 表示**永远不会发生的类型**，是所有类型的子类型。

```typescript
// 永远不会返回的函数
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
```

### 使用场景

**1. 穷尽性检查**

```typescript
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

**2. 过滤联合类型**

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null>; // string
type B = NonNullable<number | undefined>; // number
```

**3. 不可达代码**

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  }

  // 这里 value 的类型是 never（不可达）
  const _check: never = value;
}
```

---

## 问题 4：void 类型

### 特点

`void` 表示**没有返回值**的函数。

```typescript
function log(message: string): void {
  console.log(message);
  // 没有 return 或 return undefined
}

// 可以返回 undefined
function doSomething(): void {
  return undefined; // ✅
}
```

### 与 undefined 的区别

```typescript
// void：函数没有返回值
function voidFunc(): void {
  console.log("no return");
}

// undefined：函数返回 undefined
function undefinedFunc(): undefined {
  return undefined; // 必须显式返回
}
```

### 使用场景

```typescript
// 回调函数
function forEach<T>(arr: T[], callback: (item: T) => void) {
  for (const item of arr) {
    callback(item);
  }
}

// 事件处理
button.addEventListener("click", (): void => {
  console.log("clicked");
});
```

---

## 问题 5：null 和 undefined

### 特点

```typescript
let n: null = null;
let u: undefined = undefined;
```

### 严格模式下的区别

```typescript
// tsconfig.json: "strictNullChecks": true

let str: string = "hello";
str = null; // ❌ 错误
str = undefined; // ❌ 错误

let nullable: string | null = "hello";
nullable = null; // ✅

let optional: string | undefined = "hello";
optional = undefined; // ✅
```

### 可选属性

```typescript
interface User {
  name: string;
  age?: number; // 等同于 age: number | undefined
}

const user: User = {
  name: "Alice",
  // age 可以不提供
};
```

### 空值合并

```typescript
const value = null ?? "default"; // 'default'
const value2 = undefined ?? "default"; // 'default'
const value3 = 0 ?? "default"; // 0
const value4 = "" ?? "default"; // ''
```

---

## 问题 6：类型对比总结

### 赋值关系

```typescript
// any 可以赋值给任何类型
let anyVal: any;
let num: number = anyVal; // ✅
let str: string = anyVal; // ✅

// unknown 不能直接赋值
let unknownVal: unknown;
let num2: number = unknownVal; // ❌ 需要类型断言或检查

// never 可以赋值给任何类型（但没有值可以赋给 never）
let neverVal: never;
let num3: number = neverVal; // ✅
let str2: string = neverVal; // ✅

// void 只能赋值 undefined
let voidVal: void;
voidVal = undefined; // ✅
voidVal = null; // ❌（严格模式）
```

### 类型层级

```
never（底类型）
  ↓
具体类型（string, number, etc.）
  ↓
unknown（顶类型）
  ↓
any（逃逸类型）
```

### 使用建议

| 类型               | 使用场景                   | 推荐度     |
| ------------------ | -------------------------- | ---------- |
| **any**            | 迁移代码、临时跳过检查     | ⭐         |
| **unknown**        | 不确定的类型，需要类型检查 | ⭐⭐⭐⭐⭐ |
| **never**          | 穷尽性检查、不可达代码     | ⭐⭐⭐⭐   |
| **void**           | 无返回值函数               | ⭐⭐⭐⭐⭐ |
| **null/undefined** | 空值                       | ⭐⭐⭐⭐   |

---

## 总结

**核心概念总结**：

### 1. 类型特点

- **any**：关闭类型检查，不安全
- **unknown**：类型安全的 any，需要检查后使用
- **never**：永不发生，用于穷尽性检查
- **void**：无返回值
- **null/undefined**：空值类型

### 2. 最佳实践

- 避免使用 any，优先使用 unknown
- 使用 never 进行穷尽性检查
- 函数无返回值时使用 void
- 开启 strictNullChecks

### 3. 类型安全

- unknown > any（类型安全）
- 使用类型守卫收窄类型
- 利用 never 捕获遗漏的分支

## 延伸阅读

- [TypeScript 官方文档 - Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
