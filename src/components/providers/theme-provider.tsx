"use client";

import React, { createContext, useContext, useEffect } from "react";

interface ThemeContextValue {
  theme: "dark";
  resolvedTheme: "dark";
  setTheme: (_theme: "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => undefined,
});

function applyDarkTheme() {
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyDarkTheme();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: () => undefined,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
