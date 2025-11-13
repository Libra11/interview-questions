---
title: 深度遍历广度遍历的区别？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解深度优先遍历（DFS）和广度优先遍历（BFS）的区别，包括算法原理、实现方式、应用场景等。
tags:
  - 算法
  - 遍历
  - 数据结构
  - 树遍历
estimatedTime: 30 分钟
keywords:
  - 深度优先遍历
  - 广度优先遍历
  - DFS
  - BFS
  - 树遍历
highlight: 掌握深度优先和广度优先遍历的核心区别，理解不同遍历策略的适用场景
order: 60
---

## 问题 1：基本概念和区别

### 深度优先遍历 (DFS - Depth-First Search)

```javascript
// 深度优先遍历演示
function depthFirstSearchDemo() {
  console.log("=== 深度优先遍历（DFS）演示 ===");

  // 创建一个树结构用于演示
  const tree = {
    value: "A",
    children: [
      {
        value: "B",
        children: [
          { value: "D", children: [] },
          { value: "E", children: [] },
        ],
      },
      {
        value: "C",
        children: [
          { value: "F", children: [] },
          { value: "G", children: [] },
        ],
      },
    ],
  };

  console.log("树结构:");
  console.log(`
       A
      / \\
     B   C
    / \\ / \\
   D  E F  G
  `);

  // 递归实现深度优先遍历
  function dfsRecursive(node, visited = []) {
    if (!node) return visited;

    console.log(`访问节点: ${node.value}`);
    visited.push(node.value);

    // 递归遍历所有子节点
    for (let child of node.children) {
      dfsRecursive(child, visited);
    }

    return visited;
  }

  console.log("1. 递归实现 DFS:");
  const dfsResult1 = dfsRecursive(tree);
  console.log("遍历结果:", dfsResult1); // ['A', 'B', 'D', 'E', 'C', 'F', 'G']

  // 迭代实现深度优先遍历（使用栈）
  function dfsIterative(root) {
    if (!root) return [];

    const stack = [root];
    const visited = [];

    console.log("2. 迭代实现 DFS（使用栈）:");

    while (stack.length > 0) {
      const node = stack.pop();
      console.log(`访问节点: ${node.value}`);
      visited.push(node.value);

      // 将子节点逆序入栈，保证左子树先访问
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }

      console.log(`当前栈状态: [${stack.map((n) => n.value).join(", ")}]`);
    }

    return visited;
  }

  const dfsResult2 = dfsIterative(tree);
  console.log("遍历结果:", dfsResult2); // ['A', 'B', 'D', 'E', 'C', 'F', 'G']
}

depthFirstSearchDemo();
```

### 广度优先遍历 (BFS - Breadth-First Search)

```javascript
// 广度优先遍历演示
function breadthFirstSearchDemo() {
  console.log("=== 广度优先遍历（BFS）演示 ===");

  // 使用相同的树结构
  const tree = {
    value: "A",
    children: [
      {
        value: "B",
        children: [
          { value: "D", children: [] },
          { value: "E", children: [] },
        ],
      },
      {
        value: "C",
        children: [
          { value: "F", children: [] },
          { value: "G", children: [] },
        ],
      },
    ],
  };

  // 迭代实现广度优先遍历（使用队列）
  function bfsIterative(root) {
    if (!root) return [];

    const queue = [root];
    const visited = [];

    console.log("使用队列实现 BFS:");

    while (queue.length > 0) {
      const node = queue.shift(); // 从队列前端取出
      console.log(`访问节点: ${node.value}`);
      visited.push(node.value);

      // 将所有子节点加入队列后端
      for (let child of node.children) {
        queue.push(child);
      }

      console.log(`当前队列状态: [${queue.map((n) => n.value).join(", ")}]`);
    }

    return visited;
  }

  const bfsResult = bfsIterative(tree);
  console.log("遍历结果:", bfsResult); // ['A', 'B', 'C', 'D', 'E', 'F', 'G']

  // 按层级遍历的 BFS
  function bfsByLevel(root) {
    if (!root) return [];

    const result = [];
    let currentLevel = [root];
    let level = 0;

    console.log("按层级的 BFS:");

    while (currentLevel.length > 0) {
      const levelValues = [];
      const nextLevel = [];

      console.log(`第 ${level} 层:`);

      for (let node of currentLevel) {
        console.log(`  访问节点: ${node.value}`);
        levelValues.push(node.value);

        // 收集下一层的节点
        for (let child of node.children) {
          nextLevel.push(child);
        }
      }

      result.push(levelValues);
      currentLevel = nextLevel;
      level++;
    }

    return result;
  }

  const bfsLevelResult = bfsByLevel(tree);
  console.log("按层级遍历结果:", bfsLevelResult);
  // [['A'], ['B', 'C'], ['D', 'E', 'F', 'G']]
}

breadthFirstSearchDemo();
```

