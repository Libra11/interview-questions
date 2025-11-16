---
title: 模版引擎的实现原理是什么？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解模版引擎的核心实现原理，包括模板解析、变量替换、逻辑处理、编译优化等关键技术，掌握如何从零实现一个简单的模版引擎。
tags:
  - 模版引擎
  - 字符串处理
  - 编译原理
  - 正则表达式
estimatedTime: 28 分钟
keywords:
  - 模版引擎
  - template
  - 模板解析
  - 字符串替换
  - 编译
highlight: 模版引擎通过解析模板语法、编译成可执行函数，实现数据与视图的分离
order: 103
---

## 问题 1：什么是模版引擎，它解决了什么问题？

模版引擎是一种将数据和模板结合生成最终输出的工具。它的核心思想是**将数据逻辑和展示逻辑分离**，通过特定的语法在模板中标记动态内容的位置。

### 没有模版引擎的问题

```javascript
// ❌ 字符串拼接 - 难以维护，容易出错
function renderUser(user) {
  let html = '<div class="user">';
  html += '<h2>' + user.name + '</h2>';
  html += '<p>Age: ' + user.age + '</p>';
  if (user.email) {
    html += '<p>Email: ' + user.email + '</p>';
  }
  html += '<ul>';
  for (let i = 0; i < user.hobbies.length; i++) {
    html += '<li>' + user.hobbies[i] + '</li>';
  }
  html += '</ul>';
  html += '</div>';
  return html;
}
```

### 使用模版引擎

```javascript
// ✅ 模板语法 - 清晰直观
const template = `
  <div class="user">
    <h2>{{name}}</h2>
    <p>Age: {{age}}</p>
    {{if email}}
      <p>Email: {{email}}</p>
    {{/if}}
    <ul>
      {{each hobbies}}
        <li>{{$value}}</li>
      {{/each}}
    </ul>
  </div>
`;

const html = render(template, {
  name: 'Alice',
  age: 25,
  email: 'alice@example.com',
  hobbies: ['reading', 'coding', 'music']
});
```

### 模版引擎的核心价值

- **分离关注点**：数据逻辑和展示逻辑分离
- **提高可读性**：模板结构清晰，易于理解和维护
- **减少错误**：避免手动拼接字符串的错误
- **复用性强**：同一模板可以用于不同的数据

---

## 问题 2：模版引擎的基本实现原理是什么？

模版引擎的核心原理是**字符串解析和替换**。最简单的实现就是用正则表达式找到模板中的占位符，然后替换成对应的数据。

### 最简单的实现

```javascript
// 最基础的模版引擎 - 只支持变量替换
function simpleTemplate(template, data) {
  // 匹配 {{变量名}} 格式
  return template.replace(/\{\{(\w+)\}\}/g, function(match, key) {
    // match: '{{name}}'
    // key: 'name'
    return data[key] !== undefined ? data[key] : '';
  });
}

const template = 'Hello, {{name}}! You are {{age}} years old.';
const result = simpleTemplate(template, { name: 'Bob', age: 30 });
console.log(result); // 'Hello, Bob! You are 30 years old.'
```

### 支持嵌套属性

```javascript
// 支持 {{user.name}} 这样的嵌套属性访问
function templateWithNested(template, data) {
  return template.replace(/\{\{([\w.]+)\}\}/g, function(match, path) {
    // path: 'user.name'
    // 通过路径访问嵌套属性
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : '';
    }, data);
  });
}

const template = 'User: {{user.name}}, City: {{user.address.city}}';
const result = templateWithNested(template, {
  user: {
    name: 'Alice',
    address: { city: 'Beijing' }
  }
});
console.log(result); // 'User: Alice, City: Beijing'
```

### 基本原理总结

1. **解析模板**：用正则表达式找到所有占位符
2. **提取变量名**：从占位符中提取变量名或表达式
3. **获取数据**：根据变量名从数据对象中获取值
4. **替换占位符**：用实际数据替换模板中的占位符

---

## 问题 3：如何实现条件判断和循环？

简单的字符串替换无法处理复杂的逻辑，如条件判断和循环。这需要**解析模板结构**，识别不同类型的语法块。

