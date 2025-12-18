---
id: url-encoding-differences
title: escape、encodeURI、encodeURIComponent 有何区别？
category: JavaScript
difficulty: 中级
updatedAt: 2025-02-15
summary: 拆解三种编码 API 的历史包袱、编码范围与推荐使用场景，理解 URL 编码在浏览器中的真实流转。
tags:
  - URL
  - 编码
  - JavaScript
  - 浏览器
  - Unicode
estimatedTime: 25 分钟
keywords:
  - escape
  - encodeURI
  - encodeURIComponent
  - URL 编码
  - Unicode
  - UTF-8
highlight: 分清历史遗留的 escape 与现代 UTF-8 编码 API 的适用场景，才能避免跨语言的 URL 解析 bug。
order: 355
---

## 问题一：为什么同时存在三种“编码”函数？

简单回顾时间线就懂了：

- **`escape()` = 老浏览器遗产。** 它在 90 年代诞生，只考虑 0x00~0xFF 的字符，对 emoji、扩展汉字毫无概念，会把它们拆坏，然后用 `%uXXXX` 的奇怪格式存起来。
- **`encodeURI` / `encodeURIComponent` = 后来补救的正规军。** ECMAScript 3 引入它们，统一使用 UTF-8，对所有 Unicode 字符都友好，也符合现代 URL 规范。
- 旧函数没被删除，只是为了让“远古脚本”还能跑。新代码继续用 `escape` 就等于主动背锅。

> 口诀：`escape` 活在 8 位时代，`encode*` 负责现代 UTF-8。

## 问题二：它们各自默认“放过”哪些字符？

| 函数 | 它以什么视角理解你输入的内容 | 不会被编码的字符 | 什么时候用 |
| ---- | -------------------------------- | ------------------ | ---------- |
| `escape()` | 普通文本（而且只懂老式字符集） | 字母数字 + `* + @ - _ .` | 只在维护遗留系统时勉强看到，最好别用 |
| `encodeURI()` | 你传的是“整条 URL” | URL 结构符号 `: / ? # & = @ + , ;` | 想把整条 URL 放进跳转/分享时，包一层避免中文乱码 |
| `encodeURIComponent()` | 你传的是 “URL 片段” | 仅字母数字 + `- _ . ~` | 加工 query 键值、动态路径、hash 片段 |

**核心差别**：`encodeURI` 会放过能改变 URL 结构的字符，因为它希望结构仍然可读；`encodeURIComponent` 会把这些字符都转义掉，保证交出去的是一块“纯内容”。

```js
const keyword = "a&b=1";
const query = `?q=${encodeURIComponent(keyword)}`; // ?q=a%26b%3D1

const rawUrl = "https://example.com/搜索?q=JS";
const safeUrl = encodeURI(rawUrl); // https://example.com/%E6%90%9C%E7%B4%A2?q=JS
```

上面第二行里，`encodeURI` 会保留 `?`，这样浏览器依旧知道从哪里开始解析查询串；而 `encodeURIComponent` 会把 `?` 也转义，所以绝不能用它包整条 URL。

## 问题三：常见坑点是什么？

### 1. `escape` 产生的东西没人能解

`escape("𠮷")` 会得到 `%uD842%uDFB7`，这不是合法 URL 格式，后端语言看到只会一脸懵。最后你得到的往往是“半编码半中文”的乱字符串，严重时甚至被当成潜在 XSS。

**建议**：遇到旧项目请尽快用 `encodeURIComponent` 替换，别指望 `decodeURI` 能救它。

### 2. `encodeURI` 无法保护 query 键值

```js
const unsafe = encodeURI("name=张三&note=1+1=2");
// 解析后 name、note 会被拆成两个参数，`+` 也会被当成空格
```

拼查询串时应该：

```js
const params = new URLSearchParams({
  name: "张三",
  note: "1+1=2",
});
// 内部就等价于对每个键值执行 encodeURIComponent
```

### 3. 双重编码 / 解码顺序错乱

- 先整体 `encodeURI`，再自己拼 `&param=`，就等于让恶意字符再次混进来。
- 解码时必须对称：整条 URL → `decodeURI`，组件 → `decodeURIComponent`。顺序乱了要么报错，要么把 `%25`（原本的 `%`）多解一次。

## 问题四：把三者串在一起的完整示例

> 目标：把“用户输入 + 动态路径 + 查询参数”安全地拼成一个 URL。

```ts
const baseUrl = "https://example.com";
const userId = "用户/张三"; // 含有 /
const keyword = "1+1=2 & JS"; // 含有 + 和 &

const path = `/profile/${encodeURIComponent(userId)}`;
const query = new URLSearchParams({
  tab: "notes",
  keyword, // URLSearchParams 内部会自动执行 encodeURIComponent
});

const fullUrl = `${encodeURI(baseUrl + path)}?${query.toString()}`;
```

逐步拆解：

1. **路径片段**用 `encodeURIComponent`，这样 `用户/张三` 不会把路径错分成两层。
2. **查询参数**交给 `URLSearchParams`（底层同样是 `encodeURIComponent`），`+`、`&`、空格都会被安全处理。
3. **最后再整体 `encodeURI`**，是为了确保整条 URL 在复制、跳转时不会因为中文路径而乱码，同时保留 `?`、`&` 这些结构符号。

输出：

```
https://example.com/profile/%E7%94%A8%E6%88%B7%252F%E5%BC%A0%E4%B8%89?tab=notes&keyword=1%2B1%3D2%20%26%20JS
```

可以看到路径里的 `/` 被编码为 `%252F`（第一次编码 `%2F`，再次套入 `encodeURI` 时 `%` 又被转义），但浏览器在解析时会按顺序还原，最终仍能得出正确的用户 ID。

## 问题五：工程上怎么“管住”它们？

1. **Lint 禁用 `escape/unescape`**，出现就直接报错。
2. **写一个 URL 构造工具**，内部统一调用 `encodeURIComponent` 处理参数和路径片段。
3. **跨端统一 UTF-8 规则**，别让后端突然用 GBK 编码 URL，结果前端 decode 完全对不上。
4. **遇到遗留 `%uXXXX`**，在进入主流程之前先转换成 UTF-8，再交给业务逻辑。
