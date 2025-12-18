---
title: 如何在 Electron 中使用 serialport？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 应用中使用 serialport 库进行串口通信的方法。
tags:
  - Electron
  - 串口通信
  - serialport
  - 硬件
estimatedTime: 12 分钟
keywords:
  - serialport
  - 串口
  - 硬件通信
highlight: serialport 是原生模块，需要正确编译并在主进程中使用
order: 272
---

## 问题 1：安装和编译

### 安装

```bash
npm install serialport
npm install electron-rebuild -D

# 重新编译原生模块
npx electron-rebuild
```

### 或使用 @electron/rebuild

```bash
npm install @electron/rebuild -D
npx electron-rebuild
```

---

## 问题 2：主进程中使用

```javascript
// main.js
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// 列出可用端口
async function listPorts() {
  const ports = await SerialPort.list();
  return ports;
}

// 打开串口
let port;

function openPort(path, baudRate = 9600) {
  port = new SerialPort({
    path,
    baudRate,
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", (data) => {
    console.log("收到数据:", data);
    // 发送到渲染进程
    mainWindow.webContents.send("serial:data", data);
  });

  port.on("error", (err) => {
    console.error("串口错误:", err);
  });
}

function writePort(data) {
  if (port && port.isOpen) {
    port.write(data);
  }
}

function closePort() {
  if (port && port.isOpen) {
    port.close();
  }
}
```

---

## 问题 3：IPC 接口

```javascript
// main.js
const { ipcMain } = require("electron");

ipcMain.handle("serial:list", async () => {
  return await SerialPort.list();
});

ipcMain.handle("serial:open", (event, path, baudRate) => {
  openPort(path, baudRate);
  return true;
});

ipcMain.handle("serial:write", (event, data) => {
  writePort(data);
});

ipcMain.handle("serial:close", () => {
  closePort();
});
```

```javascript
// preload.js
contextBridge.exposeInMainWorld("serial", {
  list: () => ipcRenderer.invoke("serial:list"),
  open: (path, baudRate) => ipcRenderer.invoke("serial:open", path, baudRate),
  write: (data) => ipcRenderer.invoke("serial:write", data),
  close: () => ipcRenderer.invoke("serial:close"),
  onData: (callback) => {
    ipcRenderer.on("serial:data", (event, data) => callback(data));
  },
});
```

---

## 问题 4：渲染进程使用

```javascript
// renderer.js
async function init() {
  // 列出端口
  const ports = await window.serial.list();
  console.log("可用端口:", ports);

  // 打开端口
  await window.serial.open("/dev/ttyUSB0", 9600);

  // 监听数据
  window.serial.onData((data) => {
    console.log("收到:", data);
  });

  // 发送数据
  await window.serial.write("Hello\n");
}

// React 组件
function SerialMonitor() {
  const [ports, setPorts] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    window.serial.list().then(setPorts);

    window.serial.onData((data) => {
      setMessages((prev) => [...prev, data]);
    });
  }, []);

  return (
    <div>
      <select>
        {ports.map((p) => (
          <option key={p.path}>{p.path}</option>
        ))}
      </select>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 问题 5：打包配置

```json
// electron-builder.json
{
  "asarUnpack": ["**/serialport/**", "**/@serialport/**", "**/*.node"]
}
```

### Linux 权限

```bash
# 添加用户到 dialout 组
sudo usermod -a -G dialout $USER

# 或设置 udev 规则
# /etc/udev/rules.d/99-serial.rules
SUBSYSTEM=="tty", MODE="0666"
```

### 常见问题

```javascript
// 错误：Cannot find module 'serialport'
// 解决：重新编译原生模块
// npx electron-rebuild

// 错误：Permission denied
// 解决：Linux 需要 dialout 权限
// macOS 需要授权访问
```

## 延伸阅读

- [serialport 文档](https://serialport.io/)
- [electron-rebuild](https://github.com/electron/rebuild)
