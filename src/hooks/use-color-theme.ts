import { useEffect, useState } from "react";

export const colorThemes = [
  { name: "blue", label: "蓝色", color: "hsl(221 83% 53%)" },
  { name: "green", label: "绿色", color: "hsl(142.1 76.2% 36.3%)" },
  { name: "purple", label: "紫色", color: "hsl(262.1 83.3% 57.8%)" },
  { name: "orange", label: "橙色", color: "hsl(24.6 95% 53.1%)" },
  { name: "red", label: "红色", color: "hsl(346.8 77.2% 49.8%)" },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["name"];

const STORAGE_KEY = "interview-questions-color-theme";

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("blue");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorTheme;
    if (stored && colorThemes.some((t) => t.name === stored)) {
      setColorTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", colorTheme);
    localStorage.setItem(STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  return {
    colorTheme,
    setColorTheme,
    themes: colorThemes,
  };
}
