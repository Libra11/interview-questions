import { useMemo } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/markdown/code-block";
import { cn } from "@/lib/utils";

interface QuestionMarkdownProps {
  content: string;
  className?: string;
}

type MarkdownCodeProps = HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  node?: unknown;
  children?: ReactNode;
};

const getCodeContent = (value: ReactNode): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getCodeContent).join("");
  }

  if (value && typeof value === "object" && "props" in value) {
    return getCodeContent((value as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
};

const getClassNameString = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" ");
  }

  return "";
};

const CodeRenderer = ({ className, children, ...props }: MarkdownCodeProps) => {
  const codeClassName = getClassNameString(className);
  const codeValue = getCodeContent(children).replace(/\n$/, "");
  const language = /language-(\w+)/.exec(codeClassName)?.[1];
  const isCodeBlock =
    /language-(\w+)/.test(codeClassName) || codeValue.split("\n").length > 1;

  if (!isCodeBlock) {
    return (
      <code
        {...props}
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground",
          codeClassName,
        )}
      >
        {children}
      </code>
    );
  }

  return <CodeBlock code={codeValue} language={language} />;
};

const markdownComponents: Components = {
  h1: ({ className, children, ...props }) => (
    <h1
      {...props}
      className={cn(
        "text-2xl font-semibold leading-tight tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      {...props}
      className={cn(
        "mt-8 text-xl font-semibold leading-tight tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      {...props}
      className={cn(
        "mt-6 text-lg font-semibold leading-tight tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }) => (
    <p
      {...props}
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    >
      {children}
    </p>
  ),
  ul: ({ className, children, ...props }) => (
    <ul
      {...props}
      className={cn(
        "list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }) => (
    <ol
      {...props}
      className={cn(
        "list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }) => (
    <li {...props} className={cn("marker:text-muted-foreground", className)}>
      {children}
    </li>
  ),
  strong: ({ className, children, ...props }) => (
    <strong
      {...props}
      className={cn("text-foreground font-semibold", className)}
    >
      {children}
    </strong>
  ),
  em: ({ className, children, ...props }) => (
    <em {...props} className={cn("text-foreground/80 italic", className)}>
      {children}
    </em>
  ),
  blockquote: ({ className, children, ...props }) => (
    <blockquote
      {...props}
      className={cn(
        "space-y-2 rounded-xl border-l-4 border-primary/50 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </blockquote>
  ),
  hr: ({ className, ...props }) => (
    <hr
      {...props}
      className={cn("my-6 border-t border-dashed border-border/70", className)}
    />
  ),
  table: ({ className, children, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border/50 bg-card/80">
      <table
        {...props}
        className={cn("w-full border-collapse text-sm text-muted-foreground", className)}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ className, children, ...props }) => (
    <thead {...props} className={cn("bg-muted/70 text-foreground", className)}>
      {children}
    </thead>
  ),
  tbody: ({ className, children, ...props }) => (
    <tbody {...props} className={cn("divide-y divide-border/60", className)}>
      {children}
    </tbody>
  ),
  th: ({ className, children, ...props }) => (
    <th
      {...props}
      className={cn("px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide", className)}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }) => (
    <td {...props} className={cn("px-3 py-2 align-top text-sm", className)}>
      {children}
    </td>
  ),
  a: ({ className, children, href, ...props }) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "text-primary underline underline-offset-4 transition hover:text-primary/80",
        className,
      )}
    >
      {children}
    </a>
  ),
  code: CodeRenderer,
};

const stripFrontmatter = (markdown: string): string => {
  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith("---")) {
    return markdown;
  }

  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return markdown;
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return markdown;
  }

  const body = lines.slice(endIndex + 1).join("\n");
  return body.replace(/^\s+/, "");
};

export function QuestionMarkdown({ content, className }: QuestionMarkdownProps) {
  const normalizedContent = useMemo(() => stripFrontmatter(content), [content]);

  return (
    <div className={cn("space-y-5 text-sm leading-relaxed", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}