---

## 问题 2：核心区别对比

### 遍历顺序和数据结构差异

```javascript
// 遍历顺序和数据结构差异演示
function traversalComparisonDemo() {
  console.log("=== DFS vs BFS 核心区别演示 ===");

  // 创建更复杂的树结构
  const complexTree = {
    value: 1,
    children: [
      {
        value: 2,
        children: [
          {
            value: 4,
            children: [
              { value: 8, children: [] },
              { value: 9, children: [] },
            ],
          },
          { value: 5, children: [] },
        ],
      },
      {
        value: 3,
        children: [
          { value: 6, children: [] },
          {
            value: 7,
            children: [{ value: 10, children: [] }],
          },
        ],
      },
    ],
  };

  console.log("复杂树结构:");
  console.log(`
         1
       /   \\
      2     3
     / \\   / \\
    4   5 6   7
   / \\       /
  8   9     10
  `);

  // DFS 实现
  function dfs(node, path = []) {
    if (!node) return path;

    path.push(node.value);

    for (let child of node.children) {
      dfs(child, path);
    }

    return path;
  }

  // BFS 实现
  function bfs(root) {
    if (!root) return [];

    const queue = [root];
    const path = [];

    while (queue.length > 0) {
      const node = queue.shift();
      path.push(node.value);

      for (let child of node.children) {
        queue.push(child);
      }
    }

    return path;
  }

  console.log("1. 遍历顺序对比:");
  const dfsPath = dfs(complexTree);
  const bfsPath = bfs(complexTree);

  console.log("DFS 遍历顺序:", dfsPath); // [1, 2, 4, 8, 9, 5, 3, 6, 7, 10]
  console.log("BFS 遍历顺序:", bfsPath); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  // 2. 数据结构使用对比
  console.log("2. 数据结构使用对比:");

  function dfsWithStackTrace(root) {
    const stack = [root];
    const visited = [];
    const stackTrace = [];

    while (stack.length > 0) {
      stackTrace.push([...stack.map((n) => n.value)]);

      const node = stack.pop();
      visited.push(node.value);

      // 逆序添加子节点
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }

    return { visited, stackTrace };
  }

  function bfsWithQueueTrace(root) {
    const queue = [root];
    const visited = [];
    const queueTrace = [];

    while (queue.length > 0) {
      queueTrace.push([...queue.map((n) => n.value)]);

      const node = queue.shift();
      visited.push(node.value);

      for (let child of node.children) {
        queue.push(child);
      }
    }

    return { visited, queueTrace };
  }

  const dfsTrace = dfsWithStackTrace(complexTree);
  const bfsTrace = bfsWithQueueTrace(complexTree);

  console.log("DFS 栈状态变化:");
  dfsTrace.stackTrace.forEach((stack, index) => {
    console.log(`  步骤 ${index + 1}: [${stack.join(", ")}]`);
  });

  console.log("BFS 队列状态变化:");
  bfsTrace.queueTrace.forEach((queue, index) => {
    console.log(`  步骤 ${index + 1}: [${queue.join(", ")}]`);
  });
}

traversalComparisonDemo();
```

### 空间和时间复杂度分析

