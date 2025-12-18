---
title: 介绍一下 CSS 变量怎么声明和使用
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS 自定义属性(CSS 变量)的声明和使用方法,包括作用域、继承、动态修改、以及在实际项目中的应用场景。
tags:
  - CSS
  - CSS变量
  - 自定义属性
  - 主题切换
estimatedTime: 20 分钟
keywords:
  - CSS变量
  - 自定义属性
  - var()
  - CSS Variables
highlight: 掌握 CSS 变量,实现灵活的样式管理和主题切换
order: 93
---

## 问题 1：CSS 变量的基本语法

### 声明变量

使用 `--` 前缀声明变量:

```css
:root {
  --primary-color: #3498db;
  --font-size: 16px;
  --spacing: 8px;
}
```

### 使用变量

使用 `var()` 函数读取变量:

```css
.button {
  background-color: var(--primary-color);
  font-size: var(--font-size);
  padding: var(--spacing);
}
```

### 完整示例

```css
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --text-color: #333;
  --border-radius: 4px;
}

.card {
  color: var(--text-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius);
}

.button {
  background: var(--primary-color);
  color: white;
  border-radius: var(--border-radius);
}
```

---

## 问题 2：CSS 变量的作用域和继承

### 全局变量

在 `:root` 中声明,全局可用:

```css
:root {
  --global-color: red;
}

.anywhere {
  color: var(--global-color); /* 任何地方都可以使用 */
}
```

### 局部变量

在特定选择器中声明,只在该作用域内有效:

```css
.container {
  --local-color: blue;
}

.container .child {
  color: var(--local-color); /* ✅ 可以使用 */
}

.outside {
  color: var(--local-color); /* ❌ 无法使用,未定义 */
}
```

### 变量继承

CSS 变量会继承给子元素:

```css
.parent {
  --text-color: red;
}

.child {
  color: var(--text-color); /* 继承父元素的变量 */
}
```

```html
<div class="parent">
  <div class="child">文字是红色</div>
</div>
```

### 变量覆盖

子元素可以覆盖父元素的变量:

```css
:root {
  --color: red;
}

.parent {
  --color: blue; /* 覆盖全局变量 */
}

.child {
  --color: green; /* 覆盖父元素变量 */
  color: var(--color); /* green */
}
```

---

## 问题 3：CSS 变量的高级用法

### 1. 默认值

使用 `var()` 的第二个参数设置默认值:

```css
.element {
  /* 如果 --color 未定义,使用 red */
  color: var(--color, red);

  /* 默认值也可以是另一个变量 */
  color: var(--primary-color, var(--fallback-color, black));
}
```

### 2. 计算

CSS 变量可以与 `calc()` 结合:

```css
:root {
  --base-size: 16px;
  --multiplier: 2;
}

.element {
  font-size: calc(var(--base-size) * var(--multiplier)); /* 32px */
  padding: calc(var(--base-size) / 2); /* 8px */
}
```

### 3. 组合使用

```css
:root {
  --color-h: 200;
  --color-s: 50%;
  --color-l: 50%;
}

.element {
  background: hsl(var(--color-h), var(--color-s), var(--color-l));
}

.element:hover {
  /* 只修改亮度 */
  --color-l: 60%;
}
```

### 4. 无效值处理

```css
:root {
  --invalid: 20deg; /* 无效的颜色值 */
}

.element {
  color: var(--invalid); /* 使用初始值(通常是 black) */
  color: var(--invalid, red); /* 使用默认值 red */
}
```

---

## 问题 4：JavaScript 操作 CSS 变量

### 读取变量

```javascript
// 获取根元素
const root = document.documentElement;

// 读取变量值
const primaryColor = getComputedStyle(root).getPropertyValue("--primary-color");

console.log(primaryColor); // '#3498db'

// 读取特定元素的变量
const element = document.querySelector(".card");
const localColor = getComputedStyle(element).getPropertyValue("--local-color");
```

### 设置变量

