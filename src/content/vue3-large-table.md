---
title: 如何处理大型表格（上万行）渲染问题？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 中处理大数据量表格的优化策略和实现方案。
tags:
  - Vue
  - 性能优化
  - 虚拟滚动
  - 大数据
estimatedTime: 15 分钟
keywords:
  - 大型表格
  - 虚拟滚动
  - 性能优化
highlight: 通过虚拟滚动、分页、懒加载等策略解决大数据量表格的性能问题。
order: 274
---

## 问题 1：问题分析

渲染上万行数据的问题：

```vue
<!-- ❌ 直接渲染：严重卡顿 -->
<template>
  <table>
    <tr v-for="item in items" :key="item.id">
      <td>{{ item.name }}</td>
    </tr>
  </table>
</template>

<!-- 10000 行 = 10000 个 DOM 节点 -->
<!-- 内存占用高，渲染慢，滚动卡顿 -->
```

---

## 问题 2：虚拟滚动

只渲染可视区域内的行：

```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps<{
  items: any[]
  itemHeight: number
  containerHeight: number
}>()

const scrollTop = ref(0)

// 计算可视区域
const visibleCount = computed(() =>
  Math.ceil(props.containerHeight / props.itemHeight) + 2
)

const startIndex = computed(() =>
  Math.floor(scrollTop.value / props.itemHeight)
)

const endIndex = computed(() =>
  startIndex.value + visibleCount.value
)

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value)
)

const offsetY = computed(() =>
  startIndex.value * props.itemHeight
)

const totalHeight = computed(() =>
  props.items.length * props.itemHeight
)

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}
</script>

<template>
  <div
    class="container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="onScroll"
  >
    <div :style="{ height: totalHeight + 'px' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="item.id"
          :style="{ height: itemHeight + 'px' }"
        >
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 问题 3：使用 VueUse

```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const allItems = ref([...]) // 10000 条数据

const { list, containerProps, wrapperProps } = useVirtualList(
  allItems,
  {
    itemHeight: 40,
    overscan: 5  // 额外渲染的行数
  }
)
</script>

<template>
  <div v-bind="containerProps" class="container">
    <div v-bind="wrapperProps">
      <div v-for="{ data, index } in list" :key="index" class="row">
        {{ data.name }}
      </div>
    </div>
  </div>
</template>
```

---

## 问题 4：动态行高

```typescript
// 处理不定高度的行
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(items, {
  // 动态获取行高
  itemHeight: (index) => {
    return items.value[index].expanded ? 100 : 40;
  },
});

// 或使用 vue-virtual-scroller
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
```

```vue
<template>
  <DynamicScroller :items="items" :min-item-size="40" class="scroller">
    <template #default="{ item, index, active }">
      <DynamicScrollerItem :item="item" :active="active" :data-index="index">
        <div class="row">{{ item.name }}</div>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>
```

---

## 问题 5：分页加载

```vue
<script setup>
const page = ref(1);
const pageSize = 100;
const total = ref(0);
const items = ref([]);

async function loadPage(p: number) {
  const { data, total: t } = await api.getList({ page: p, pageSize });
  items.value = data;
  total.value = t;
}

// 无限滚动
const { arrivedState } = useScroll(containerRef);

watch(
  () => arrivedState.bottom,
  (arrived) => {
    if (arrived && items.value.length < total.value) {
      loadMore();
    }
  }
);

async function loadMore() {
  page.value++;
  const { data } = await api.getList({ page: page.value, pageSize });
  items.value.push(...data);
}
</script>
```

---

## 问题 6：Web Worker 处理数据

```typescript
// worker.ts
self.onmessage = (e) => {
  const { data, filter, sort } = e.data;

  let result = data;

  // 在 Worker 中进行过滤和排序
  if (filter) {
    result = result.filter((item) => item.name.includes(filter));
  }

  if (sort) {
    result = result.sort((a, b) => a[sort.key] - b[sort.key]);
  }

  self.postMessage(result);
};

// 组件中使用
const worker = new Worker(new URL("./worker.ts", import.meta.url));

function filterData(keyword: string) {
  worker.postMessage({ data: allItems.value, filter: keyword });
}

worker.onmessage = (e) => {
  filteredItems.value = e.data;
};
```

---

## 问题 7：表格组件优化

```vue
<script setup>
// 1. 使用 shallowRef 减少响应式开销
const items = shallowRef([]);

// 2. 使用 v-memo 缓存行
// 3. 避免在模板中进行复杂计算
// 4. 使用 CSS contain 优化渲染
</script>

<template>
  <div class="table" style="contain: strict;">
    <div
      v-for="item in visibleItems"
      :key="item.id"
      v-memo="[item.id, item.selected]"
      class="row"
    >
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>
```

---

## 问题 8：完整方案对比

| 方案     | 适用场景 | 优点     | 缺点         |
| -------- | -------- | -------- | ------------ |
| 虚拟滚动 | 固定高度 | 性能最好 | 实现复杂     |
| 分页     | 通用     | 简单     | 用户体验一般 |
| 无限滚动 | 列表流   | 体验好   | 内存增长     |
| 懒加载   | 按需展示 | 初始快   | 滚动时加载   |

### 推荐库

- **vue-virtual-scroller**：功能完整
- **@vueuse/core**：useVirtualList
- **vxe-table**：专业表格组件

## 延伸阅读

- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)
- [VueUse - useVirtualList](https://vueuse.org/core/useVirtualList/)
