---
title: 介绍抽象语法树(AST)
category: 编译原理
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解抽象语法树(AST)的概念、结构和应用,掌握如何使用 AST 进行代码分析、转换和优化,了解 Babel、ESLint 等工具的工作原理。
tags:
  - AST
  - 编译原理
  - Babel
  - 代码转换
estimatedTime: 26 分钟
keywords:
  - 抽象语法树
  - AST
  - Babel
  - 代码分析
highlight: AST 是现代前端工具链的基础,理解 AST 能帮助我们深入理解代码转换和分析的原理
order: 72
---

## 问题 1:什么是抽象语法树(AST)?

### 基本概念

AST (Abstract Syntax Tree) 是源代码的树状表示,它抽象了代码的语法结构,忽略了具体的语法细节。

```javascript
// 源代码
const add = (a, b) => a + b;

// AST 表示(简化版)
{
  type: "VariableDeclaration",
  kind: "const",
  declarations: [{
    type: "VariableDeclarator",
    id: { type: "Identifier", name: "add" },
    init: {
      type: "ArrowFunctionExpression",
      params: [
        { type: "Identifier", name: "a" },
        { type: "Identifier", name: "b" }
      ],
      body: {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Identifier", name: "a" },
        right: { type: "Identifier", name: "b" }
      }
    }
  }]
}
```

### 为什么需要 AST?

```javascript
// 代码是字符串,计算机难以理解
"const add = (a, b) => a + b;"

// AST 是结构化的数据,容易分析和操作
// 可以:
// 1. 分析代码结构
// 2. 转换代码
// 3. 优化代码
// 4. 检查错误
```

---

## 问题 2:AST 的生成过程

### 编译流程

```javascript
// 1. 词法分析 (Lexical Analysis)
// 源代码 → Tokens

"const add = 1"
↓
[
  { type: "Keyword", value: "const" },
  { type: "Identifier", value: "add" },
  { type: "Punctuator", value: "=" },
  { type: "Numeric", value: "1" }
]

// 2. 语法分析 (Syntax Analysis)
// Tokens → AST

[tokens]
↓
{
  type: "VariableDeclaration",
  kind: "const",
  declarations: [...]
}

// 3. 转换 (Transformation)
// AST → 新的 AST

// 4. 代码生成 (Code Generation)
// AST → 新的代码
```

### 使用 @babel/parser

```javascript
const parser = require('@babel/parser');

const code = 'const add = (a, b) => a + b;';

// 解析代码生成 AST
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

console.log(JSON.stringify(ast, null, 2));
```

---

## 问题 3:AST 的结构

### 节点类型

```javascript
// 1. 标识符 (Identifier)
{ type: "Identifier", name: "add" }

// 2. 字面量 (Literal)
{ type: "NumericLiteral", value: 42 }
{ type: "StringLiteral", value: "hello" }
{ type: "BooleanLiteral", value: true }

// 3. 表达式 (Expression)
// 二元表达式
{
  type: "BinaryExpression",
  operator: "+",
  left: { type: "Identifier", name: "a" },
  right: { type: "Identifier", name: "b" }
}

// 函数调用
{
  type: "CallExpression",
  callee: { type: "Identifier", name: "console.log" },
  arguments: [
    { type: "StringLiteral", value: "hello" }
  ]
}

// 4. 语句 (Statement)
// 变量声明
{
  type: "VariableDeclaration",
  kind: "const",
  declarations: [...]
}

// if 语句
{
  type: "IfStatement",
  test: { type: "BinaryExpression", ... },
  consequent: { type: "BlockStatement", ... },
  alternate: null
}

// 5. 函数 (Function)
{
  type: "FunctionDeclaration",
  id: { type: "Identifier", name: "add" },
  params: [...],
  body: { type: "BlockStatement", ... }
}
```

### 完整示例