```javascript
// 设置全局变量
document.documentElement.style.setProperty("--primary-color", "#e74c3c");

// 设置局部变量
const element = document.querySelector(".card");
element.style.setProperty("--local-color", "blue");
```

### 删除变量

```javascript
// 删除变量
document.documentElement.style.removeProperty("--primary-color");
```

### 实际应用:主题切换

```javascript
// 主题配置
const themes = {
  light: {
    "--bg-color": "#ffffff",
    "--text-color": "#333333",
    "--primary-color": "#3498db",
  },
  dark: {
    "--bg-color": "#1a1a1a",
    "--text-color": "#ffffff",
    "--primary-color": "#2980b9",
  },
};

// 切换主题
function setTheme(themeName) {
  const theme = themes[themeName];
  const root = document.documentElement;

  Object.keys(theme).forEach((key) => {
    root.style.setProperty(key, theme[key]);
  });

  // 保存到 localStorage
  localStorage.setItem("theme", themeName);
}

// 使用
setTheme("dark");
```

---

## 问题 5：CSS 变量的实际应用场景

### 场景 1: 主题切换

```css
/* 定义主题变量 */
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --primary-color: #3498db;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  --primary-color: #2980b9;
}

/* 使用变量 */
body {
  background: var(--bg-color);
  color: var(--text-color);
}

.button {
  background: var(--primary-color);
}
```

```javascript
// 切换主题
document.documentElement.setAttribute("data-theme", "dark");
```

### 场景 2: 响应式设计

```css
:root {
  --container-width: 1200px;
  --spacing: 16px;
}

@media (max-width: 768px) {
  :root {
    --container-width: 100%;
    --spacing: 8px;
  }
}

.container {
  max-width: var(--container-width);
  padding: var(--spacing);
}
```

### 场景 3: 组件变体

```css
.button {
  --btn-bg: var(--primary-color);
  --btn-color: white;

  background: var(--btn-bg);
  color: var(--btn-color);
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
}

.button--secondary {
  --btn-bg: var(--secondary-color);
}

.button--outline {
  --btn-bg: transparent;
  --btn-color: var(--primary-color);
  border: 1px solid var(--primary-color);
}
```

### 场景 4: 动画和过渡

```css
:root {
  --rotation: 0deg;
}

.spinner {
  transform: rotate(var(--rotation));
  transition: transform 0.3s;
}

.spinner:hover {
  --rotation: 360deg;
}
```

```javascript
// 动态动画
let rotation = 0;
setInterval(() => {
  rotation += 10;
  document.documentElement.style.setProperty("--rotation", `${rotation}deg`);
}, 100);
```

### 场景 5: 设计系统

```css
:root {
  /* 颜色系统 */
  --color-primary-50: #e3f2fd;
  --color-primary-100: #bbdefb;
  --color-primary-500: #2196f3;
  --color-primary-900: #0d47a1;

  /* 间距系统 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 字体系统 */
  --font-size-sm: 12px;
  --font-size-base: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;

  /* 阴影系统 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* 使用 */
.card {
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  box-shadow: var(--shadow-md);
}
```

## 总结

**核心概念**:

### 1. 声明和使用

- 声明: `--variable-name: value`
- 使用: `var(--variable-name)`
- 默认值: `var(--variable-name, fallback)`

### 2. 作用域

- 全局变量: 在 `:root` 中声明
- 局部变量: 在选择器中声明
- 变量会继承给子元素

### 3. JavaScript 操作

- 读取: `getComputedStyle().getPropertyValue()`
- 设置: `style.setProperty()`
- 删除: `style.removeProperty()`

### 4. 应用场景

- 主题切换
- 响应式设计
- 组件变体
- 设计系统

## 延伸阅读

- [MDN - CSS 自定义属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN - var()](https://developer.mozilla.org/zh-CN/docs/Web/CSS/var)
- [CSS Tricks - A Complete Guide to Custom Properties](https://css-tricks.com/a-complete-guide-to-custom-properties/)
- [W3C - CSS Custom Properties](https://www.w3.org/TR/css-variables-1/)
