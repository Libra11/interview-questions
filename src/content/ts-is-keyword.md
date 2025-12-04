---
title: TypeScript 中 is 关键字的作用
category: TypeScript
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 TypeScript 中 is 关键字的作用，掌握自定义类型守卫（Type Guard）的编写方法，提升类型安全性。
tags:
  - TypeScript
  - is关键字
  - 类型守卫
  - 类型收窄
estimatedTime: 20 分钟
keywords:
  - is关键字
  - 类型守卫
  - Type Guard
  - 类型谓词
highlight: 掌握 is 关键字在自定义类型守卫中的使用，实现精确的类型收窄
order: 306
---

## 问题 1：TypeScript 中 is 关键字是什么？

**is 关键字的定义**

`is` 是 TypeScript 中的**类型谓词（Type Predicate）**关键字，用于**自定义类型守卫函数**。它告诉 TypeScript 编译器：如果函数返回 `true`，则参数的类型应该被收窄为指定的类型。

**基本语法**

```typescript
function isType(value: any): value is TargetType {
  // 返回 boolean 值的检查逻辑
  return /* 检查条件 */;
}
```

**简单示例**

```typescript
// 定义类型守卫函数
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value 被收窄为 string 类型
    console.log(value.toUpperCase()); // ✅ 可以调用 string 方法
  } else {
    // value 仍然是 unknown
    console.log(value);
  }
}
```

**为什么需要 is 关键字？**

如果不使用 `is`，TypeScript 无法知道函数的返回值与类型收窄的关系：

```typescript
// ❌ 没有使用 is，类型不会被收窄
function isStringBad(value: unknown): boolean {
  return typeof value === "string";
}

function processValueBad(value: unknown) {
  if (isStringBad(value)) {
    // value 仍然是 unknown，无法调用 string 方法
    console.log(value.toUpperCase()); // ❌ 错误
  }
}

// ✅ 使用 is，类型会被收窄
function isStringGood(value: unknown): value is string {
  return typeof value === "string";
}

function processValueGood(value: unknown) {
  if (isStringGood(value)) {
    // value 被收窄为 string
    console.log(value.toUpperCase()); // ✅ 正确
  }
}
```

---

## 问题 2：如何编写自定义类型守卫函数？

**检查基本类型**

```typescript
// 检查是否为 number
function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

// 检查是否为 boolean
function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

// 使用
function processInput(input: unknown) {
  if (isNumber(input)) {
    console.log(input.toFixed(2)); // input 是 number
  } else if (isBoolean(input)) {
    console.log(input ? "Yes" : "No"); // input 是 boolean
  }
}
```

**检查对象类型**

```typescript
// 定义接口
interface User {
  name: string;
  age: number;
}

// 自定义类型守卫
function isUser(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.name === "string" &&
    typeof obj.age === "number"
  );
}

// 使用
function greetUser(data: unknown) {
  if (isUser(data)) {
    // data 被收窄为 User
    console.log(`Hello, ${data.name}! You are ${data.age} years old.`);
  } else {
    console.log("Invalid user data");
  }
}
```

**检查数组类型**

```typescript
// 检查是否为字符串数组
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

// 检查是否为数字数组
function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "number")
  );
}

// 使用
function processArray(arr: unknown) {
  if (isStringArray(arr)) {
    // arr 是 string[]
    arr.forEach((str) => console.log(str.toUpperCase()));
  } else if (isNumberArray(arr)) {
    // arr 是 number[]
    const sum = arr.reduce((a, b) => a + b, 0);
    console.log("Sum:", sum);
  }
}
```

**检查联合类型**

```typescript
interface Cat {
  type: "cat";
  meow: () => void;
}

interface Dog {
  type: "dog";
  bark: () => void;
}

type Animal = Cat | Dog;

// 检查是否为 Cat
function isCat(animal: Animal): animal is Cat {
  return animal.type === "cat";
}

// 检查是否为 Dog
function isDog(animal: Animal): animal is Dog {
  return animal.type === "dog";
}

// 使用
function makeSound(animal: Animal) {
  if (isCat(animal)) {
    animal.meow(); // animal 是 Cat
  } else if (isDog(animal)) {
    animal.bark(); // animal 是 Dog
  }
}
```

---

## 问题 3：is 关键字在实际项目中的应用场景有哪些？

**场景 1：API 响应验证**

```typescript
// API 响应类型
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code: number;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 类型守卫
function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

// 使用
async function fetchUser(id: number) {
  const response: ApiResponse<User> = await fetch(`/api/users/${id}`).then(
    (r) => r.json()
  );

  if (isSuccessResponse(response)) {
    // response.data 的类型是 User
    console.log(response.data.name);
  } else {
    // response 的类型是 ApiErrorResponse
    console.error(`Error ${response.code}: ${response.error}`);
  }
}
```

**场景 2：表单验证**

