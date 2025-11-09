import { useMemo, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "tsx", className }: CodeBlockProps) {
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
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{language}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={handleCopy}
        >
          {copied ? "已复制" : "复制"}
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