### 条件判断的实现

```javascript
// 支持 {{if}} {{/if}} 条件语法
function templateWithIf(template, data) {
  // 匹配 {{if 条件}} 内容 {{/if}}
  return template.replace(
    /\{\{if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    function(match, condition, content) {
      // 如果条件为真，保留内容；否则移除
      return data[condition] ? content : '';
    }
  );
}

const template = `
  <div>
    <p>Name: {{name}}</p>
    {{if isVip}}
      <span class="vip-badge">VIP</span>
    {{/if}}
  </div>
`;

// 先处理条件，再处理变量
let result = templateWithIf(template, { name: 'Alice', isVip: true });
result = simpleTemplate(result, { name: 'Alice' });
console.log(result); // 包含 VIP 标记
```

### 循环的实现

```javascript
// 支持 {{each}} {{/each}} 循环语法
function templateWithEach(template, data) {
  // 匹配 {{each 数组名}} 内容 {{/each}}
  return template.replace(
    /\{\{each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    function(match, arrayName, itemTemplate) {
      const array = data[arrayName];
      
      // 如果不是数组，返回空字符串
      if (!Array.isArray(array)) return '';
      
      // 遍历数组，为每个元素渲染模板
      return array.map((item, index) => {
        // 替换 {{$value}} 为当前项的值
        // 替换 {{$index}} 为当前索引
        return itemTemplate
          .replace(/\{\{\$value\}\}/g, item)
          .replace(/\{\{\$index\}\}/g, index);
      }).join('');
    }
  );
}

const template = `
  <ul>
    {{each items}}
      <li>{{$index}}: {{$value}}</li>
    {{/each}}
  </ul>
`;

const result = templateWithEach(template, {
  items: ['Apple', 'Banana', 'Orange']
});
console.log(result);
// <ul>
//   <li>0: Apple</li>
//   <li>1: Banana</li>
//   <li>2: Orange</li>
// </ul>
```

### 处理对象数组

```javascript
// 支持对象数组的循环
function templateWithObjectEach(template, data) {
  return template.replace(
    /\{\{each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    function(match, arrayName, itemTemplate) {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        // 为每个对象创建临时数据上下文
        let rendered = itemTemplate;
        
        // 替换对象属性 {{name}}, {{age}} 等
        rendered = rendered.replace(/\{\{(\w+)\}\}/g, (m, key) => {
          if (key === '$index') return index;
          return item[key] !== undefined ? item[key] : '';
        });
        
        return rendered;
      }).join('');
    }
  );
}

const template = `
  {{each users}}
    <div>{{name}} - {{age}}</div>
  {{/each}}
`;

const result = templateWithObjectEach(template, {
  users: [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 }
  ]
});
```

---

## 问题 4：编译型模版引擎是如何工作的？

正则替换的方式虽然简单，但每次渲染都要重新解析模板，效率较低。**编译型模版引擎**会将模板预先编译成 JavaScript 函数，提高渲染效率。

### 编译的基本思路

```javascript
// 将模板编译成函数
function compile(template) {
  // 1. 解析模板，生成函数体代码
  let code = 'let output = "";\n';
  
  // 2. 将模板分割成静态文本和动态部分
  const tokens = template.split(/(\{\{.*?\}\})/);
  
  tokens.forEach(token => {
    if (token.startsWith('{{') && token.endsWith('}}')) {
      // 动态部分：提取变量名并拼接
      const varName = token.slice(2, -2).trim();
      code += `output += data.${varName};\n`;
    } else {
      // 静态部分：直接拼接
      code += `output += ${JSON.stringify(token)};\n`;
    }
  });
  
  code += 'return output;';
  
  // 3. 创建函数
  return new Function('data', code);
}

// 使用编译后的函数
const template = 'Hello, {{name}}! Age: {{age}}';
const render = compile(template);

console.log(render({ name: 'Alice', age: 25 }));
// 'Hello, Alice! Age: 25'

// 可以多次使用，无需重新解析
console.log(render({ name: 'Bob', age: 30 }));
// 'Hello, Bob! Age: 30'
```

### 生成的函数代码示例

