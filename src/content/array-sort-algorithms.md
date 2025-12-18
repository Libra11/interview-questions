---
title: 常见的数组排序算法有哪些？
category: 算法
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解常见的排序算法，包括冒泡排序、选择排序、插入排序、快速排序、归并排序等，掌握每种算法的实现原理、时间复杂度和适用场景。
tags:
  - 排序算法
  - 数据结构
  - 算法复杂度
  - 面试题
estimatedTime: 32 分钟
keywords:
  - 排序算法
  - 冒泡排序
  - 快速排序
  - 归并排序
  - 时间复杂度
highlight: 快速排序和归并排序是最常用的高效排序算法，平均时间复杂度为 O(n log n)
order: 391
---

## 问题 1：什么是冒泡排序？

冒泡排序是最简单的排序算法，通过**重复遍历数组，比较相邻元素并交换**，使较大的元素逐渐"冒泡"到数组末尾。

### 基本实现

```javascript
// 冒泡排序
function bubbleSort(arr) {
  const n = arr.length;
  
  // 外层循环：控制遍历次数
  for (let i = 0; i < n - 1; i++) {
    // 内层循环：比较相邻元素
    for (let j = 0; j < n - 1 - i; j++) {
      // 如果前一个元素大于后一个元素，交换它们
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  
  return arr;
}

// 测试
const arr = [64, 34, 25, 12, 22, 11, 90];
console.log(bubbleSort(arr)); // [11, 12, 22, 25, 34, 64, 90]
```

### 优化版本

```javascript
// 优化的冒泡排序：添加标志位，如果某次遍历没有交换，说明已经有序
function bubbleSortOptimized(arr) {
  const n = arr.length;
  
  for (let i = 0; i < n - 1; i++) {
    let swapped = false; // 标志位
    
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    
    // 如果这一轮没有交换，说明已经有序
    if (!swapped) {
      break;
    }
  }
  
  return arr;
}

// 测试
const arr = [1, 2, 3, 5, 4];
console.log(bubbleSortOptimized(arr)); // [1, 2, 3, 4, 5]
// 只需要一轮就能完成排序
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n) - 数组已经有序
// - 平均情况：O(n²)
// - 最坏情况：O(n²) - 数组完全逆序

// 空间复杂度：O(1) - 只需要常数级额外空间

// 稳定性：稳定 - 相等元素的相对位置不会改变

// 适用场景：
// - 数据量小
// - 数组基本有序
// - 教学演示
```

---

## 问题 2：什么是选择排序？

选择排序通过**每次从未排序部分选择最小元素**，放到已排序部分的末尾。

### 基本实现

```javascript
// 选择排序
function selectionSort(arr) {
  const n = arr.length;
  
  // 外层循环：控制已排序部分的边界
  for (let i = 0; i < n - 1; i++) {
    // 假设当前位置是最小值
    let minIndex = i;
    
    // 内层循环：在未排序部分找最小值
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    
    // 将最小值交换到已排序部分的末尾
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  
  return arr;
}

// 测试
const arr = [64, 25, 12, 22, 11];
console.log(selectionSort(arr)); // [11, 12, 22, 25, 64]
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n²)
// - 平均情况：O(n²)
// - 最坏情况：O(n²)
// 无论数组是否有序，都需要遍历所有元素

// 空间复杂度：O(1)

// 稳定性：不稳定
// 例如：[5, 8, 5, 2]
// 第一次选择 2，会将第一个 5 和 2 交换
// 导致两个 5 的相对位置改变

// 适用场景：
// - 数据量小
// - 交换操作代价较大（选择排序交换次数少）
```

---

## 问题 3：什么是插入排序？

插入排序通过**构建有序序列**，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。

### 基本实现

```javascript
// 插入排序
function insertionSort(arr) {
  const n = arr.length;
  
  // 从第二个元素开始，认为第一个元素已经有序
  for (let i = 1; i < n; i++) {
    const current = arr[i]; // 当前要插入的元素
    let j = i - 1;
    
    // 在已排序部分找到插入位置
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j]; // 元素后移
      j--;
    }
    
    // 插入元素
    arr[j + 1] = current;
  }
  
  return arr;
}

// 测试
const arr = [12, 11, 13, 5, 6];
console.log(insertionSort(arr)); // [5, 6, 11, 12, 13]
```

### 二分插入排序

