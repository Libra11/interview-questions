import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Layers,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

import { QuestionMarkdown } from "@/components/markdown/question-markdown";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestionProgress } from "@/hooks/use-question-progress";
import { categories, difficulties, questionTopics, recommendations } from "@/data/questions";
import {
  defaultQuestionStatus,
  type Difficulty,
  type QuestionStatus,
  type QuestionTopic,
} from "@/types/question";
import { cn } from "@/lib/utils";

const ALL_CATEGORY = "全部领域";
const ALL_DIFFICULTIES: Difficulty | "全部难度" = "全部难度";
type DetailTab = "markdown" | "highlights" | "plan";
const ALL_STATUS = "全部状态";
const statusOptions = [ALL_STATUS, "已完成", "待复习", "已标星"] as const;
type StatusFilter = (typeof statusOptions)[number];
type StatusCountKey = Exclude<StatusFilter, typeof ALL_STATUS>;

const toggleButtonBaseClass =
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background/80 shadow-xs dark:bg-background/40";

const statusBadgeBaseClass =
  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";

function App() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [difficulty, setDifficulty] = useState<Difficulty | "全部难度">(ALL_DIFFICULTIES);
  const [activeId, setActiveId] = useState<string>(questionTopics[0]?.id ?? "");
  const [detailTab, setDetailTab] = useState<DetailTab>("markdown");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_STATUS);

  const { getStatus, toggleCompleted, toggleReview, toggleStar, clearStatus } =
    useQuestionProgress();

  const questionStatuses = useMemo(
    () =>
      questionTopics.map((topic) => ({
        topic,
        status: getStatus(topic.id),
      })),
    [getStatus],
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
    [],
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

    return { completedCount: completed, reviewCount: review, starredCount: starred };
  }, [questionStatuses]);

  const statusCounts: Record<StatusCountKey, number> = {
    已完成: completedCount,
    待复习: reviewCount,
    已标星: starredCount,
  };

  const STATUS_STYLES = {
    completed: {
      label: "已完成",
      className: cn(
        statusBadgeBaseClass,
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200",
      ),
      icon: CheckCircle2,
    },
    review: {
      label: "待复习",
      className: cn(
        statusBadgeBaseClass,
        "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200",
      ),
      icon: Clock3,
    },
    starred: {
      label: "已标星",
      className: cn(
        statusBadgeBaseClass,
        "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200",
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
        topic.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword)) ||
        topic.keywords.some((tag) => tag.toLowerCase().includes(normalizedKeyword));
      const matchesCategory =
        category === ALL_CATEGORY ? true : topic.category === category;
      const matchesDifficulty =
        difficulty === ALL_DIFFICULTIES ? true : topic.difficulty === difficulty;
      const status = statusMap.get(topic.id) ?? defaultQuestionStatus;
      const matchesStatus =
        statusFilter === ALL_STATUS
          ? true
          : statusFilter === "已完成"
            ? status.completed
            : statusFilter === "待复习"
              ? status.review
              : status.starred;
      return matchesKeyword && matchesCategory && matchesDifficulty && matchesStatus;
    });
  }, [keyword, category, difficulty, statusFilter, statusMap]);

  useEffect(() => {
    if (!filteredTopics.length) {
      setActiveId("");
      return;
    }
    if (!filteredTopics.some((topic) => topic.id === activeId)) {
      setActiveId(filteredTopics[0].id);
    }
  }, [filteredTopics, activeId]);

  const activeTopic: QuestionTopic | null =
    filteredTopics.find((topic) => topic.id === activeId) ?? filteredTopics[0] ?? null;

  const activeStatus = activeTopic
    ? statusMap.get(activeTopic.id) ?? defaultQuestionStatus
    : defaultQuestionStatus;

  useEffect(() => {
    setDetailTab("markdown");
  }, [activeTopic?.id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_60%)]" />

      <div className="flex min-h-screen w-full flex-col gap-8 px-6 py-10 lg:px-12 xl:px-16 2xl:px-24">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-3 text-xs uppercase tracking-[0.3em]">
              Frontend Interview Planner
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              前端面试刷题手册
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
              精心整理 React、TypeScript、性能优化等高频面试题目，配合 Markdown 详解与答题要点，帮助你快速梳理知识结构。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/5 via-background/70 to-background shadow-[0_20px_45px_-30px_rgba(59,130,246,0.45)]">
          <div className="absolute inset-0 -z-10 opacity-90 [mask-image:radial-gradient(circle_at_top,_rgba(0,0,0,0.65),_transparent_70%)]">
            <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -right-36 top-1/3 h-80 w-80 rounded-full bg-violet-400/30 blur-[120px]" />
          </div>
          <CardHeader className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:border-primary/40 dark:bg-primary/35 dark:text-foreground">
                <Sparkles className="size-3.5 text-primary dark:text-primary" />
                今日建议练习路径
              </div>
              <CardTitle className="text-2xl font-semibold md:text-3xl">
                数据驱动的练习看板
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-relaxed md:text-base">
                建议先从基础题目热身，再进入核心专题，最后通过工程化题目串联流程，形成完整的面试表达。
              </CardDescription>
            </div>
            <div className="grid w-full max-w-[680px] grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "题目总数", value: totalQuestions, gradient: "from-blue-500/25 to-blue-500/5", icon: BookOpenCheck },
                { label: "覆盖领域", value: totalCategories, gradient: "from-indigo-500/25 to-indigo-500/5", icon: Layers },
                { label: "核心标签", value: totalTags, gradient: "from-purple-500/25 to-purple-500/5", icon: Tag },
                { label: "已完成", value: completedCount, gradient: "from-emerald-500/25 to-emerald-500/5", icon: CheckCircle2 },
                { label: "待复习", value: reviewCount, gradient: "from-amber-500/25 to-amber-500/5", icon: Clock3 },
                { label: "已标星", value: starredCount, gradient: "from-fuchsia-500/25 to-fuchsia-500/5", icon: Star },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br p-4 shadow-sm backdrop-blur",
                    item.gradient,
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="size-4 text-foreground/70" />
                    <p className="text-xs">{item.label}</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-foreground md:text-2xl">
                    {item.value}
                  </p>
                  <span className="absolute -right-3 top-3 h-12 w-12 rounded-full bg-white/10 blur-xl" />
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 pb-10 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="shadow-xs">
              <CardHeader className="gap-5">
                <div>
                  <CardTitle className="text-lg font-semibold">筛选器</CardTitle>
                  <CardDescription>支持按关键词、领域与难度进行组合筛选。</CardDescription>
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
                  <h3 className="text-sm font-medium text-muted-foreground">领域</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[ALL_CATEGORY, ...categories].map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={category === item ? "default" : "ghost"}
                        onClick={() => setCategory(item)}
                        className={cn(
                          "rounded-full border transition",
                          category === item && "shadow-md",
                        )}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-muted-foreground">难度</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[ALL_DIFFICULTIES, ...difficulties].map((item) => (
                      <Badge
                        key={item}
                        asChild
                        variant={difficulty === item ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1 text-xs"
                      >
                        <button type="button" onClick={() => setDifficulty(item)}>
                          {item}
                        </button>
                      </Badge>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium text-muted-foreground">练习状态</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions.map((option) => {
                      const isActive = statusFilter === option;
                      const count =
                        option === ALL_STATUS ? undefined : statusCounts[option as StatusCountKey];
                      return (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "ghost"}
                          onClick={() => setStatusFilter(option)}
                          className={cn(
                            "rounded-full border transition",
                            isActive && "shadow-md",
                          )}
                        >
                          {option}
                          {option !== ALL_STATUS && (
                            <span className="ml-1 text-xs opacity-80">({count})</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  题库列表
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    {filteredTopics.length} 条结果
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {filteredTopics.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    暂无匹配的题目，请尝试调整筛选条件。
                  </div>
                ) : (
                  filteredTopics.map((topic) => {
                    const status = statusMap.get(topic.id) ?? defaultQuestionStatus;
                    const hasStatus =
                      status.completed || status.review || status.starred;

                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setActiveId(topic.id)}
                        className={cn(
                          "rounded-xl border bg-card px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                          activeTopic?.id === topic.id &&
                            "border-primary/60 bg-primary/5 shadow-md backdrop-blur",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{topic.title}</p>
                          <Badge variant="secondary" className="text-[11px]">
                            {topic.difficulty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                          {topic.summary}
                        </p>
                        {hasStatus && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {status.review && (
                              <span className={STATUS_STYLES.review.className}>
                                <STATUS_STYLES.review.icon className="size-3" />
                                {STATUS_STYLES.review.label}
                              </span>
                            )}
                            {status.starred && (
                              <span className={STATUS_STYLES.starred.className}>
                                <STATUS_STYLES.starred.icon className="size-3" />
                                {STATUS_STYLES.starred.label}
                              </span>
                            )}
                            {status.completed && (
                              <span className={STATUS_STYLES.completed.className}>
                                <STATUS_STYLES.completed.icon className="size-3" />
                                {STATUS_STYLES.completed.label}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">加分练习</CardTitle>
                <CardDescription>
                  面试官常追问的延伸话题，可准备 1-2 个案例作为亮点。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-dashed border-muted-foreground/20 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {item.hint}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {activeTopic ? (
              <>
                <Card className="shadow-xs backdrop-blur">
                  <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="uppercase tracking-wide">
                          {activeTopic.category}
                        </Badge>
                        <Badge variant="secondary">{activeTopic.difficulty}</Badge>
                        <Badge variant="secondary">更新于 {activeTopic.updatedAt}</Badge>
                      </div>
                      <CardTitle className="text-2xl font-semibold leading-tight md:text-3xl">
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
                          <Badge key={keywordItem} variant="outline" className="text-xs">
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
                                "border-violet-500 bg-violet-500/20 text-violet-700 dark:border-violet-400 dark:bg-violet-500/30 dark:text-violet-100",
                            )}
                          >
                            <Star
                              className="size-4"
                              fill={activeStatus.starred ? "currentColor" : "none"}
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
                                "border-amber-500 bg-amber-500/20 text-amber-700 dark:border-amber-400 dark:bg-amber-500/30 dark:text-amber-100",
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
                                "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/30 dark:text-emerald-100",
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
                    <Tabs
                      value={detailTab}
                      onValueChange={(value) => {
                        if (value === "markdown" || value === "highlights" || value === "plan") {
                          setDetailTab(value);
                        }
                      }}
                    >
                      <TabsList className="inline-flex max-w-full flex-wrap justify-start gap-2 bg-muted/40 px-2 py-1.5 rounded-lg">
                        <TabsTrigger value="markdown">题目详解</TabsTrigger>
                        <TabsTrigger value="highlights">速记要点</TabsTrigger>
                        <TabsTrigger value="plan">复盘 checklist</TabsTrigger>
                      </TabsList>
                      <TabsContent value="markdown" className="mt-4">
                        <QuestionMarkdown content={activeTopic.content} />
                      </TabsContent>
                      <TabsContent value="highlights" className="mt-4">
                        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 p-5 text-sm leading-relaxed">
                          <h3 className="mb-3 text-base font-semibold text-foreground">
                            面试官期望听到的关键点
                          </h3>
                          <ul className="grid list-disc gap-2 pl-5 text-muted-foreground">
                            {activeTopic.keywords.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                          <p className="mt-4 rounded-lg border border-transparent bg-primary/5 p-3 text-xs text-primary">
                            建议：将答题结构拆分为“场景-挑战-解决方案-收益”，并准备至少一个实际项目案例。
                          </p>
                        </div>
                      </TabsContent>
                      <TabsContent value="plan" className="mt-4">
                        <div className="rounded-xl bg-card p-5 text-sm leading-relaxed shadow-inner">
                          <ol className="grid list-decimal gap-3 pl-5 text-foreground/80">
                            <li>快速复述题目背景，明确面试官想考察的能力。</li>
                            <li>结合 Markdown 详解列出 3 个核心观点，每个观点配一个真实项目案例。</li>
                            <li>总结复盘时记录遗忘的知识点，加入明日练习清单。</li>
                          </ol>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {activeTopic.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full items-center justify-center border-dashed">
                <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <p className="text-sm">当前筛选条件暂无题目</p>
                  <Button variant="outline" onClick={() => setKeyword("")}>
                    重置搜索条件
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
