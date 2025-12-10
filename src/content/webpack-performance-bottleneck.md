---
title: 如何定位 Webpack 构建性能瓶颈？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握定位 Webpack 构建性能瓶颈的方法和工具，找出耗时最长的环节。
tags:
  - Webpack
  - 性能分析
  - 构建优化
  - 调试
estimatedTime: 12 分钟
keywords:
  - 性能瓶颈
  - 构建分析
  - speed-measure
  - 优化定位
highlight: 使用 speed-measure-webpack-plugin 分析各 loader 和 plugin 的耗时，结合 stats 输出定位性能瓶颈。
order: 707
---

## 问题 1：使用 speed-measure-webpack-plugin

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // 你的 webpack 配置
});
```

输出示例：

```
SMP  ⏱
General output time took 12.5 secs

SMP  ⏱  Plugins
HtmlWebpackPlugin took 0.5 secs
MiniCssExtractPlugin took 0.3 secs

SMP  ⏱  Loaders
babel-loader took 8.2 secs
  modules with babel-loader: 245
css-loader took 2.1 secs
ts-loader took 1.5 secs
```

---

## 问题 2：使用 --profile 参数

```bash
webpack --profile --json > stats.json
```

然后使用分析工具：

- [Webpack Analyse](https://webpack.github.io/analyse/)
- [Webpack Visualizer](https://chrisbateman.github.io/webpack-visualizer/)

---

## 问题 3：查看 stats 输出

```javascript
// webpack.config.js
module.exports = {
  stats: {
    timings: true, // 显示时间信息
    modules: true, // 显示模块信息
    reasons: true, // 显示模块被引入的原因
    performance: true, // 显示性能提示
  },
};
```

---

## 问题 4：常见瓶颈和解决方案

### Loader 处理慢

```
瓶颈：babel-loader 耗时 8 秒

解决方案：
1. 缩小处理范围（include/exclude）
2. 开启缓存（cacheDirectory）
3. 使用 thread-loader 并行处理
4. 使用更快的工具（esbuild-loader）
```

### 模块解析慢

```
瓶颈：大量模块解析耗时

解决方案：
1. 配置 resolve.extensions（减少尝试）
2. 配置 resolve.modules（指定目录）
3. 使用 noParse（跳过已知库）
```

### 压缩慢

```
瓶颈：TerserPlugin 耗时 5 秒

解决方案：
1. 开启 parallel（并行压缩）
2. 使用 esbuild 压缩
3. 减少压缩范围
```

---

## 问题 5：分析脚本

```javascript
// scripts/analyze-build.js
const webpack = require("webpack");
const config = require("../webpack.config");

const compiler = webpack(config);

compiler.run((err, stats) => {
  if (err) {
    console.error(err);
    return;
  }

  // 输出详细统计
  console.log(
    stats.toString({
      colors: true,
      modules: true,
      timings: true,
      performance: true,
    })
  );

  // 输出耗时最长的模块
  const info = stats.toJson();
  const sortedModules = info.modules
    .filter((m) => m.profile)
    .sort((a, b) => b.profile.building - a.profile.building)
    .slice(0, 10);

  console.log("\n耗时最长的模块：");
  sortedModules.forEach((m) => {
    console.log(`${m.profile.building}ms - ${m.name}`);
  });
});
```

---

## 问题 6：性能基准

```
参考基准（中型项目）：
- 首次构建：< 30 秒
- 增量构建：< 5 秒
- HMR 更新：< 1 秒

如果超出这些基准，需要优化
```

## 延伸阅读

- [speed-measure-webpack-plugin](https://github.com/stephencookdev/speed-measure-webpack-plugin)
- [Build Performance](https://webpack.js.org/guides/build-performance/)