```typescript
interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  password: string;
  email: string;
  confirmPassword: string;
}

// 验证登录表单
function isLoginForm(form: any): form is LoginForm {
  return (
    typeof form === "object" &&
    form !== null &&
    typeof form.username === "string" &&
    typeof form.password === "string" &&
    !("email" in form)
  );
}

// 验证注册表单
function isRegisterForm(form: any): form is RegisterForm {
  return (
    typeof form === "object" &&
    form !== null &&
    typeof form.username === "string" &&
    typeof form.password === "string" &&
    typeof form.email === "string" &&
    typeof form.confirmPassword === "string"
  );
}

// 使用
function handleFormSubmit(formData: unknown) {
  if (isLoginForm(formData)) {
    // 处理登录
    console.log("Logging in:", formData.username);
  } else if (isRegisterForm(formData)) {
    // 处理注册
    console.log("Registering:", formData.username, formData.email);
  } else {
    console.error("Invalid form data");
  }
}
```

**场景 3：事件处理**

```typescript
// 不同类型的事件
interface ClickEvent {
  type: "click";
  x: number;
  y: number;
}

interface KeyEvent {
  type: "keypress";
  key: string;
}

interface ScrollEvent {
  type: "scroll";
  scrollTop: number;
}

type AppEvent = ClickEvent | KeyEvent | ScrollEvent;

// 类型守卫
function isClickEvent(event: AppEvent): event is ClickEvent {
  return event.type === "click";
}

function isKeyEvent(event: AppEvent): event is KeyEvent {
  return event.type === "keypress";
}

// 使用
function handleEvent(event: AppEvent) {
  if (isClickEvent(event)) {
    console.log(`Clicked at (${event.x}, ${event.y})`);
  } else if (isKeyEvent(event)) {
    console.log(`Key pressed: ${event.key}`);
  } else {
    console.log(`Scrolled to: ${event.scrollTop}`);
  }
}
```

**场景 4：配置对象验证**

```typescript
interface DatabaseConfig {
  type: "database";
  host: string;
  port: number;
  database: string;
}

interface CacheConfig {
  type: "cache";
  host: string;
  ttl: number;
}

type Config = DatabaseConfig | CacheConfig;

// 类型守卫
function isDatabaseConfig(config: Config): config is DatabaseConfig {
  return config.type === "database";
}

function isCacheConfig(config: Config): config is CacheConfig {
  return config.type === "cache";
}

// 使用
function initializeService(config: Config) {
  if (isDatabaseConfig(config)) {
    console.log(`Connecting to database at ${config.host}:${config.port}`);
    console.log(`Database name: ${config.database}`);
  } else if (isCacheConfig(config)) {
    console.log(`Connecting to cache at ${config.host}`);
    console.log(`TTL: ${config.ttl} seconds`);
  }
}
```

---

## 问题 4：is 关键字的注意事项和最佳实践是什么？

**注意事项 1：类型守卫必须准确**

```typescript
// ❌ 错误：检查不充分
function isUserBad(obj: any): obj is User {
  return obj.name !== undefined; // 只检查了 name，不够严格
}

// ✅ 正确：完整检查
function isUserGood(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.name === "string" &&
    typeof obj.age === "number"
  );
}
```

**注意事项 2：避免过度使用类型断言**

```typescript
// ❌ 不推荐：使用类型断言
function processData(data: unknown) {
  const user = data as User; // 不安全
  console.log(user.name);
}

// ✅ 推荐：使用类型守卫
function processDataSafe(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // 类型安全
  }
}
```

**注意事项 3：类型守卫的返回值必须是 boolean**

```typescript
// ❌ 错误：返回值不是 boolean
function isStringBad(value: unknown): value is string {
  return value; // 错误：返回值可能不是 boolean
}

// ✅ 正确：明确返回 boolean
function isStringGood(value: unknown): value is string {
  return typeof value === "string";
}
```

**最佳实践 1：结合泛型使用**

```typescript
// 通用数组类型守卫
function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

// 使用
const data: unknown = [1, 2, 3];

if (isArrayOf(data, isNumber)) {
  // data 是 number[]
  const sum = data.reduce((a, b) => a + b, 0);
}
```

**最佳实践 2：使用 Zod 等验证库**

```typescript
import { z } from "zod";

// 定义 schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

// 类型守卫
function isUser(data: unknown): data is User {
  return UserSchema.safeParse(data).success;
}

// 使用
function processUser(data: unknown) {
  if (isUser(data)) {
    console.log(data.name, data.email); // 类型安全
  }
}
```

**最佳实践 3：组合多个类型守卫**

```typescript
// 基础类型守卫
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === "object" && obj !== null && key in obj;
}

// 组合使用
function isUser(obj: unknown): obj is User {
  return (
    hasProperty(obj, "name") &&
    hasProperty(obj, "age") &&
    typeof obj.name === "string" &&
    typeof obj.age === "number"
  );
}
```

---

## 总结

**核心概念**：

### 1. is 关键字的作用

- 定义类型谓词，实现自定义类型守卫
- 告诉 TypeScript 如何收窄类型
- 提高类型安全性

### 2. 基本语法

```typescript
function isType(value: unknown): value is TargetType {
  return /* 检查逻辑 */;
}
```

### 3. 常见应用场景

- API 响应验证
- 表单数据验证
- 事件类型判断
- 配置对象验证
- 联合类型区分

### 4. 最佳实践

- 确保类型检查的准确性和完整性
- 优先使用类型守卫而非类型断言
- 结合泛型实现可复用的类型守卫
- 使用验证库（如 Zod）简化复杂验证

## 延伸阅读

- [TypeScript 官方文档 - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Deep Dive - Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
- [Zod - TypeScript-first schema validation](https://zod.dev/)
