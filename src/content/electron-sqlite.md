---
title: 如何让前端访问本地 SQLite？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 应用中集成 SQLite 数据库的方法，通过 IPC 让渲染进程安全访问。
tags:
  - Electron
  - SQLite
  - 数据库
  - 本地存储
estimatedTime: 12 分钟
keywords:
  - SQLite
  - 本地数据库
  - better-sqlite3
highlight: SQLite 在主进程运行，渲染进程通过 IPC 调用数据库操作
order: 270
---

## 问题 1：选择 SQLite 库

### 常用库对比

```
better-sqlite3：
├── 同步 API，性能好
├── 需要编译原生模块
└── 推荐使用

sql.js：
├── 纯 JavaScript
├── 无需编译
├── 性能较低
└── 适合简单场景

sqlite3：
├── 异步 API
├── 需要编译
└── 回调风格
```

---

## 问题 2：安装和配置

### 安装 better-sqlite3

```bash
npm install better-sqlite3
npm install electron-rebuild -D

# 重新编译原生模块
npx electron-rebuild
```

### electron-builder 配置

```json
{
  "asarUnpack": ["**/better-sqlite3/**"]
}
```

---

## 问题 3：主进程数据库操作

```javascript
// database.js
const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "data.db");
const db = new Database(dbPath);

// 初始化表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = {
  getUsers: () => {
    return db.prepare("SELECT * FROM users").all();
  },

  getUser: (id) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  },

  createUser: (name, email) => {
    const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
    return stmt.run(name, email);
  },

  updateUser: (id, name, email) => {
    const stmt = db.prepare(
      "UPDATE users SET name = ?, email = ? WHERE id = ?"
    );
    return stmt.run(name, email, id);
  },

  deleteUser: (id) => {
    return db.prepare("DELETE FROM users WHERE id = ?").run(id);
  },
};
```

---

## 问题 4：IPC 暴露接口

```javascript
// main.js
const { ipcMain } = require("electron");
const db = require("./database");

ipcMain.handle("db:getUsers", () => {
  return db.getUsers();
});

ipcMain.handle("db:getUser", (event, id) => {
  return db.getUser(id);
});

ipcMain.handle("db:createUser", (event, name, email) => {
  return db.createUser(name, email);
});

ipcMain.handle("db:updateUser", (event, id, name, email) => {
  return db.updateUser(id, name, email);
});

ipcMain.handle("db:deleteUser", (event, id) => {
  return db.deleteUser(id);
});
```

```javascript
// preload.js
contextBridge.exposeInMainWorld("db", {
  getUsers: () => ipcRenderer.invoke("db:getUsers"),
  getUser: (id) => ipcRenderer.invoke("db:getUser", id),
  createUser: (name, email) => ipcRenderer.invoke("db:createUser", name, email),
  updateUser: (id, name, email) =>
    ipcRenderer.invoke("db:updateUser", id, name, email),
  deleteUser: (id) => ipcRenderer.invoke("db:deleteUser", id),
});
```

---

## 问题 5：渲染进程使用

```javascript
// renderer.js
async function loadUsers() {
  const users = await window.db.getUsers();
  renderUserList(users);
}

async function addUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  try {
    await window.db.createUser(name, email);
    loadUsers();
  } catch (error) {
    console.error("创建用户失败:", error);
  }
}

// React 示例
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    window.db.getUsers().then(setUsers);
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 延伸阅读

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [sql.js](https://github.com/sql-js/sql.js)
- [Electron 原生模块](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
