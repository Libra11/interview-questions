---
title: 如何使用原生剪贴板（clipboard）？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  深入讲解 Electron 中 clipboard 模块的使用，包括读写文本、HTML、图片、RTF 等多种格式，
  以及如何在主进程和渲染进程中安全地操作剪贴板。
tags:
  - Electron
  - Clipboard
  - 剪贴板
  - 系统 API
estimatedTime: 15 分钟
keywords:
  - electron clipboard
  - 剪贴板操作
  - 复制粘贴
highlight: 掌握 Electron clipboard 模块的完整用法，实现跨平台的剪贴板读写功能。
order: 80
---

## 问题 1：Electron 中如何访问系统剪贴板？

Electron 提供了 `clipboard` 模块来访问系统剪贴板。这个模块可以在主进程和渲染进程中使用，但在启用了 `contextIsolation` 的情况下，渲染进程需要通过 preload 脚本来访问。

```javascript
// 主进程中直接使用
const { clipboard } = require('electron')

// 读取剪贴板文本
const text = clipboard.readText()

// 写入剪贴板文本
clipboard.writeText('Hello World')
```

在 preload 脚本中暴露给渲染进程：

```javascript
// preload.js
const { contextBridge, clipboard } = require('electron')

contextBridge.exposeInMainWorld('clipboard', {
  readText: () => clipboard.readText(),
  writeText: (text) => clipboard.writeText(text),
  readHTML: () => clipboard.readHTML(),
  writeHTML: (html) => clipboard.writeHTML(html)
})
```

---

## 问题 2：clipboard 支持哪些数据格式？

clipboard 模块支持多种数据格式，可以满足不同场景的需求：

```javascript
const { clipboard } = require('electron')

// 1. 纯文本
clipboard.writeText('纯文本内容')
const text = clipboard.readText()

// 2. HTML 格式
clipboard.writeHTML('<strong>加粗文本</strong>')
const html = clipboard.readHTML()

// 3. RTF 富文本格式
clipboard.writeRTF('{\\rtf1\\ansi{\\fonttbl\\f0\\fswiss Helvetica;}\\f0 Rich Text}')
const rtf = clipboard.readRTF()

// 4. 图片（NativeImage）
const { nativeImage } = require('electron')
const image = nativeImage.createFromPath('/path/to/image.png')
clipboard.writeImage(image)
const clipImage = clipboard.readImage()

// 5. 书签（macOS/Windows）
clipboard.writeBookmark('Electron', 'https://electronjs.org')
const bookmark = clipboard.readBookmark()

// 6. 查找文本（macOS 专用）
clipboard.writeFindText('搜索关键词')
const findText = clipboard.readFindText()
```

---

## 问题 3：如何一次写入多种格式的数据？

有时需要同时写入多种格式的数据，比如复制富文本时同时提供 HTML 和纯文本格式，让不同的应用程序可以选择合适的格式粘贴：

```javascript
const { clipboard } = require('electron')

// 使用 write 方法同时写入多种格式
clipboard.write({
  text: '纯文本内容',
  html: '<b>HTML 格式内容</b>',
  rtf: '{\\rtf1\\ansi Rich Text Format}'
})

// 读取时可以分别获取不同格式
console.log(clipboard.readText())  // 纯文本内容
console.log(clipboard.readHTML())  // <b>HTML 格式内容</b>
```

还可以同时写入图片和文本：

```javascript
const { clipboard, nativeImage } = require('electron')

const image = nativeImage.createFromPath('/path/to/chart.png')

clipboard.write({
  text: '图表数据的描述文字',
  image: image
})
```

---

## 问题 4：如何检查剪贴板中的数据类型？

在读取剪贴板之前，可能需要先检查其中包含的数据类型：

```javascript
const { clipboard } = require('electron')

// 获取剪贴板中可用的格式列表
const formats = clipboard.availableFormats()
console.log(formats)
// 可能输出: ['text/plain', 'text/html', 'image/png']

// 判断是否包含特定格式
const hasText = formats.includes('text/plain')
const hasHTML = formats.includes('text/html')
const hasImage = formats.some(f => f.startsWith('image/'))

// 根据格式决定读取方式
if (hasImage) {
  const image = clipboard.readImage()
  // 处理图片
} else if (hasHTML) {
  const html = clipboard.readHTML()
  // 处理 HTML
} else if (hasText) {
  const text = clipboard.readText()
  // 处理文本
}
```

---

## 问题 5：如何处理剪贴板中的图片？

处理剪贴板图片需要使用 `NativeImage` 对象：

```javascript
const { clipboard, nativeImage } = require('electron')

// 读取剪贴板图片
const image = clipboard.readImage()

if (!image.isEmpty()) {
  // 获取图片尺寸
  const size = image.getSize()
  console.log(`图片尺寸: ${size.width} x ${size.height}`)
  
  // 转换为不同格式
  const pngBuffer = image.toPNG()
  const jpegBuffer = image.toJPEG(80) // 80% 质量
  const dataUrl = image.toDataURL()
  
  // 保存到文件
  const fs = require('fs')
  fs.writeFileSync('/path/to/output.png', pngBuffer)
}

// 从文件写入剪贴板
const imageFromFile = nativeImage.createFromPath('/path/to/image.png')
clipboard.writeImage(imageFromFile)

// 从 Base64 写入剪贴板
const imageFromBase64 = nativeImage.createFromDataURL('data:image/png;base64,...')
clipboard.writeImage(imageFromBase64)
```

---

## 问题 6：如何清空剪贴板？

```javascript
const { clipboard } = require('electron')

// 清空剪贴板内容
clipboard.clear()

// 验证是否已清空
const formats = clipboard.availableFormats()
console.log(formats.length === 0) // true
```

---

## 问题 7：实际应用中如何封装剪贴板操作？

建议将剪贴板操作封装成一个统一的服务，便于管理和使用：

```javascript
// clipboardService.js
const { clipboard, nativeImage } = require('electron')

class ClipboardService {
  // 复制文本
  copyText(text) {
    clipboard.writeText(text)
  }
  
  // 粘贴文本
  pasteText() {
    return clipboard.readText()
  }
  
  // 复制带格式的内容
  copyRichContent(options) {
    const data = {}
    if (options.text) data.text = options.text
    if (options.html) data.html = options.html
    if (options.imagePath) {
      data.image = nativeImage.createFromPath(options.imagePath)
    }
    clipboard.write(data)
  }
  
  // 获取剪贴板类型
  getContentType() {
    const formats = clipboard.availableFormats()
    if (formats.some(f => f.startsWith('image/'))) return 'image'
    if (formats.includes('text/html')) return 'html'
    if (formats.includes('text/plain')) return 'text'
    return 'unknown'
  }
  
  // 监控剪贴板变化（需要轮询）
  startWatching(callback, interval = 500) {
    let lastContent = clipboard.readText()
    
    this.watchInterval = setInterval(() => {
      const currentContent = clipboard.readText()
      if (currentContent !== lastContent) {
        lastContent = currentContent
        callback(currentContent)
      }
    }, interval)
  }
  
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval)
    }
  }
}

module.exports = new ClipboardService()
```

---

## 延伸阅读

- [Electron Clipboard 官方文档](https://www.electronjs.org/docs/latest/api/clipboard)
- [Electron NativeImage 文档](https://www.electronjs.org/docs/latest/api/native-image)
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
