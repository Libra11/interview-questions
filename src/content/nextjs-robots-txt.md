---
title: 如何实现 robots.txt？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  学习在 Next.js App Router 中生成 robots.txt 文件，控制搜索引擎爬虫的访问规则
tags:
  - Next.js
  - robots.txt
  - SEO
  - 爬虫控制
estimatedTime: 14 分钟
keywords:
  - robots.txt
  - 爬虫
  - SEO
  - 搜索引擎
highlight: robots.txt 告诉搜索引擎哪些页面可以爬取，哪些页面应该忽略
order: 166
---

## 问题 1：什么是 robots.txt？

robots.txt 是一个文本文件，用于指导搜索引擎爬虫如何访问网站。

### 基本格式

```txt
# 允许所有爬虫访问所有内容
User-agent: *
Allow: /

# 禁止所有爬虫访问
User-agent: *
Disallow: /

# 禁止访问特定目录
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# 站点地图位置
Sitemap: https://example.com/sitemap.xml
```

### robots.txt 的作用

```javascript
// 主要用途：
// 1. 防止爬虫访问敏感页面
// 2. 节省服务器资源（避免爬取无用页面）
// 3. 防止重复内容被索引
// 4. 指定 sitemap 位置

// 注意：
// - robots.txt 是建议性的，不是强制的
// - 恶意爬虫可能会忽略
// - 不要用于保护敏感信息（使用认证）
```

---

## 问题 2：静态 robots.txt

### 基本实现

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  };
}

// 生成的 robots.txt
User-agent: *
Allow: /
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
```

### 多个规则

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  };
}

// 生成的 robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
```

---

## 问题 3：针对不同爬虫的规则

### 区分爬虫

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google 爬虫
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/admin/',
      },
      // Bing 爬虫
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: '/admin/',
      },
      // 其他爬虫
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  };
}

// 生成的 robots.txt
User-agent: Googlebot
Allow: /
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /admin/

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

### 阻止特定爬虫

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 允许主要搜索引擎
      {
        userAgent: ["Googlebot", "Bingbot"],
        allow: "/",
      },
      // 阻止 AI 爬虫
      {
        userAgent: ["GPTBot", "ChatGPT-User"],
        disallow: "/",
      },
      // 阻止其他爬虫
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

---

## 问题 4：动态 robots.txt

### 基于环境

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

  // 生产环境：允许爬取
  if (process.env.NODE_ENV === "production") {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // 开发/测试环境：禁止爬取
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
```

### 基于配置

```typescript
// config/seo.ts
export const seoConfig = {
  allowedPaths: ["/"],
  disallowedPaths: ["/admin/", "/api/", "/private/", "/draft/"],
  allowedBots: ["Googlebot", "Bingbot"],
  blockedBots: ["GPTBot", "ChatGPT-User"],
};

// app/robots.ts
import { seoConfig } from "@/config/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 允许的爬虫
      {
        userAgent: seoConfig.allowedBots,
        allow: seoConfig.allowedPaths,
        disallow: seoConfig.disallowedPaths,
      },
      // 阻止的爬虫
      {
        userAgent: seoConfig.blockedBots,
        disallow: "/",
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

---

## 问题 5：常见配置场景

### 电商网站

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/", // 管理后台
        "/api/", // API 端点
        "/checkout/", // 结账页面
        "/cart/", // 购物车
        "/account/", // 用户账户
        "/search?*", // 搜索结果页
        "/*?sort=*", // 排序参数
        "/*?filter=*", // 筛选参数
      ],
      crawlDelay: 10, // 爬取延迟（秒）
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

### 博客网站

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/draft/", // 草稿
        "/preview/", // 预览
        "/wp-admin/", // WordPress 后台
        "/wp-includes/",
      ],
    },
    sitemap: [
      "https://example.com/sitemap.xml",
      "https://example.com/sitemap-posts.xml",
      "https://example.com/sitemap-pages.xml",
    ],
  };
}
```

### SaaS 应用

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 允许爬取公开页面
      {
        userAgent: "*",
        allow: ["/", "/pricing/", "/features/", "/blog/"],
        disallow: [
          "/app/", // 应用内页面
          "/dashboard/", // 仪表板
          "/settings/", // 设置
          "/api/", // API
          "/auth/", // 认证
        ],
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

---

## 问题 6：高级配置

### Crawl-delay

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google 不需要延迟
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: '/admin/',
      },
      // 其他爬虫添加延迟
      {
        userAgent: '*',
        allow: '/',
        disallow: '/admin/',
        crawlDelay: 10, // 每次请求间隔 10 秒
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  };
}

// 生成的 robots.txt
User-agent: Googlebot
Allow: /
Disallow: /admin/

User-agent: *
Allow: /
Disallow: /admin/
Crawl-delay: 10

Sitemap: https://example.com/sitemap.xml
```

