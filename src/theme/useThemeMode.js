import { useEffect, useState } from "react";

const THEME_KEY = "coding-quiz-theme";

export function useThemeMode() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("light-theme", theme === "light");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    themeClass: theme === "light" ? "light-theme" : "",
    toggleTheme,
  };
}
