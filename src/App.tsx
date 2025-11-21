/**
 * Author: Libra
 * Date: 2025-11-20 09:29:28
 * LastEditTime: 2025-11-21 17:59:50
 * LastEditors: Libra
 * Description:
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Layers,
  PlayCircle,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

import { QuestionMarkdown } from "@/components/markdown/question-markdown";
import { QuestionList } from "@/components/question-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestionProgress } from "@/hooks/use-question-progress";
import { categories, difficulties, questionTopics } from "@/data/questions";
import {
  defaultQuestionStatus,
  type Difficulty,
  type QuestionStatus,
  type QuestionTopic,
} from "@/types/question";
import { cn, formatQuestionOrder } from "@/lib/utils";
import { getAnimationComponent } from "@/components/animations/registry";

const ALL_CATEGORY = "全部领域";
const ALL_DIFFICULTIES: Difficulty | "全部难度" = "全部难度";
const ALL_STATUS = "全部状态";
const statusOptions = [ALL_STATUS, "已完成", "待复习", "已标星"] as const;
type StatusFilter = (typeof statusOptions)[number];
type StatusCountKey = Exclude<StatusFilter, typeof ALL_STATUS>;

const LIST_ROUTE_HASH = "#/list";
const QUESTION_ROUTE_PREFIX = "#/question/";

type RouteState = { view: "list" } | { view: "detail"; topicId: string };

const resolveRouteFromHash = (hash?: string): RouteState => {
  if (!hash) {
    return { view: "list" };
  }

  if (hash.startsWith(QUESTION_ROUTE_PREFIX)) {
    const topicId = hash.slice(QUESTION_ROUTE_PREFIX.length).trim();
    if (topicId) {
      return { view: "detail", topicId };
    }
  }

  return { view: "list" };
};

const getInitialRoute = (): RouteState => {
  if (typeof window === "undefined") {
    return { view: "list" };
  }
  return resolveRouteFromHash(window.location.hash);
};

const toggleButtonBaseClass =
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background/80 shadow-xs dark:bg-background/40";

const statusBadgeBaseClass =
  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";

const difficultyWeight: Record<Difficulty, number> = {
  入门: 1,
  中级: 2,
  高级: 3,
};

type SortOption =
  | "default"
  | "updated-desc"
  | "updated-asc"
  | "title-asc"
  | "difficulty-desc"
  | "difficulty-asc";

const sortOptionItems: { value: SortOption; label: string }[] = [
  { value: "default", label: "默认排序" },
  { value: "updated-desc", label: "按更新时间（新→旧）" },
  { value: "updated-asc", label: "按更新时间（旧→新）" },
  { value: "title-asc", label: "按标题（A→Z）" },
  { value: "difficulty-desc", label: "按难度（高→低）" },
  { value: "difficulty-asc", label: "按难度（低→高）" },
];

function App() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [difficulty, setDifficulty] = useState<Difficulty | "全部难度">(
    ALL_DIFFICULTIES
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_STATUS);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [route, setRoute] = useState<RouteState>(() => getInitialRoute());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHashChange = () => {
      setRoute(resolveRouteFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const { getStatus, toggleCompleted, toggleReview, toggleStar, clearStatus } =
    useQuestionProgress();

  const questionStatuses = useMemo(
    () =>
      questionTopics.map((topic) => ({
        topic,
        status: getStatus(topic.id),
      })),
    [getStatus]
  );

  const statusMap = useMemo(() => {
    const map = new Map<string, QuestionStatus>();
    questionStatuses.forEach(({ topic, status }) => {
      map.set(topic.id, status);
    });
    return map;
  }, [questionStatuses]);

  const totalQuestions = questionTopics.length;
  const totalCategories = categories.length;
  const totalTags = useMemo(
    () => new Set(questionTopics.flatMap((topic) => topic.tags)).size,
    []
  );

  const { completedCount, reviewCount, starredCount } = useMemo(() => {
    let completed = 0;
    let review = 0;
    let starred = 0;

    questionStatuses.forEach(({ status }) => {
      if (status.completed) {
        completed += 1;
      }
      if (status.review) {
        review += 1;
      }
      if (status.starred) {
        starred += 1;
      }
    });

    return {
      completedCount: completed,
      reviewCount: review,
      starredCount: starred,
    };
  }, [questionStatuses]);

  const statusCounts: Record<StatusCountKey, number> = {
    已完成: completedCount,
    待复习: reviewCount,
    已标星: starredCount,
  };

  const handleNavigateToList = useCallback(() => {
    setRoute({ view: "list" });
    if (typeof window !== "undefined") {
      window.location.hash = LIST_ROUTE_HASH;
      const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(scrollToTop);
      } else {
        scrollToTop();
      }
    }
  }, []);

  const handleNavigateToDetail = useCallback((topicId: string) => {
    if (!topicId) {
      return;
    }
    setRoute({ view: "detail", topicId });
    if (typeof window !== "undefined") {
      window.location.hash = `${QUESTION_ROUTE_PREFIX}${topicId}`;
      const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(scrollToTop);
      } else {
        scrollToTop();
      }
    }
  }, []);

  const STATUS_STYLES = {
    completed: {
      label: "已完成",
      className: cn(
        statusBadgeBaseClass,
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200"
      ),
      icon: CheckCircle2,
    },
    review: {
      label: "待复习",
      className: cn(
        statusBadgeBaseClass,
        "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200"
      ),
      icon: Clock3,
    },
    starred: {
      label: "已标星",
      className: cn(
        statusBadgeBaseClass,
        "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200"
      ),
      icon: Star,
    },
  } as const;

  const filteredTopics = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return questionTopics.filter((topic) => {
      const matchesKeyword =
        !normalizedKeyword ||
        topic.title.toLowerCase().includes(normalizedKeyword) ||
        topic.summary.toLowerCase().includes(normalizedKeyword) ||
        topic.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedKeyword)
        ) ||
        topic.keywords.some((tag) =>
          tag.toLowerCase().includes(normalizedKeyword)
        );
      const matchesCategory =
        category === ALL_CATEGORY ? true : topic.category === category;
      const matchesDifficulty =
        difficulty === ALL_DIFFICULTIES
          ? true
          : topic.difficulty === difficulty;
      const status = statusMap.get(topic.id) ?? defaultQuestionStatus;
      const matchesStatus =
        statusFilter === ALL_STATUS
          ? true
          : statusFilter === "已完成"
          ? status.completed
          : statusFilter === "待复习"
          ? status.review
          : status.starred;
      return (
        matchesKeyword && matchesCategory && matchesDifficulty && matchesStatus
      );
    });
  }, [keyword, category, difficulty, statusFilter, statusMap]);

  const sortedTopics = useMemo(() => {
    if (sortOption === "default") {
      return filteredTopics;
    }
    const sorted = [...filteredTopics];
    switch (sortOption) {
      case "updated-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "updated-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
        break;
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
        break;
      case "difficulty-desc":
        sorted.sort(
          (a, b) =>
            difficultyWeight[b.difficulty] - difficultyWeight[a.difficulty]
        );
        break;
      case "difficulty-asc":
        sorted.sort(
          (a, b) =>
            difficultyWeight[a.difficulty] - difficultyWeight[b.difficulty]
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredTopics, sortOption]);

  useEffect(() => {
    if (route.view === "detail") {
      const exists = sortedTopics.some((topic) => topic.id === route.topicId);
      if (!exists) {
        handleNavigateToList();
      }
    }
  }, [route, sortedTopics, handleNavigateToList]);

  const activeTopic: QuestionTopic | null =
    route.view === "detail"
      ? sortedTopics.find((topic) => topic.id === route.topicId) ?? null
      : null;

  const highlightedId = route.view === "detail" ? route.topicId : "";

  const activeIndex = activeTopic
    ? sortedTopics.findIndex((topic) => topic.id === activeTopic.id)
    : -1;
  const previousTopic = activeIndex > 0 ? sortedTopics[activeIndex - 1] : null;
  const nextTopic =
    activeIndex >= 0 && activeIndex < sortedTopics.length - 1
      ? sortedTopics[activeIndex + 1]
      : null;
  const activeOrderLabel =
    activeTopic && activeIndex >= 0
      ? formatQuestionOrder(activeTopic.order, activeIndex + 1)
      : "--";

  const activeStatus = activeTopic
    ? statusMap.get(activeTopic.id) ?? defaultQuestionStatus
    : defaultQuestionStatus;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background selection:bg-primary/20 selection:text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />

      <div className="flex min-h-screen w-full flex-col gap-8 px-6 py-10 lg:px-12 xl:px-16 2xl:px-24">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge
              variant="secondary"
              className="mb-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm ring-1 ring-primary/10"
            >
              Frontend Interview Planner
            </Badge>
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl lg:text-6xl">
              前端面试刷题手册
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed md:text-lg">
              精心整理 React、TypeScript、性能优化等高频面试题目，配合 Markdown
              详解与答题要点，帮助你快速梳理知识结构。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeCustomizer />
            <ThemeToggle />
          </div>
        </header>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background ring-1 ring-black/5 dark:ring-white/10">
          <div className="absolute inset-0 -z-10 opacity-50 mix-blend-soft-light">
            <div className="absolute -left-24 -top-32 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute -right-36 top-1/3 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
          </div>
          <CardHeader className="flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
                <Sparkles className="size-3.5" />
                今日建议练习路径
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight md:text-4xl">
                数据驱动的练习看板
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-relaxed">
                建议先从基础题目热身，再进入核心专题，最后通过工程化题目串联流程，形成完整的面试表达。
              </CardDescription>
            </div>
            <div className="grid w-full max-w-[840px] grid-cols-2 gap-4 text-sm sm:grid-cols-3 xl:grid-cols-6">
              {[
                {
                  label: "题目总数",
                  value: totalQuestions,
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-100 dark:border-blue-900",
                  icon: BookOpenCheck,
                },
                {
                  label: "覆盖领域",
                  value: totalCategories,
                  color: "text-indigo-600 dark:text-indigo-400",
                  bg: "bg-indigo-500/10",
                  border: "border-indigo-100 dark:border-indigo-900",
                  icon: Layers,
                },
                {
                  label: "核心标签",
                  value: totalTags,
                  color: "text-purple-600 dark:text-purple-400",
                  bg: "bg-purple-500/10",
                  border: "border-purple-100 dark:border-purple-900",
                  icon: Tag,
                },
                {
                  label: "已完成",
                  value: completedCount,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-100 dark:border-emerald-900",
                  icon: CheckCircle2,
                },
                {
                  label: "待复习",
                  value: reviewCount,
                  color: "text-amber-600 dark:text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "border-amber-100 dark:border-amber-900",
                  icon: Clock3,
                },
                {
                  label: "已标星",
                  value: starredCount,
                  color: "text-pink-600 dark:text-pink-400",
                  bg: "bg-pink-500/10",
                  border: "border-pink-100 dark:border-pink-900",
                  icon: Star,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    item.bg,
                    item.border
                  )}
                >
                  <item.icon
                    className={cn(
                      "absolute -bottom-4 -right-4 size-20 opacity-[0.08] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12",
                      item.color
                    )}
                  />
                  <div className="relative z-10 flex items-center gap-2 text-muted-foreground">
                    <div className="rounded-lg bg-background/40 p-1.5 ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
                      <item.icon
                        className={cn(
                          "size-3.5 transition-colors group-hover:text-foreground",
                          item.color
                        )}
                      />
                    </div>
                    <p className="text-xs font-medium opacity-80">
                      {item.label}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "relative z-10 mt-3 text-3xl font-bold tracking-tight",
                      item.color
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {route.view === "list" ? (
          <div className="space-y-6 pb-10">
            <Card className="shadow-xs">
              <CardHeader className="gap-5">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    筛选器
                  </CardTitle>
                  <CardDescription>
                    支持按关键词、领域与难度进行组合筛选。
                  </CardDescription>
                </div>
                <Input
                  placeholder="搜索关键词，例如：悬挂闭包、LCP..."
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  aria-label="搜索题目"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    领域
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[ALL_CATEGORY, ...categories].map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={category === item ? "default" : "outline"}
                        onClick={() => setCategory(item)}
                        className={cn(
                          "rounded-full border transition-all duration-300",
                          category === item
                            ? "shadow-md ring-2 ring-primary/20"
                            : "bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        )}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    难度
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[ALL_DIFFICULTIES, ...difficulties].map((item) => (
                      <Badge
                        key={item}
                        asChild
                        variant={difficulty === item ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer px-4 py-1.5 text-xs transition-all duration-300",
                          difficulty === item
                            ? "shadow-md ring-2 ring-primary/20"
                            : "bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setDifficulty(item)}
                        >
                          {item}
                        </button>
                      </Badge>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    练习状态
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions.map((option) => {
                      const isActive = statusFilter === option;
                      const count =
                        option === ALL_STATUS
                          ? undefined
                          : statusCounts[option as StatusCountKey];
                      return (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => setStatusFilter(option)}
                          className={cn(
                            "rounded-full border transition-all duration-300",
                            isActive
                              ? "shadow-md ring-2 ring-primary/20"
                              : "bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                          )}
                        >
                          {option}
                          {option !== ALL_STATUS && (
                            <span className="ml-1.5 text-xs opacity-80">
                              ({count})
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      题库列表
                      <span className="text-muted-foreground ml-2 text-sm font-normal">
                        {sortedTopics.length} 条结果
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      根据需要调整排序与密度，虚拟滚动确保千级题目依然流畅。
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={sortOption}
                      onValueChange={(value: SortOption) =>
                        setSortOption(value)
                      }
                    >
                      <SelectTrigger className="w-[180px] text-xs sm:text-sm">
                        <SelectValue placeholder="选择排序" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptionItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QuestionList
                  topics={sortedTopics}
                  activeId={highlightedId}
                  onSelect={handleNavigateToDetail}
                  statusMap={statusMap}
                  statusStyles={STATUS_STYLES}
                  layout="grid"
                  emptyPlaceholder="暂无匹配的题目，请尝试调整筛选条件。"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNavigateToList}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                返回题库列表
              </Button>
              <span className="text-xs text-muted-foreground">
                共 {sortedTopics.length} 题
              </span>
            </div>
            {activeTopic ? (
              <>
                <Card className="shadow-xs backdrop-blur">
                  <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="uppercase tracking-wide"
                        >
                          {activeTopic.category}
                        </Badge>
                        <Badge variant="secondary">
                          {activeTopic.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          更新于 {activeTopic.updatedAt}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-semibold leading-tight md:text-3xl">
                        <span className="mr-3 font-mono text-base uppercase tracking-wide text-muted-foreground">
                          #{activeOrderLabel}
                        </span>
                        {activeTopic.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-muted-foreground">
                        {activeTopic.summary}
                      </CardDescription>
                      {activeTopic.highlight && (
                        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed text-foreground/80">
                          ✅ 面试官关注点：{activeTopic.highlight}
                        </div>
                      )}
                    </div>
                    <CardAction className="flex min-w-[220px] flex-col gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          预计练习时长
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {activeTopic.estimatedTime}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeTopic.keywords.map((keywordItem) => (
                          <Badge
                            key={keywordItem}
                            variant="outline"
                            className="text-xs"
                          >
                            {keywordItem}
                          </Badge>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          练习状态
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStar(activeTopic.id)}
                            aria-pressed={activeStatus.starred}
                            className={cn(
                              toggleButtonBaseClass,
                              "border-violet-500/40 text-violet-600 hover:bg-violet-500/10 dark:text-violet-200",
                              activeStatus.starred &&
                                "border-violet-500 bg-violet-500/20 text-violet-700 dark:border-violet-400 dark:bg-violet-500/30 dark:text-violet-100"
                            )}
                          >
                            <Star
                              className="size-4"
                              fill={
                                activeStatus.starred ? "currentColor" : "none"
                              }
                            />
                            标星
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleReview(activeTopic.id)}
                            aria-pressed={activeStatus.review}
                            className={cn(
                              toggleButtonBaseClass,
                              "border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-200",
                              activeStatus.review &&
                                "border-amber-500 bg-amber-500/20 text-amber-700 dark:border-amber-400 dark:bg-amber-500/30 dark:text-amber-100"
                            )}
                          >
                            <Clock3 className="size-4" />
                            待复习
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompleted(activeTopic.id)}
                            aria-pressed={activeStatus.completed}
                            className={cn(
                              toggleButtonBaseClass,
                              "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-200",
                              activeStatus.completed &&
                                "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/30 dark:text-emerald-100"
                            )}
                          >
                            <CheckCircle2 className="size-4" />
                            已完成
                          </button>
                        </div>
                        {(activeStatus.completed ||
                          activeStatus.review ||
                          activeStatus.starred) && (
                          <button
                            type="button"
                            onClick={() => clearStatus(activeTopic.id)}
                            className="inline-flex items-center text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
                          >
                            重置状态
                          </button>
                        )}
                      </div>
                    </CardAction>
                  </CardHeader>
                </Card>

                <Card className="shadow-xs">
                  <CardContent className="pt-4 pb-4">
                    {(() => {
                      const AnimationComponent = getAnimationComponent(
                        activeTopic.id
                      );

                      if (AnimationComponent) {
                        return (
                          <Tabs defaultValue="markdown" className="w-full">
                            <div className="mb-6 flex items-center justify-between">
                              <TabsList className="h-9 w-full justify-start rounded-lg bg-muted/50 p-1 sm:w-auto">
                                <TabsTrigger
                                  value="markdown"
                                  className="flex-1 gap-2 text-xs sm:flex-none"
                                >
                                  <BookOpen className="size-3.5" />
                                  原理详解
                                </TabsTrigger>
                                <TabsTrigger
                                  value="animation"
                                  className="flex-1 gap-2 text-xs sm:flex-none"
                                >
                                  <PlayCircle className="size-3.5" />
                                  动态演示
                                </TabsTrigger>
                              </TabsList>
                            </div>

                            <TabsContent
                              value="markdown"
                              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                            >
                              <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-sm leading-relaxed shadow-sm">
                                <QuestionMarkdown
                                  content={activeTopic.content}
                                />
                              </div>
                            </TabsContent>

                            <TabsContent
                              value="animation"
                              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                            >
                              <AnimationComponent />
                            </TabsContent>
                          </Tabs>
                        );
                      }

                      return (
                        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 p-6 text-sm leading-relaxed shadow-sm">
                          <QuestionMarkdown content={activeTopic.content} />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border border-border/60 shadow-xs">
                  <CardContent className="space-y-3 bg-gradient-to-br from-background to-background/40 px-4 py-5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        第 {activeIndex + 1} / {sortedTopics.length} 题
                      </span>
                      <span>切换题目保持思路连贯</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          previousTopic &&
                          handleNavigateToDetail(previousTopic.id)
                        }
                        disabled={!previousTopic}
                        aria-label="上一题"
                        className={cn(
                          "group h-auto justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-left text-base shadow-sm transition hover:border-primary/50 hover:bg-primary/10 hover:shadow-md",
                          !previousTopic && "opacity-60"
                        )}
                      >
                        <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition group-hover:text-primary/80">
                            上一题
                          </span>
                          <span className="text-sm font-medium leading-tight text-foreground transition group-hover:text-primary line-clamp-1">
                            {previousTopic
                              ? previousTopic.title
                              : "已经是第一题"}
                          </span>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          nextTopic && handleNavigateToDetail(nextTopic.id)
                        }
                        disabled={!nextTopic}
                        aria-label="下一题"
                        className={cn(
                          "group h-auto justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-right text-base shadow-sm transition hover:border-primary/50 hover:bg-primary/10 hover:shadow-md",
                          !nextTopic && "opacity-60"
                        )}
                      >
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition group-hover:text-primary/80">
                            下一题
                          </span>
                          <span className="text-sm font-medium leading-tight text-foreground transition group-hover:text-primary line-clamp-1">
                            {nextTopic ? nextTopic.title : "已经是最后一题"}
                          </span>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="items-center justify-center border-dashed">
                <CardContent className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <p className="text-sm">
                    当前题目不可用，请返回列表重新选择。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToList}
                  >
                    返回列表
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
