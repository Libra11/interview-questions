---
title: Webpack 如何压缩图片资源？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握在 Webpack 中压缩图片资源的方法，减少图片体积，提升页面加载速度。
tags:
  - Webpack
  - 图片压缩
  - 性能优化
  - image-minimizer
estimatedTime: 12 分钟
keywords:
  - 图片压缩
  - image-webpack-loader
  - image-minimizer
  - 资源优化
highlight: 使用 image-minimizer-webpack-plugin 或 image-webpack-loader 可以在构建时自动压缩图片，支持 PNG、JPEG、SVG 等格式。
order: 809
---

## 问题 1：使用 image-minimizer-webpack-plugin

```javascript
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              ["svgo", { plugins: [{ removeViewBox: false }] }],
            ],
          },
        },
      }),
    ],
  },
};
```

安装依赖：

```bash
npm install image-minimizer-webpack-plugin imagemin imagemin-gifsicle imagemin-jpegtran imagemin-optipng imagemin-svgo -D
```

---

## 问题 2：使用 image-webpack-loader

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: "file-loader",
          },
          {
            loader: "image-webpack-loader",
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75,
              },
            },
          },
        ],
      },
    ],
  },
};
```

---

## 问题 3：使用 squoosh（更快）

```javascript
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.squooshMinify,
          options: {
            encodeOptions: {
              mozjpeg: { quality: 75 },
              webp: { lossless: 1 },
              oxipng: { level: 3 },
            },
          },
        },
      }),
    ],
  },
};
```

squoosh 使用 WebAssembly，速度更快。

---

## 问题 4：生成 WebP 格式

```javascript
new ImageMinimizerPlugin({
  generator: [
    {
      preset: 'webp',
      implementation: ImageMinimizerPlugin.squooshGenerate,
      options: {
        encodeOptions: {
          webp: { quality: 75 },
        },
      },
    },
  ],
}),
```

在 HTML 中使用：

```html
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" />
</picture>
```

---

## 问题 5：只在生产环境压缩

```javascript
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          "file-loader",
          isProduction && {
            loader: "image-webpack-loader",
            options: {
              /* ... */
            },
          },
        ].filter(Boolean),
      },
    ],
  },
};
```

开发环境跳过压缩，加快构建速度。

## 延伸阅读

- [ImageMinimizerWebpackPlugin](https://webpack.js.org/plugins/image-minimizer-webpack-plugin/)
- [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)
