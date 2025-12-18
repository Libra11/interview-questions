---
title: TypeScript extends 条件类型详解
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 extends 关键字在条件类型中的作用，掌握类型约束、条件判断和分布式条件类型的使用方法。
tags:
  - TypeScript
  - extends
  - 条件类型
  - 类型约束
estimatedTime: 22 分钟
keywords:
  - extends关键字
  - 条件类型
  - 类型约束
  - 分布式条件类型
highlight: 掌握 extends 在条件类型中的多种用法，实现灵活的类型判断和转换
order: 681
---

## 问题 1：TypeScript 中 extends 在条件类型中的作用是什么？

**extends 的两种主要用法**

在 TypeScript 中，`extends` 关键字有两种主要用法：

1. **泛型约束**：限制泛型参数必须满足某个条件
2. **条件类型**：根据类型关系进行条件判断

**条件类型的基本语法**

```typescript
T extends U ? X : Y
```

- 如果类型 `T` 可以赋值给类型 `U`，则结果是 `X`
- 否则结果是 `Y`

**简单示例**

```typescript
// 判断类型是否为 string
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false
type Test3 = IsString<"hello">; // true（字面量类型也是 string）

// 判断类型是否为数组
type IsArray<T> = T extends any[] ? true : false;

type Test4 = IsArray<number[]>; // true
type Test5 = IsArray<string>; // false
```

---

## 问题 2：extends 如何用于类型约束？

**泛型约束基础**

使用 `extends` 可以限制泛型参数必须满足特定条件：

```typescript
// 约束 T 必须有 length 属性
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength("hello"); // ✅ string 有 length
getLength([1, 2, 3]); // ✅ array 有 length
getLength({ length: 10 }); // ✅ 对象有 length
// getLength(123); // ❌ 错误：number 没有 length
```

**约束为特定类型**

```typescript
// 约束为 number 类型
function double<T extends number>(value: T): T {
  return (value * 2) as T;
}

double(5); // ✅ 10
// double("5"); // ❌ 错误

// 约束为对象类型
interface HasName {
  name: string;
}

function greet<T extends HasName>(obj: T): string {
  return `Hello, ${obj.name}!`;
}

greet({ name: "Alice" }); // ✅
greet({ name: "Bob", age: 25 }); // ✅
// greet({ age: 25 }); // ❌ 错误：缺少 name 属性
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
// 同时满足多个接口
interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

function process<T extends Printable & Loggable>(item: T): void {
  item.print();
  item.log();
}

// 使用
const obj = {
  print() {
    console.log("Printing...");
  },
  log() {
    console.log("Logging...");
  },
};

process(obj); // ✅
```

---

## 问题 3：extends 在条件类型中如何进行类型判断？

**基本类型判断**

```typescript
// 判断是否为 null 或 undefined
type IsNullable<T> = T extends null | undefined ? true : false;

type Test1 = IsNullable<null>; // true
type Test2 = IsNullable<undefined>; // true
type Test3 = IsNullable<string>; // false

// 排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T;

type Test4 = NonNullable<string | null>; // string
type Test5 = NonNullable<number | undefined>; // number
```

**函数类型判断**

```typescript
// 判断是否为函数
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type Test1 = IsFunction<() => void>; // true
type Test2 = IsFunction<(x: number) => string>; // true
type Test3 = IsFunction<string>; // false

// 提取函数返回值类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Func = (x: number) => string;
type Result = ReturnType<Func>; // string
```

**对象类型判断**

```typescript
// 判断是否为对象
type IsObject<T> = T extends object ? true : false;

type Test1 = IsObject<{}>; // true
type Test2 = IsObject<{ name: string }>; // true
type Test3 = IsObject<string>; // false

// 判断是否包含特定属性
type HasProperty<T, K extends string> = T extends { [P in K]: any }
  ? true
  : false;

interface User {
  name: string;
  age: number;
}

type Test4 = HasProperty<User, "name">; // true
type Test5 = HasProperty<User, "email">; // false
```

**嵌套条件类型**

```typescript
// 多层条件判断
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends Function
  ? "function"
  : "object";

type T1 = TypeName<string>; // "string"
type T2 = TypeName<123>; // "number"
type T3 = TypeName<true>; // "boolean"
type T4 = TypeName<() => void>; // "function"
```

---

## 问题 4：什么是分布式条件类型？

**分布式条件类型的定义**

当条件类型作用于**联合类型**时，TypeScript 会自动将条件类型**分布**到联合类型的每个成员上。

```typescript
// 基本示例
type ToArray<T> = T extends any ? T[] : never;

type Test1 = ToArray<string>; // string[]
type Test2 = ToArray<number>; // number[]

// 联合类型会被分布
type Test3 = ToArray<string | number>;
// 等价于：ToArray<string> | ToArray<number>
// 结果：string[] | number[]
```