### 通配符

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/*", // 所有 admin 下的路径
        "/*?page=*", // 所有带 page 参数的 URL
        "/*.pdf$", // 所有 PDF 文件
        "/temp-*", // 所有 temp- 开头的路径
      ],
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

### 多个 Sitemap

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: [
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap-posts.xml',
      'https://example.com/sitemap-products.xml',
      'https://example.com/sitemap-pages.xml',
    ],
  };
}

// 生成的 robots.txt
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-posts.xml
Sitemap: https://example.com/sitemap-products.xml
Sitemap: https://example.com/sitemap-pages.xml
```

---

## 问题 7：测试和验证

### 本地测试

```bash
# 访问 robots.txt
curl http://localhost:3000/robots.txt

# 或在浏览器中访问
http://localhost:3000/robots.txt
```

### Google 测试工具

```bash
# Google Search Console
1. 访问 https://search.google.com/search-console
2. 选择网站
3. 进入"设置" > "robots.txt 测试工具"
4. 输入 URL 测试是否被阻止

# 或使用 robots.txt Tester
https://support.google.com/webmasters/answer/6062598
```

### 验证语法

```typescript
// 常见错误检查
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // ❌ 错误：路径必须以 / 开头
      // disallow: 'admin',

      // ✅ 正确
      disallow: "/admin/",
    },
    // ❌ 错误：sitemap 必须是完整 URL
    // sitemap: '/sitemap.xml',

    // ✅ 正确
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

---

## 问题 8：最佳实践

### 安全考虑

```typescript
// ❌ 不要在 robots.txt 中暴露敏感路径
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/secret-admin-panel/", // 暴露了管理面板位置
        "/api/private-keys/", // 暴露了敏感 API
      ],
    },
  };
}

// ✅ 使用通用路径名
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin/", "/api/"],
    },
  };
}

// 真正的安全应该通过认证实现，而不是 robots.txt
```

### 性能优化

```typescript
// app/robots.ts
export const revalidate = 86400; // 24 小时缓存

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

### 监控和维护

```typescript
// 定期检查：
// 1. robots.txt 是否可访问
// 2. 规则是否正确
// 3. sitemap 链接是否有效
// 4. 是否有意外阻止的页面

// 在 Google Search Console 中查看：
// - 被 robots.txt 阻止的 URL
// - 爬取统计
// - 错误报告
```

---

## 总结

**核心概念总结**：

### 1. robots.txt 的作用

- 指导爬虫访问规则
- 节省服务器资源
- 防止重复内容索引
- 指定 sitemap 位置

### 2. 基本配置

- User-agent：指定爬虫
- Allow：允许访问的路径
- Disallow：禁止访问的路径
- Sitemap：站点地图位置

### 3. 高级功能

- 针对不同爬虫的规则
- Crawl-delay：爬取延迟
- 通配符：灵活匹配
- 多个 sitemap

### 4. 最佳实践

- 不要用于安全保护
- 定期测试和验证
- 合理设置缓存
- 监控爬取状态

## 延伸阅读

- [Next.js robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Robots.txt Specification](https://www.robotstxt.org/)
- [Google Robots.txt Guidelines](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Robots.txt Tester](https://support.google.com/webmasters/answer/6062598)
- [Common Crawlers User Agents](https://www.useragents.me/)
