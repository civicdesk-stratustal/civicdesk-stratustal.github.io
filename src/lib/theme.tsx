import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type TextSize = "small" | "default" | "large";

type ThemeState = {
  theme: ThemeMode;
  textSize: TextSize;
  setTheme: (t: ThemeMode) => void;
  setTextSize: (s: TextSize) => void;
};

const KEY_THEME = "civicdesk.theme";
const KEY_TEXT = "civicdesk.textSize";

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [textSize, setTextSizeState] = useState<TextSize>("default");

  useEffect(() => {
    const storedTheme = localStorage.getItem(KEY_THEME) as ThemeMode | null;
    const storedText = localStorage.getItem(KEY_TEXT) as TextSize | null;
    if (storedTheme === "light" || storedTheme === "dark") setThemeState(storedTheme);
    if (storedText === "small" || storedText === "default" || storedText === "large") {
      setTextSizeState(storedText);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset['textSize'] = textSize;
    localStorage.setItem(KEY_THEME, theme);
    localStorage.setItem(KEY_TEXT, textSize);
  }, [theme, textSize]);

  const value = useMemo(
    () => ({
      theme,
      textSize,
      setTheme: setThemeState,
      setTextSize: setTextSizeState,
    }),
    [theme, textSize],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
