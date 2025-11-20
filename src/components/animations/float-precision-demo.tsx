import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, Calculator } from "lucide-react";

export function FloatPrecisionDemo() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "十进制输入",
      description: "计算机接收十进制数字输入",
      content: (
        <div className="flex items-center justify-center gap-4 text-2xl font-bold">
          <div className="rounded-lg bg-blue-100 px-4 py-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">0.1</div>
          <span>+</span>
          <div className="rounded-lg bg-indigo-100 px-4 py-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">0.2</div>
          <span>=</span>
          <div className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-gray-400">?</div>
        </div>
      ),
    },
    {
      title: "转换为二进制 (IEEE 754)",
      description: "十进制小数转换为二进制时产生无限循环",
      content: (
        <div className="space-y-6 font-mono text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0.1 的转换过程 (乘 2 取整法)</span>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-1 text-muted-foreground">
                <span>0.1</span><span>×</span><span>2</span><span>=</span><span>0.2 → 取整数 0</span>
                <span>0.2</span><span>×</span><span>2</span><span>=</span><span>0.4 → 取整数 0</span>
                <span>0.4</span><span>×</span><span>2</span><span>=</span><span>0.8 → 取整数 0</span>
                <span>0.8</span><span>×</span><span>2</span><span>=</span><span>1.6 → 取整数 1</span>
                <span>0.6</span><span>×</span><span>2</span><span>=</span><span>1.2 → 取整数 1</span>
                <span>0.2</span><span>×</span><span>2</span><span>=</span><span className="text-red-500">0.4 → 循环开始...</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">结果:</span>
              <div className="overflow-hidden rounded bg-muted px-2 py-1 break-all">
                0.00011<span className="font-bold text-primary">0011</span><span className="font-bold text-primary">0011</span>...
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0.2 的转换过程</span>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-1 text-muted-foreground">
                <span>0.2</span><span>×</span><span>2</span><span>=</span><span>0.4 → 取整数 0</span>
                <span>0.4</span><span>×</span><span>2</span><span>=</span><span>0.8 → 取整数 0</span>
                <span>0.8</span><span>×</span><span>2</span><span>=</span><span>1.6 → 取整数 1</span>
                <span>0.6</span><span>×</span><span>2</span><span>=</span><span>1.2 → 取整数 1</span>
                <span>0.2</span><span>×</span><span>2</span><span>=</span><span className="text-red-500">0.4 → 循环开始...</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">结果:</span>
              <div className="overflow-hidden rounded bg-muted px-2 py-1 break-all">
                0.0011<span className="font-bold text-primary">0011</span><span className="font-bold text-primary">0011</span>...
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "精度截断 (IEEE 754 存储)",
      description: "64位浮点数 = 1位符号 + 11位指数 + 52位尾数",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0.1 的存储结构</span>
              <span className="text-[10px]">双精度 (64-bit)</span>
            </div>
            <div className="rounded-lg border border-border/50 bg-card p-3">
              <div className="mb-2 flex gap-1 text-[10px] font-mono text-muted-foreground">
                <div className="flex-none w-8 text-center border-b border-blue-500/50 text-blue-600 dark:text-blue-400">符号</div>
                <div className="flex-none w-24 text-center border-b border-purple-500/50 text-purple-600 dark:text-purple-400">指数 (11位)</div>
                <div className="flex-1 text-center border-b border-orange-500/50 text-orange-600 dark:text-orange-400">尾数 (52位)</div>
              </div>
              <div className="flex gap-1 font-mono text-xs">
                <div className="flex-none w-8 text-center bg-blue-100 dark:bg-blue-900/30 rounded py-1 text-blue-700 dark:text-blue-300">0</div>
                <div className="flex-none w-24 text-center bg-purple-100 dark:bg-purple-900/30 rounded py-1 text-purple-700 dark:text-purple-300">01111111011</div>
                <div className="flex-1 break-all bg-orange-100 dark:bg-orange-900/30 rounded py-1 px-2 text-orange-700 dark:text-orange-300 tracking-wider">
                  1001100110011001100110011001100110011001100110011010
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                <span className="text-red-500 font-bold">注意：</span> 
                原始二进制是无限循环的 1001...，但只能存储 52 位，最后一位 1 被进位（舍入），导致值变大。
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>实际存储的十进制值</span>
            </div>
             <div className="relative rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <div className="font-mono text-xs break-all text-muted-foreground">
                0.1000000000000000<span className="font-bold text-red-500">05551115123125...</span>
              </div>
              <div className="mt-1 text-[10px] text-yellow-600 dark:text-yellow-400">
                比 0.1 略大
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "二进制加法运算",
      description: "对截断后的二进制数进行对齐相加",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-4 font-mono text-xs">
            <div className="flex justify-end gap-2 text-muted-foreground">
              <span>0.1:</span>
              <span>0.00011001100110011001100110011001100110011001100110011010</span>
            </div>
            <div className="flex justify-end gap-2 text-muted-foreground">
              <span>0.2:</span>
              <span>0.00110011001100110011001100110011001100110011001100110100</span>
            </div>
            <div className="my-2 border-b border-border/50"></div>
            <div className="flex justify-end gap-2 font-bold text-primary">
              <span>结果:</span>
              <span>0.01001100110011001100110011001100110011001100110011001110</span>
            </div>
          </div>
          
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-600 dark:text-blue-400">
            <p><strong>关键点：</strong> 两个略微偏大的数相加，误差进一步累积。</p>
            <p className="mt-1">二进制结果转换回十进制时，就变成了 0.30000000000000004</p>
          </div>
        </div>
      ),
    },
    {
      title: "转换回十进制",
      description: "将二进制结果转换回十进制，误差显现",
      content: (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">最终结果</div>
              <div className="mt-2 text-3xl font-bold text-red-500">
                0.30000000000000004
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>误差分析</span>
            </div>
            <div className="rounded-lg border border-border/50 bg-card p-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">期望值:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">0.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">实际值:</span>
                  <span className="font-mono text-red-500">0.3000000000000000444...</span>
                </div>
                <div className="border-t border-border/50 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">差异:</span>
                    <span className="font-mono text-orange-500">0.00000000000000004</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              这个微小的差异 (2^-52 级别) 就是导致相等判断失败的原因。
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "解决方案",
      description: "如何正确处理浮点数运算",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">1. 使用 Number.EPSILON (误差范围)</h4>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs">
              <div className="text-blue-600 dark:text-blue-400">
                Math.abs(0.1 + 0.2 - 0.3) &lt; Number.EPSILON
              </div>
              <div className="mt-1 text-green-600 dark:text-green-400">// true</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">2. 转换为整数运算 (推荐金额计算)</h4>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs">
              <div className="text-muted-foreground">
                (0.1 * 10 + 0.2 * 10) / 10
              </div>
              <div className="mt-1 text-green-600 dark:text-green-400">// 0.3</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">3. 使用 toFixed (仅用于显示)</h4>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs">
              <div className="text-muted-foreground">
                (0.1 + 0.2).toFixed(1)
              </div>
              <div className="mt-1 text-green-600 dark:text-green-400">// "0.3" (String)</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    setStep((prev) => (prev + 1) % steps.length);
  };

  const reset = () => {
    setStep(0);
  };

  return (
    <Card className="w-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calculator className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">浮点数精度演示</h3>
            <p className="text-[10px] text-muted-foreground">IEEE 754 可视化流程</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={reset}
            disabled={step === 0}
          >
            <RefreshCw className="mr-1.5 size-3" />
            重置
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={nextStep}>
            {step === steps.length - 1 ? "重新开始" : "下一步"}
            <ArrowRight className="ml-1.5 size-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <div className="relative pl-4 before:absolute before:bottom-0 before:left-[7px] before:top-2 before:w-[2px] before:bg-border/50">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`relative mb-6 last:mb-0 ${
                  i === step ? "opacity-100" : "opacity-40"
                } transition-opacity duration-300`}
              >
                <div
                  className={`absolute -left-[21px] top-1 size-3.5 rounded-full border-2 border-background transition-colors duration-300 ${
                    i <= step ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
                <h4 className={`text-sm font-medium ${i === step ? "text-primary" : ""}`}>
                  {s.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-border/50 bg-card/50 p-6 shadow-sm">
          <div className="animate-in fade-in zoom-in-95 duration-300 key={step}">
            {steps[step].content}
          </div>
        </div>
      </div>
    </Card>
  );
}
