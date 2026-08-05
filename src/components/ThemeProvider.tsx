"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "sleek-dark" | "clean-business" | "cyberpunk" | "emerald-growth" | "oceanic";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("sleek-dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("metrika-theme") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "sleek-dark");
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("metrika-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Evita Hydration mismatch renderizando children normalmente após montado no client
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.15s ease" }} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
