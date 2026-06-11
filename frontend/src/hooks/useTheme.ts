import { useState, useEffect, useCallback } from "react";

export type ThemeName = "dark-amber" | "cave-fresh";

const THEME_KEY = "digital-brain-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "dark-amber";
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark-amber" || stored === "cave-fresh") return stored;
    return "dark-amber";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark-amber");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
  }, []);

  return { theme, setTheme };
}