**分布式条件类型的工作原理**

```typescript
// Exclude 的实现
type MyExclude<T, U> = T extends U ? never : T;

type Result = MyExclude<"a" | "b" | "c", "a" | "b">;
// 分布过程：
// MyExclude<"a", "a" | "b"> | MyExclude<"b", "a" | "b"> | MyExclude<"c", "a" | "b">
// never | never | "c"
// 结果："c"

// Extract 的实现
type MyExtract<T, U> = T extends U ? T : never;

type Result2 = MyExtract<"a" | "b" | "c", "a" | "b">;
// 分布过程：
// MyExtract<"a", "a" | "b"> | MyExtract<"b", "a" | "b"> | MyExtract<"c", "a" | "b">
// "a" | "b" | never
// 结果："a" | "b"
```

**阻止分布式条件类型**

使用元组包裹类型参数可以阻止分布：

```typescript
// 正常的分布式条件类型
type ToArray<T> = T extends any ? T[] : never;
type Test1 = ToArray<string | number>; // string[] | number[]

// 阻止分布
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never;
type Test2 = ToArrayNonDistributive<string | number>; // (string | number)[]
```

**实际应用：过滤联合类型**

```typescript
// 过滤掉函数类型
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

interface Methods {
  name: string;
  age: number;
  getName: () => string;
  getAge: () => number;
}

type DataKeys = NonFunctionKeys<Methods>;
// 结果："name" | "age"

// 提取函数类型
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type MethodKeys = FunctionKeys<Methods>;
// 结果："getName" | "getAge"
```

---

## 问题 5：extends 条件类型的高级应用有哪些？

**应用 1：实现 Diff 类型**

```typescript
// 找出两个类型的差异
type Diff<T, U> = T extends U ? never : T;

type A = "a" | "b" | "c";
type B = "a" | "b";
type Result = Diff<A, B>; // "c"
```

**应用 2：实现 Filter 类型**

```typescript
// 过滤对象中特定类型的属性
type FilterByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  count: number;
}

type OnlyNumbers = FilterByType<Mixed, number>;
// 结果：{ age: number; count: number; }

type OnlyStrings = FilterByType<Mixed, string>;
// 结果：{ name: string; }
```

**应用 3：实现 PartialByKeys**

```typescript
// 将指定的键变为可选
type PartialByKeys<T, K extends keyof T> = {
  [P in K]?: T[P];
} & {
  [P in Exclude<keyof T, K>]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserWithOptionalContact = PartialByKeys<User, "email" | "age">;
// 结果：{ id: number; name: string; email?: string; age?: number; }
```

**应用 4：实现 RequiredByKeys**

```typescript
// 将指定的键变为必选
type RequiredByKeys<T, K extends keyof T> = {
  [P in K]-?: T[P];
} & {
  [P in Exclude<keyof T, K>]: T[P];
};

interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

type RequiredHostConfig = RequiredByKeys<Config, "host">;
// 结果：{ host: string; port?: number; timeout?: number; }
```

**应用 5：实现 Mutable（移除 readonly）**

```typescript
// 移除所有 readonly 修饰符
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
}

type MutableUser = Mutable<ReadonlyUser>;
// 结果：{ id: number; name: string; }
```

**应用 6：实现 DeepPartial**

```typescript
// 递归将所有属性变为可选
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

interface NestedObject {
  user: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
}

type PartialNested = DeepPartial<NestedObject>;
// 所有嵌套属性都变为可选
```

---

## 总结

**核心概念**：

### 1. extends 的两种用法

- **泛型约束**：`<T extends SomeType>` 限制类型范围
- **条件类型**：`T extends U ? X : Y` 类型判断

### 2. 条件类型语法

```typescript
T extends U ? TrueType : FalseType
```

### 3. 分布式条件类型

- 联合类型会自动分布到条件类型的每个成员
- 使用元组 `[T]` 可以阻止分布

### 4. 常见应用

- **类型过滤**：Exclude、Extract、NonNullable
- **类型提取**：ReturnType、Parameters
- **属性操作**：PartialByKeys、RequiredByKeys
- **递归类型**：DeepPartial、DeepReadonly

### 5. 使用技巧

- 结合 `infer` 推断类型
- 使用 `keyof` 遍历属性
- 嵌套条件类型实现复杂逻辑
- 利用分布式特性处理联合类型

## 延伸阅读

- [TypeScript 官方文档 - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript 官方文档 - Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [TypeScript Deep Dive - Conditional Types](https://basarat.gitbook.io/typescript/type-system/conditional-types)