```javascript
// 模板：'Hello, {{name}}! Age: {{age}}'
// 编译后生成的函数等价于：
function render(data) {
  let output = "";
  output += "Hello, ";
  output += data.name;
  output += "! Age: ";
  output += data.age;
  return output;
}
```

### 编译型的优势

- **只解析一次**：模板只在编译时解析一次，之后直接执行函数
- **执行效率高**：避免了重复的正则匹配和字符串操作
- **可优化**：编译时可以进行各种优化，如静态内容合并

---

## 问题 5：如何实现更复杂的编译逻辑？

真实的模版引擎需要支持条件、循环等复杂语法，这需要更完善的**词法分析和语法解析**。

### 支持条件判断的编译

```javascript
function compileWithIf(template) {
  let code = 'let output = "";\n';
  
  // 使用正则匹配不同类型的标签
  const pattern = /\{\{(if|\/if|else|\w+)\s*(.*?)\}\}/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(template)) !== null) {
    // 添加标签前的静态文本
    const staticText = template.slice(lastIndex, match.index);
    if (staticText) {
      code += `output += ${JSON.stringify(staticText)};\n`;
    }
    
    const [fullMatch, type, content] = match;
    
    if (type === 'if') {
      // {{if condition}} -> if (data.condition) {
      code += `if (data.${content.trim()}) {\n`;
    } else if (type === '/if') {
      // {{/if}} -> }
      code += '}\n';
    } else if (type === 'else') {
      // {{else}} -> } else {
      code += '} else {\n';
    } else {
      // {{variable}} -> output += data.variable;
      code += `output += data.${type};\n`;
    }
    
    lastIndex = pattern.lastIndex;
  }
  
  // 添加剩余的静态文本
  if (lastIndex < template.length) {
    code += `output += ${JSON.stringify(template.slice(lastIndex))};\n`;
  }
  
  code += 'return output;';
  return new Function('data', code);
}

const template = 'Hello, {{name}}! {{if isVip}}[VIP]{{else}}[Normal]{{/if}}';
const render = compileWithIf(template);

console.log(render({ name: 'Alice', isVip: true }));
// 'Hello, Alice! [VIP]'

console.log(render({ name: 'Bob', isVip: false }));
// 'Hello, Bob! [Normal]'
```

### 支持循环的编译

```javascript
function compileWithEach(template) {
  let code = 'let output = "";\n';
  
  // 匹配 {{each array}} 内容 {{/each}}
  const eachPattern = /\{\{each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  
  let result = template.replace(eachPattern, (match, arrayName, loopBody) => {
    // 生成循环代码
    let loopCode = `
      if (Array.isArray(data.${arrayName})) {
        data.${arrayName}.forEach((item, index) => {
    `;
    
    // 处理循环体内的变量
    loopBody = loopBody.replace(/\{\{(\$value|\$index|\w+)\}\}/g, (m, key) => {
      if (key === '$value') return '${item}';
      if (key === '$index') return '${index}';
      return '${item.' + key + '}';
    });
    
    loopCode += `output += \`${loopBody}\`;\n`;
    loopCode += '});\n}\n';
    
    return '${' + loopCode + '}';
  });
  
  // 处理普通变量
  code += `output = \`${result}\`;\n`;
  code = code.replace(/\{\{(\w+)\}\}/g, '${data.$1}');
  code += 'return output;';
  
  return new Function('data', code);
}
```

### 生成的代码示例

```javascript
// 模板：
// {{each users}}
//   <li>{{name}}</li>
// {{/each}}

// 编译后生成的函数类似：
function render(data) {
  let output = "";
  
  if (Array.isArray(data.users)) {
    data.users.forEach((item, index) => {
      output += `<li>${item.name}</li>`;
    });
  }
  
  return output;
}
```

---

## 问题 6：如何处理表达式和过滤器？

实际应用中，模板常需要支持**表达式计算**和**过滤器**功能，如 `{{price * quantity}}` 或 `{{name | uppercase}}`。

### 支持简单表达式

```javascript
function compileWithExpression(template) {
  let code = 'let output = "";\n';
  
  // 匹配 {{表达式}}
  const pattern = /\{\{(.+?)\}\}/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(template)) !== null) {
    // 静态文本
    const staticText = template.slice(lastIndex, match.index);
    if (staticText) {
      code += `output += ${JSON.stringify(staticText)};\n`;
    }
    
    // 表达式：直接在 with 语句中执行
    const expression = match[1].trim();
    code += `output += (${expression});\n`;
    
    lastIndex = pattern.lastIndex;
  }
  
  // 剩余文本
  if (lastIndex < template.length) {
    code += `output += ${JSON.stringify(template.slice(lastIndex))};\n`;
  }
  
  code += 'return output;';
  
  // 使用 with 语句简化数据访问
  return new Function('data', `
    with(data) {
      ${code}
    }
  `);
}

