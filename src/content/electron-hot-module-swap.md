---
title: 如何实现模块热插拔？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍在 Electron 应用中实现运行时模块热插拔的技术方案，
  包括动态加载、模块隔离和状态迁移。
tags:
  - Electron
  - 热插拔
  - 动态加载
  - 模块化
estimatedTime: 15 分钟
keywords:
  - electron 热插拔
  - 动态模块加载
  - 运行时更新
highlight: 掌握模块热插拔技术，实现应用的动态扩展和无缝更新。
order: 308
---

## 问题 1：什么是模块热插拔？

模块热插拔允许在应用运行时：

- **动态加载** - 按需加载新模块
- **动态卸载** - 移除不需要的模块
- **热更新** - 替换模块而不重启应用

---

## 问题 2：如何实现动态模块加载？

```javascript
class ModuleManager {
  constructor() {
    this.modules = new Map()
  }
  
  async load(modulePath) {
    // 清除缓存以支持重新加载
    delete require.cache[require.resolve(modulePath)]
    
    const module = require(modulePath)
    const instance = new module.default()
    
    // 初始化模块
    if (instance.init) {
      await instance.init()
    }
    
    this.modules.set(modulePath, {
      instance,
      loadTime: Date.now()
    })
    
    return instance
  }
  
  async unload(modulePath) {
    const moduleData = this.modules.get(modulePath)
    if (!moduleData) return
    
    // 调用清理方法
    if (moduleData.instance.destroy) {
      await moduleData.instance.destroy()
    }
    
    // 清除引用
    this.modules.delete(modulePath)
    delete require.cache[require.resolve(modulePath)]
  }
  
  async reload(modulePath) {
    const oldModule = this.modules.get(modulePath)
    const oldState = oldModule?.instance.getState?.()
    
    await this.unload(modulePath)
    const newInstance = await this.load(modulePath)
    
    // 迁移状态
    if (oldState && newInstance.setState) {
      newInstance.setState(oldState)
    }
    
    return newInstance
  }
}
```

---

## 问题 3：如何设计支持热插拔的模块？

```javascript
// modules/example.js
class ExampleModule {
  constructor() {
    this.state = {}
    this.listeners = []
  }
  
  async init() {
    console.log('模块初始化')
    this.setupEventListeners()
  }
  
  async destroy() {
    console.log('模块销毁')
    this.removeEventListeners()
    this.state = {}
  }
  
  getState() {
    return { ...this.state }
  }
  
  setState(state) {
    this.state = { ...state }
  }
  
  setupEventListeners() {
    // 保存引用以便清理
    this.handler = this.handleEvent.bind(this)
    eventBus.on('event', this.handler)
  }
  
  removeEventListeners() {
    eventBus.off('event', this.handler)
  }
}

module.exports = { default: ExampleModule }
```

---

## 问题 4：如何监控模块变化并自动重载？

```javascript
const chokidar = require('chokidar')

class HotModuleReloader {
  constructor(moduleManager, watchDir) {
    this.manager = moduleManager
    this.watchDir = watchDir
  }
  
  start() {
    this.watcher = chokidar.watch(this.watchDir, {
      ignored: /node_modules/,
      persistent: true
    })
    
    this.watcher.on('change', async (filePath) => {
      console.log('检测到模块变化:', filePath)
      
      if (this.manager.modules.has(filePath)) {
        try {
          await this.manager.reload(filePath)
          console.log('模块热重载成功:', filePath)
        } catch (error) {
          console.error('热重载失败:', error)
        }
      }
    })
  }
  
  stop() {
    this.watcher?.close()
  }
}
```

---

## 延伸阅读

- [Node.js 模块系统](https://nodejs.org/api/modules.html)
- [Webpack HMR 原理](https://webpack.js.org/concepts/hot-module-replacement/)
