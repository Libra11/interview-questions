---
title: TypeScript 中 type 和 interface 的区别
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入对比 TypeScript 中 type 和 interface 的异同，掌握它们在声明合并、扩展、性能等方面的差异，学会在不同场景下做出正确选择。
tags:
  - TypeScript
  - type
  - interface
  - 类型系统
estimatedTime: 22 分钟
keywords:
  - type别名
  - interface接口
  - 类型声明
  - 声明合并
highlight: 理解 type 和 interface 的核心区别，掌握在实际开发中的最佳实践
order: 314
---

## 问题 1：type 和 interface 的基本定义是什么？

**interface（接口）**

`interface` 用于定义对象的**结构**，描述对象应该有哪些属性和方法。

```typescript
// 定义接口
interface User {
  name: string;
  age: number;
  email?: string; // 可选属性
  readonly id: number; // 只读属性
  greet(): void; // 方法
}

// 使用接口
const user: User = {
  id: 1,
  name: "Alice",
  age: 25,
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  },
};
```

**type（类型别名）**

`type` 用于给类型起一个**别名**，可以表示任何类型（基本类型、联合类型、交叉类型等）。

```typescript
// 基本类型别名
type ID = string | number;

// 对象类型
type User = {
  name: string;
  age: number;
  email?: string;
  readonly id: number;
  greet(): void;
};

// 联合类型
type Status = "pending" | "success" | "error";

// 交叉类型
type Admin = User & { role: "admin" };
```

---

## 问题 2：type 和 interface 在对象类型定义上有什么区别？

**相同点：都可以定义对象结构**

```typescript
// interface 定义对象
interface UserInterface {
  name: string;
  age: number;
}

// type 定义对象
type UserType = {
  name: string;
  age: number;
};

// 使用方式相同
const user1: UserInterface = { name: "Alice", age: 25 };
const user2: UserType = { name: "Bob", age: 30 };
```

**扩展方式不同**

```typescript
// interface 使用 extends 扩展
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

const dog: Dog = {
  name: "Buddy",
  bark() {
    console.log("Woof!");
  },
};

// type 使用交叉类型 & 扩展
type AnimalType = {
  name: string;
};

type DogType = AnimalType & {
  bark(): void;
};

const dog2: DogType = {
  name: "Max",
  bark() {
    console.log("Woof!");
  },
};
```

**interface 可以多次扩展同一个接口**

```typescript
// interface 可以继承多个接口
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

interface Duck extends Flyable, Swimmable {
  quack(): void;
}

// type 使用交叉类型实现相同效果
type DuckType = Flyable &
  Swimmable & {
    quack(): void;
  };
```

---

## 问题 3：type 和 interface 在声明合并上有什么区别？

**interface 支持声明合并**

`interface` 的一个重要特性是**声明合并**（Declaration Merging），同名接口会自动合并。

```typescript
// 声明合并：同名接口会自动合并
interface User {
  name: string;
}

interface User {
  age: number;
}

interface User {
  email: string;
}

// 三个声明合并为一个
const user: User = {
  name: "Alice",
  age: 25,
  email: "alice@example.com",
};
```

**type 不支持声明合并**

```typescript
// ❌ 错误：标识符"UserType"重复
type UserType = {
  name: string;
};

// type UserType = {  // 错误
//   age: number;
// };
```

**声明合并的实际应用**

```typescript
// 扩展第三方库的类型定义
interface Window {
  myCustomProperty: string;
}

// 现在可以使用
window.myCustomProperty = "Hello";

// 扩展全局接口
interface Array<T> {
  myMethod(): void;
}

Array.prototype.myMethod = function () {
  console.log("Custom method");
};

[1, 2, 3].myMethod(); // ✅ 可以调用
```

---

## 问题 4：type 和 interface 在高级类型上有什么区别？

**type 可以表示更多类型**

```typescript
// 1. 基本类型别名
type Name = string;
type Age = number;

// 2. 联合类型
type Status = "pending" | "success" | "error";
type ID = string | number;

// 3. 元组类型
type Point = [number, number];
type RGB = [number, number, number];

// 4. 映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 5. 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

// 6. 工具类型
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

**interface 只能表示对象类型**

```typescript
// ✅ interface 可以定义对象
interface User {
  name: string;
}

// ❌ interface 不能定义基本类型
// interface Name = string; // 错误

// ❌ interface 不能定义联合类型
// interface Status = "pending" | "success"; // 错误

// ❌ interface 不能定义元组
// interface Point = [number, number]; // 错误
```

**type 可以使用联合和交叉类型**

```typescript
// 联合类型
type Shape = Circle | Square | Triangle;

type Result<T> = { success: true; data: T } | { success: false; error: string };

