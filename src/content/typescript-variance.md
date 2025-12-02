---
title: 介绍一下 TypeScript 类型兼容——逆变、协变、双向协变和不变这四个概念
category: TypeScript
difficulty: 高级
updatedAt: 2024-12-02
summary: >-
  深入理解 TypeScript 类型系统中的变型概念，包括协变、逆变、双向协变和不变，掌握类型兼容性的原理和实际应用。
tags:
  - TypeScript
  - 类型系统
  - 协变
  - 逆变
estimatedTime: 26 分钟
keywords:
  - TypeScript 变型
  - 协变
  - 逆变
  - 类型兼容
highlight: 理解类型变型是掌握 TypeScript 类型系统的高级知识，对编写类型安全的代码至关重要
order: 118
---

## 问题 1：什么是类型变型（Variance）？

### 基本概念

类型变型描述了**子类型关系如何影响复合类型**的兼容性。

假设 `Dog` 是 `Animal` 的子类型：

```typescript
class Animal {
  name: string;
}

class Dog extends Animal {
  bark() {}
}

// Dog 是 Animal 的子类型
const animal: Animal = new Dog(); // ✅
```

那么 `Array<Dog>` 和 `Array<Animal>` 的关系是什么？这就是变型要解决的问题。

### 四种变型

1. **协变（Covariance）**：子类型关系保持不变
2. **逆变（Contravariance）**：子类型关系反转
3. **双向协变（Bivariance）**：既协变又逆变
4. **不变（Invariance）**：不存在子类型关系

---

## 问题 2：协变（Covariance）

### 定义

如果 `Dog` 是 `Animal` 的子类型，那么 `Container<Dog>` 也是 `Container<Animal>` 的子类型。

### 示例：数组是协变的

```typescript
class Animal {
  name: string;
}

class Dog extends Animal {
  bark() {}
}

const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs; // ✅ 协变：Dog[] 可以赋值给 Animal[]

// 但这可能导致问题
animals.push(new Animal()); // ✅ 编译通过
dogs[1].bark(); // ❌ 运行时错误：Animal 没有 bark 方法
```

### 只读属性是安全的协变

```typescript
interface ReadonlyArray<T> {
  readonly length: number;
  readonly [n: number]: T;
}

const dogs: readonly Dog[] = [new Dog()];
const animals: readonly Animal[] = dogs; // ✅ 安全的协变

// animals.push(new Animal()); // ❌ 不能修改，所以安全
```

### 函数返回值是协变的

```typescript
type GetAnimal = () => Animal;
type GetDog = () => Dog;

const getDog: GetDog = () => new Dog();
const getAnimal: GetAnimal = getDog; // ✅ 返回值协变

const animal = getAnimal();
// animal 的类型是 Animal，但实际是 Dog，这是安全的
```

---

## 问题 3：逆变（Contravariance）

### 定义

如果 `Dog` 是 `Animal` 的子类型，那么 `Handler<Animal>` 是 `Handler<Dog>` 的子类型（关系反转）。

### 函数参数是逆变的

```typescript
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const handleAnimal: AnimalHandler = (animal) => {
  console.log(animal.name);
};

// ✅ 逆变：接受 Animal 的函数可以赋值给接受 Dog 的函数
const handleDog: DogHandler = handleAnimal;

handleDog(new Dog()); // ✅ 安全
// 因为 handleAnimal 可以处理任何 Animal，当然也能处理 Dog
```

### 为什么函数参数是逆变的？

```typescript
class Animal {
  name: string;
}

class Dog extends Animal {
  bark() {}
}

class Cat extends Animal {
  meow() {}
}

// 接受 Animal 的函数
const feedAnimal = (animal: Animal) => {
  console.log(`Feeding ${animal.name}`);
};

// 接受 Dog 的函数
const feedDog = (dog: Dog) => {
  dog.bark();
  console.log(`Feeding ${dog.name}`);
};

// ✅ 安全：feedAnimal 可以赋值给 DogHandler
const dogHandler: (dog: Dog) => void = feedAnimal;
dogHandler(new Dog()); // ✅ 安全

// ❌ 不安全：feedDog 不能赋值给 AnimalHandler
const animalHandler: (animal: Animal) => void = feedDog; // ❌
animalHandler(new Cat()); // 运行时错误：Cat 没有 bark 方法
```

---

## 问题 4：双向协变（Bivariance）

