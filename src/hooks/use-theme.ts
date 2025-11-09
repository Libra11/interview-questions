import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "interview-questions-theme";
const subscribers = new Set<() => void>();

let initialized = false;
let currentTheme: Theme = "light";

const isBrowser = () => typeof window !== "undefined";

const notify = () => {
  subscribers.forEach((callback) => callback());
};

const getPreferredTheme = (): Theme => {
  if (!isBrowser()) {
    return currentTheme;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.setProperty("color-scheme", theme);
};

const ensureInitialized = () => {
  if (initialized || !isBrowser()) {
    return;
  }

  initialized = true;
  currentTheme = getPreferredTheme();
  applyTheme(currentTheme);
  window.localStorage.setItem(STORAGE_KEY, currentTheme);
};

const setThemeValue = (theme: Theme) => {
  ensureInitialized();
  currentTheme = theme;
  applyTheme(theme);
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
  notify();
};

const subscribe = (callback: () => void) => {
  ensureInitialized();
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

const getSnapshot = () => {
  ensureInitialized();
  return currentTheme;
};

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        return;
      }
      setThemeValue(event.matches ? "dark" : "light");
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeValue(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeValue(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );
}

if (isBrowser()) {
  ensureInitialized();
}