```javascript
// 空间和时间复杂度分析
function complexityAnalysisDemo() {
  console.log("=== 复杂度分析演示 ===");

  // 创建不同深度的树进行测试
  function createTree(depth, branching = 2) {
    if (depth <= 0) return null;

    const node = {
      value: Math.random().toString(36).substr(2, 5),
      children: [],
    };

    if (depth > 1) {
      for (let i = 0; i < branching; i++) {
        const child = createTree(depth - 1, branching);
        if (child) node.children.push(child);
      }
    }

    return node;
  }

  // 测量内存使用的 DFS
  function dfsMemoryTest(node, depth = 0, maxDepth = { value: 0 }) {
    if (!node) return [];

    maxDepth.value = Math.max(maxDepth.value, depth);

    const result = [node.value];

    for (let child of node.children) {
      result.push(...dfsMemoryTest(child, depth + 1, maxDepth));
    }

    return result;
  }

  // 测量内存使用的 BFS
  function bfsMemoryTest(root) {
    if (!root) return [];

    const queue = [root];
    const result = [];
    let maxQueueSize = 0;

    while (queue.length > 0) {
      maxQueueSize = Math.max(maxQueueSize, queue.length);

      const node = queue.shift();
      result.push(node.value);

      for (let child of node.children) {
        queue.push(child);
      }
    }

    return { result, maxQueueSize };
  }

  // 测试不同深度的树
  const depths = [3, 4, 5];

  depths.forEach((depth) => {
    console.log(`\n测试深度 ${depth} 的二叉树:`);

    const tree = createTree(depth, 2);
    const nodeCount = Math.pow(2, depth) - 1; // 完全二叉树节点数

    console.log(`节点总数: ${nodeCount}`);

    // DFS 测试
    const dfsMaxDepth = { value: 0 };
    console.time(`DFS-深度${depth}`);
    const dfsResult = dfsMemoryTest(tree, 0, dfsMaxDepth);
    console.timeEnd(`DFS-深度${depth}`);

    console.log(`DFS 最大递归深度: ${dfsMaxDepth.value}`);
    console.log(`DFS 空间复杂度: O(h) = O(${dfsMaxDepth.value})`);

    // BFS 测试
    console.time(`BFS-深度${depth}`);
    const bfsResult = bfsMemoryTest(tree);
    console.timeEnd(`BFS-深度${depth}`);

    console.log(`BFS 最大队列大小: ${bfsResult.maxQueueSize}`);
    console.log(`BFS 空间复杂度: O(w) = O(${bfsResult.maxQueueSize})`);

    console.log(`时间复杂度: 两者都是 O(n) = O(${nodeCount})`);
  });

  // 极端情况测试：链状树（最坏情况）
  console.log("\n极端情况测试 - 链状树:");

  function createLinkedTree(depth) {
    if (depth <= 0) return null;

    return {
      value: depth,
      children: depth > 1 ? [createLinkedTree(depth - 1)] : [],
    };
  }

  const linkedTree = createLinkedTree(10);

  console.log("链状树结构: 1 -> 2 -> 3 -> ... -> 10");

  const linkedDfsMaxDepth = { value: 0 };
  const linkedDfsResult = dfsMemoryTest(linkedTree, 0, linkedDfsMaxDepth);
  const linkedBfsResult = bfsMemoryTest(linkedTree);

  console.log(`DFS 链状树最大深度: ${linkedDfsMaxDepth.value}`);
  console.log(`BFS 链状树最大队列大小: ${linkedBfsResult.maxQueueSize}`);
  console.log("链状树中 DFS 空间效率更高");
}

complexityAnalysisDemo();
```

---

## 问题 3：实际应用场景

### DOM 树遍历应用