### 定义

既可以协变又可以逆变，这是**不安全**的。

### TypeScript 的函数参数（非严格模式）

在非严格模式下，TypeScript 的函数参数是双向协变的：

```typescript
// tsconfig.json: "strictFunctionTypes": false

type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const handleAnimal: AnimalHandler = (animal) => {
  console.log(animal.name);
};

const handleDog: DogHandler = (dog) => {
  dog.bark();
};

// ⚠️ 双向协变：两个方向都可以赋值
const h1: DogHandler = handleAnimal; // ✅ 逆变
const h2: AnimalHandler = handleDog; // ✅ 协变（不安全！）

h2(new Cat()); // ❌ 运行时错误
```

### 严格模式

```typescript
// tsconfig.json: "strictFunctionTypes": true

const h2: AnimalHandler = handleDog; // ❌ 编译错误
// 严格模式下，函数参数只能逆变，不能协变
```

---

## 问题 5：不变（Invariance）

### 定义

既不协变也不逆变，类型必须完全匹配。

### 可变数组在严格模式下是不变的

```typescript
// 理论上，可变数组应该是不变的
type MutableArray<T> = {
  get(index: number): T; // 协变位置
  set(index: number, value: T): void; // 逆变位置
};

// 但 TypeScript 的数组实际是协变的（为了便利性）
```

### 泛型类型参数

```typescript
class Box<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
  }
}

const dogBox: Box<Dog> = new Box(new Dog());
const animalBox: Box<Animal> = dogBox; // ❌ 不变：不能赋值
```

---

## 问题 6：实际应用和最佳实践

### 1. 理解函数类型兼容性

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

// 函数参数逆变
type Fn1 = (x: Animal) => void;
type Fn2 = (x: Dog) => void;

let fn1: Fn1 = (x) => console.log(x.name);
let fn2: Fn2 = fn1; // ✅ 逆变

// 函数返回值协变
type Fn3 = () => Animal;
type Fn4 = () => Dog;

let fn4: Fn4 = () => new Dog();
let fn3: Fn3 = fn4; // ✅ 协变
```

### 2. 使用只读类型保证安全

```typescript
// ❌ 可变数组不安全
function processDogs(dogs: Dog[]): void {
  const animals: Animal[] = dogs; // 协变
  animals.push(new Animal()); // 破坏了类型安全
}

// ✅ 只读数组安全
function processDogs(dogs: readonly Dog[]): void {
  const animals: readonly Animal[] = dogs; // 安全的协变
  // animals.push(new Animal()); // ❌ 不能修改
}
```

### 3. 严格模式配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strictFunctionTypes": true, // 启用严格的函数类型检查
    "strict": true
  }
}
```

### 4. 事件处理器的类型

```typescript
class Button {
  onClick(handler: (event: MouseEvent) => void) {
    // ...
  }
}

// ✅ 可以接受更宽泛的参数类型（逆变）
button.onClick((event: Event) => {
  console.log("clicked");
});

// ❌ 不能接受更具体的参数类型
button.onClick((event: SpecificMouseEvent) => {
  // 编译错误
});
```

### 5. Promise 是协变的

```typescript
const dogPromise: Promise<Dog> = Promise.resolve(new Dog());
const animalPromise: Promise<Animal> = dogPromise; // ✅ 协变

animalPromise.then((animal) => {
  console.log(animal.name); // ✅ 安全
});
```

---

## 总结

**核心概念总结**：

### 1. 四种变型

- **协变**：子类型关系保持（如数组、返回值）
- **逆变**：子类型关系反转（如函数参数）
- **双向协变**：不安全，应避免
- **不变**：类型必须完全匹配

### 2. TypeScript 中的变型

- 数组：协变（不完全安全）
- 函数返回值：协变
- 函数参数：逆变（严格模式）
- 只读类型：安全的协变

### 3. 最佳实践

- 启用 `strictFunctionTypes`
- 使用只读类型保证安全
- 理解函数类型的兼容性
- 注意可变数据结构的风险

### 4. 记忆口诀

- **返回值协变**：返回更具体的类型是安全的
- **参数逆变**：接受更宽泛的类型是安全的
- **只读协变**：不能修改就是安全的

## 延伸阅读

- [TypeScript 官方文档 - Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [协变和逆变详解](https://www.stephanboyer.com/post/132/what-are-covariance-and-contravariance)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
