---
title: TypeScript 中 any 和 unknown 的区别
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 any 和 unknown 类型的本质区别，掌握类型安全的最佳实践，避免滥用 any 导致的类型系统失效问题。
tags:
  - TypeScript
  - 类型系统
  - 类型安全
  - any
estimatedTime: 20 分钟
keywords:
  - any类型
  - unknown类型
  - 类型安全
  - 类型检查
highlight: 理解 any 和 unknown 的核心差异，掌握在实际开发中如何选择合适的顶层类型
order: 660
---

## 问题 1：any 和 unknown 的基本定义是什么？

**any 类型**

`any` 是 TypeScript 中的"逃生舱"类型，它会**完全关闭类型检查**。使用 `any` 类型的变量可以被赋予任何值，也可以访问任何属性或方法，TypeScript 编译器不会进行任何检查。

```typescript
let value: any;

// ✅ 可以赋予任何类型的值
value = 123;
value = "hello";
value = { name: "John" };
value = [1, 2, 3];

// ✅ 可以调用任何方法（即使不存在）
value.foo(); // 编译通过，但运行时可能报错
value.bar.baz; // 编译通过，但运行时可能报错
```

**unknown 类型**

`unknown` 是 TypeScript 3.0 引入的**类型安全的顶层类型**。它表示"未知类型"，可以接收任何值，但在使用前**必须进行类型检查或类型断言**。

```typescript
let value: unknown;

// ✅ 可以赋予任何类型的值
value = 123;
value = "hello";
value = { name: "John" };

// ❌ 不能直接使用，必须先进行类型检查
value.toFixed(); // 错误：对象的类型为 "unknown"
value.length; // 错误：对象的类型为 "unknown"

// ✅ 类型检查后可以使用
if (typeof value === "string") {
  console.log(value.length); // 正确
}
```

---

## 问题 2：any 和 unknown 在类型安全性上有什么区别？

**any 类型：完全放弃类型安全**

`any` 类型会让 TypeScript 的类型检查系统完全失效，相当于回到了 JavaScript 的动态类型世界。

```typescript
function processValue(value: any) {
  // ❌ 所有操作都能通过编译，但可能在运行时出错
  return value
    .toUpperCase()
    .split(",")
    .map((x: any) => x * 2);
}

// 编译通过，但运行时会报错
processValue(123); // TypeError: value.toUpperCase is not a function
```

**unknown 类型：强制类型检查**

`unknown` 类型强制开发者在使用前进行类型检查，提供了类型安全保障。

```typescript
function processValue(value: unknown) {
  // ❌ 直接使用会报错
  // return value.toUpperCase(); // 错误

  // ✅ 必须先进行类型检查
  if (typeof value === "string") {
    return value.toUpperCase(); // 正确
  }

  throw new Error("Expected string");
}

processValue("hello"); // "HELLO"
processValue(123); // 抛出错误（在编译时就能发现问题）
```

**类型传播的差异**

```typescript
// any 会"污染"其他类型
let anyValue: any = "hello";
let str: string = anyValue; // ✅ 编译通过
str.toFixed(); // 编译通过，但运行时报错

// unknown 不会污染其他类型
let unknownValue: unknown = "hello";
let str2: string = unknownValue; // ❌ 错误：不能将 unknown 赋值给 string

// 必须先进行类型检查
if (typeof unknownValue === "string") {
  let str3: string = unknownValue; // ✅ 正确
}
```

---

## 问题 3：在什么场景下应该使用 any 或 unknown？

**使用 unknown 的场景（推荐）**

1. **处理不确定类型的外部数据**

```typescript
// 处理 API 响应
async function fetchData(url: string): Promise<unknown> {
  const response = await fetch(url);
  return response.json(); // 返回类型未知
}

// 使用时必须进行类型检查
const data = await fetchData("/api/user");
if (isUser(data)) {
  // 类型守卫
  console.log(data.name);
}
```

2. **类型守卫函数的参数**

```typescript
// 类型守卫函数
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processInput(input: unknown) {
  if (isString(input)) {
    console.log(input.toUpperCase()); // input 被收窄为 string
  }
}
```