```javascript
// 源代码
function add(a, b) {
  return a + b;
}

// AST
{
  "type": "Program",
  "body": [{
    "type": "FunctionDeclaration",
    "id": {
      "type": "Identifier",
      "name": "add"
    },
    "params": [
      { "type": "Identifier", "name": "a" },
      { "type": "Identifier", "name": "b" }
    ],
    "body": {
      "type": "BlockStatement",
      "body": [{
        "type": "ReturnStatement",
        "argument": {
          "type": "BinaryExpression",
          "operator": "+",
          "left": { "type": "Identifier", "name": "a" },
          "right": { "type": "Identifier", "name": "b" }
        }
      }]
    }
  }]
}
```

---

## 问题 4:如何遍历和操作 AST?

### 使用 @babel/traverse

```javascript
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = `
  const add = (a, b) => a + b;
  const multiply = (a, b) => a * b;
`;

const ast = parser.parse(code);

// 遍历 AST
traverse(ast, {
  // 访问所有标识符
  Identifier(path) {
    console.log(path.node.name);
    // 输出: add, a, b, a, b, multiply, a, b, a, b
  },
  
  // 访问箭头函数
  ArrowFunctionExpression(path) {
    console.log('Found arrow function');
  },
  
  // 访问变量声明
  VariableDeclaration(path) {
    console.log('Variable kind:', path.node.kind);
  }
});
```

### 修改 AST

```javascript
const t = require('@babel/types');

traverse(ast, {
  // 将所有 const 改为 let
  VariableDeclaration(path) {
    if (path.node.kind === 'const') {
      path.node.kind = 'let';
    }
  },
  
  // 将箭头函数改为普通函数
  ArrowFunctionExpression(path) {
    const { params, body } = path.node;
    
    // 创建函数表达式节点
    const funcExpr = t.functionExpression(
      null,  // id
      params,  // params
      t.blockStatement([
        t.returnStatement(body)
      ])
    );
    
    // 替换节点
    path.replaceWith(funcExpr);
  }
});
```

### 生成新代码

```javascript
const generate = require('@babel/generator').default;

// 从 AST 生成代码
const output = generate(ast, {
  comments: false,  // 不包含注释
  compact: false    // 不压缩
});

console.log(output.code);
// 输出:
// let add = function(a, b) {
//   return a + b;
// };
// let multiply = function(a, b) {
//   return a * b;
// };
```

---

## 问题 5:AST 的实际应用

### 1. Babel - 代码转换

```javascript
// Babel 插件示例:移除 console.log
module.exports = function({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        // 检查是否是 console.log
        if (
          t.isMemberExpression(path.node.callee) &&
          path.node.callee.object.name === 'console' &&
          path.node.callee.property.name === 'log'
        ) {
          // 移除节点
          path.remove();
        }
      }
    }
  };
};

// 使用插件
// 输入
console.log('debug');
const x = 1;

// 输出
const x = 1;
```

### 2. ESLint - 代码检查

```javascript
// ESLint 规则示例:禁止使用 var
module.exports = {
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind === 'var') {
          context.report({
            node,
            message: 'Unexpected var, use let or const instead.'
          });
        }
      }
    };
  }
};
```

### 3. Webpack - 代码分析

```javascript
// Webpack 分析依赖
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeDependencies(code) {
  const ast = parser.parse(code, {
    sourceType: 'module'
  });
  
  const dependencies = [];
  
  traverse(ast, {
    // 分析 import 语句
    ImportDeclaration(path) {
      dependencies.push(path.node.source.value);
    },
    
    // 分析 require 调用
    CallExpression(path) {
      if (path.node.callee.name === 'require') {
        const arg = path.node.arguments[0];
        if (arg.type === 'StringLiteral') {
          dependencies.push(arg.value);
        }
      }
    }
  });
  
  return dependencies;
}

// 使用
const code = `
  import React from 'react';
  const lodash = require('lodash');
`;

console.log(analyzeDependencies(code));
// ['react', 'lodash']
```

