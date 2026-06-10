import { createContext, useContext } from "react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