```javascript
// DOM 树遍历应用演示
function domTraversalDemo() {
  console.log("=== DOM 树遍历应用演示 ===");

  // 模拟 DOM 节点结构
  const mockDOM = {
    tagName: "html",
    id: "",
    className: "",
    children: [
      {
        tagName: "head",
        id: "",
        className: "",
        children: [
          {
            tagName: "title",
            id: "",
            className: "",
            children: [],
            textContent: "Page Title",
          },
          { tagName: "meta", id: "", className: "", children: [] },
        ],
      },
      {
        tagName: "body",
        id: "main-body",
        className: "container",
        children: [
          {
            tagName: "header",
            id: "header",
            className: "header",
            children: [
              {
                tagName: "h1",
                id: "",
                className: "title",
                children: [],
                textContent: "Welcome",
              },
            ],
          },
          {
            tagName: "main",
            id: "content",
            className: "main-content",
            children: [
              {
                tagName: "section",
                id: "section1",
                className: "section",
                children: [
                  {
                    tagName: "p",
                    id: "",
                    className: "",
                    children: [],
                    textContent: "Paragraph 1",
                  },
                  {
                    tagName: "p",
                    id: "",
                    className: "",
                    children: [],
                    textContent: "Paragraph 2",
                  },
                ],
              },
            ],
          },
          {
            tagName: "footer",
            id: "footer",
            className: "footer",
            children: [
              {
                tagName: "p",
                id: "",
                className: "",
                children: [],
                textContent: "Footer content",
              },
            ],
          },
        ],
      },
    ],
  };

  // 1. DFS 查找特定元素
  console.log("1. DFS 查找特定元素:");

  function findElementByIdDFS(root, targetId) {
    if (!root) return null;

    console.log(`检查元素: ${root.tagName}${root.id ? "#" + root.id : ""}`);

    if (root.id === targetId) {
      console.log(`✅ 找到目标元素: ${root.tagName}#${root.id}`);
      return root;
    }

    for (let child of root.children) {
      const found = findElementByIdDFS(child, targetId);
      if (found) return found;
    }

    return null;
  }

  const foundElement = findElementByIdDFS(mockDOM, "section1");
  console.log(
    "DFS 查找结果:",
    foundElement ? `${foundElement.tagName}#${foundElement.id}` : "未找到"
  );

  // 2. BFS 查找最近的元素
  console.log("\n2. BFS 查找最近的元素:");

  function findElementByClassBFS(root, targetClass) {
    if (!root) return null;

    const queue = [{ node: root, level: 0 }];

    while (queue.length > 0) {
      const { node, level } = queue.shift();

      console.log(
        `第 ${level} 层检查: ${node.tagName}${
          node.className ? "." + node.className : ""
        }`
      );

      if (node.className.includes(targetClass)) {
        console.log(
          `✅ 找到目标元素: ${node.tagName}.${node.className} (层级: ${level})`
        );
        return { node, level };
      }

      for (let child of node.children) {
        queue.push({ node: child, level: level + 1 });
      }
    }

    return null;
  }

  const foundByClass = findElementByClassBFS(mockDOM, "section");
  console.log(
    "BFS 查找结果:",
    foundByClass
      ? `${foundByClass.node.tagName}.${foundByClass.node.className} (层级: ${foundByClass.level})`
      : "未找到"
  );

  // 3. 收集所有文本内容
  console.log("\n3. 收集所有文本内容:");

  function collectTextContentDFS(node, texts = []) {
    if (!node) return texts;

    if (node.textContent) {
      texts.push(node.textContent);
    }

    for (let child of node.children) {
      collectTextContentDFS(child, texts);
    }

    return texts;
  }

  function collectTextContentBFS(root) {
    if (!root) return [];

    const queue = [root];
    const texts = [];

    while (queue.length > 0) {
      const node = queue.shift();

      if (node.textContent) {
        texts.push(node.textContent);
      }

      for (let child of node.children) {
        queue.push(child);
      }
    }

    return texts;
  }

  const dfsTexts = collectTextContentDFS(mockDOM);
  const bfsTexts = collectTextContentBFS(mockDOM);

  console.log("DFS 文本收集:", dfsTexts);
  console.log("BFS 文本收集:", bfsTexts);
  console.log("注意: DFS 按深度优先顺序，BFS 按层级顺序");
}