```javascript
// 使用二分查找优化查找插入位置
function binaryInsertionSort(arr) {
  const n = arr.length;
  
  for (let i = 1; i < n; i++) {
    const current = arr[i];
    
    // 使用二分查找找到插入位置
    let left = 0;
    let right = i - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] > current) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    // 移动元素
    for (let j = i - 1; j >= left; j--) {
      arr[j + 1] = arr[j];
    }
    
    // 插入元素
    arr[left] = current;
  }
  
  return arr;
}

// 测试
const arr = [12, 11, 13, 5, 6];
console.log(binaryInsertionSort(arr)); // [5, 6, 11, 12, 13]
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n) - 数组已经有序
// - 平均情况：O(n²)
// - 最坏情况：O(n²) - 数组完全逆序

// 空间复杂度：O(1)

// 稳定性：稳定

// 适用场景：
// - 数据量小
// - 数组基本有序
// - 在线排序（边接收数据边排序）
```

---

## 问题 4：什么是快速排序？

快速排序是最常用的排序算法之一，采用**分治策略**，选择一个基准元素，将数组分为小于和大于基准的两部分，递归排序。

### 基本实现

```javascript
// 快速排序
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    // 获取分区点
    const pivotIndex = partition(arr, left, right);
    
    // 递归排序左右两部分
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
  
  return arr;
}

// 分区函数
function partition(arr, left, right) {
  // 选择最右边的元素作为基准
  const pivot = arr[right];
  let i = left - 1; // 小于基准的区域的右边界
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  // 将基准放到正确位置
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  
  return i + 1;
}

// 测试
const arr = [10, 7, 8, 9, 1, 5];
console.log(quickSort(arr)); // [1, 5, 7, 8, 9, 10]
```

### 三路快排（处理重复元素）

```javascript
// 三路快排：将数组分为小于、等于、大于基准的三部分
function quickSort3Way(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  
  const pivot = arr[left];
  let lt = left;      // arr[left+1...lt] < pivot
  let gt = right;     // arr[gt...right] > pivot
  let i = left + 1;   // arr[lt+1...i-1] === pivot
  
  while (i <= gt) {
    if (arr[i] < pivot) {
      [arr[lt + 1], arr[i]] = [arr[i], arr[lt + 1]];
      lt++;
      i++;
    } else if (arr[i] > pivot) {
      [arr[i], arr[gt]] = [arr[gt], arr[i]];
      gt--;
    } else {
      i++;
    }
  }
  
  [arr[left], arr[lt]] = [arr[lt], arr[left]];
  
  quickSort3Way(arr, left, lt - 1);
  quickSort3Way(arr, gt + 1, right);
  
  return arr;
}

// 测试（有重复元素）
const arr = [4, 2, 4, 1, 4, 3, 4];
console.log(quickSort3Way(arr)); // [1, 2, 3, 4, 4, 4, 4]
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n log n) - 每次都平分数组
// - 平均情况：O(n log n)
// - 最坏情况：O(n²) - 数组已经有序，每次只分出一个元素

// 空间复杂度：O(log n) - 递归调用栈

// 稳定性：不稳定

// 适用场景：
// - 大数据量
// - 平均情况下性能最好
// - 实际应用最广泛
```

---

## 问题 5：什么是归并排序？

归并排序采用**分治策略**，将数组分成两半，递归排序后再合并。

### 基本实现

```javascript
// 归并排序
function mergeSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  
  // 分割数组
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);
  
  // 递归排序并合并
  return merge(mergeSort(left), mergeSort(right));
}

// 合并两个有序数组
function merge(left, right) {
  const result = [];
  let i = 0;
  let j = 0;
  
  // 比较两个数组的元素，将较小的放入结果数组
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  // 将剩余元素放入结果数组
  while (i < left.length) {
    result.push(left[i]);
    i++;
  }
  
  while (j < right.length) {
    result.push(right[j]);
    j++;
  }
  
  return result;
}

// 测试
const arr = [38, 27, 43, 3, 9, 82, 10];
console.log(mergeSort(arr)); // [3, 9, 10, 27, 38, 43, 82]
```

### 原地归并排序

