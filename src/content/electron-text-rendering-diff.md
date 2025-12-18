---
title: 文本渲染为什么不同？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 在不同平台上文本渲染差异的原因和解决方法。
tags:
  - Electron
  - 跨平台
  - 文本渲染
  - 字体
estimatedTime: 10 分钟
keywords:
  - 文本渲染
  - 字体差异
  - 跨平台字体
highlight: 不同平台使用不同的字体渲染引擎和默认字体，导致文本显示差异
order: 261
---

## 问题 1：为什么文本渲染不同？

### 渲染引擎差异

```
macOS：
├── Core Text 渲染引擎
├── 亚像素抗锯齿
├── 字体平滑较重
└── 文字看起来较粗

Windows：
├── DirectWrite 渲染引擎
├── ClearType 技术
├── 针对 LCD 优化
└── 文字看起来较细

Linux：
├── FreeType 渲染引擎
├── 配置灵活
├── 取决于发行版设置
└── 差异较大
```

---

## 问题 2：默认字体差异

### 系统默认字体

```css
/* 各平台默认无衬线字体 */
macOS: -apple-system, BlinkMacSystemFont
Windows: Segoe UI
Linux: Ubuntu, Cantarell, 或 DejaVu Sans

/* 各平台默认等宽字体 */
macOS: SF Mono, Menlo
Windows: Consolas, Courier New
Linux: Ubuntu Mono, DejaVu Sans Mono
```

### 统一字体栈

```css
body {
  font-family: -apple-system, /* macOS */ BlinkMacSystemFont, /* macOS Chrome */
      "Segoe UI", /* Windows */ "Ubuntu", /* Ubuntu */ "Roboto",
    /* Android/Chrome OS */ "Helvetica Neue", /* 旧 macOS */ sans-serif; /* 兜底 */
}

code {
  font-family: "SF Mono", "Consolas", "Ubuntu Mono", "Menlo", monospace;
}
```

---

## 问题 3：中文字体处理

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
    /* 中文字体 */ "PingFang SC", /* macOS */ "Microsoft YaHei",
    /* Windows */ "Noto Sans CJK SC", /* Linux */ "Source Han Sans SC",
    /* 思源黑体 */ sans-serif;
}
```

---

## 问题 4：使用自定义字体

### 打包字体文件

```css
@font-face {
  font-family: "MyFont";
  src: url("./fonts/MyFont.woff2") format("woff2"), url("./fonts/MyFont.woff")
      format("woff");
  font-weight: normal;
  font-style: normal;
}

body {
  font-family: "MyFont", sans-serif;
}
```

### 字体文件位置

```json
// electron-builder.json
{
  "files": ["dist/**/*", "fonts/**/*"]
}
```

---

## 问题 5：调整渲染效果

### CSS 调整

```css
body {
  /* 字体平滑 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* 文字渲染优化 */
  text-rendering: optimizeLegibility;

  /* 字体粗细调整 */
  font-weight: 400;
}

/* Windows 上加粗一点 */
@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
  body {
    font-weight: 500;
  }
}
```

### Electron 配置

```javascript
// 禁用硬件加速可能影响文字渲染
app.disableHardwareAcceleration();

// 或调整特定标志
app.commandLine.appendSwitch("disable-lcd-text");
```

## 延伸阅读

- [CSS font-family](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-family)
- [系统字体栈](https://css-tricks.com/snippets/css/system-font-stack/)