domTraversalDemo();
```

### 文件系统遍历

```javascript
// 文件系统遍历应用
function fileSystemTraversalDemo() {
  console.log("=== 文件系统遍历应用演示 ===");

  // 模拟文件系统结构
  const fileSystem = {
    name: "root",
    type: "directory",
    size: 0,
    children: [
      {
        name: "documents",
        type: "directory",
        size: 0,
        children: [
          { name: "resume.pdf", type: "file", size: 1024 },
          { name: "cover-letter.docx", type: "file", size: 512 },
          {
            name: "projects",
            type: "directory",
            size: 0,
            children: [
              { name: "project1.zip", type: "file", size: 2048 },
              { name: "project2.zip", type: "file", size: 1536 },
            ],
          },
        ],
      },
      {
        name: "images",
        type: "directory",
        size: 0,
        children: [
          { name: "photo1.jpg", type: "file", size: 3072 },
          { name: "photo2.png", type: "file", size: 2560 },
        ],
      },
      { name: "config.json", type: "file", size: 256 },
    ],
  };

  // 1. DFS 计算目录总大小
  console.log("1. DFS 计算目录总大小:");

  function calculateSizeDFS(node, path = "") {
    const currentPath = path + "/" + node.name;
    console.log(`访问: ${currentPath} (${node.type})`);

    if (node.type === "file") {
      console.log(`  文件大小: ${node.size} bytes`);
      return node.size;
    }

    let totalSize = 0;
    for (let child of node.children) {
      totalSize += calculateSizeDFS(child, currentPath);
    }

    console.log(`  目录 ${currentPath} 总大小: ${totalSize} bytes`);
    return totalSize;
  }

  const totalSize = calculateSizeDFS(fileSystem);
  console.log(`根目录总大小: ${totalSize} bytes`);

  // 2. BFS 按层级列出文件
  console.log("\n2. BFS 按层级列出文件:");

  function listFilesByLevelBFS(root) {
    if (!root) return [];

    const queue = [{ node: root, level: 0, path: "" }];
    const levels = [];

    while (queue.length > 0) {
      const { node, level, path } = queue.shift();
      const currentPath = path + "/" + node.name;

      if (!levels[level]) {
        levels[level] = [];
      }

      levels[level].push({
        name: node.name,
        type: node.type,
        path: currentPath,
        size: node.size,
      });

      if (node.children) {
        for (let child of node.children) {
          queue.push({ node: child, level: level + 1, path: currentPath });
        }
      }
    }

    return levels;
  }

  const filesByLevel = listFilesByLevelBFS(fileSystem);
  filesByLevel.forEach((level, index) => {
    console.log(`第 ${index} 层:`);
    level.forEach((item) => {
      console.log(
        `  ${item.type === "file" ? "📄" : "📁"} ${item.name} ${
          item.type === "file" ? `(${item.size} bytes)` : ""
        }`
      );
    });
  });

  // 3. 查找特定类型文件
  console.log("\n3. 查找特定类型文件:");

  function findFilesByExtensionDFS(node, extension, results = [], path = "") {
    const currentPath = path + "/" + node.name;

    if (node.type === "file" && node.name.endsWith(extension)) {
      results.push({
        name: node.name,
        path: currentPath,
        size: node.size,
      });
    }

    if (node.children) {
      for (let child of node.children) {
        findFilesByExtensionDFS(child, extension, results, currentPath);
      }
    }

    return results;
  }

  function findFilesByExtensionBFS(root, extension) {
    if (!root) return [];

    const queue = [{ node: root, path: "" }];
    const results = [];

    while (queue.length > 0) {
      const { node, path } = queue.shift();
      const currentPath = path + "/" + node.name;

      if (node.type === "file" && node.name.endsWith(extension)) {
        results.push({
          name: node.name,
          path: currentPath,
          size: node.size,
        });
      }

      if (node.children) {
        for (let child of node.children) {
          queue.push({ node: child, path: currentPath });
        }
      }
    }

    return results;
  }

  const pdfFilesDFS = findFilesByExtensionDFS(fileSystem, ".pdf");
  const pdfFilesBFS = findFilesByExtensionBFS(fileSystem, ".pdf");

  console.log("DFS 查找 PDF 文件:", pdfFilesDFS);
  console.log("BFS 查找 PDF 文件:", pdfFilesBFS);
  console.log("结果相同，但查找顺序不同");
}