```javascript
// 原地归并排序（不使用额外数组）
function mergeSortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  
  const mid = Math.floor((left + right) / 2);
  
  // 递归排序左右两部分
  mergeSortInPlace(arr, left, mid);
  mergeSortInPlace(arr, mid + 1, right);
  
  // 合并
  mergeInPlace(arr, left, mid, right);
  
  return arr;
}

function mergeInPlace(arr, left, mid, right) {
  // 创建临时数组
  const temp = [];
  let i = left;
  let j = mid + 1;
  
  // 合并到临时数组
  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      temp.push(arr[i++]);
    } else {
      temp.push(arr[j++]);
    }
  }
  
  while (i <= mid) {
    temp.push(arr[i++]);
  }
  
  while (j <= right) {
    temp.push(arr[j++]);
  }
  
  // 复制回原数组
  for (let k = 0; k < temp.length; k++) {
    arr[left + k] = temp[k];
  }
}

// 测试
const arr = [38, 27, 43, 3, 9, 82, 10];
console.log(mergeSortInPlace(arr)); // [3, 9, 10, 27, 38, 43, 82]
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n log n)
// - 平均情况：O(n log n)
// - 最坏情况：O(n log n)
// 无论什么情况都是 O(n log n)

// 空间复杂度：O(n) - 需要额外的数组空间

// 稳定性：稳定

// 适用场景：
// - 需要稳定排序
// - 数据量大
// - 外部排序（数据在磁盘上）
```

---

## 问题 6：什么是堆排序？

堆排序利用**堆这种数据结构**，将数组构建成最大堆，然后依次取出堆顶元素。

### 基本实现

```javascript
// 堆排序
function heapSort(arr) {
  const n = arr.length;
  
  // 1. 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }
  
  // 2. 依次取出堆顶元素
  for (let i = n - 1; i > 0; i--) {
    // 将堆顶（最大值）与末尾元素交换
    [arr[0], arr[i]] = [arr[i], arr[0]];
    
    // 重新调整堆
    heapify(arr, i, 0);
  }
  
  return arr;
}

// 调整堆
function heapify(arr, n, i) {
  let largest = i;       // 假设父节点最大
  const left = 2 * i + 1;  // 左子节点
  const right = 2 * i + 2; // 右子节点
  
  // 找出父节点和子节点中的最大值
  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }
  
  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }
  
  // 如果最大值不是父节点，交换并递归调整
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}

// 测试
const arr = [12, 11, 13, 5, 6, 7];
console.log(heapSort(arr)); // [5, 6, 7, 11, 12, 13]
```

### 复杂度分析

```javascript
// 时间复杂度：
// - 最好情况：O(n log n)
// - 平均情况：O(n log n)
// - 最坏情况：O(n log n)

// 空间复杂度：O(1)

// 稳定性：不稳定

// 适用场景：
// - 需要 O(n log n) 且空间复杂度 O(1)
// - 不需要稳定排序
```

---

## 问题 7：如何选择合适的排序算法？

根据不同场景选择最合适的排序算法。

### 算法对比

```javascript
// 排序算法对比表
const sortingAlgorithms = {
  冒泡排序: {
    最好: 'O(n)',
    平均: 'O(n²)',
    最坏: 'O(n²)',
    空间: 'O(1)',
    稳定: '是',
    适用: '小数据量、基本有序'
  },
  
  选择排序: {
    最好: 'O(n²)',
    平均: 'O(n²)',
    最坏: 'O(n²)',
    空间: 'O(1)',
    稳定: '否',
    适用: '小数据量、交换代价大'
  },
  
  插入排序: {
    最好: 'O(n)',
    平均: 'O(n²)',
    最坏: 'O(n²)',
    空间: 'O(1)',
    稳定: '是',
    适用: '小数据量、基本有序、在线排序'
  },
  
  快速排序: {
    最好: 'O(n log n)',
    平均: 'O(n log n)',
    最坏: 'O(n²)',
    空间: 'O(log n)',
    稳定: '否',
    适用: '大数据量、平均性能最好'
  },
  
  归并排序: {
    最好: 'O(n log n)',
    平均: 'O(n log n)',
    最坏: 'O(n log n)',
    空间: 'O(n)',
    稳定: '是',
    适用: '大数据量、需要稳定排序'
  },
  
  堆排序: {
    最好: 'O(n log n)',
    平均: 'O(n log n)',
    最坏: 'O(n log n)',
    空间: 'O(1)',
    稳定: '否',
    适用: '大数据量、空间受限'
  }
};
```

### 选择建议

```javascript
// 1. 数据量小（< 50）
// 推荐：插入排序
function sortSmallArray(arr) {
  if (arr.length < 50) {
    return insertionSort(arr);
  }
  return quickSort(arr);
}

// 2. 数据基本有序
// 推荐：插入排序或冒泡排序
function sortNearlySorted(arr) {
  // 插入排序在这种情况下接近 O(n)
  return insertionSort(arr);
}

// 3. 需要稳定排序
// 推荐：归并排序
function stableSort(arr) {
  return mergeSort(arr);
}

// 4. 空间受限
// 推荐：堆排序或快速排序
function sortWithLimitedSpace(arr) {
  return heapSort(arr);
}

// 5. 一般情况
// 推荐：快速排序
function generalSort(arr) {
  return quickSort(arr);
}

// 6. 有大量重复元素
// 推荐：三路快排
function sortWithDuplicates(arr) {
  return quickSort3Way(arr);
}
```

