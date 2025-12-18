---
title: 对比 pnpm、npm、yarn 的区别
category: 工程化
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  全面对比三大主流包管理器 pnpm、npm 和 yarn 的特性、性能、磁盘使用、依赖管理等方面的差异，帮助你选择最适合项目的包管理工具。
tags:
  - 包管理器
  - pnpm
  - npm
  - yarn
estimatedTime: 26 分钟
keywords:
  - 包管理器对比
  - pnpm vs npm
  - yarn vs npm
  - 依赖管理
highlight: pnpm 通过硬链接和符号链接实现了极致的磁盘空间节省和安装速度提升
order: 36
---

## 问题 1：三者的基本特点是什么？

### npm (Node Package Manager)

```bash
# Node.js 官方包管理器
# 随 Node.js 一起安装

npm install express
npm run dev
```

**特点**：
- Node.js 官方工具，兼容性最好
- 社区最大，文档最全
- 功能完善，持续更新
- npm 7+ 性能大幅提升

### yarn

```bash
# Facebook 开发的包管理器
# 需要单独安装

yarn add express
yarn dev
```

**特点**：
- 2016 年发布，解决 npm 早期问题
- 引入 yarn.lock 锁定版本
- 并行安装，速度快
- Yarn 2+ (Berry) 引入 PnP 模式

### pnpm (Performant npm)

```bash
# 高性能的包管理器
# 需要单独安装

pnpm add express
pnpm dev
```

**特点**：
- 2017 年发布，专注性能和磁盘效率
- 使用硬链接和符号链接
- 严格的依赖管理
- 天然支持 monorepo

---

## 问题 2：依赖安装方式有什么区别？

### npm/yarn 的 node_modules 结构

**扁平化结构（npm 3+）**：

```
node_modules/
├── express/
│   └── package.json
├── body-parser/      # express 的依赖被提升
│   └── package.json
├── cookie/           # express 的依赖被提升
│   └── package.json
└── my-app/
    └── package.json
```

**问题**：

```javascript
// 幽灵依赖（Phantom Dependencies）
// package.json 中没有声明 body-parser
// 但可以直接使用（因为被提升了）
import bodyParser from 'body-parser'; // 能正常工作

// 风险：
// 1. 依赖不明确
// 2. 可能突然不可用（如果 express 不再依赖它）
// 3. 版本冲突
```

### pnpm 的 node_modules 结构

**非扁平化结构**：

```
node_modules/
├── .pnpm/                    # 实际存储位置
│   ├── express@4.18.0/
│   │   └── node_modules/
│   │       ├── express/      # 硬链接到全局 store
│   │       ├── body-parser/  # express 的依赖
│   │       └── cookie/
│   └── body-parser@1.20.0/
│       └── node_modules/
│           └── body-parser/
└── express/                  # 符号链接到 .pnpm/express@4.18.0/node_modules/express
```

**优势**：

```javascript
// 只能访问声明的依赖
import express from 'express';     // ✅ 可以
import bodyParser from 'body-parser'; // ❌ 报错（未声明）

// 严格的依赖管理
// 1. 依赖明确
// 2. 避免幽灵依赖
// 3. 避免版本冲突
```

---

## 问题 3：磁盘空间使用有什么差异？

### npm/yarn 的存储方式

```bash
# 每个项目都有独立的 node_modules
project-a/
└── node_modules/
    └── lodash/  # 100MB

project-b/
└── node_modules/
    └── lodash/  # 100MB（重复）

project-c/
└── node_modules/
    └── lodash/  # 100MB（重复）

# 总计：300MB（大量重复）
```

### pnpm 的存储方式

```bash
# 全局 store + 硬链接
~/.pnpm-store/
└── v3/
    └── files/
        └── 00/
            └── lodash@4.17.21  # 100MB（只存一份）

project-a/
└── node_modules/
    └── .pnpm/
        └── lodash@4.17.21/
            └── node_modules/
                └── lodash/  # 硬链接到 store

project-b/
└── node_modules/
    └── .pnpm/
        └── lodash@4.17.21/
            └── node_modules/
                └── lodash/  # 硬链接到 store

# 总计：100MB（无重复）
```

**硬链接原理**：

```javascript
// 硬链接不是复制文件，而是指向同一个 inode
// 多个路径指向同一份数据

// 磁盘上只有一份文件
// 但可以通过多个路径访问

// 好处：
// 1. 节省磁盘空间
// 2. 安装速度快（不需要复制）
// 3. 修改一处，所有地方都生效
```

### 实际对比

```bash
# 安装 React 项目依赖

# npm
# 磁盘使用：300MB
# 安装时间：30s

# yarn
# 磁盘使用：280MB
# 安装时间：25s

# pnpm
# 磁盘使用：150MB  # 节省 50%
# 安装时间：15s    # 快 50%
```

---

## 问题 4：安装速度有什么差异？

### 安装流程对比

**npm**：

```javascript
// 1. 解析依赖
// 2. 下载包（串行）
// 3. 解压到 node_modules
// 4. 执行生命周期脚本

// 优化（npm 7+）
// - 并行下载
// - 缓存机制
```

**yarn**：

```javascript
// 1. 解析依赖（并行）
// 2. 下载包（并行）
// 3. 解压到缓存
// 4. 从缓存复制到 node_modules
// 5. 执行生命周期脚本

// 优势
// - 并行处理
// - 离线缓存
```

**pnpm**：