fileSystemTraversalDemo();
```

### 图遍历应用

```javascript
// 图遍历应用演示
function graphTraversalDemo() {
  console.log("=== 图遍历应用演示 ===");

  // 创建图结构（邻接表表示）
  const graph = {
    A: ["B", "C"],
    B: ["A", "D", "E"],
    C: ["A", "F"],
    D: ["B"],
    E: ["B", "F"],
    F: ["C", "E"],
  };

  console.log("图结构 (邻接表):");
  Object.entries(graph).forEach(([node, neighbors]) => {
    console.log(`${node}: [${neighbors.join(", ")}]`);
  });

  // 1. DFS 图遍历
  console.log("\n1. DFS 图遍历:");

  function dfsGraph(graph, start, visited = new Set(), path = []) {
    visited.add(start);
    path.push(start);
    console.log(`访问节点: ${start}`);

    for (let neighbor of graph[start] || []) {
      if (!visited.has(neighbor)) {
        dfsGraph(graph, neighbor, visited, path);
      }
    }

    return path;
  }

  const dfsPath = dfsGraph(graph, "A");
  console.log("DFS 遍历路径:", dfsPath);

  // 2. BFS 图遍历
  console.log("\n2. BFS 图遍历:");

  function bfsGraph(graph, start) {
    const visited = new Set();
    const queue = [start];
    const path = [];

    visited.add(start);

    while (queue.length > 0) {
      const node = queue.shift();
      path.push(node);
      console.log(`访问节点: ${node}`);

      for (let neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return path;
  }

  const bfsPath = bfsGraph(graph, "A");
  console.log("BFS 遍历路径:", bfsPath);

  // 3. 寻找最短路径（BFS 适用于无权图）
  console.log("\n3. 寻找最短路径:");

  function findShortestPathBFS(graph, start, target) {
    if (start === target) return [start];

    const queue = [{ node: start, path: [start] }];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const { node, path } = queue.shift();

      for (let neighbor of graph[node] || []) {
        if (neighbor === target) {
          const shortestPath = [...path, neighbor];
          console.log(`找到最短路径: ${shortestPath.join(" -> ")}`);
          return shortestPath;
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }

    console.log("未找到路径");
    return null;
  }

  const shortestPath = findShortestPathBFS(graph, "A", "F");
  console.log("A 到 F 的最短路径:", shortestPath);

  // 4. 检测环路（DFS 适用）
  console.log("\n4. 检测环路:");

  function hasCycleDFS(
    graph,
    start,
    visited = new Set(),
    recursionStack = new Set()
  ) {
    visited.add(start);
    recursionStack.add(start);

    for (let neighbor of graph[start] || []) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(graph, neighbor, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        console.log(`检测到环路: ${start} -> ${neighbor}`);
        return true;
      }
    }

    recursionStack.delete(start);
    return false;
  }

  // 创建有向图测试环路检测
  const directedGraph = {
    A: ["B"],
    B: ["C"],
    C: ["A"], // 形成环路 A -> B -> C -> A
    D: ["E"],
    E: [],
  };

  console.log("有向图结构:");
  Object.entries(directedGraph).forEach(([node, neighbors]) => {
    console.log(`${node}: [${neighbors.join(", ")}]`);
  });

  const hasCycle = hasCycleDFS(directedGraph, "A");
  console.log("是否存在环路:", hasCycle);
}

graphTraversalDemo();
```

---

## 问题 4：性能优化和实际考虑

### 内存优化策略

```javascript
// 内存优化策略演示
function memoryOptimizationDemo() {
  console.log("=== 内存优化策略演示 ===");

  // 创建大型树结构用于测试
  function createLargeTree(depth, branching = 3) {
    if (depth <= 0) return null;

    const node = {
      id: Math.random().toString(36).substr(2, 9),
      value: Math.floor(Math.random() * 1000),
      children: [],
    };

    if (depth > 1) {
      for (let i = 0; i < branching; i++) {
        const child = createLargeTree(depth - 1, branching);
        if (child) node.children.push(child);
      }
    }

    return node;
  }

  // 1. 迭代 vs 递归的内存使用
  console.log("1. 迭代 vs 递归的内存使用:");

  // 递归 DFS（可能栈溢出）
  function dfsRecursive(node, callback, depth = 0) {
    if (!node) return;

    callback(node, depth);

    for (let child of node.children) {
      dfsRecursive(child, callback, depth + 1);
    }
  }

  // 迭代 DFS（使用显式栈）
  function dfsIterative(root, callback) {
    if (!root) return;

    const stack = [{ node: root, depth: 0 }];

    while (stack.length > 0) {
      const { node, depth } = stack.pop();
      callback(node, depth);

      // 逆序添加子节点以保持遍历顺序
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }

  const testTree = createLargeTree(6, 2);
  let nodeCount = 0;

  console.log("测试递归 DFS:");
  console.time("递归 DFS");
  try {
    dfsRecursive(testTree, (node, depth) => {
      nodeCount++;
    });
    console.log(`递归 DFS 成功，访问了 ${nodeCount} 个节点`);
  } catch (error) {
    console.log("递归 DFS 失败:", error.message);
  }
  console.timeEnd("递归 DFS");

  nodeCount = 0;
  console.log("测试迭代 DFS:");
  console.time("迭代 DFS");
  dfsIterative(testTree, (node, depth) => {
    nodeCount++;
  });
  console.log(`迭代 DFS 成功，访问了 ${nodeCount} 个节点`);
  console.timeEnd("迭代 DFS");

  // 2. 惰性遍历（生成器）
  console.log("\n2. 惰性遍历（生成器）:");

  function* dfsGenerator(node, depth = 0) {
    if (!node) return;

    yield { node, depth };

    for (let child of node.children) {
      yield* dfsGenerator(child, depth + 1);
    }
  }

  function* bfsGenerator(root) {
    if (!root) return;

    const queue = [{ node: root, depth: 0 }];

    while (queue.length > 0) {
      const item = queue.shift();
      yield item;

      for (let child of item.node.children) {
        queue.push({ node: child, depth: item.depth + 1 });
      }
    }
  }

  console.log("DFS 生成器（前5个节点）:");
  let count = 0;
  for (let { node, depth } of dfsGenerator(testTree)) {
    console.log(`  深度 ${depth}: ${node.id}`);
    if (++count >= 5) break;
  }

  console.log("BFS 生成器（前5个节点）:");
  count = 0;
  for (let { node, depth } of bfsGenerator(testTree)) {
    console.log(`  深度 ${depth}: ${node.id}`);
    if (++count >= 5) break;
  }

  // 3. 分批处理大型数据
  console.log("\n3. 分批处理大型数据:");

  async function processBatchDFS(root, batchSize = 100, processor) {
    const stack = [root];
    let batch = [];
    let totalProcessed = 0;

    while (stack.length > 0) {
      const node = stack.pop();
      batch.push(node);

      // 添加子节点到栈
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }

      // 处理批次
      if (batch.length >= batchSize) {
        await processor(batch);
        totalProcessed += batch.length;
        batch = [];

        // 让出控制权，避免阻塞
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // 处理剩余的节点
    if (batch.length > 0) {
      await processor(batch);
      totalProcessed += batch.length;
    }

    return totalProcessed;
  }

  async function batchProcessor(batch) {
    console.log(`处理批次，包含 ${batch.length} 个节点`);
    // 模拟处理时间
    return new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log("开始分批处理:");
  processBatchDFS(testTree, 50, batchProcessor).then((total) => {
    console.log(`分批处理完成，总共处理了 ${total} 个节点`);
  });
}

memoryOptimizationDemo();
```

### 选择合适的遍历策略

```javascript
// 选择合适的遍历策略指南
function traversalStrategyGuide() {
  console.log("=== 遍历策略选择指南 ===");

  console.log(`
  选择 DFS 的场景：
  
  1. 🎯 查找特定路径或解决方案
     - 迷宫求解
     - 数独求解
     - 回溯算法
  
  2. 📊 需要完整遍历子树
     - 计算目录大小
     - 复制文件夹结构
     - 语法树分析
  
  3. 💾 内存受限的环境
     - 深度较大但宽度较小的树
     - 需要节省内存的场景
  
  4. 🔍 检测环路或依赖关系
     - 拓扑排序
     - 依赖分析
  
  选择 BFS 的场景：
  
  1. 🎯 查找最短路径
     - 无权图最短路径
     - 最少步数问题
     - 层级关系分析
  
  2. 📊 按层级处理数据
     - 层序遍历
     - 广播消息
     - 影响范围分析
  
  3. 💾 深度较大的树结构
     - 避免栈溢出
     - 控制搜索深度
  
  4. 🔍 查找最近的节点
     - 最近邻搜索
     - 范围查询
  `);

  // 实际应用示例对比
  console.log("实际应用示例对比:");

  // 场景1: 查找文件（DFS 更适合）
  console.log("\n场景1: 在深层目录中查找特定文件");

  const deepFileSystem = {
    name: "root",
    type: "directory",
    children: [
      {
        name: "level1",
        type: "directory",
        children: [
          {
            name: "level2",
            type: "directory",
            children: [
              {
                name: "level3",
                type: "directory",
                children: [{ name: "target.txt", type: "file" }],
              },
            ],
          },
        ],
      },
    ],
  };

  function findFileDFS(node, filename, path = "") {
    const currentPath = path + "/" + node.name;

    if (node.type === "file" && node.name === filename) {
      console.log(`✅ DFS 找到文件: ${currentPath}`);
      return currentPath;
    }

    if (node.children) {
      for (let child of node.children) {
        const result = findFileDFS(child, filename, currentPath);
        if (result) return result;
      }
    }

    return null;
  }

  function findFileBFS(root, filename) {
    const queue = [{ node: root, path: "" }];

    while (queue.length > 0) {
      const { node, path } = queue.shift();
      const currentPath = path + "/" + node.name;

      if (node.type === "file" && node.name === filename) {
        console.log(`✅ BFS 找到文件: ${currentPath}`);
        return currentPath;
      }

      if (node.children) {
        for (let child of node.children) {
          queue.push({ node: child, path: currentPath });
        }
      }
    }

    return null;
  }

  console.time("DFS 查找文件");
  findFileDFS(deepFileSystem, "target.txt");
  console.timeEnd("DFS 查找文件");

  console.time("BFS 查找文件");
  findFileBFS(deepFileSystem, "target.txt");
  console.timeEnd("BFS 查找文件");

  console.log("结论: 对于深层文件查找，DFS 通常更快到达目标");

  // 场景2: 查找最近的节点（BFS 更适合）
  console.log("\n场景2: 查找距离根节点最近的特定类型节点");

  const wideTree = {
    type: "root",
    children: [
      { type: "normal", children: [{ type: "target" }] },
      { type: "normal", children: [{ type: "normal" }] },
      { type: "target", children: [] }, // 这个更近
      { type: "normal", children: [{ type: "target" }] },
    ],
  };

  function findNearestDFS(node, targetType, depth = 0) {
    if (node.type === targetType) {
      console.log(`✅ DFS 找到目标，深度: ${depth}`);
      return { node, depth };
    }

    for (let child of node.children) {
      const result = findNearestDFS(child, targetType, depth + 1);
      if (result) return result;
    }

    return null;
  }

  function findNearestBFS(root, targetType) {
    const queue = [{ node: root, depth: 0 }];

    while (queue.length > 0) {
      const { node, depth } = queue.shift();

      if (node.type === targetType) {
        console.log(`✅ BFS 找到目标，深度: ${depth}`);
        return { node, depth };
      }

      for (let child of node.children) {
        queue.push({ node: child, depth: depth + 1 });
      }
    }

    return null;
  }

  console.log("DFS 查找最近目标:");
  const dfsNearest = findNearestDFS(wideTree, "target");

  console.log("BFS 查找最近目标:");
  const bfsNearest = findNearestBFS(wideTree, "target");

  console.log("结论: BFS 保证找到距离根节点最近的目标节点");
}

traversalStrategyGuide();
```

---

## 总结

### 深度遍历 vs 广度遍历总结

```javascript
// 深度遍历 vs 广度遍历总结
function traversalSummary() {
  console.log("=== 深度遍历 vs 广度遍历总结 ===");

  console.log(`
  核心区别对比：
  
  | 特性 | 深度优先遍历 (DFS) | 广度优先遍历 (BFS) |
  |------|-------------------|-------------------|
  | 数据结构 | 栈 (Stack) | 队列 (Queue) |
  | 遍历顺序 | 先深入，后广度 | 先广度，后深入 |
  | 空间复杂度 | O(h) - 树的高度 | O(w) - 树的最大宽度 |
  | 时间复杂度 | O(n) - 节点数量 | O(n) - 节点数量 |
  | 实现方式 | 递归或显式栈 | 队列 |
  | 内存使用 | 深度相关 | 宽度相关 |
  
  适用场景：
  
  DFS 适合：
  ✅ 路径查找和回溯
  ✅ 拓扑排序
  ✅ 环路检测
  ✅ 深层数据挖掘
  ✅ 内存受限环境
  
  BFS 适合：
  ✅ 最短路径查找
  ✅ 层级遍历
  ✅ 最近邻搜索
  ✅ 广播传播
  ✅ 避免深度栈溢出
  
  性能考虑：
  
  1. 内存使用：
     - DFS: 取决于树的深度
     - BFS: 取决于树的宽度
  
  2. 查找效率：
     - DFS: 目标在深层时更快
     - BFS: 目标在浅层时更快
  
  3. 实现复杂度：
     - DFS: 递归实现简单
     - BFS: 迭代实现直观
  
  最佳实践：
  
  1. 根据数据结构特点选择
  2. 考虑内存限制
  3. 评估查找目标的位置
  4. 使用生成器进行惰性遍历
  5. 大数据集考虑分批处理
  `);
}

traversalSummary();
```

### 关键要点

| 方面           | DFS                  | BFS                |
| -------------- | -------------------- | ------------------ |
| **核心思想**   | 尽可能深入，然后回溯 | 逐层扩展，层层推进 |
| **数据结构**   | 栈（LIFO）           | 队列（FIFO）       |
| **空间复杂度** | O(深度)              | O(宽度)            |
| **最佳场景**   | 路径查找、回溯       | 最短路径、层级处理 |
| **实现难度**   | 递归简单             | 迭代直观           |

理解深度遍历和广度遍历的区别有助于：

- 选择合适的算法解决特定问题
- 优化程序的时间和空间性能
- 处理复杂的数据结构遍历需求
- 实现高效的搜索和查找功能
