---
title: Webpack 多个 loader 对同一个资源进行处理，他们之间如何通信
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack loader 的执行顺序和通信机制。多个 loader 通过管道模式串联，
  通过 this 上下文和返回值进行数据传递。
tags:
  - Webpack
  - Loader
  - 构建工具
  - 通信机制
estimatedTime: 22 分钟
keywords:
  - Webpack loader
  - loader 通信
  - loader 执行顺序
  - this 上下文
highlight: Loader 通过管道模式串联，从右到左执行，通过返回值传递数据
order: 215
---

## 问题 1：Loader 的执行顺序是什么？

**Loader 从右到左（从下到上）执行，形成管道**。

### 执行顺序

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  }
};

// 执行顺序：
// 1. postcss-loader（最右边，最先执行）
// 2. css-loader
// 3. style-loader（最左边，最后执行）

// 数据流：
// 源文件 -> postcss-loader -> css-loader -> style-loader -> 输出
```

### 管道模式

```javascript
// 类似 Unix 管道
// cat file.css | postcss | css-loader | style-loader

// 每个 loader 处理上一个 loader 的输出
const result1 = postcssLoader(source);
const result2 = cssLoader(result1);
const result3 = styleLoader(result2);
```

---

## 问题 2：Loader 如何通过返回值通信？

**Loader 返回处理后的内容，传递给下一个 loader**。

### 基本返回值

```javascript
// simple-loader.js
module.exports = function(source) {
  // source: 上一个 loader 的输出或源文件内容
  
  // 处理内容
  const result = source.replace(/foo/g, 'bar');
  
  // 返回处理后的内容
  return result;
};
```

### 返回多个值

```javascript
// loader-with-sourcemap.js
module.exports = function(source) {
  const result = transform(source);
  const sourceMap = generateSourceMap(source, result);
  
  // 返回内容和 source map
  this.callback(null, result, sourceMap);
  
  // callback 参数：
  // 1. error: 错误信息
  // 2. content: 处理后的内容
  // 3. sourceMap: source map
  // 4. meta: 额外的元数据
};
```

---

## 问题 3：Loader 如何通过 this 上下文通信？

**Webpack 为 loader 提供了丰富的 this 上下文 API**。

### 常用的 this 方法

```javascript
module.exports = function(source) {
  // 1. this.callback - 返回多个值
  this.callback(null, result, sourceMap, meta);
  
  // 2. this.async - 异步处理
  const callback = this.async();
  setTimeout(() => {
    callback(null, result);
  }, 1000);
  
  // 3. this.cacheable - 设置缓存
  this.cacheable(true);  // 默认为 true
  
  // 4. this.addDependency - 添加文件依赖
  this.addDependency('./config.json');
  
  // 5. this.emitFile - 输出文件
  this.emitFile('output.txt', content);
  
  // 6. this.resourcePath - 当前文件路径
  console.log(this.resourcePath);
  
  // 7. this.query - loader 的配置参数
  console.log(this.query);
  
  return result;
};
```

### 传递元数据

```javascript
// loader-a.js
module.exports = function(source) {
  const result = processA(source);
  
  // 传递元数据给下一个 loader
  this.callback(null, result, null, {
    customData: 'some data from loader-a'
  });
};

// loader-b.js
module.exports = function(source, sourceMap, meta) {
  // 接收上一个 loader 的元数据
  console.log(meta.customData);  // 'some data from loader-a'
  
  const result = processB(source);
  return result;
};
```

---

## 问题 4：如何实现 loader 之间的数据共享？

**通过 this.data 和 pitch 方法**。

### 使用 this.data

```javascript
// my-loader.js
module.exports = function(source) {
  // 在 normal 阶段访问 pitch 阶段设置的数据
  console.log(this.data.value);  // 'shared data'
  
  return source;
};

module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  // 在 pitch 阶段设置数据
  data.value = 'shared data';
};
```

### Pitch 方法

```javascript
// loader 执行分为两个阶段：
// 1. Pitch 阶段：从左到右
// 2. Normal 阶段：从右到左

// loader-a.js
module.exports = function(source) {
  console.log('loader-a normal');
  return source;
};

module.exports.pitch = function() {
  console.log('loader-a pitch');
};

// loader-b.js
module.exports = function(source) {
  console.log('loader-b normal');
  return source;
};

module.exports.pitch = function() {
  console.log('loader-b pitch');
};

