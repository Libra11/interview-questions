/**
 * Author: Libra
 * Date: 2025-11-09 15:07:44
 * Description:
 * LastEditors: Libra
 */
import { useMemo, useState } from "react";
import hljs from "highlight.js";
import vue from "highlight.js/lib/languages/xml"; // Vue uses XML/HTML syntax
import "highlight.js/styles/atom-one-dark.css";

// Register Vue language
hljs.registerLanguage("vue", vue);

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "tsx",
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    const trimmed = code.trimEnd();
    if (trimmed.length === 0) {
      return "";
    }

    const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
    return hljs.highlight(trimmed, { language: validLanguage }).value;
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trimEnd());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-background/80 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors" />
          <div className="size-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors" />
          <div className="size-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/80 transition-colors" />
          <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {language}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 rounded-md px-2 text-[10px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? "已复制" : "复制代码"}
        </Button>
      </div>
      <pre className="scrollbar-thin overflow-auto px-4 py-4 text-xs leading-6">
        <code
          className={cn("language-" + language, "font-mono")}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}