const template = 'Total: {{price * quantity}}, Tax: {{price * quantity * 0.1}}';
const render = compileWithExpression(template);

console.log(render({ price: 100, quantity: 3 }));
// 'Total: 300, Tax: 30'
```

### 实现过滤器功能

```javascript
// 过滤器系统
const filters = {
  uppercase: str => String(str).toUpperCase(),
  lowercase: str => String(str).toLowerCase(),
  capitalize: str => {
    str = String(str);
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  currency: num => '¥' + Number(num).toFixed(2)
};

function compileWithFilters(template, filterMap = filters) {
  let code = 'let output = "";\n';
  
  // 匹配 {{变量 | 过滤器1 | 过滤器2}}
  const pattern = /\{\{(.+?)\}\}/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(template)) !== null) {
    const staticText = template.slice(lastIndex, match.index);
    if (staticText) {
      code += `output += ${JSON.stringify(staticText)};\n`;
    }
    
    const expression = match[1].trim();
    
    // 检查是否有过滤器
    if (expression.includes('|')) {
      const parts = expression.split('|').map(s => s.trim());
      const varName = parts[0]; // 变量名
      const filterNames = parts.slice(1); // 过滤器列表
      
      // 生成过滤器调用链
      let filterCode = `data.${varName}`;
      filterNames.forEach(filterName => {
        filterCode = `filters.${filterName}(${filterCode})`;
      });
      
      code += `output += ${filterCode};\n`;
    } else {
      code += `output += data.${expression};\n`;
    }
    
    lastIndex = pattern.lastIndex;
  }
  
  if (lastIndex < template.length) {
    code += `output += ${JSON.stringify(template.slice(lastIndex))};\n`;
  }
  
  code += 'return output;';
  
  // 将 filters 作为参数传入
  return new Function('data', 'filters', code);
}

const template = 'Hello, {{name | uppercase}}! Price: {{price | currency}}';
const render = compileWithFilters(template);

console.log(render({ name: 'alice', price: 99.5 }, filters));
// 'Hello, ALICE! Price: ¥99.50'
```

---

## 问题 7：现代模版引擎的优化策略有哪些？

现代模版引擎（如 Vue、React JSX、Handlebars）在基本原理之上，还采用了多种优化策略。

### 静态内容提取

```javascript
// 将静态内容提取为常量，避免重复创建
function optimizedCompile(template) {
  // 分析模板，提取静态部分
  const staticParts = [];
  let code = '';
  
  // 例如：'<div>{{name}}</div>' 
  // 静态部分：'<div>' 和 '</div>'
  // 动态部分：name
  
  const pattern = /\{\{(.+?)\}\}/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;
  
  code += 'let output = "";\n';
  
  while ((match = pattern.exec(template)) !== null) {
    const staticText = template.slice(lastIndex, match.index);
    if (staticText) {
      // 将静态文本存储为常量
      const constName = `_static${partIndex++}`;
      staticParts.push(`const ${constName} = ${JSON.stringify(staticText)};`);
      code += `output += ${constName};\n`;
    }
    
    const varName = match[1].trim();
    code += `output += data.${varName};\n`;
    
    lastIndex = pattern.lastIndex;
  }
  
  if (lastIndex < template.length) {
    const constName = `_static${partIndex}`;
    staticParts.push(`const ${constName} = ${JSON.stringify(template.slice(lastIndex))};`);
    code += `output += ${constName};\n`;
  }
  
  code += 'return output;';
  
  // 将静态常量定义放在函数外部
  const fullCode = staticParts.join('\n') + '\n' + 
                   'return function(data) {\n' + code + '\n}';
  
  return new Function(fullCode)();
}
```

### 缓存编译结果

```javascript
// 模板缓存系统
class TemplateEngine {
  constructor() {
    this.cache = new Map(); // 缓存编译后的函数
  }
  
