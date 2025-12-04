---
title: TypeScript 中 in 运算符的作用
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 in 运算符的两种用法：映射类型中的键遍历和类型守卫中的属性检查，掌握类型收窄技巧。
tags:
  - TypeScript
  - in运算符
  - 类型守卫
  - 映射类型
estimatedTime: 18 分钟
keywords:
  - in运算符
  - 类型守卫
  - 映射类型
  - 类型收窄
highlight: 掌握 in 运算符在映射类型和类型守卫中的不同作用，提升类型编程能力
order: 305
---

## 问题 1：TypeScript 中 in 运算符有哪些用法？

TypeScript 中的 `in` 运算符有**两种主要用法**：

1. **映射类型（Mapped Types）**：遍历类型的键
2. **类型守卫（Type Guards）**：检查对象是否包含某个属性

这两种用法在不同的上下文中发挥作用，是 TypeScript 类型系统的重要组成部分。

---

## 问题 2：in 运算符在映射类型中如何使用？

**映射类型基础**

在映射类型中，`in` 用于**遍历联合类型的每个成员**，为每个键创建新的类型。

```typescript
// 基本语法
type MappedType<T> = {
  [K in keyof T]: T[K];
};

// 示例：复制类型
interface User {
  name: string;
  age: number;
  email: string;
}

type UserCopy = {
  [K in keyof User]: User[K];
};
// 结果：{ name: string; age: number; email: string; }
```

**常见映射类型模式**

```typescript
// 1. 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 2. 将所有属性变为只读
type Readonly<T> = {
  [P in keyof T]: readonly T[P];
};

// 3. 将所有属性变为必选
type Required<T> = {
  [P in keyof T]-?: T[P]; // -? 移除可选修饰符
};

// 4. 添加前缀
type Prefixed<T> = {
  [K in keyof T as `prefix_${K & string}`]: T[K];
};

interface Person {
  name: string;
  age: number;
}

type PrefixedPerson = Prefixed<Person>;
// 结果：{ prefix_name: string; prefix_age: number; }
```

**使用 in 遍历联合类型**

```typescript
// 遍历字符串字面量联合类型
type Keys = "name" | "age" | "email";

type KeysObject = {
  [K in Keys]: string;
};
// 结果：{ name: string; age: string; email: string; }

// 实际应用：创建状态映射
type Status = "idle" | "loading" | "success" | "error";

type StatusMap = {
  [S in Status]: {
    message: string;
    timestamp: number;
  };
};

const statusMap: StatusMap = {
  idle: { message: "Waiting", timestamp: 0 },
  loading: { message: "Loading...", timestamp: Date.now() },
  success: { message: "Done", timestamp: Date.now() },
  error: { message: "Failed", timestamp: Date.now() },
};
```

**键重映射（Key Remapping）**

TypeScript 4.1+ 支持使用 `as` 子句重新映射键：

```typescript
// 过滤掉某些键
type OmitByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? never : K]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  count: number;
}

type OnlyStrings = OmitByType<Mixed, number>;
// 结果：{ name: string; active: boolean; }

// 转换键名
type Getters<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
};

interface User {
  name: string;
  age: number;
}

type UserGetters = Getters<User>;
// 结果：{ getName: () => string; getAge: () => number; }
```

---

## 问题 3：in 运算符在类型守卫中如何使用？

**基本类型守卫**

在运行时，`in` 运算符用于检查对象是否包含某个属性，TypeScript 会根据检查结果**收窄类型**。

```typescript
interface Cat {
  meow: () => void;
}

interface Dog {
  bark: () => void;
}

type Animal = Cat | Dog;

function makeSound(animal: Animal) {
  // 使用 in 运算符进行类型守卫
  if ("meow" in animal) {
    // animal 被收窄为 Cat
    animal.meow();
  } else {
    // animal 被收窄为 Dog
    animal.bark();
  }
}
```

**判别联合类型**

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

type Shape = Circle | Square | Rectangle;

function getArea(shape: Shape): number {
  // 使用 in 检查特定属性
  if ("radius" in shape) {
    // shape 被收窄为 Circle
    return Math.PI * shape.radius ** 2;
  } else if ("size" in shape) {
    // shape 被收窄为 Square
    return shape.size ** 2;
  } else {
    // shape 被收窄为 Rectangle
    return shape.width * shape.height;
  }
}
```

**检查可选属性**

```typescript
interface User {
  name: string;
  email?: string;
  phone?: string;
}

