---
title: React 开发过程中有哪些性能优化手段
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  总结 React 开发中常见的性能优化策略，包括组件优化、渲染优化、代码分割等多个维度。
  掌握这些优化技巧能够显著提升应用性能和用户体验。
tags:
  - React
  - 性能优化
  - 最佳实践
  - 工程化
estimatedTime: 26 分钟
keywords:
  - React 性能优化
  - memo
  - useMemo
  - 代码分割
highlight: 从组件设计、渲染策略、打包优化等多维度进行性能优化
order: 369
---

## 问题 1：组件层面有哪些优化手段？

**使用 React.memo、PureComponent 避免不必要的重新渲染**。

### 使用 React.memo

```jsx
// 避免父组件更新时子组件不必要的渲染
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent 渲染');
  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const data = useMemo(() => [{ id: 1, name: 'Item 1' }], []);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {/* data 不变，ExpensiveComponent 不会重新渲染 */}
      <ExpensiveComponent data={data} />
    </>
  );
}
```

### 使用 PureComponent

```jsx
class ListItem extends React.PureComponent {
  render() {
    console.log('ListItem 渲染');
    return <div>{this.props.item.name}</div>;
  }
}

// PureComponent 会自动进行浅比较
// props 没变化时不会重新渲染
```

---

## 问题 2：如何优化 Hooks 的使用？

**合理使用 useMemo、useCallback 缓存值和函数**。

### 使用 useMemo 缓存计算结果

```jsx
function ProductList({ products, filter }) {
  // 缓存过滤后的结果
  const filteredProducts = useMemo(() => {
    console.log('执行过滤');
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  return (
    <ul>
      {filteredProducts.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### 使用 useCallback 缓存函数

```jsx
function TodoList({ todos }) {
  const [filter, setFilter] = useState('all');

  // 缓存回调函数，避免子组件重新渲染
  const handleToggle = useCallback((id) => {
    toggleTodo(id);
  }, []);

  const handleDelete = useCallback((id) => {
    deleteTodo(id);
  }, []);

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}

const TodoItem = React.memo(function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      {todo.text}
      <button onClick={() => onDelete(todo.id)}>删除</button>
    </li>
  );
});
```

---

## 问题 3：列表渲染如何优化？

**使用虚拟滚动、正确的 key、分页加载**。

### 虚拟滚动

```jsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 即使有 10000 条数据，也只渲染可见的部分
```

### 使用正确的 key

```jsx
// ✅ 使用唯一 ID
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ 使用 index（列表会变化时）
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

### 分页或无限滚动

```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    const newItems = await fetchItems(page);
    setItems(prev => [...prev, ...newItems]);
    setPage(p => p + 1);
    setHasMore(newItems.length > 0);
  }, [page]);

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<Loading />}
    >
      {items.map(item => (
        <Item key={item.id} data={item} />
      ))}
    </InfiniteScroll>
  );
}
```

---

## 问题 4：如何优化状态管理？

**合理拆分状态、使用 Context 优化、避免不必要的状态**。

### 拆分状态

```jsx
// ❌ 所有状态放在一起
function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });

  // 任何字段变化都会导致整个组件重新渲染
}

// ✅ 拆分独立的状态
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // 只有相关字段变化时才重新渲染
}
```

### 优化 Context

```jsx
// ❌ 单个 Context 包含所有状态
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState({});

  // 任何状态变化都会导致所有消费者重新渲染
  return (
    <AppContext.Provider value={{ user, theme, settings }}>
      {children}
    </AppContext.Provider>
  );
}

// ✅ 拆分多个 Context
const UserContext = createContext();
const ThemeContext = createContext();
const SettingsContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState({});

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <SettingsContext.Provider value={settings}>
          {children}
        </SettingsContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

---

## 问题 5：代码分割和懒加载如何实现？

**使用 React.lazy 和动态 import 实现代码分割**。

### 路由懒加载

```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载路由组件
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 组件懒加载

```jsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        加载组件
      </button>
      {showHeavy && (
        <Suspense fallback={<Spinner />}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}
```

### 预加载

```jsx
// 创建懒加载组件
const Dashboard = lazy(() => import('./Dashboard'));

// 预加载函数
const preloadDashboard = () => {
  import('./Dashboard');
};

function Navigation() {
  return (
    <nav>
      <Link
        to="/dashboard"
        onMouseEnter={preloadDashboard}  // 鼠标悬停时预加载
      >
        Dashboard
      </Link>
    </nav>
  );
}
```

---

## 问题 6：如何优化事件处理？

**使用事件委托、防抖节流优化事件处理**。

### 事件委托

```jsx
function List({ items }) {
  const handleClick = (e) => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (id) {
      console.log('点击了项目:', id);
    }
  };

  return (
    <ul onClick={handleClick}>
      {items.map(item => (
        <li key={item.id} data-id={item.id}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 防抖和节流

```jsx
import { useMemo } from 'react';
import { debounce, throttle } from 'lodash';

function SearchInput() {
  // 防抖：停止输入后才执行
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      console.log('搜索:', value);
    }, 500),
    []
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="搜索..."
    />
  );
}

function ScrollHandler() {
  // 节流：固定时间间隔执行
  const throttledScroll = useMemo(
    () => throttle(() => {
      console.log('滚动位置:', window.scrollY);
    }, 200),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [throttledScroll]);

  return null;
}
```

---

## 问题 7：打包和资源优化有哪些方法？

**代码分割、Tree Shaking、压缩、CDN**。

### Webpack 配置优化

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    minimize: true,
    usedExports: true  // Tree Shaking
  }
};
```

### 按需引入

```jsx
// ❌ 全量引入
import _ from 'lodash';
import { Button, Input, Modal } from 'antd';

// ✅ 按需引入
import debounce from 'lodash/debounce';
import Button from 'antd/es/button';
import 'antd/es/button/style';
```

### 图片优化

```jsx
// 使用 WebP 格式
function OptimizedImage({ src, alt }) {
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img src={`${src}.jpg`} alt={alt} loading="lazy" />
    </picture>
  );
}

// 懒加载图片
function LazyImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
```

---

## 总结

**核心优化策略**：

### 1. 组件优化
- React.memo 避免重渲染
- PureComponent 浅比较
- 合理拆分组件

### 2. Hooks 优化
- useMemo 缓存计算结果
- useCallback 缓存函数
- 避免在渲染中创建对象/函数

### 3. 列表优化
- 虚拟滚动
- 正确使用 key
- 分页/无限滚动

### 4. 状态管理
- 拆分状态
- 优化 Context
- 避免不必要的状态

### 5. 代码分割
- 路由懒加载
- 组件懒加载
- 动态 import

### 6. 事件优化
- 事件委托
- 防抖节流
- 移除事件监听器

### 7. 打包优化
- 代码分割
- Tree Shaking
- 压缩和混淆
- CDN 加速

## 延伸阅读

- [React 性能优化官方文档](https://react.dev/learn/render-and-commit)
- [React.memo 使用指南](https://react.dev/reference/react/memo)
- [useMemo 和 useCallback](https://react.dev/reference/react/useMemo)
- [代码分割最佳实践](https://react.dev/reference/react/lazy)
