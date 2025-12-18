---
title: 如何减少 hydration cost？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握减少 Next.js 应用 hydration 开销的方法，优化交互时间和用户体验
tags:
  - Next.js
  - Hydration
  - 性能优化
  - React
estimatedTime: 20 分钟
keywords:
  - Hydration
  - 水合
  - 性能优化
  - TTI
highlight: 通过减少客户端 JavaScript、延迟 hydration 和优化组件可以显著降低 hydration 成本
order: 69
---

## 问题 1：什么是 Hydration Cost？

Hydration 是 React 将服务器渲染的 HTML 转换为可交互的过程，这个过程需要时间和资源。

### Hydration 过程

```javascript
// 1. 服务器渲染 HTML
<div id="root">
  <button>点击我</button>
</div>

// 2. 浏览器接收 HTML，立即显示（用户可见）

// 3. 下载 JavaScript bundle

// 4. Hydration：React 接管 DOM
// - 重新执行组件代码
// - 绑定事件处理器
// - 建立虚拟 DOM

// 5. 页面可交互
```

### Hydration Cost 的组成

```
Hydration Cost = JS 下载时间 + JS 解析时间 + JS 执行时间
```

**典型时间分布**：

```javascript
// 小型应用
JS 下载：100ms
JS 解析：50ms
JS 执行：100ms
总计：250ms

// 大型应用
JS 下载：500ms
JS 解析：200ms
JS 执行：500ms
总计：1200ms
```

---

## 问题 2：如何减少客户端 JavaScript？

减少 JavaScript 体积是降低 hydration cost 的最直接方法。

### 使用 Server Components

```javascript
// ❌ 全部使用 Client Components
'use client';

export default function Page() {
  return (
    <div>
      <Header />
      <Content />
      <Footer />
    </div>
  );
}

// 所有组件都需要 hydration
// JS bundle 大小：~200KB

// ✅ 只在需要交互的地方使用 Client Components
// app/page.tsx（Server Component）
export default function Page() {
  return (
    <div>
      <Header /> {/* Server Component */}
      <Content /> {/* Server Component */}
      <InteractiveWidget /> {/* Client Component */}
      <Footer /> {/* Server Component */}
    </div>
  );
}

// 只有 InteractiveWidget 需要 hydration
// JS bundle 大小：~50KB
```

### 动态导入

```javascript
// ❌ 静态导入所有组件
import HeavyChart from '@/components/HeavyChart';
import HeavyEditor from '@/components/HeavyEditor';

export default function Page() {
  return (
    <div>
      <HeavyChart />
      <HeavyEditor />
    </div>
  );
}

// 所有代码都在初始 bundle 中

// ✅ 动态导入非关键组件
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // 不在服务器渲染
});

const HeavyEditor = dynamic(() => import('@/components/HeavyEditor'), {
  loading: () => <EditorSkeleton />,
});

export default function Page() {
  return (
    <div>
      <HeavyChart />
      <HeavyEditor />
    </div>
  );
}

// 组件代码被分割到单独的 chunk
// 按需加载，减少初始 bundle
```

### 条件加载

```javascript
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// 只在需要时加载
const Modal = dynamic(() => import("@/components/Modal"));
const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"));

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>打开弹窗</button>

      {/* 只有在 showModal 为 true 时才加载 Modal */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}

      <button onClick={() => setShowVideo(true)}>播放视频</button>

      {/* 只有在 showVideo 为 true 时才加载 VideoPlayer */}
      {showVideo && <VideoPlayer />}
    </div>
  );
}
```

### 移除未使用的依赖

```javascript
// ❌ 导入整个库
import _ from 'lodash';
import moment from 'moment';

export default function Component() {
  const sorted = _.sortBy(data, 'name');
  const formatted = moment().format('YYYY-MM-DD');

  return <div>{/* ... */}</div>;
}

// ✅ 只导入需要的函数
import sortBy from 'lodash/sortBy';
import { format } from 'date-fns';

export default function Component() {
  const sorted = sortBy(data, 'name');
  const formatted = format(new Date(), 'yyyy-MM-dd');

  return <div>{/* ... */}</div>;
}

// 或者使用更轻量的替代品
// moment (68KB) → date-fns (13KB)
// lodash (71KB) → 原生 JS 方法
```

---

## 问题 3：如何延迟 Hydration？

不是所有内容都需要立即 hydration。

### 使用 Suspense 延迟非关键内容

```javascript
// app/page.tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      {/* 关键内容：立即 hydration */}
      <Header />
      <MainContent />

      {/* 非关键内容：延迟 hydration */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// Hydration 顺序：
// 1. Header 和 MainContent 先 hydration
// 2. Sidebar 和 Comments 后 hydration
// 用户可以更快地与主要内容交互
```

### 视口内 Hydration

```javascript
"use client";

import { useEffect, useRef, useState } from "react";

export function LazyHydrate({ children }) {
  const ref = useRef(null);
  const [shouldHydrate, setShouldHydrate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldHydrate(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // 提前 200px 开始 hydration
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {shouldHydrate ? (
        children
      ) : (
        <div dangerouslySetInnerHTML={{ __html: "" }} />
      )}
    </div>
  );
}

// 使用
export default function Page() {
  return (
    <div>
      <Header />

      {/* 只有滚动到视口内才 hydration */}
      <LazyHydrate>
        <HeavyComponent />
      </LazyHydrate>
    </div>
  );
}
```

