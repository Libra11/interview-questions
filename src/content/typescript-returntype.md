---
title: TypeScript 中 ReturnType 的作用和用法
category: TypeScript
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  深入理解 TypeScript 内置工具类型 ReturnType 的作用和使用场景，掌握如何提取函数返回值类型，以及在实际项目中的应用。
tags:
  - TypeScript
  - 工具类型
  - ReturnType
  - 类型推断
estimatedTime: 16 分钟
keywords:
  - ReturnType
  - TypeScript 工具类型
  - 函数返回类型
  - 类型推断
highlight: ReturnType 是 TypeScript 中常用的工具类型，能够自动提取函数的返回值类型
order: 115
---

## 问题 1：ReturnType 是什么？

### 基本概念

`ReturnType<T>` 是 TypeScript 内置的工具类型，用于提取函数类型的返回值类型。

```typescript
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

### 基本用法

```typescript
function getUserInfo() {
  return {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
  };
}

// 提取返回值类型
type UserInfo = ReturnType<typeof getUserInfo>;
// { id: number; name: string; email: string; }

const user: UserInfo = {
  id: 2,
  name: "Bob",
  email: "bob@example.com",
};
```

---

## 问题 2：ReturnType 的使用场景

### 场景 1：避免重复定义类型

```typescript
// ❌ 重复定义
interface User {
  id: number;
  name: string;
}

function getUser(): User {
  return { id: 1, name: "Alice" };
}

// ✅ 使用 ReturnType
function getUser() {
  return { id: 1, name: "Alice" };
}

type User = ReturnType<typeof getUser>;
```

### 场景 2：API 响应类型

```typescript
async function fetchUserData() {
  const response = await fetch("/api/user");
  return response.json();
}

// 提取返回类型
type UserData = ReturnType<typeof fetchUserData>;
// Promise<any>

// 配合 Awaited 使用
type UserDataResolved = Awaited<ReturnType<typeof fetchUserData>>;
```

### 场景 3：工厂函数

```typescript
function createStore() {
  const state = { count: 0 };

  return {
    getState: () => state,
    increment: () => state.count++,
    decrement: () => state.count--,
  };
}

type Store = ReturnType<typeof createStore>;
// {
//   getState: () => { count: number };
//   increment: () => number;
//   decrement: () => number;
// }

const store: Store = createStore();
```

### 场景 4：高阶函数

```typescript
function withLogging<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>): ReturnType<T> => {
    console.log("Calling function...");
    return fn(...args);
  };
}

function add(a: number, b: number) {
  return a + b;
}

const loggedAdd = withLogging(add);
type Result = ReturnType<typeof loggedAdd>; // number
```

---

## 问题 3：ReturnType 的实现原理

### 源码实现

```typescript
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

### 关键点

1. **泛型约束**：`T extends (...args: any) => any` 确保 T 是函数类型
2. **条件类型**：使用 `extends` 进行类型判断
3. **infer 关键字**：推断返回值类型 R

### 手动实现

```typescript
// 自定义 ReturnType
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function test(): string {
  return "hello";
}

type TestReturn = MyReturnType<typeof test>; // string
```

---

## 问题 4：ReturnType 的进阶用法

### 配合其他工具类型

```typescript
// 1. 配合 Parameters
function calculate(a: number, b: number): number {
  return a + b;
}

type Params = Parameters<typeof calculate>; // [number, number]
type Result = ReturnType<typeof calculate>; // number

// 2. 配合 Awaited（异步函数）
async function fetchData(): Promise<{ id: number; name: string }> {
  return { id: 1, name: "Alice" };
}

type FetchReturn = ReturnType<typeof fetchData>;
// Promise<{ id: number; name: string }>

type FetchData = Awaited<ReturnType<typeof fetchData>>;
// { id: number; name: string }
```

### 提取类方法返回类型

```typescript
class UserService {
  getUser(id: number) {
    return {
      id,
      name: "Alice",
      email: "alice@example.com",
    };
  }

  async fetchUsers() {
    return [{ id: 1, name: "Alice" }];
  }
}

// 提取方法返回类型
type GetUserReturn = ReturnType<UserService["getUser"]>;
// { id: number; name: string; email: string; }

type FetchUsersReturn = Awaited<ReturnType<UserService["fetchUsers"]>>;
// { id: number; name: string; }[]
```

### 条件返回类型

```typescript
function process<T extends boolean>(flag: T): T extends true ? string : number {
  return (flag ? "yes" : 0) as any;
}

type ResultTrue = ReturnType<typeof process<true>>; // string
type ResultFalse = ReturnType<typeof process<false>>; // number
```

### 联合类型函数

```typescript
type Fn1 = () => string;
type Fn2 = () => number;
type Fn = Fn1 | Fn2;

type Result = ReturnType<Fn>; // string | number
```

---

## 问题 5：实际项目应用

### Redux Action Creator

```typescript
const addTodo = (text: string) => ({
  type: "ADD_TODO" as const,
  payload: { text, id: Date.now() },
});

type AddTodoAction = ReturnType<typeof addTodo>;
// { type: 'ADD_TODO'; payload: { text: string; id: number } }
```

### React Hooks

```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);

  return { count, increment, decrement };
}

type CounterState = ReturnType<typeof useCounter>;
// { count: number; increment: () => void; decrement: () => void; }
```

### API 客户端

```typescript
class ApiClient {
  async getUsers() {
    return [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
  }

  async getUser(id: number) {
    return { id, name: "Alice", email: "alice@example.com" };
  }
}

const api = new ApiClient();

type Users = Awaited<ReturnType<typeof api.getUsers>>;
// { id: number; name: string; }[]

type User = Awaited<ReturnType<typeof api.getUser>>;
// { id: number; name: string; email: string; }
```

---

## 总结

**核心概念总结**：

### 1. ReturnType 的作用

- 提取函数返回值类型
- 避免重复定义类型
- 保持类型同步

### 2. 常见用法

- 提取普通函数返回类型
- 配合 Awaited 处理异步函数
- 提取类方法返回类型
- 配合 Parameters 使用

### 3. 实现原理

- 使用条件类型和 infer
- 泛型约束确保是函数类型
- 推断返回值类型

### 4. 最佳实践

- 优先使用 ReturnType 而不是手动定义
- 配合其他工具类型使用
- 注意异步函数需要 Awaited
- 保持类型定义的单一来源

## 延伸阅读

- [TypeScript 官方文档 - ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype)
- [TypeScript 工具类型详解](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
