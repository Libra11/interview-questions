---
title: TS 如何在 Redux 中提供类型安全？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握在 Redux 中使用 TypeScript 实现类型安全的方法。
tags:
  - React
  - TypeScript
  - Redux
  - 类型安全
estimatedTime: 15 分钟
keywords:
  - Redux TypeScript
  - type safety
  - typed Redux
  - Redux Toolkit
highlight: 通过定义 State、Action 类型，使用 Redux Toolkit 的类型推断，实现端到端类型安全。
order: 642
---

## 问题 1：定义 State 类型

### 基本 State 类型

```tsx
// 定义 State 类型
interface CounterState {
  value: number;
  status: "idle" | "loading" | "failed";
}

// 初始状态
const initialState: CounterState = {
  value: 0,
  status: "idle",
};
```

### 根 State 类型

```tsx
// store.ts
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
});

// 从 store 推断类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 问题 2：定义 Action 类型

### 使用 Redux Toolkit

```tsx
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
  value: number;
}

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 } as CounterState,
  reducers: {
    // PayloadAction 定义 payload 类型
    increment: (state) => {
      state.value += 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      state.value = action.payload.count;
    },
  },
});

export const { increment, incrementByAmount, setCount } = counterSlice.actions;
export default counterSlice.reducer;
```

---

## 问题 3：类型化 Hooks

### 创建类型化 Hooks

```tsx
// hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// 类型化的 useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 类型化的 useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 在组件中使用

```tsx
import { useAppDispatch, useAppSelector } from "./hooks";
import { increment, incrementByAmount } from "./counterSlice";

function Counter() {
  // 自动推断类型
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
```

---

## 问题 4：异步 Action 类型

### createAsyncThunk

```tsx
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// 定义返回类型和参数类型
export const fetchUser = createAsyncThunk<
  User, // 返回类型
  string, // 参数类型
  { rejectValue: string } // thunkAPI 配置
>("user/fetchUser", async (userId, { rejectWithValue }) => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (err) {
    return rejectWithValue("Failed to fetch user");
  }
});

// 在 slice 中处理
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload; // 类型是 User
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload; // 类型是 string
      });
  },
});
```

---

## 问题 5：Selector 类型

### 创建类型化 Selector

```tsx
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";

// 基础 selector
const selectCounter = (state: RootState) => state.counter;

// 派生 selector
export const selectDoubleCount = createSelector(
  [selectCounter],
  (counter) => counter.value * 2 // 自动推断返回类型
);

// 带参数的 selector
export const selectCountGreaterThan = createSelector(
  [selectCounter, (state: RootState, threshold: number) => threshold],
  (counter, threshold) => counter.value > threshold
);

// 使用
const doubleCount = useAppSelector(selectDoubleCount);
const isGreater = useAppSelector((state) => selectCountGreaterThan(state, 10));
```

## 总结

| 部分     | 类型定义方式            |
| -------- | ----------------------- |
| State    | interface 定义          |
| Action   | PayloadAction<T>        |
| Hooks    | 创建类型化版本          |
| Async    | createAsyncThunk 泛型   |
| Selector | createSelector 自动推断 |

## 延伸阅读

- [Redux Toolkit TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript)
