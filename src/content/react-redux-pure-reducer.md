---
title: Redux 的 reducer 为什么必须纯函数？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 Redux reducer 必须是纯函数的原因，掌握纯函数的定义和重要性。
tags:
  - React
  - Redux
  - 纯函数
  - Reducer
estimatedTime: 10 分钟
keywords:
  - pure function
  - Redux reducer
  - immutable
  - predictable
highlight: 纯函数保证相同输入得到相同输出，让状态变化可预测、可测试、可调试。
order: 234
---

## 问题 1：什么是纯函数？

### 纯函数的定义

1. **相同输入 → 相同输出**
2. **无副作用**

```jsx
// ✅ 纯函数
function add(a, b) {
  return a + b;
}

// ❌ 不纯：依赖外部变量
let c = 1;
function addWithExternal(a, b) {
  return a + b + c; // c 可能变化
}

// ❌ 不纯：有副作用
function addWithSideEffect(a, b) {
  console.log(a, b); // 副作用
  return a + b;
}
```

---

## 问题 2：为什么 reducer 必须是纯函数？

### 1. 可预测性

```jsx
// 纯函数：给定相同输入，永远得到相同输出
const state = { count: 0 };
const action = { type: "INCREMENT" };

reducer(state, action); // { count: 1 }
reducer(state, action); // { count: 1 }
reducer(state, action); // { count: 1 }
// 永远一致
```

### 2. 时间旅行调试

```jsx
// Redux DevTools 可以回放 action
// 因为 reducer 是纯函数，重放会得到相同结果

// Action 历史
actions = [
  { type: "ADD", payload: 1 },
  { type: "ADD", payload: 2 },
  { type: "SUBTRACT", payload: 1 },
];

// 可以跳到任意时间点
// 重新执行 actions[0..n] 得到那个时刻的状态
```

### 3. 可测试性

```jsx
// 纯函数非常容易测试
describe("counterReducer", () => {
  it("should increment", () => {
    const state = { count: 0 };
    const action = { type: "INCREMENT" };

    expect(reducer(state, action)).toEqual({ count: 1 });
  });
});
```

### 4. 变化检测

```jsx
// Redux 使用浅比较检测变化
if (prevState !== nextState) {
  // 状态变化了
}

// 如果 reducer 修改原对象，引用不变，检测不到变化
// ❌ 错误
function badReducer(state, action) {
  state.count++; // 修改原对象
  return state; // 引用没变！
}
```

---

## 问题 3：reducer 中不能做什么？

### 禁止的操作

```jsx
function reducer(state, action) {
  // ❌ 修改参数
  state.count++;

  // ❌ API 调用
  fetch("/api/data");

  // ❌ 随机值
  return { ...state, id: Math.random() };

  // ❌ 当前时间
  return { ...state, timestamp: Date.now() };

  // ❌ 修改外部变量
  globalVariable = "changed";
}
```

### 正确的写法

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      // ✅ 返回新对象
      return { ...state, count: state.count + 1 };

    case "ADD_ITEM":
      // ✅ 返回新数组
      return { ...state, items: [...state.items, action.payload] };

    case "UPDATE_ITEM":
      // ✅ map 返回新数组
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };

    default:
      return state;
  }
}
```

---

## 问题 4：副作用应该放在哪里？

### 中间件处理副作用

```jsx
// Redux Thunk
const fetchUser = (id) => async (dispatch) => {
  dispatch({ type: "FETCH_START" });

  try {
    const user = await api.getUser(id); // 副作用在这里
    dispatch({ type: "FETCH_SUCCESS", payload: user });
  } catch (error) {
    dispatch({ type: "FETCH_ERROR", payload: error });
  }
};

// Reducer 保持纯净
function userReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, user: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
```

## 总结

**Reducer 必须是纯函数的原因**：

| 原因     | 说明                 |
| -------- | -------------------- |
| 可预测   | 相同输入 → 相同输出  |
| 可调试   | 支持时间旅行         |
| 可测试   | 无副作用，易于测试   |
| 变化检测 | 新引用才能检测到变化 |

## 延伸阅读

- [Redux 文档 - Reducers](https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers)
- [不可变更新模式](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)