### 交互时 Hydration

```javascript
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const HeavyInteractiveComponent = dynamic(
  () => import("@/components/HeavyInteractive"),
  { ssr: false }
);

export default function Page() {
  const [isActive, setIsActive] = useState(false);

  return (
    <div>
      {/* 点击前显示静态内容 */}
      {!isActive && (
        <div onClick={() => setIsActive(true)}>
          <StaticPreview />
          <button>激活交互功能</button>
        </div>
      )}

      {/* 点击后才加载和 hydration */}
      {isActive && <HeavyInteractiveComponent />}
    </div>
  );
}
```

---

## 问题 4：如何优化组件以减少 Hydration 时间？

组件的复杂度直接影响 hydration 时间。

### 减少组件嵌套

```javascript
// ❌ 过度嵌套
export default function Page() {
  return (
    <Container>
      <Wrapper>
        <Section>
          <Box>
            <Card>
              <Content>
                <Text>Hello</Text>
              </Content>
            </Card>
          </Box>
        </Section>
      </Wrapper>
    </Container>
  );
}

// React 需要遍历所有层级

// ✅ 扁平化结构
export default function Page() {
  return (
    <div className="container">
      <div className="card">
        <p>Hello</p>
      </div>
    </div>
  );
}

// 更少的组件，更快的 hydration
```

### 避免大型列表的 Hydration

```javascript
// ❌ 一次性 hydration 大量项目
'use client';

export default function LargeList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <ComplexItem data={item} />
        </li>
      ))}
    </ul>
  );
}

// 1000 个项目需要全部 hydration

// ✅ 虚拟滚动
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';

export default function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ComplexItem data={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 只 hydration 可见的项目
```

### 使用 memo 避免不必要的重新渲染

```javascript
// ❌ 每次都重新渲染
'use client';

export default function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <HeavyChild /> {/* 每次 count 变化都重新渲染 */}
    </div>
  );
}

// ✅ 使用 memo 优化
'use client';

import { memo } from 'react';

const HeavyChild = memo(function HeavyChild() {
  // 复杂的渲染逻辑
  return <div>{/* ... */}</div>;
});

export default function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <HeavyChild /> {/* count 变化时不重新渲染 */}
    </div>
  );
}
```

### 简化初始状态

```javascript
// ❌ 复杂的初始化
'use client';

export default function Component() {
  const [data, setData] = useState(() => {
    // 复杂的计算
    const processed = heavyComputation();
    return processed;
  });

  return <div>{/* ... */}</div>;
}

// Hydration 时需要重新执行 heavyComputation

// ✅ 延迟初始化
'use client';

export default function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Hydration 后再计算
    const processed = heavyComputation();
    setData(processed);
  }, []);

  return <div>{/* ... */}</div>;
}

// Hydration 更快，计算在后台进行
```

---

## 问题 5：如何监控和测量 Hydration Cost？

### 使用 React DevTools Profiler

```javascript
"use client";

import { Profiler } from "react";

export default function Page() {
  function onRenderCallback(
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  }

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <App />
    </Profiler>
  );
}
```

### 使用 Web Vitals

```javascript
// app/layout.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // TTI (Time to Interactive) 反映 hydration 完成时间
    if (metric.name === "FCP" || metric.name === "TTI") {
      console.log(metric.name, metric.value);

      // 发送到分析服务
      fetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify(metric),
      });
    }
  });

  return null;
}
```

### 使用 Next.js Analytics

```javascript
// next.config.js
module.exports = {
  // Vercel 自动收集性能指标
  experimental: {
    instrumentationHook: true,
  },
};

// 查看 Vercel Dashboard 中的：
// - Hydration Time
// - JavaScript Size
// - Time to Interactive
```

### 自定义测量

```javascript
"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    // 测量 hydration 时间
    const hydrationStart = performance.now();

    // Hydration 完成后
    requestIdleCallback(() => {
      const hydrationEnd = performance.now();
      const hydrationTime = hydrationEnd - hydrationStart;

      console.log(`Hydration took ${hydrationTime}ms`);

      // 发送到分析服务
      if (hydrationTime > 1000) {
        console.warn("Hydration is slow!");
      }
    });
  }, []);

  return <div>{/* ... */}</div>;
}
```

---

## 总结

**核心概念总结**：

### 1. 减少 JavaScript

- 优先使用 Server Components
- 动态导入非关键组件
- 条件加载交互功能
- 移除未使用的依赖

### 2. 延迟 Hydration

- 使用 Suspense 分优先级
- 视口内才 hydration
- 交互时才 hydration
- 关键内容优先

### 3. 优化组件

- 减少组件嵌套
- 虚拟滚动大型列表
- 使用 memo 避免重复渲染
- 简化初始状态

### 4. 监控和测量

- React DevTools Profiler
- Web Vitals（TTI、FCP）
- Next.js Analytics
- 自定义性能监控

## 延伸阅读

- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
