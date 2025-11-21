import { useState } from 'react';
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 定义列表项类型
interface Item {
  id: string;
  value: string;
}

// 初始数据
const INITIAL_ITEMS: Item[] = [
  { id: 'a', value: '🍎 Apple' },
  { id: 'b', value: '🍌 Banana' },
  { id: 'c', value: '🍒 Cherry' },
];

export function ReactKeyIndexDemo() {
  const [items, setItems] = useState<Item[]>([...INITIAL_ITEMS]);
  const [nextId, setNextId] = useState(0);
  
  // 操作：头部添加
  const addItem = () => {
    const newItem = { id: `new-${nextId}`, value: `🥝 Kiwi ${nextId}` };
    setNextId(n => n + 1);
    setItems([newItem, ...items]);
  };

  // 操作：反转列表
  const reverseList = () => {
    setItems([...items].reverse());
  };

  // 操作：重置
  const reset = () => {
    setItems([...INITIAL_ITEMS]);
    setNextId(0);
  };

  return (
    <Card className="w-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Info className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Key 的作用演示</h3>
            <p className="text-[10px] text-muted-foreground">Index vs ID 对比</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="h-8 text-xs" 
            onClick={addItem}
          >
            <Plus className="mr-1.5 size-3" />
            头部插入
          </Button>
          <Button 
            variant="secondary"
            size="sm" 
            className="h-8 text-xs" 
            onClick={reverseList}
          >
            <RefreshCw className="mr-1.5 size-3" />
            反转
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            className="h-8 text-xs" 
            onClick={reset}
          >
            重置
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            请在下方的输入框中输入一些文字（例如对应水果的颜色），然后点击“头部插入”或“反转”，观察输入框的内容是否跟随对应的水果移动。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 错误示范：Index as Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <AlertTriangle className="size-4 text-red-500" />
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400">错误示范: Index 作为 Key</h4>
            </div>
            <div className="rounded-xl border border-red-200/50 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 p-4 min-h-[300px]">
              <p className="text-[10px] text-red-500/80 dark:text-red-400/80 mb-4 leading-relaxed">
                注意：当你插入新项时，React 认为 key=0 的组件还是原来的第一个组件。
                组件实例被复用，<b>输入框里的状态（State）留在了原地</b>。
              </p>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <ListItem 
                    key={index} // ❌ 错误用法
                    label={`Key=${index}`} 
                    value={item.value}
                    type="bad"
                  />
                ))}
              </ul>
            </div>
          </div>

          {/* 正确示范：ID as Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">正确示范: ID 作为 Key</h4>
            </div>
            <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-4 min-h-[300px]">
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mb-4 leading-relaxed">
                注意：使用唯一 ID，React 知道 key="a" 的组件移动到了新位置。
                组件实例跟随数据移动，<b>输入框里的状态也随之移动</b>。
              </p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <ListItem 
                    key={item.id} // ✅ 正确用法
                    label={`Key="${item.id}"`} 
                    value={item.value}
                    type="good"
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border/50 bg-card p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">原理总结：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 marker:text-muted-foreground/50">
            <li>React 使用 Key 来识别组件的身份。</li>
            <li>如果 Key 相同（例如都是 0），React 认为这是同一个组件，会保留其内部状态（如输入框内容、组件 state）。</li>
            <li>当使用 Index 时，头部插入会导致所有数据的 Index 发生错位，但 React 看到的 Key 仍然是从 0 开始，导致状态与数据不匹配。</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

// 子组件：包含一个输入框来演示状态保留问题
function ListItem({ label, value, type }: { label: string, value: string, type: 'good' | 'bad' }) {
  const isGood = type === 'good';
  
  return (
    <li className={`
      flex items-center gap-3 p-2.5 rounded-lg border shadow-sm transition-all duration-300
      ${isGood 
        ? 'bg-background border-emerald-200/50 dark:border-emerald-800/50' 
        : 'bg-background border-red-200/50 dark:border-red-800/50'
      }
    `}>
      <div className={`
        text-[10px] font-mono px-1.5 py-0.5 rounded border
        ${isGood 
          ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
          : 'bg-red-100/50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        }
      `}>
        {label}
      </div>
      <div className="flex-1 text-sm font-medium text-foreground">
        {value}
      </div>
      <input 
        type="text" 
        placeholder="输入..." 
        className="w-20 px-2 py-1 text-xs bg-muted/50 border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring transition-colors placeholder:text-muted-foreground/50"
        onClick={(e) => e.stopPropagation()}
      />
    </li>
  );
}