  compile(template) {
    // 检查缓存
    if (this.cache.has(template)) {
      return this.cache.get(template);
    }
    
    // 编译模板
    const render = this._compile(template);
    
    // 存入缓存
    this.cache.set(template, render);
    
    return render;
  }
  
  _compile(template) {
    // 实际的编译逻辑
    let code = 'let output = "";\n';
    // ... 编译代码
    code += 'return output;';
    return new Function('data', code);
  }
  
  render(template, data) {
    const renderFn = this.compile(template);
    return renderFn(data);
  }
}

const engine = new TemplateEngine();

// 第一次：编译并缓存
engine.render('Hello, {{name}}', { name: 'Alice' });

// 第二次：直接使用缓存，无需重新编译
engine.render('Hello, {{name}}', { name: 'Bob' });
```

### 字符串拼接优化

```javascript
// 使用数组 join 代替字符串拼接（在某些场景下更快）
function compileWithArray(template) {
  let code = 'const arr = [];\n';
  
  const pattern = /\{\{(.+?)\}\}/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(template)) !== null) {
    const staticText = template.slice(lastIndex, match.index);
    if (staticText) {
      code += `arr.push(${JSON.stringify(staticText)});\n`;
    }
    
    const varName = match[1].trim();
    code += `arr.push(data.${varName});\n`;
    
    lastIndex = pattern.lastIndex;
  }
  
  if (lastIndex < template.length) {
    code += `arr.push(${JSON.stringify(template.slice(lastIndex))});\n`;
  }
  
  code += 'return arr.join("");';
  
  return new Function('data', code);
}
```

### 预编译和构建时优化

```javascript
// 在构建阶段预编译模板
// 例如 Vue 的单文件组件编译

// 开发时：
// <template>
//   <div>{{message}}</div>
// </template>

// 构建后生成：
function render() {
  return h('div', this.message);
}

// 避免运行时编译开销
```

---

## 总结

**模版引擎实现的核心要点**：

### 1. 基本原理

- 字符串解析和替换
- 正则表达式匹配占位符
- 数据绑定和变量替换

### 2. 解析策略

- 词法分析：识别不同类型的标记
- 语法解析：处理嵌套结构和逻辑
- 递归处理：支持复杂的嵌套语法

### 3. 编译优化

- 预编译成函数，避免重复解析
- 静态内容提取和缓存
- 使用 `new Function` 动态生成代码

### 4. 功能扩展

- 条件判断：if/else 语法
- 循环遍历：each/for 语法
- 表达式计算：支持简单运算
- 过滤器：数据格式化和转换

### 5. 实现技巧

- 使用 `with` 语句简化数据访问（注意严格模式限制）
- 正则表达式的非贪婪匹配
- 模板缓存提高复用效率
- 错误处理和边界情况

### 6. 现代优化

- 静态分析和优化
- 虚拟 DOM 结合（React/Vue）
- AOT 编译（Angular）
- 增量更新和 diff 算法

**常见模版引擎对比**：

- **Mustache/Handlebars**：逻辑少，语法简单
- **EJS**：支持原生 JavaScript 语法
- **Pug（Jade）**：简洁的缩进语法
- **Vue Template**：响应式数据绑定
- **JSX**：JavaScript 扩展语法

## 延伸阅读

- [MDN - Template literals](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Template_literals)
- [Mustache 模板引擎](https://github.com/janl/mustache.js)
- [Handlebars.js 官方文档](https://handlebarsjs.com/)
- [EJS 模板引擎](https://ejs.co/)
- [Vue 模板编译原理](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [编写一个简单的模板引擎](https://github.com/krasimir/blog/tree/master/2015/JavaScript-template-engine-in-just-20-lines)
