---
title: 如何实现无限滚动列表？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握实现无限滚动列表的多种方法和最佳实践。
tags:
  - React
  - 无限滚动
  - 性能
  - 列表
estimatedTime: 12 分钟
keywords:
  - infinite scroll
  - lazy loading
  - intersection observer
  - pagination
highlight: 无限滚动可通过 Intersection Observer 或滚动事件监听实现，配合分页加载数据。
order: 296
---

## 问题 1：使用 Intersection Observer

### 基本实现

```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  // 加载数据
  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const newItems = await fetchItems(page);

    setItems((prev) => [...prev, ...newItems]);
    setPage((prev) => prev + 1);
    setHasMore(newItems.length > 0);
    setLoading(false);
  };

  // 监听底部元素
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [page, loading, hasMore]);

  return (
    <div>
      {items.map((item) => (
        <Item key={item.id} data={item} />
      ))}

      <div ref={loaderRef}>
        {loading && <Spinner />}
        {!hasMore && <p>没有更多了</p>}
      </div>
    </div>
  );
}
```

---

## 问题 2：使用滚动事件

### 监听滚动位置

```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // 距离底部 100px 时加载
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [loading]);

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} style={{ height: "100vh", overflow: "auto" }}>
      {items.map((item) => (
        <Item key={item.id} data={item} />
      ))}
      {loading && <Spinner />}
    </div>
  );
}
```

### 节流优化

```jsx
import { throttle } from "lodash";

const handleScroll = useMemo(
  () =>
    throttle(() => {
      // 滚动处理逻辑
    }, 200),
  []
);
```

---

## 问题 3：封装自定义 Hook

### useInfiniteScroll

```jsx
function useInfiniteScroll(fetchFn, options = {}) {
  const { threshold = 100 } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchFn(page);
      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
      setHasMore(newData.length > 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFn]);

  const sentinelRef = useCallback(
    (node) => {
      if (!node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: `${threshold}px` }
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMore, threshold]
  );

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  return { data, loading, hasMore, error, sentinelRef, reset };
}

// 使用
function List() {
  const { data, loading, hasMore, sentinelRef } = useInfiniteScroll((page) =>
    fetchItems(page)
  );

  return (
    <div>
      {data.map((item) => (
        <Item key={item.id} data={item} />
      ))}
      <div ref={sentinelRef} />
      {loading && <Spinner />}
    </div>
  );
}
```

---

## 问题 4：配合 React Query

### 使用 useInfiniteQuery

```jsx
import { useInfiniteQuery } from "@tanstack/react-query";

function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["items"],
      queryFn: ({ pageParam = 1 }) => fetchItems(pageParam),
      getNextPageParam: (lastPage, pages) => {
        return lastPage.length > 0 ? pages.length + 1 : undefined;
      },
    });

  const loaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.map((item) => <Item key={item.id} data={item} />)
      )}
      <div ref={loaderRef}>{isFetchingNextPage && <Spinner />}</div>
    </div>
  );
}
```

---

## 问题 5：性能优化

### 配合虚拟列表

```jsx
// 大量数据时，配合虚拟列表
import { FixedSizeList } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

function VirtualInfiniteList({ items, loadMore, hasMore }) {
  const itemCount = hasMore ? items.length + 1 : items.length;

  const isItemLoaded = (index) => !hasMore || index < items.length;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMore}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          ref={ref}
          height={600}
          itemCount={itemCount}
          itemSize={50}
          onItemsRendered={onItemsRendered}
        >
          {({ index, style }) => (
            <div style={style}>
              {isItemLoaded(index) ? items[index].name : "Loading..."}
            </div>
          )}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
}
```

## 总结

| 方法                  | 优点         | 缺点          |
| --------------------- | ------------ | ------------- |
| Intersection Observer | 性能好，简洁 | 需要 polyfill |
| 滚动事件              | 兼容性好     | 需要节流      |
| React Query           | 功能完善     | 额外依赖      |

## 延伸阅读

- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/react/guides/infinite-queries)