```javascript
// 1. 解析依赖
// 2. 检查 store（已有的跳过下载）
// 3. 下载缺失的包（并行）
// 4. 创建硬链接（非常快）
// 5. 执行生命周期脚本

// 优势
// - 全局 store 复用
// - 硬链接代替复制
// - 严格的依赖树
```

### 性能基准测试

```bash
# 场景 1：首次安装（无缓存）
npm:   45s
yarn:  35s
pnpm:  30s

# 场景 2：有缓存
npm:   25s
yarn:  15s
pnpm:  10s

# 场景 3：已安装过（其他项目）
npm:   25s
yarn:  15s
pnpm:  5s   # 直接使用 store

# 场景 4：Monorepo（10 个包）
npm:   120s
yarn:  80s
pnpm:  30s  # 共享依赖
```

---

## 问题 5：lock 文件有什么区别？

### package-lock.json (npm)

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.18.0",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "body-parser": "^1.20.0"
      }
    }
  }
}
```

**特点**：
- 记录完整的依赖树
- 包含 integrity 校验
- npm 5+ 自动生成

### yarn.lock (yarn)

```yaml
express@^4.18.0:
  version "4.18.0"
  resolved "https://registry.yarnpkg.com/express/-/express-4.18.0.tgz"
  integrity sha512-...
  dependencies:
    body-parser "^1.20.0"
    cookie "^0.5.0"
```

**特点**：
- 更简洁的格式
- 合并相同版本
- 易于阅读

### pnpm-lock.yaml (pnpm)

```yaml
lockfileVersion: '6.0'

dependencies:
  express:
    specifier: ^4.18.0
    version: 4.18.0

packages:
  /express@4.18.0:
    resolution: {integrity: sha512-...}
    dependencies:
      body-parser: 1.20.0
```

**特点**：
- YAML 格式
- 记录依赖关系图
- 支持 workspace

---

## 问题 6：Monorepo 支持对比

### npm workspaces

```json
// package.json
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/*"
  ]
}
```

```bash
# 安装所有 workspace 依赖
npm install

# 在特定 workspace 运行命令
npm run build --workspace=package-a

# 在所有 workspace 运行命令
npm run test --workspaces
```

### yarn workspaces

```json
// package.json
{
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

```bash
# 安装依赖
yarn install

# 在特定 workspace 运行命令
yarn workspace package-a build

# 在所有 workspace 运行命令
yarn workspaces run test
```

### pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```bash
# 安装依赖
pnpm install

# 在特定 workspace 运行命令
pnpm --filter package-a build

# 在所有 workspace 运行命令
pnpm -r test

# 只运行改变的 workspace
pnpm --filter="...[origin/main]" test
```

**pnpm 的优势**：

```bash
# 1. 更好的过滤能力
pnpm --filter "./packages/**" build

# 2. 依赖关系感知
pnpm --filter package-a... build  # 包括依赖它的包

# 3. 并行执行
pnpm -r --parallel test

# 4. 共享依赖
# 所有 workspace 共享 node_modules
# 大幅节省磁盘空间
```

---

## 问题 7：如何选择包管理器？

### 选择 npm

```bash
# 适用场景
# 1. 小型项目
# 2. 需要最大兼容性
# 3. 团队不想引入额外工具
# 4. CI/CD 环境简单

# 优势
# - 官方工具，无需安装
# - 文档最全
# - 兼容性最好
```

### 选择 yarn

```bash
# 适用场景
# 1. 需要稳定的 lock 文件
# 2. 团队已经在使用
# 3. 需要 Plug'n'Play 模式（Yarn 2+）

# 优势
# - 成熟稳定
# - 性能较好
# - 离线模式
```

### 选择 pnpm

```bash
# 适用场景
# 1. Monorepo 项目
# 2. 磁盘空间有限
# 3. 需要严格的依赖管理
# 4. 追求极致性能

# 优势
# - 最快的安装速度
# - 最少的磁盘占用
# - 最严格的依赖管理
# - 最好的 monorepo 支持
```

### 迁移建议

```bash
# npm → pnpm
# 1. 安装 pnpm
npm install -g pnpm

# 2. 导入 package-lock.json
pnpm import

# 3. 安装依赖
pnpm install

# 4. 更新 scripts（如果需要）
# npm run dev → pnpm dev

# yarn → pnpm
# 1. 安装 pnpm
yarn global add pnpm

# 2. 删除 node_modules 和 yarn.lock
rm -rf node_modules yarn.lock

# 3. 安装依赖
pnpm install
```

---

## 总结

**核心概念总结**：

### 1. 依赖管理

- **npm/yarn**：扁平化，可能有幽灵依赖
- **pnpm**：非扁平化，严格依赖

### 2. 磁盘使用

- **npm/yarn**：每个项目独立存储
- **pnpm**：全局 store + 硬链接

### 3. 性能

- **npm**：持续改进，npm 7+ 性能不错
- **yarn**：并行安装，速度快
- **pnpm**：最快，尤其是 monorepo

### 4. 推荐

- **新项目**：pnpm（性能和磁盘效率）
- **Monorepo**：pnpm（最佳支持）
- **兼容性优先**：npm（官方工具）
- **已有项目**：保持现状或评估迁移成本

## 延伸阅读

- [pnpm 官方文档](https://pnpm.io/)
- [npm 官方文档](https://docs.npmjs.com/)
- [Yarn 官方文档](https://yarnpkg.com/)
- [包管理器性能对比](https://pnpm.io/benchmarks)
- [pnpm 工作原理](https://pnpm.io/symlinked-node-modules-structure)
- [Monorepo 最佳实践](https://pnpm.io/workspaces)