### 4. 代码压缩

```javascript
// UglifyJS/Terser 使用 AST 压缩代码
const terser = require('terser');

const code = `
  function add(a, b) {
    return a + b;
  }
  const result = add(1, 2);
`;

const result = terser.minify(code);
console.log(result.code);
// function add(a,b){return a+b}const result=add(1,2);
```

### 5. 代码生成工具

```javascript
// 使用 AST 生成代码
const t = require('@babel/types');
const generate = require('@babel/generator').default;

// 创建 AST
const ast = t.program([
  t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier('greeting'),
      t.stringLiteral('Hello, World!')
    )
  ]),
  t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier('console'),
        t.identifier('log')
      ),
      [t.identifier('greeting')]
    )
  )
]);

// 生成代码
const output = generate(ast);
console.log(output.code);
// const greeting = "Hello, World!";
// console.log(greeting);
```

---

## 问题 6:编写简单的 AST 转换

### 示例:将 var 转换为 let

```javascript
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function varToLet(code) {
  // 1. 解析代码
  const ast = parser.parse(code);
  
  // 2. 遍历并修改
  traverse(ast, {
    VariableDeclaration(path) {
      if (path.node.kind === 'var') {
        path.node.kind = 'let';
      }
    }
  });
  
  // 3. 生成新代码
  return generate(ast).code;
}

// 使用
const input = 'var x = 1; var y = 2;';
const output = varToLet(input);
console.log(output);
// let x = 1;
// let y = 2;
```

### 示例:自动添加分号

```javascript
function addSemicolons(code) {
  const ast = parser.parse(code);
  
  traverse(ast, {
    // 在每个语句后添加分号
    Statement(path) {
      // AST 中已经包含了语句结构
      // generate 时会自动添加分号
    }
  });
  
  return generate(ast, {
    retainLines: false,
    compact: false
  }).code;
}
```

---

## 问题 7:AST 工具和资源

### 在线工具

```javascript
// 1. AST Explorer
// https://astexplorer.net/
// - 可视化 AST
// - 实时编辑
// - 支持多种解析器

// 2. Babel REPL
// https://babeljs.io/repl
// - 在线转换代码
// - 查看 AST
// - 测试插件
```

### 常用库

```javascript
// 1. @babel/parser - 解析代码
npm install @babel/parser

// 2. @babel/traverse - 遍历 AST
npm install @babel/traverse

// 3. @babel/types - 创建和验证节点
npm install @babel/types

// 4. @babel/generator - 生成代码
npm install @babel/generator

// 5. @babel/template - 使用模板创建 AST
npm install @babel/template
```

### 使用模板

```javascript
const template = require('@babel/template').default;

// 使用模板创建 AST
const buildRequire = template(`
  var %%importName%% = require(%%source%%);
`);

const ast = buildRequire({
  importName: t.identifier('myModule'),
  source: t.stringLiteral('./my-module')
});

// 生成代码
// var myModule = require("./my-module");
```

---

## 总结

**核心概念总结**:

### 1. AST 基础

- 代码的树状表示
- 由节点组成
- 每个节点有类型和属性
- 忽略语法细节

### 2. 处理流程

- **解析**: 代码 → AST
- **遍历**: 访问节点
- **转换**: 修改节点
- **生成**: AST → 代码

### 3. 主要应用

- **Babel**: 代码转换
- **ESLint**: 代码检查
- **Webpack**: 依赖分析
- **Terser**: 代码压缩

### 4. 常用工具

- @babel/parser
- @babel/traverse
- @babel/types
- @babel/generator

## 延伸阅读

- [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)
- [AST Explorer](https://astexplorer.net/)
- [@babel/types API](https://babeljs.io/docs/en/babel-types)
- [ESLint 自定义规则](https://eslint.org/docs/developer-guide/working-with-rules)
- [Acorn Parser](https://github.com/acornjs/acorn)
