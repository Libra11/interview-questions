---
title: TypeScript 枚举和常量枚举的区别
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中普通枚举（enum）和常量枚举（const enum）的区别，掌握它们的编译结果、性能差异和使用场景。
tags:
  - TypeScript
  - 枚举
  - const enum
  - 编译优化
estimatedTime: 20 分钟
keywords:
  - enum
  - const enum
  - 枚举类型
  - 编译优化
highlight: 理解枚举和常量枚举的本质区别，掌握在不同场景下的正确选择
order: 313
---

## 问题 1：TypeScript 中的枚举（enum）是什么？

**枚举的定义**

枚举（Enum）是 TypeScript 提供的一种**为一组数值赋予友好名称**的方式。枚举可以让代码更具可读性和可维护性。

**数字枚举**

```typescript
// 数字枚举（默认从 0 开始）
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

let dir: Direction = Direction.Up;
console.log(dir); // 0
console.log(Direction.Down); // 1

// 自定义起始值
enum Status {
  Pending = 1,
  Active, // 2
  Inactive, // 3
}

// 自定义所有值
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalServerError = 500,
}
```

**字符串枚举**

```typescript
// 字符串枚举
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

let color: Color = Color.Red;
console.log(color); // "RED"

// 实际应用
enum LogLevel {
  Error = "ERROR",
  Warning = "WARNING",
  Info = "INFO",
  Debug = "DEBUG",
}

function log(level: LogLevel, message: string) {
  console.log(`[${level}] ${message}`);
}

log(LogLevel.Error, "Something went wrong");
```

**异构枚举（不推荐）**

```typescript
// 混合数字和字符串（不推荐使用）
enum Mixed {
  No = 0,
  Yes = "YES",
}
```

---

## 问题 2：普通枚举的编译结果是什么？

**数字枚举的编译结果**

```typescript
// TypeScript 代码
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

// 编译后的 JavaScript 代码
var Direction;
(function (Direction) {
  Direction[(Direction["Up"] = 0)] = "Up";
  Direction[(Direction["Down"] = 1)] = "Down";
  Direction[(Direction["Left"] = 2)] = "Left";
  Direction[(Direction["Right"] = 3)] = "Right";
})(Direction || (Direction = {}));

// 生成的对象结构
// Direction = {
//   0: "Up",
//   1: "Down",
//   2: "Left",
//   3: "Right",
//   Up: 0,
//   Down: 1,
//   Left: 2,
//   Right: 3
// }
```

**反向映射**

数字枚举支持反向映射（从值到名称）：

```typescript
enum Direction {
  Up = 0,
  Down = 1,
}

console.log(Direction.Up); // 0
console.log(Direction[0]); // "Up" （反向映射）
console.log(Direction.Down); // 1
console.log(Direction[1]); // "Down"
```

**字符串枚举的编译结果**

```typescript
// TypeScript 代码
enum Color {
  Red = "RED",
  Green = "GREEN",
}

// 编译后的 JavaScript 代码
var Color;
(function (Color) {
  Color["Red"] = "RED";
  Color["Green"] = "GREEN";
})(Color || (Color = {}));

// 生成的对象结构（没有反向映射）
// Color = {
//   Red: "RED",
//   Green: "GREEN"
// }
```

---

## 问题 3：什么是常量枚举（const enum）？

**常量枚举的定义**

常量枚举使用 `const enum` 声明，在编译时会被**完全内联**，不会生成额外的 JavaScript 代码。

```typescript
// 常量枚举
const enum Direction {
  Up,
  Down,
  Left,
  Right,
}

let dir = Direction.Up;
console.log(Direction.Down);

// 编译后的 JavaScript 代码（完全内联）
let dir = 0; /* Direction.Up */
console.log(1); /* Direction.Down */

// ✅ 没有生成 Direction 对象，直接替换为字面量值
```

**常量枚举的特点**

```typescript
const enum Status {
  Pending = 1,
  Active = 2,
  Inactive = 3,
}

// TypeScript 代码
function checkStatus(status: Status) {
  if (status === Status.Active) {
    console.log("Active");
  }
}

checkStatus(Status.Pending);

// 编译后的 JavaScript 代码
function checkStatus(status) {
  if (status === 2 /* Status.Active */) {
    console.log("Active");
  }
}

checkStatus(1 /* Status.Pending */);
```

---

## 问题 4：enum 和 const enum 的区别是什么？

**编译结果对比**

```typescript
// 普通枚举
enum NormalEnum {
  A = 1,
  B = 2,
}

// 常量枚举
const enum ConstEnum {
  A = 1,
  B = 2,
}

// 使用
let normal = NormalEnum.A;
let constant = ConstEnum.A;

// 编译后的 JavaScript
// 普通枚举：生成对象
var NormalEnum;
(function (NormalEnum) {
  NormalEnum[(NormalEnum["A"] = 1)] = "A";
  NormalEnum[(NormalEnum["B"] = 2)] = "B";
})(NormalEnum || (NormalEnum = {}));

let normal = NormalEnum.A; // 运行时查找

// 常量枚举：完全内联
let constant = 1; /* ConstEnum.A */ // 编译时替换
```

**功能对比**