// 交叉类型
type Admin = User & { role: "admin"; permissions: string[] };

type Timestamped<T> = T & { createdAt: Date; updatedAt: Date };
```

**interface 使用 extends 实现类似效果**

```typescript
// interface 可以继承多个接口（类似交叉类型）
interface User {
  name: string;
}

interface Admin extends User {
  role: "admin";
  permissions: string[];
}

// 但 interface 不能表示联合类型
// 需要使用 type
type Shape = Circle | Square;
```

---

## 问题 5：type 和 interface 在性能和使用建议上有什么区别？

**性能差异**

在大多数情况下，`type` 和 `interface` 的性能差异可以忽略不计。但在某些极端情况下：

```typescript
// interface 的声明合并可能导致性能问题
// 如果有大量的声明合并，TypeScript 需要合并所有声明

// type 的复杂交叉类型可能导致类型检查变慢
type Complex = A & B & C & D & E & F; // 复杂的交叉类型
```

**官方推荐**

TypeScript 官方建议：

1. **优先使用 interface**：对于对象类型定义
2. **使用 type**：当需要联合类型、元组、映射类型等高级特性时

**实际使用建议**

```typescript
// ✅ 推荐：使用 interface 定义对象结构
interface User {
  name: string;
  age: number;
}

// ✅ 推荐：使用 type 定义联合类型
type Status = "idle" | "loading" | "success" | "error";

// ✅ 推荐：使用 type 定义工具类型
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// ✅ 推荐：使用 interface 定义 React 组件 Props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ 推荐：使用 type 定义复杂的返回值类型
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**库开发建议**

```typescript
// 库开发时，使用 interface 允许用户扩展类型
export interface LibraryConfig {
  apiUrl: string;
  timeout: number;
}

// 用户可以扩展
declare module "my-library" {
  interface LibraryConfig {
    customOption: string;
  }
}

// 如果使用 type，用户无法扩展
export type LibraryConfigType = {
  apiUrl: string;
  timeout: number;
};
```

**React 开发建议**

```typescript
// Props 使用 interface（可以被扩展）
interface BaseButtonProps {
  label: string;
  onClick: () => void;
}

interface PrimaryButtonProps extends BaseButtonProps {
  variant: "primary";
}

// 状态类型使用 type（通常不需要扩展）
type LoadingState = "idle" | "loading" | "success" | "error";

type AppState = {
  user: User | null;
  status: LoadingState;
};
```

---

## 问题 6：何时选择 type 或 interface？

**选择 interface 的场景**

1. **定义对象结构**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

2. **需要声明合并**

```typescript
interface Window {
  customProperty: string;
}
```

3. **定义类的契约**

```typescript
interface Drawable {
  draw(): void;
}

class Circle implements Drawable {
  draw() {
    console.log("Drawing circle");
  }
}
```

4. **库的公共 API**

```typescript
// 允许用户扩展
export interface PluginConfig {
  name: string;
  version: string;
}
```

**选择 type 的场景**

1. **定义联合类型**

```typescript
type Status = "pending" | "success" | "error";
type ID = string | number;
```

2. **定义元组**

```typescript
type Point = [number, number];
type RGB = [number, number, number];
```

3. **定义映射类型**

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

4. **定义条件类型**

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

5. **定义复杂的工具类型**

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

**混合使用**

```typescript
// interface 定义基础结构
interface User {
  id: number;
  name: string;
}

// type 定义联合类型
type UserRole = "admin" | "user" | "guest";

// 组合使用
interface AdminUser extends User {
  role: UserRole;
  permissions: string[];
}

// 或使用交叉类型
type AdminUserType = User & {
  role: UserRole;
  permissions: string[];
};
```

---

## 总结

**核心区别**：

### 1. 基本特性

- **interface**：专门用于定义对象结构
- **type**：可以定义任何类型（联合、交叉、元组等）

### 2. 扩展方式

- **interface**：使用 `extends` 关键字
- **type**：使用交叉类型 `&`

### 3. 声明合并

- **interface**：✅ 支持声明合并
- **type**：❌ 不支持声明合并

### 4. 适用场景

**interface**：

- 对象类型定义
- 类的契约
- 需要声明合并
- 库的公共 API

**type**：

- 联合类型
- 元组类型
- 映射类型
- 条件类型
- 工具类型

### 5. 使用建议

- **优先使用 interface** 定义对象结构
- **使用 type** 定义联合类型和高级类型
- 在库开发中使用 **interface** 允许用户扩展
- 根据具体需求灵活选择

## 延伸阅读

- [TypeScript 官方文档 - Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript 官方文档 - Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [TypeScript Deep Dive - Interfaces vs Type Aliases](https://basarat.gitbook.io/typescript/type-system/type-compatibility)
