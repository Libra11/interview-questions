import { Palette } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ColorTheme, useColorTheme } from "@/hooks/use-color-theme";
import { cn } from "@/lib/utils";

export function ThemeCustomizer() {
  const { colorTheme, setColorTheme, themes } = useColorTheme();

  return (
    <Select
      value={colorTheme}
      onValueChange={(value) => setColorTheme(value as ColorTheme)}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-[130px] bg-transparent px-3 text-xs",
          "border-border/50 hover:border-border focus:ring-0 focus:ring-offset-0"
        )}
      >
        <Palette className="mr-2 size-3.5 opacity-70" />
        <SelectValue placeholder="选择主题" />
      </SelectTrigger>
      <SelectContent>
        {themes.map((theme) => (
          <SelectItem key={theme.name} value={theme.name} className="text-xs">
            <div className="flex items-center gap-2">
              <div
                className="size-3 rounded-full border border-black/10 dark:border-white/10"
                style={{ backgroundColor: theme.color }}
              />
              {theme.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
