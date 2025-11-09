/*
 * @Author: Libra
 * @Date: 2025-11-09 15:00:07
 * @Description:
 * @LastEditors: Libra
 */
/*
 * @Author: Libra
 * @Date: 2025-11-09 15:00:07
 * @Description:
 * @LastEditors: Libra
 */
import { parse as parseYaml } from "yaml";
import type {
  Difficulty,
  QuestionRecommendation,
  QuestionTopic,
} from "@/types/question";

const MARKDOWN_MODULES = import.meta.glob<string>("../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const DIFFICULTY_VALUES: Difficulty[] = ["入门", "中级", "高级"];

interface QuestionFrontmatter {
  id?: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  summary: string;
  tags: string[];
  updatedAt: string;
  estimatedTime: string;
  keywords: string[];
  highlight?: string;
  order?: number;
}

const ensureString = (
  value: unknown,
  key: string,
  filePath: string
): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  throw new Error(`Markdown frontmatter "${key}" is missing in ${filePath}`);
};

const ensureStringArray = (
  value: unknown,
  key: string,
  filePath: string
): string[] => {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  throw new Error(
    `Markdown frontmatter "${key}" must be a string array in ${filePath}`
  );
};

const ensureDifficulty = (value: unknown, filePath: string): Difficulty => {
  if (
    typeof value === "string" &&
    DIFFICULTY_VALUES.includes(value as Difficulty)
  ) {
    return value as Difficulty;
  }
  throw new Error(
    `Markdown frontmatter "difficulty" must be one of ${DIFFICULTY_VALUES.join(
      ", "
    )} in ${filePath}`
  );
};

const toSlug = (filePath: string): string => {
  const match = filePath.match(/([^/\\]+)\.md$/i);
  return match ? match[1] : filePath;
};

const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)\r?\n---\s*/;

const extractFrontmatter = (raw: string) => {
  const trimmed = raw.trimStart();
  const match = trimmed.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: {} as Partial<QuestionFrontmatter>,
      body: raw,
    };
  }

  const [, yamlSource] = match;
  const body = trimmed.slice(match[0].length);
  const parsed = yamlSource
    ? (parseYaml(yamlSource) as Partial<QuestionFrontmatter>)
    : {};

  return {
    frontmatter: parsed,
    body,
  };
};

const parseFrontmatter = (filePath: string, raw: string) => {
  const { frontmatter, body } = extractFrontmatter(raw);

  const id =
    typeof frontmatter.id === "string" ? frontmatter.id : toSlug(filePath);
  const title = ensureString(frontmatter.title, "title", filePath);
  const category = ensureString(frontmatter.category, "category", filePath);
  const difficulty = ensureDifficulty(frontmatter.difficulty, filePath);
  const summary = ensureString(frontmatter.summary, "summary", filePath);
  const tags = ensureStringArray(frontmatter.tags, "tags", filePath);
  const updatedAt = ensureString(frontmatter.updatedAt, "updatedAt", filePath);
  const estimatedTime = ensureString(
    frontmatter.estimatedTime,
    "estimatedTime",
    filePath
  );
  const keywords = ensureStringArray(
    frontmatter.keywords,
    "keywords",
    filePath
  );
  const highlight =
    typeof frontmatter.highlight === "string" &&
    frontmatter.highlight.trim().length > 0
      ? frontmatter.highlight.trim()
      : undefined;
  const order =
    typeof frontmatter.order === "number" && Number.isFinite(frontmatter.order)
      ? frontmatter.order
      : Number.MAX_SAFE_INTEGER;

  const normalizedContent = body.replace(/^\s+/, "");

  return {
    order,
    topic: {
      id,
      title,
      category,
      difficulty,
      summary,
      tags,
      updatedAt,
      estimatedTime,
      keywords,
      content: normalizedContent,
      highlight,
    } satisfies QuestionTopic,
  };
};

const parsedTopics = Object.entries(MARKDOWN_MODULES).map(([filePath, raw]) =>
  parseFrontmatter(filePath, raw)
);

export const questionTopics: QuestionTopic[] = parsedTopics
  .sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.topic.title.localeCompare(b.topic.title, "zh-Hans");
  })
  .map((entry) => entry.topic);

export const difficulties: Difficulty[] = DIFFICULTY_VALUES.filter((value) =>
  questionTopics.some((topic) => topic.difficulty === value)
);

export const recommendations: QuestionRecommendation[] = [
  {
    id: "system-design",
    title: "系统设计：可扩展的前端部署架构",
    hint: "关注 CDN、Edge 与缓存策略的组合。",
  },
  {
    id: "a11y",
    title: "无障碍体验：组件库需要注意什么？",
    hint: "关注键盘可达性、语义化标签与 ARIA。",
  },
  {
    id: "testing",
    title: "测试策略：如何覆盖关键路径？",
    hint: "单测、组件测试、E2E 的协同。",
  },
];

export const categories = Array.from(
  new Set(questionTopics.map((topic) => topic.category))
);
