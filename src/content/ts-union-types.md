---
title: TypeScript 联合类型详解
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面解析 TypeScript 联合类型的概念、使用方法和类型收窄技巧，掌握如何处理多种可能的类型组合。
tags:
  - TypeScript
  - 联合类型
  - 类型收窄
  - 类型守卫
estimatedTime: 20 分钟
keywords:
  - 联合类型
  - Union Types
  - 类型收窄
  - 判别联合
highlight: 理解联合类型的本质和使用场景，掌握类型收窄和判别联合的最佳实践
order: 684
---

## 问题 1：什么是联合类型？

**联合类型的定义**

联合类型（Union Types）表示一个值可以是**几种类型之一**，使用 `|` 符号连接多个类型。联合类型让我们可以更灵活地描述可能有多种形态的数据。

```typescript
// 基本联合类型
let value: string | number;

value = "hello"; // ✅ 可以是 string
value = 123; // ✅ 可以是 number
// value = true; // ❌ 错误：不能是 boolean
```

**联合类型的特点**

```typescript
// 1. 可以包含多个类型
type Status = "idle" | "loading" | "success" | "error";

let currentStatus: Status;
currentStatus = "idle"; // ✅
currentStatus = "loading"; // ✅
// currentStatus = "pending"; // ❌ 错误

// 2. 可以是不同种类的类型
type Result = string | number | boolean | null;

let result: Result;
result = "success";
result = 200;
result = true;
result = null;

// 3. 可以是复杂类型
type Response =
  | { success: true; data: any }
  | { success: false; error: string };
```

---

## 问题 2：如何使用联合类型？

**函数参数中的联合类型**

```typescript
// 接受多种类型的参数
function formatValue(value: string | number): string {
  // 只能访问两种类型共有的属性和方法
  return value.toString();
}

formatValue("hello"); // "hello"
formatValue(123); // "123"

// 处理不同类型的逻辑
function printId(id: string | number) {
  if (typeof id === "string") {
    // id 被收窄为 string
    console.log(id.toUpperCase());
  } else {
    // id 被收窄为 number
    console.log(id.toFixed(2));
  }
}
```

**数组中的联合类型**

```typescript
// 数组元素可以是多种类型
let mixedArray: (string | number)[] = [1, "hello", 2, "world"];

// 或者使用 Array 泛型
let mixedArray2: Array<string | number> = [1, "hello", 2, "world"];

// 遍历时需要类型检查
mixedArray.forEach((item) => {
  if (typeof item === "string") {
    console.log(item.toUpperCase());
  } else {
    console.log(item.toFixed(2));
  }
});
```

**对象属性中的联合类型**

```typescript
interface User {
  id: string | number; // id 可以是 string 或 number
  name: string;
  age: number;
  role: "admin" | "user" | "guest"; // 字符串字面量联合
}

const user: User = {
  id: "user-123", // 可以是 string
  name: "Alice",
  age: 25,
  role: "admin",
};

const user2: User = {
  id: 123, // 也可以是 number
  name: "Bob",
  age: 30,
  role: "user",
};
```

**返回值中的联合类型**

```typescript
// 函数可能返回不同类型
function getValue(key: string): string | number | undefined {
  const data: Record<string, string | number> = {
    name: "Alice",
    age: 25,
  };
  return data[key];
}

const value = getValue("name"); // string | number | undefined

// 使用前需要类型检查
if (typeof value === "string") {
  console.log(value.toUpperCase());
} else if (typeof value === "number") {
  console.log(value.toFixed(2));
}
```

---

## 问题 3：如何对联合类型进行类型收窄？

**使用 typeof 类型守卫**

```typescript
function process(value: string | number) {
  // typeof 类型守卫
  if (typeof value === "string") {
    // value 被收窄为 string
    return value.toUpperCase();
  } else {
    // value 被收窄为 number
    return value.toFixed(2);
  }
}
```

**使用 instanceof 类型守卫**

```typescript
class Cat {
  meow() {
    console.log("Meow!");
  }
}

class Dog {
  bark() {
    console.log("Woof!");
  }
}

function makeSound(animal: Cat | Dog) {
  // instanceof 类型守卫
  if (animal instanceof Cat) {
    animal.meow(); // animal 是 Cat
  } else {
    animal.bark(); // animal 是 Dog
  }
}
```

**使用 in 操作符**

```typescript
interface Bird {
  fly: () => void;
  layEggs: () => void;
}

interface Fish {
  swim: () => void;
  layEggs: () => void;
}

function move(animal: Bird | Fish) {
  // in 操作符检查属性
  if ("fly" in animal) {
    animal.fly(); // animal 是 Bird
  } else {
    animal.swim(); // animal 是 Fish
  }
}
```

