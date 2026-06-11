import { createContext, useContext } from "react";
import { useTheme, type ThemeName } from "@/hooks/useTheme";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark-amber", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
export function useThemeContext() {
  return useContext(ThemeContext);
}
