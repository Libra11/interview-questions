import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? "切换至浅色模式" : "切换至深色模式"}
      onClick={toggleTheme}
      className="relative text-muted-foreground transition hover:text-foreground"
    >
      <Sun
        className={cn(
          "absolute size-4 rotate-0 scale-100 transition-transform duration-300",
          isDark && "-rotate-90 scale-0",
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 rotate-90 scale-0 transition-transform duration-300",
          isDark && "rotate-0 scale-100",
        )}
      />
      <span className="sr-only">切换主题</span>
    </Button>
  );
}