### JavaScript 内置排序

```javascript
// JavaScript 的 Array.sort()
// V8 引擎使用 Timsort（归并排序和插入排序的混合）

// 基本使用
const arr = [3, 1, 4, 1, 5, 9, 2, 6];
arr.sort((a, b) => a - b); // 升序
console.log(arr); // [1, 1, 2, 3, 4, 5, 6, 9]

// 降序
arr.sort((a, b) => b - a);
console.log(arr); // [9, 6, 5, 4, 3, 2, 1, 1]

// 对象排序
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 20 },
  { name: 'Charlie', age: 30 }
];

// 按年龄排序
users.sort((a, b) => a.age - b.age);
console.log(users);
// [
//   { name: 'Bob', age: 20 },
//   { name: 'Alice', age: 25 },
//   { name: 'Charlie', age: 30 }
// ]

// 多条件排序
const students = [
  { name: 'Alice', grade: 90, age: 20 },
  { name: 'Bob', grade: 90, age: 22 },
  { name: 'Charlie', grade: 85, age: 21 }
];

// 先按成绩降序，成绩相同按年龄升序
students.sort((a, b) => {
  if (a.grade !== b.grade) {
    return b.grade - a.grade;
  }
  return a.age - b.age;
});

console.log(students);
// [
//   { name: 'Alice', grade: 90, age: 20 },
//   { name: 'Bob', grade: 90, age: 22 },
//   { name: 'Charlie', grade: 85, age: 21 }
// ]
```

### 实际应用示例

```javascript
// 混合排序：根据数据量自动选择算法
function hybridSort(arr) {
  // 小数组使用插入排序
  if (arr.length < 10) {
    return insertionSort(arr);
  }
  
  // 大数组使用快速排序
  return quickSort(arr);
}

// 测试
console.log(hybridSort([5, 2, 8, 1, 9])); // 小数组
console.log(hybridSort(Array.from({ length: 100 }, () => Math.random()))); // 大数组

// 自定义排序：按多个条件排序
function customSort(arr, compareFn) {
  return quickSort(arr.slice(), 0, arr.length - 1, compareFn);
}

function quickSortWithCompare(arr, left, right, compare) {
  if (left < right) {
    const pivotIndex = partitionWithCompare(arr, left, right, compare);
    quickSortWithCompare(arr, left, pivotIndex - 1, compare);
    quickSortWithCompare(arr, pivotIndex + 1, right, compare);
  }
  return arr;
}

function partitionWithCompare(arr, left, right, compare) {
  const pivot = arr[right];
  let i = left - 1;
  
  for (let j = left; j < right; j++) {
    if (compare(arr[j], pivot) < 0) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}
```

---

## 总结

**排序算法的核心要点**：

### 1. 简单排序（O(n²)）
- **冒泡排序**：相邻元素比较交换
- **选择排序**：每次选择最小元素
- **插入排序**：构建有序序列

### 2. 高效排序（O(n log n)）
- **快速排序**：分治，选择基准分区
- **归并排序**：分治，递归合并
- **堆排序**：利用堆结构

### 3. 时间复杂度
- O(n²)：冒泡、选择、插入
- O(n log n)：快速、归并、堆
- 最好情况可能更优

### 4. 空间复杂度
- O(1)：冒泡、选择、插入、堆
- O(log n)：快速排序（递归栈）
- O(n)：归并排序

### 5. 稳定性
- 稳定：冒泡、插入、归并
- 不稳定：选择、快速、堆

### 6. 选择建议
- 小数据量：插入排序
- 大数据量：快速排序
- 需要稳定：归并排序
- 空间受限：堆排序

### 7. 实际应用
- JavaScript 使用 Timsort
- 根据场景选择算法
- 可以混合使用多种算法

## 延伸阅读

- [排序算法可视化](https://visualgo.net/zh/sorting)
- [十大经典排序算法](https://www.runoob.com/w3cnote/ten-sorting-algorithm.html)
- [算法导论 - 排序](https://book.douban.com/subject/20432061/)
- [JavaScript 排序算法详解](https://javascript.info/array-methods#sort-fn)