// 执行顺序：
// loader-a pitch
// loader-b pitch
// loader-b normal
// loader-a normal
```

### Pitch 熔断

```javascript
// loader-a.js
module.exports.pitch = function() {
  console.log('loader-a pitch');
  
  // 返回值会熔断后续 loader
  return 'module.exports = "熔断"';
};

// loader-b.js
module.exports = function(source) {
  console.log('loader-b normal');  // 不会执行
  return source;
};

// 执行顺序：
// loader-a pitch（返回值）
// loader-a normal（不会执行）
// loader-b pitch（不会执行）
// loader-b normal（不会执行）
```

---

## 问题 5：如何实现异步 loader 通信？

**使用 this.async() 获取回调函数**。

### 异步 Loader

```javascript
// async-loader.js
module.exports = function(source) {
  // 获取异步回调
  const callback = this.async();
  
  // 异步处理
  setTimeout(() => {
    const result = transform(source);
    
    // 调用回调返回结果
    callback(null, result);
  }, 1000);
  
  // 不需要 return
};
```

### 异步 Loader 链

```javascript
// loader-a.js
module.exports = function(source) {
  const callback = this.async();
  
  fetchData().then(data => {
    const result = source + data;
    
    // 传递给下一个 loader
    callback(null, result, null, { fromA: true });
  });
};

// loader-b.js
module.exports = function(source, sourceMap, meta) {
  const callback = this.async();
  
  console.log(meta.fromA);  // true
  
  processAsync(source).then(result => {
    callback(null, result);
  });
};
```

---

## 问题 6：如何实现 loader 的配置传递？

**通过 options 和 loader-utils**。

### 传递配置

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: [
          {
            loader: 'my-loader',
            options: {
              name: 'test',
              flag: true
            }
          }
        ]
      }
    ]
  }
};
```

### 接收配置

```javascript
// my-loader.js
const { getOptions } = require('loader-utils');

module.exports = function(source) {
  // 获取配置
  const options = getOptions(this);
  
  console.log(options.name);  // 'test'
  console.log(options.flag);  // true
  
  // 使用配置处理源码
  const result = process(source, options);
  
  return result;
};
```

### 配置验证

```javascript
const { getOptions } = require('loader-utils');
const { validate } = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    flag: {
      type: 'boolean'
    }
  }
};

module.exports = function(source) {
  const options = getOptions(this);
  
  // 验证配置
  validate(schema, options, {
    name: 'My Loader',
    baseDataPath: 'options'
  });
  
  return source;
};
```

---

## 问题 7：实际案例：实现一个完整的 loader 链

**处理 Markdown 文件的 loader 链**。

### Loader 链配置

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          'html-loader',           // 3. 处理 HTML
          'markdown-loader',       // 2. Markdown 转 HTML
          'frontmatter-loader'     // 1. 提取 frontmatter
        ]
      }
    ]
  }
};
```

### frontmatter-loader

```javascript
// frontmatter-loader.js
const matter = require('gray-matter');

module.exports = function(source) {
  const { data, content } = matter(source);
  
  // 传递 frontmatter 数据给下一个 loader
  this.callback(null, content, null, {
    frontmatter: data
  });
};
```

### markdown-loader

```javascript
// markdown-loader.js
const marked = require('marked');

module.exports = function(source, sourceMap, meta) {
  // 接收 frontmatter 数据
  const frontmatter = meta?.frontmatter || {};
  
  // 转换 Markdown 为 HTML
  const html = marked(source);
  
  // 添加 frontmatter 信息
  const result = `
    <div class="markdown" data-title="${frontmatter.title || ''}">
      ${html}
    </div>
  `;
  
  return result;
};
```

### html-loader

```javascript
// 使用内置的 html-loader
// 处理 HTML 中的资源引用
```

---

## 总结

**核心机制**：

### 1. 执行顺序
- 从右到左（从下到上）
- Pitch 阶段：从左到右
- Normal 阶段：从右到左

### 2. 数据传递
- 返回值：传递处理后的内容
- this.callback：传递多个值
- meta：传递元数据

### 3. this 上下文
- this.async：异步处理
- this.callback：返回多个值
- this.data：共享数据
- this.emitFile：输出文件

### 4. 配置传递
- options：loader 配置
- getOptions：获取配置
- schema-utils：验证配置

### 5. 最佳实践
- 单一职责
- 链式调用
- 异步处理
- 错误处理

## 延伸阅读

- [Loader API 官方文档](https://webpack.js.org/api/loaders/)
- [编写 Loader](https://webpack.js.org/contribute/writing-a-loader/)
- [loader-utils](https://github.com/webpack/loader-utils)
- [schema-utils](https://github.com/webpack/schema-utils)
