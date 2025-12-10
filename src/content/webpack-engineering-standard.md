---
title: 如何为大型前端项目做 Webpack 工程化规范？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  掌握大型前端项目的 Webpack 工程化规范，包括配置管理、代码规范和构建流程。
tags:
  - Webpack
  - 工程化
  - 规范
  - 大型项目
estimatedTime: 18 分钟
keywords:
  - 工程化规范
  - 配置管理
  - 构建流程
  - 最佳实践
highlight: 大型项目需要规范的配置管理、统一的构建流程、完善的代码检查和清晰的目录结构。
order: 690
---

## 问题 1：目录结构规范

```
project/
├── build/                    # 构建配置
│   ├── webpack.base.js       # 基础配置
│   ├── webpack.dev.js        # 开发配置
│   ├── webpack.prod.js       # 生产配置
│   └── utils.js              # 工具函数
├── config/                   # 项目配置
│   ├── env.js                # 环境变量
│   └── paths.js              # 路径配置
├── scripts/                  # 脚本
│   ├── build.js
│   └── start.js
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── index.js
├── public/
├── .eslintrc.js
├── .prettierrc
├── babel.config.js
└── package.json
```

---

## 问题 2：配置分离

```javascript
// build/webpack.base.js
module.exports = {
  entry: paths.appEntry,
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: { "@": paths.appSrc },
  },
  module: {
    rules: [
      /* 公共 loader */
    ],
  },
};

// build/webpack.dev.js
const { merge } = require("webpack-merge");
const base = require("./webpack.base");

module.exports = merge(base, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  devServer: {
    /* ... */
  },
});

// build/webpack.prod.js
module.exports = merge(base, {
  mode: "production",
  optimization: {
    /* ... */
  },
});
```

---

## 问题 3：环境变量管理

```javascript
// config/env.js
const dotenv = require("dotenv");

const envFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  ".env.local",
  ".env",
];

envFiles.forEach((file) => {
  dotenv.config({ path: file });
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  // ...
};
```

```javascript
// .env.development
API_URL=http://localhost:3000

// .env.production
API_URL=https://api.example.com
```

---

## 问题 4：代码检查集成

```javascript
// webpack.config.js
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = {
  plugins: [
    new ESLintPlugin({
      extensions: ["js", "jsx", "ts", "tsx"],
      failOnError: process.env.NODE_ENV === "production",
    }),
  ],
};
```

配合 Git Hooks：

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

## 问题 5：构建脚本规范

```javascript
// scripts/build.js
process.env.NODE_ENV = "production";

const webpack = require("webpack");
const config = require("../build/webpack.prod");
const { measureFileSizes } = require("./utils");

async function build() {
  console.log("Creating production build...");

  const previousSizes = await measureFileSizes("dist");

  const compiler = webpack(config);

  compiler.run((err, stats) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(stats.toString({ colors: true }));
    // 输出体积变化
    printFileSizes(stats, previousSizes);
  });
}

build();
```

---

## 问题 6：npm scripts 规范

```json
{
  "scripts": {
    "start": "node scripts/start.js",
    "build": "node scripts/build.js",
    "build:analyze": "ANALYZE=true npm run build",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint src --ext .js,.jsx,.ts,.tsx --fix",
    "test": "jest",
    "type-check": "tsc --noEmit"
  }
}
```

## 延伸阅读

- [webpack-merge](https://github.com/survivejs/webpack-merge)
- [Create React App 源码](https://github.com/facebook/create-react-app)
