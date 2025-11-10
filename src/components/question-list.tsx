/**
 * @Author: Libra
 * @Date: 2025-01-09 15:22:00
 * @Description: 虚拟化题库列表，支持大规模题目渲染
 * @LastEditors: Libra
 */
import { useEffect, useRef } from "react";
import type { ComponentType, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  defaultQuestionStatus,
  type QuestionStatus,
  type QuestionTopic,
} from "@/types/question";

interface StatusStyle {
  label: string;
  className: string;
  icon: ComponentType<{ className?: string }>;
}

export interface QuestionListProps {
  topics: QuestionTopic[];
  activeId: string;
  onSelect: (id: string) => void;
  statusMap: Map<string, QuestionStatus>;
  statusStyles: {
    completed: StatusStyle;
    review: StatusStyle;
    starred: StatusStyle;
  };
  density: "comfortable" | "compact";
  emptyPlaceholder?: ReactNode;
}

const densityConfig = {
  comfortable: {
    estimate: 112,
    itemPadding: "p-2",
    buttonPadding: "px-4 py-3",
    titleClass: "text-sm font-medium",
    summaryClass: "text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed",
  },
  compact: {
    estimate: 88,
    itemPadding: "px-2 py-1.5",
    buttonPadding: "px-3 py-2",
    titleClass: "text-sm font-medium",
    summaryClass: "text-muted-foreground mt-1 line-clamp-1 text-[11px] leading-relaxed",
  },
} as const;

export function QuestionList({
  topics,
  activeId,
  onSelect,
  statusMap,
  statusStyles,
  density,
  emptyPlaceholder,
}: QuestionListProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const config = densityConfig[density];

  const virtualizer = useVirtualizer({
    count: topics.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config.estimate,
    overscan: 12,
    measureElement:
      typeof window !== "undefined" && "ResizeObserver" in window
        ? undefined
        : (element) => (element as HTMLElement).offsetHeight,
  });

  useEffect(() => {
    if (!topics.length) {
      return;
    }
    const activeIndex = topics.findIndex((topic) => topic.id === activeId);
    if (activeIndex >= 0) {
      virtualizer.scrollToIndex(activeIndex, { align: "auto" });
    }
  }, [activeId, topics, virtualizer]);

  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyPlaceholder ?? "暂无匹配的题目，请尝试调整筛选条件。"}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div
      ref={parentRef}
      className={cn(
        "question-list-scroll relative w-full overflow-y-auto rounded-xl border border-border/30 bg-card/95 shadow-inner",
        "min-h-[340px] max-h-[calc(100vh-320px)]",
      )}
    >
      <div className="flex flex-col gap-1.5 pb-3">
        {paddingTop > 0 && <div style={{ height: paddingTop }} />}
        {virtualItems.map((virtualRow) => {
          const topic = topics[virtualRow.index];
          const status = statusMap.get(topic.id) ?? defaultQuestionStatus;
          const hasStatus = status.completed || status.review || status.starred;

          return (
            <button
              key={virtualRow.key}
              ref={(node) => {
                if (node) {
                  virtualizer.measureElement(node);
                }
              }}
              data-index={virtualRow.index}
              type="button"
              onClick={() => onSelect(topic.id)}
              className={cn(
                "mx-1 rounded-xl border border-border/50 bg-card text-left shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                config.buttonPadding,
                activeId === topic.id &&
                  "border-primary/60 bg-primary/5 shadow-lg shadow-primary/15 ring-1 ring-primary/20",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn(config.titleClass, "text-foreground")}>{topic.title}</p>
                <Badge variant="secondary" className="text-[11px]">
                  {topic.difficulty}
                </Badge>
              </div>
              <p className={config.summaryClass}>{topic.summary}</p>
              {hasStatus && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {status.review && (
                    <span className={statusStyles.review.className}>
                      <statusStyles.review.icon className="size-3" />
                      {statusStyles.review.label}
                    </span>
                  )}
                  {status.starred && (
                    <span className={statusStyles.starred.className}>
                      <statusStyles.starred.icon className="size-3" />
                      {statusStyles.starred.label}
                    </span>
                  )}
                  {status.completed && (
                    <span className={statusStyles.completed.className}>
                      <statusStyles.completed.icon className="size-3" />
                      {statusStyles.completed.label}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
        {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
      </div>
    </div>
  );
}