| 特性         | enum                | const enum  |
| ------------ | ------------------- | ----------- |
| 生成 JS 代码 | ✅ 生成对象         | ❌ 完全内联 |
| 反向映射     | ✅ 支持（数字枚举） | ❌ 不支持   |
| 运行时存在   | ✅ 存在             | ❌ 不存在   |
| 代码体积     | 较大                | 较小        |
| 性能         | 运行时查找          | 编译时替换  |
| 可迭代       | ✅ 可以             | ❌ 不可以   |

**反向映射的区别**

```typescript
// 普通枚举：支持反向映射
enum Direction {
  Up = 0,
  Down = 1,
}

console.log(Direction[0]); // "Up" ✅
console.log(Direction.Up); // 0 ✅

// 常量枚举：不支持反向映射
const enum ConstDirection {
  Up = 0,
  Down = 1,
}

// console.log(ConstDirection[0]); // ❌ 编译错误
console.log(ConstDirection.Up); // ✅ 编译为 0
```

**运行时访问的区别**

```typescript
// 普通枚举：运行时可以访问
enum Status {
  Active = 1,
  Inactive = 2,
}

// 可以遍历枚举
Object.keys(Status).forEach((key) => {
  console.log(key, Status[key as any]);
});

// 可以作为对象使用
const statusMap = {
  [Status.Active]: "活跃",
  [Status.Inactive]: "不活跃",
};

// 常量枚举：运行时不存在
const enum ConstStatus {
  Active = 1,
  Inactive = 2,
}

// ❌ 不能遍历（运行时不存在）
// Object.keys(ConstStatus) // 编译错误

// ❌ 不能作为对象使用
// const map = { [ConstStatus.Active]: "..." }; // 编译错误
```

---

## 问题 5：何时使用 enum 或 const enum？

**使用普通 enum 的场景**

1. **需要反向映射**

```typescript
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalServerError = 500,
}

// 根据状态码获取名称
function getStatusName(code: number): string {
  return HttpStatus[code] || "Unknown";
}

console.log(getStatusName(200)); // "OK"
```

2. **需要运行时遍历**

```typescript
enum Permission {
  Read = "READ",
  Write = "WRITE",
  Delete = "DELETE",
}

// 获取所有权限
function getAllPermissions(): string[] {
  return Object.values(Permission);
}

console.log(getAllPermissions()); // ["READ", "WRITE", "DELETE"]
```

3. **需要在运行时动态访问**

```typescript
enum Feature {
  DarkMode = "DARK_MODE",
  Notifications = "NOTIFICATIONS",
}

// 根据配置启用功能
function enableFeature(featureName: string) {
  const feature = Feature[featureName as keyof typeof Feature];
  // ...
}
```

**使用 const enum 的场景**

1. **性能敏感的代码**

```typescript
// 频繁使用的常量
const enum CacheKey {
  User = "user",
  Posts = "posts",
  Comments = "comments",
}

// 编译后直接替换为字符串，无运行时开销
localStorage.getItem(CacheKey.User);
```

2. **不需要反向映射**

```typescript
const enum Direction {
  Up,
  Down,
  Left,
  Right,
}

// 只需要正向使用
function move(direction: Direction) {
  switch (direction) {
    case Direction.Up:
      // ...
      break;
  }
}
```

3. **减少打包体积**

```typescript
// 在库或大型项目中，使用 const enum 可以减少打包体积
const enum LogLevel {
  Error = 0,
  Warning = 1,
  Info = 2,
  Debug = 3,
}

function log(level: LogLevel, message: string) {
  if (level <= LogLevel.Warning) {
    console.log(message);
  }
}
```

**替代方案：对象字面量 + as const**

```typescript
// 使用对象字面量替代枚举
const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
} as const;

type Direction = (typeof Direction)[keyof typeof Direction];

// 使用
let dir: Direction = Direction.Up;

// 优点：
// 1. 更符合 JavaScript 习惯
// 2. 可以在运行时访问
// 3. 更好的 tree-shaking 支持
```

**字符串联合类型替代枚举**

```typescript
// 使用字符串联合类型
type Status = "pending" | "active" | "inactive";

// 定义常量
const STATUS = {
  PENDING: "pending" as const,
  ACTIVE: "active" as const,
  INACTIVE: "inactive" as const,
};

function updateStatus(status: Status) {
  // ...
}

updateStatus(STATUS.ACTIVE);

// 优点：
// 1. 更轻量
// 2. 更好的类型推断
// 3. 不需要额外的编译产物
```

---

## 总结

**核心区别**：

### 1. 编译结果

- **enum**：生成 JavaScript 对象
- **const enum**：完全内联，不生成代码

### 2. 运行时行为

- **enum**：运行时存在，可以访问和遍历
- **const enum**：运行时不存在，编译时替换

### 3. 性能

- **enum**：运行时查找，有轻微性能开销
- **const enum**：编译时替换，零运行时开销

### 4. 功能

- **enum**：支持反向映射、遍历、动态访问
- **const enum**：仅支持正向访问

### 5. 使用建议

**使用 enum**：

- 需要反向映射
- 需要运行时遍历
- 需要动态访问

**使用 const enum**：

- 性能敏感场景
- 只需要正向访问
- 减少打包体积

**替代方案**：

- 对象字面量 + as const
- 字符串联合类型

## 延伸阅读

- [TypeScript 官方文档 - Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TypeScript Deep Dive - Enums](https://basarat.gitbook.io/typescript/type-system/enums)
- [Why I don't use enums anymore](https://www.youtube.com/watch?v=jjMbPt_H3RQ)