**使用自定义类型守卫**

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  size: number;
}

type Shape = Circle | Square;

// 自定义类型守卫
function isCircle(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}

function getArea(shape: Shape): number {
  if (isCircle(shape)) {
    // shape 被收窄为 Circle
    return Math.PI * shape.radius ** 2;
  } else {
    // shape 被收窄为 Square
    return shape.size ** 2;
  }
}
```

**使用字面量类型收窄**

```typescript
type Status = "idle" | "loading" | "success" | "error";

function handleStatus(status: Status) {
  // 字面量类型收窄
  if (status === "loading") {
    console.log("Loading...");
  } else if (status === "success") {
    console.log("Success!");
  } else if (status === "error") {
    console.log("Error occurred");
  } else {
    // status 被收窄为 "idle"
    console.log("Idle");
  }
}
```

---

## 问题 4：什么是判别联合（Discriminated Unions）？

**判别联合的定义**

判别联合（也称为标签联合、Tagged Union）是一种特殊的联合类型模式，通过一个**共同的字面量类型属性**（通常叫做判别属性或标签）来区分不同的类型。

**基本模式**

```typescript
// 定义判别联合
interface Circle {
  kind: "circle"; // 判别属性
  radius: number;
}

interface Square {
  kind: "square"; // 判别属性
  size: number;
}

interface Rectangle {
  kind: "rectangle"; // 判别属性
  width: number;
  height: number;
}

type Shape = Circle | Square | Rectangle;

// 使用判别属性进行类型收窄
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape 被收窄为 Circle
      return Math.PI * shape.radius ** 2;
    case "square":
      // shape 被收窄为 Square
      return shape.size ** 2;
    case "rectangle":
      // shape 被收窄为 Rectangle
      return shape.width * shape.height;
  }
}
```

**实际应用：API 响应处理**

```typescript
// 成功响应
interface SuccessResponse {
  status: "success";
  data: any;
}

// 错误响应
interface ErrorResponse {
  status: "error";
  message: string;
  code: number;
}

// 加载中响应
interface LoadingResponse {
  status: "loading";
}

type ApiResponse = SuccessResponse | ErrorResponse | LoadingResponse;

function handleResponse(response: ApiResponse) {
  switch (response.status) {
    case "success":
      console.log("Data:", response.data);
      break;
    case "error":
      console.error(`Error ${response.code}: ${response.message}`);
      break;
    case "loading":
      console.log("Loading...");
      break;
  }
}
```

**详尽性检查（Exhaustiveness Checking）**

```typescript
type Shape = Circle | Square | Rectangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    case "rectangle":
      return shape.width * shape.height;
    default:
      // 详尽性检查：如果所有情况都处理了，shape 类型是 never
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}

// 如果添加新类型但忘记处理，会报错
type Shape2 = Circle | Square | Rectangle | Triangle;

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

function getArea2(shape: Shape2): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    case "rectangle":
      return shape.width * shape.height;
    default:
      // ❌ 错误：Triangle 不能赋值给 never
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

**Redux Action 模式**

```typescript
// 定义不同的 Action
interface IncrementAction {
  type: "INCREMENT";
  payload: number;
}

interface DecrementAction {
  type: "DECREMENT";
  payload: number;
}

interface ResetAction {
  type: "RESET";
}

type CounterAction = IncrementAction | DecrementAction | ResetAction;

// Reducer 函数
function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case "INCREMENT":
      return state + action.payload;
    case "DECREMENT":
      return state - action.payload;
    case "RESET":
      return 0;
    default:
      const _exhaustiveCheck: never = action;
      return state;
  }
}
```

---

## 总结

**核心概念**：

### 1. 联合类型基础

- 使用 `|` 连接多个类型
- 表示值可以是几种类型之一
- 只能访问所有类型共有的属性和方法

### 2. 类型收窄方法

- **typeof**：检查基本类型
- **instanceof**：检查类实例
- **in**：检查对象属性
- **自定义类型守卫**：使用 `is` 关键字
- **字面量类型**：直接比较值

### 3. 判别联合

- 使用共同的字面量类型属性作为判别器
- 通过 switch 或 if 语句进行类型收窄
- 支持详尽性检查，确保处理所有情况

### 4. 实际应用

- API 响应类型定义
- 状态管理（Redux Actions）
- 事件处理
- 表单数据验证
- 配置对象类型

### 5. 最佳实践

- 优先使用判别联合而非普通联合
- 使用详尽性检查确保类型安全
- 合理使用类型守卫进行类型收窄
- 避免过度复杂的联合类型

## 延伸阅读

- [TypeScript 官方文档 - Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript 官方文档 - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript Deep Dive - Discriminated Unions](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