**使用 any 的场景（谨慎使用）**

1. **快速原型开发或临时代码**

```typescript
// 快速开发时暂时使用 any，后续再补充类型
let temp: any = getSomeComplexData();
```

2. **与第三方库交互（缺少类型定义）**

```typescript
// 第三方库没有类型定义
const legacyLib: any = require("legacy-library");
legacyLib.doSomething();
```

3. **复杂的类型转换（但应优先考虑其他方案）**

```typescript
// ⚠️ 不推荐，应该使用更精确的类型
const data = JSON.parse(jsonString) as any;

// ✅ 更好的做法
const data: unknown = JSON.parse(jsonString);
if (isValidData(data)) {
  // 类型检查
  // 使用 data
}
```

**最佳实践建议**

```typescript
// ❌ 避免：滥用 any
function badExample(data: any) {
  return data.foo.bar.baz; // 完全没有类型安全
}

// ✅ 推荐：使用 unknown + 类型守卫
function goodExample(data: unknown) {
  if (isValidData(data)) {
    return data.foo.bar.baz; // 类型安全
  }
  throw new Error("Invalid data");
}

// ✅ 推荐：使用泛型
function bestExample<T>(data: T) {
  // 保留类型信息
  return data;
}
```

---

## 问题 4：如何将 unknown 类型转换为具体类型？

**方法 1：类型守卫（Type Guards）**

```typescript
function processValue(value: unknown) {
  // typeof 类型守卫
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // value 是 string
  }

  // instanceof 类型守卫
  if (value instanceof Date) {
    console.log(value.getFullYear()); // value 是 Date
  }

  // in 操作符类型守卫
  if (value && typeof value === "object" && "name" in value) {
    console.log((value as { name: string }).name);
  }
}
```

**方法 2：自定义类型守卫函数**

```typescript
// 定义接口
interface User {
  name: string;
  age: number;
}

// 自定义类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "age" in value &&
    typeof (value as User).name === "string" &&
    typeof (value as User).age === "number"
  );
}

// 使用
function greetUser(data: unknown) {
  if (isUser(data)) {
    console.log(`Hello, ${data.name}!`); // data 被收窄为 User
  }
}
```

**方法 3：类型断言（Type Assertion）**

```typescript
// ⚠️ 使用类型断言会绕过类型检查，需要确保类型正确
function processData(data: unknown) {
  // as 断言
  const user = data as User;
  console.log(user.name);

  // 尖括号断言（在 TSX 中不可用）
  const user2 = <User>data;
}

// ✅ 更安全的做法：结合类型守卫
function safeProcessData(data: unknown) {
  if (isUser(data)) {
    // 类型已被收窄，不需要断言
    console.log(data.name);
  }
}
```

**方法 4：使用 Zod 等运行时验证库**

```typescript
import { z } from "zod";

// 定义 schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// 验证并解析
function parseUser(data: unknown) {
  try {
    const user = UserSchema.parse(data); // 运行时验证
    console.log(user.name); // user 的类型是 { name: string; age: number }
  } catch (error) {
    console.error("Invalid user data");
  }
}
```

---

## 总结

**核心差异**：

### 1. 类型安全性

- **any**：完全关闭类型检查，放弃类型安全
- **unknown**：保持类型安全，强制类型检查

### 2. 使用限制

- **any**：可以直接访问任何属性和方法
- **unknown**：必须先进行类型检查或断言才能使用

### 3. 类型传播

- **any**：会"污染"其他类型，破坏类型系统
- **unknown**：不会污染其他类型，保持类型完整性

### 4. 使用建议

- **优先使用 unknown**：当类型真正未知时
- **谨慎使用 any**：仅在必要时使用，并添加注释说明原因
- **配合类型守卫**：将 unknown 安全地转换为具体类型

## 延伸阅读

- [TypeScript 官方文档 - any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [TypeScript 官方文档 - unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
- [Zod - TypeScript-first schema validation](https://zod.dev/)