function notifyUser(user: User) {
  // 检查可选属性是否存在
  if ("email" in user && user.email) {
    console.log(`Sending email to ${user.email}`);
  } else if ("phone" in user && user.phone) {
    console.log(`Sending SMS to ${user.phone}`);
  } else {
    console.log("No contact method available");
  }
}
```

**与其他类型守卫结合**

```typescript
interface ApiSuccess {
  status: "success";
  data: any;
}

interface ApiError {
  status: "error";
  message: string;
  code?: number;
}

type ApiResponse = ApiSuccess | ApiError;

function handleResponse(response: ApiResponse) {
  // 先用 in 检查属性
  if ("data" in response) {
    // response 被收窄为 ApiSuccess
    console.log("Success:", response.data);
  } else {
    // response 被收窄为 ApiError
    console.log("Error:", response.message);

    // 进一步检查可选属性
    if ("code" in response && response.code) {
      console.log("Error code:", response.code);
    }
  }
}
```

---

## 问题 4：in 运算符与其他类型守卫的区别是什么？

**in vs typeof**

```typescript
function process(value: string | number) {
  // typeof：检查基本类型
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  } else {
    console.log(value.toFixed(2));
  }
}

function processObject(obj: { name: string } | { age: number }) {
  // in：检查对象属性
  if ("name" in obj) {
    console.log(obj.name);
  } else {
    console.log(obj.age);
  }
}
```

**in vs instanceof**

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
  // instanceof：检查类实例
  if (animal instanceof Cat) {
    animal.meow();
  } else {
    animal.bark();
  }
}

// in 更适合接口和类型别名
interface ICat {
  meow: () => void;
}

interface IDog {
  bark: () => void;
}

function makeSoundInterface(animal: ICat | IDog) {
  // instanceof 不能用于接口，使用 in
  if ("meow" in animal) {
    animal.meow();
  } else {
    animal.bark();
  }
}
```

**in vs 自定义类型守卫**

```typescript
interface User {
  name: string;
  email: string;
}

// 自定义类型守卫函数
function isUser(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "email" in obj &&
    typeof obj.name === "string" &&
    typeof obj.email === "string"
  );
}

function processData(data: unknown) {
  // 使用自定义类型守卫
  if (isUser(data)) {
    console.log(data.name, data.email);
  }

  // 直接使用 in（不够安全）
  if (typeof data === "object" && data !== null && "name" in data) {
    // data 类型仍然是 object，需要类型断言
    console.log((data as User).name);
  }
}
```

**最佳实践对比**

```typescript
// ❌ 不推荐：只用 in 检查，不够安全
function unsafe(obj: any) {
  if ("name" in obj) {
    return obj.name.toUpperCase(); // 可能运行时报错
  }
}

// ✅ 推荐：结合多种检查
function safe(obj: any) {
  if (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof obj.name === "string"
  ) {
    return obj.name.toUpperCase(); // 类型安全
  }
}

// ✅ 最佳：使用自定义类型守卫
function isValidObject(obj: any): obj is { name: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof obj.name === "string"
  );
}

function best(obj: any) {
  if (isValidObject(obj)) {
    return obj.name.toUpperCase(); // 类型安全且可复用
  }
}
```

---

## 总结

**in 运算符的两种用法**：

### 1. 映射类型中的 in

- **作用**：遍历类型的键，创建新类型
- **语法**：`[K in keyof T]` 或 `[K in UnionType]`
- **应用**：Partial、Readonly、Record 等工具类型

### 2. 类型守卫中的 in

- **作用**：检查对象是否包含某个属性，收窄类型
- **语法**：`"property" in object`
- **应用**：判别联合类型、检查可选属性

### 3. 与其他类型守卫的对比

- **typeof**：检查基本类型（string、number 等）
- **instanceof**：检查类实例
- **in**：检查对象属性（适合接口和类型别名）
- **自定义类型守卫**：复杂类型检查，可复用

### 4. 使用建议

- 映射类型中使用 `in` 遍历键
- 类型守卫中结合 `typeof`、`in` 等多种检查
- 复杂场景使用自定义类型守卫函数

## 延伸阅读

- [TypeScript 官方文档 - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript 官方文档 - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
