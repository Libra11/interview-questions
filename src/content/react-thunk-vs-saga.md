---
title: Redux-thunk 与 Redux-saga 的区别？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  对比 Redux-thunk 和 Redux-saga 的差异，理解各自的适用场景。
tags:
  - React
  - Redux
  - Thunk
  - Saga
estimatedTime: 15 分钟
keywords:
  - Redux thunk
  - Redux saga
  - middleware
  - side effects
highlight: Thunk 简单直接用函数处理异步，Saga 用 Generator 处理复杂异步流程。
order: 548
---

## 问题 1：Redux-thunk 是什么？

### 基本概念

Thunk 让 action creator 可以返回**函数**而不是对象。

```jsx
// 普通 action creator
const addTodo = (text) => ({
  type: "ADD_TODO",
  payload: text,
});

// Thunk action creator
const fetchUser = (id) => async (dispatch, getState) => {
  dispatch({ type: "FETCH_START" });

  try {
    const user = await api.getUser(id);
    dispatch({ type: "FETCH_SUCCESS", payload: user });
  } catch (error) {
    dispatch({ type: "FETCH_ERROR", payload: error });
  }
};

// 使用
dispatch(fetchUser(1));
```

### 特点

- 简单直接
- 学习成本低
- 适合简单异步

---

## 问题 2：Redux-saga 是什么？

### 基本概念

Saga 使用 **Generator 函数**处理副作用。

```jsx
import { call, put, takeEvery } from "redux-saga/effects";

// Saga
function* fetchUserSaga(action) {
  try {
    yield put({ type: "FETCH_START" });
    const user = yield call(api.getUser, action.payload);
    yield put({ type: "FETCH_SUCCESS", payload: user });
  } catch (error) {
    yield put({ type: "FETCH_ERROR", payload: error });
  }
}

// Watcher
function* watchFetchUser() {
  yield takeEvery("FETCH_USER", fetchUserSaga);
}

// 使用
dispatch({ type: "FETCH_USER", payload: 1 });
```

### 特点

- 声明式副作用
- 强大的流程控制
- 易于测试

---

## 问题 3：两者有什么区别？

### 对比

| 特性     | Thunk       | Saga       |
| -------- | ----------- | ---------- |
| 语法     | async/await | Generator  |
| 学习成本 | 低          | 高         |
| 代码量   | 少          | 多         |
| 测试     | 需要 mock   | 声明式测试 |
| 复杂流程 | 困难        | 容易       |
| 取消请求 | 手动实现    | 内置支持   |

### 代码对比

```jsx
// Thunk：竞态条件处理困难
const fetchUser = (id) => async (dispatch) => {
  const user = await api.getUser(id);
  dispatch({ type: "SUCCESS", payload: user });
  // 如果快速切换 id，可能显示错误的用户
};

// Saga：轻松处理
function* fetchUserSaga(action) {
  const user = yield call(api.getUser, action.payload);
  yield put({ type: "SUCCESS", payload: user });
}

function* watchFetchUser() {
  // takeLatest 自动取消之前的请求
  yield takeLatest("FETCH_USER", fetchUserSaga);
}
```

---

## 问题 4：各自适合什么场景？

### Thunk 适合

```jsx
// 简单的异步操作
const login = (credentials) => async (dispatch) => {
  const user = await api.login(credentials);
  dispatch({ type: "LOGIN_SUCCESS", payload: user });
};

// 简单的条件 dispatch
const conditionalAction = () => (dispatch, getState) => {
  const { user } = getState();
  if (user.isAdmin) {
    dispatch({ type: "ADMIN_ACTION" });
  }
};
```

### Saga 适合

```jsx
// 复杂的异步流程
function* checkoutSaga() {
  // 1. 验证库存
  const stock = yield call(api.checkStock);
  if (!stock.available) {
    yield put({ type: "OUT_OF_STOCK" });
    return;
  }

  // 2. 处理支付
  const payment = yield call(api.processPayment);
  if (!payment.success) {
    yield put({ type: "PAYMENT_FAILED" });
    return;
  }

  // 3. 创建订单
  const order = yield call(api.createOrder);
  yield put({ type: "CHECKOUT_SUCCESS", payload: order });
}

// 并行请求
function* fetchDashboard() {
  const [users, products, orders] = yield all([
    call(api.getUsers),
    call(api.getProducts),
    call(api.getOrders),
  ]);
  yield put({ type: "DASHBOARD_LOADED", payload: { users, products, orders } });
}

// 轮询
function* pollData() {
  while (true) {
    const data = yield call(api.getData);
    yield put({ type: "DATA_UPDATED", payload: data });
    yield delay(5000);
  }
}
```

---

## 问题 5：测试对比？

### Thunk 测试

```jsx
// 需要 mock API
jest.mock("./api");

test("fetchUser", async () => {
  api.getUser.mockResolvedValue({ name: "John" });
  const dispatch = jest.fn();

  await fetchUser(1)(dispatch);

  expect(dispatch).toHaveBeenCalledWith({
    type: "FETCH_SUCCESS",
    payload: { name: "John" },
  });
});
```

### Saga 测试

```jsx
// 声明式测试，不需要 mock
test("fetchUserSaga", () => {
  const gen = fetchUserSaga({ payload: 1 });

  expect(gen.next().value).toEqual(put({ type: "FETCH_START" }));
  expect(gen.next().value).toEqual(call(api.getUser, 1));
  expect(gen.next({ name: "John" }).value).toEqual(
    put({ type: "FETCH_SUCCESS", payload: { name: "John" } })
  );
});
```

## 总结

| 选择  | 场景                           |
| ----- | ------------------------------ |
| Thunk | 简单异步、小项目、快速开发     |
| Saga  | 复杂流程、需要取消、并行、轮询 |

## 延伸阅读

- [Redux Thunk 文档](https://github.com/reduxjs/redux-thunk)
- [Redux Saga 文档](https://redux-saga.js.org/)
