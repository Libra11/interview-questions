---
title: CSR 与 SSR 的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  对比客户端渲染（CSR）和服务端渲染（SSR）的区别，掌握各自的适用场景。
tags:
  - React
  - CSR
  - SSR
  - 渲染模式
estimatedTime: 12 分钟
keywords:
  - CSR vs SSR
  - client side rendering
  - server side rendering
  - rendering comparison
highlight: CSR 在浏览器渲染，首屏慢但交互流畅；SSR 在服务器渲染，首屏快但需要服务器资源。
order: 277
---

## 问题 1：渲染流程对比

### CSR（客户端渲染）

```
1. 浏览器请求页面
2. 服务器返回空 HTML + JS 链接
3. 浏览器下载 JS
4. 浏览器执行 JS
5. JS 请求数据
6. JS 渲染页面
7. 用户看到内容
```

### SSR（服务端渲染）

```
1. 浏览器请求页面
2. 服务器获取数据
3. 服务器渲染 HTML
4. 服务器返回完整 HTML
5. 用户看到内容（但不可交互）
6. 浏览器下载 JS
7. Hydration（水合）
8. 页面可交互
```

---

## 问题 2：代码对比

### CSR 代码

```jsx
// index.html
<div id="root"></div>
<script src="bundle.js"></script>

// App.jsx
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <Loading />;
  return <Content data={data} />;
}

// 客户端入口
createRoot(document.getElementById('root')).render(<App />);
```

### SSR 代码

```jsx
// 服务端
import { renderToString } from "react-dom/server";

app.get("/", async (req, res) => {
  const data = await fetchData();
  const html = renderToString(<App data={data} />);

  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <script>window.__DATA__ = ${JSON.stringify(data)}</script>
        <script src="bundle.js"></script>
      </body>
    </html>
  `);
});

// 客户端入口
const data = window.__DATA__;
hydrateRoot(document.getElementById("root"), <App data={data} />);
```

---

## 问题 3：性能对比

### 首屏时间

| 指标 | CSR            | SSR              |
| ---- | -------------- | ---------------- |
| TTFB | 快             | 慢（需要渲染）   |
| FCP  | 慢             | 快               |
| TTI  | 取决于 JS 大小 | 取决于 Hydration |

### 后续导航

```jsx
// CSR：后续导航快（SPA）
// 只需要获取数据，不需要重新加载页面

// SSR：后续导航可能慢
// 每次都需要服务器渲染（除非使用 Next.js 等框架的客户端导航）
```

---

## 问题 4：适用场景

### CSR 适合

```jsx
// 1. 后台管理系统
// - 不需要 SEO
// - 用户已登录
// - 交互频繁

// 2. 单页应用（SPA）
// - 类似桌面应用的体验
// - 频繁的页面切换

// 3. 实时应用
// - 聊天应用
// - 协作工具
```

### SSR 适合

```jsx
// 1. 内容网站
// - 博客、新闻
// - 需要 SEO

// 2. 电商网站
// - 产品页需要被搜索引擎索引
// - 首屏性能重要

// 3. 社交分享
// - 需要动态 meta 标签
```

---

## 问题 5：混合方案

### Next.js 的方案

```jsx
// 静态生成（SSG）
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 服务端渲染（SSR）
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 增量静态再生（ISR）
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60, // 60秒后重新生成
  };
}

// 客户端渲染
// 不使用 getStaticProps 或 getServerSideProps
```

### 选择策略

```jsx
// 页面类型 → 渲染方式
// 首页 → SSG/ISR
// 产品列表 → SSG + 客户端分页
// 产品详情 → SSG（常见）或 SSR（实时库存）
// 用户中心 → CSR
// 搜索结果 → SSR 或 CSR
```

## 总结

| 方面       | CSR | SSR            |
| ---------- | --- | -------------- |
| 首屏速度   | 慢  | 快             |
| SEO        | 差  | 好             |
| 服务器负载 | 低  | 高             |
| 开发复杂度 | 低  | 高             |
| 交互体验   | 好  | 需要 Hydration |

**建议**：根据页面特点选择合适的渲染方式，或使用混合方案。

## 延伸阅读

- [Next.js 渲染](https://nextjs.org/docs/pages/building-your-application/rendering)
- [React 服务端组件](https://react.dev/reference/react/use-server)
