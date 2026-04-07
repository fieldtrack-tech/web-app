"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light",  label: "Light",  icon: Sun },
  { value: "dark",   label: "Dark",   icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ThemeToggleProps {
  /** If true, renders as a compact icon-only button with a dropdown */
  compact?: boolean;
}

export function ThemeToggle({ compact = true }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          className="btn-icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle theme"
          aria-expanded={open}
        >
          <CurrentIcon className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-40 rounded-2xl border border-outline-variant/30 bg-surface-container-high shadow-ambient py-1 animate-fade-in">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  theme === value
                    ? "text-primary font-medium"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                )}
                onClick={() => { setTheme(value); setOpen(false); }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
                {theme === value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Pill toggle (light / dark / system)
  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-1 bg-surface-container border border-outline-variant/30"
      role="radiogroup"
      aria-label="Theme"
    >
      {THEMES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            theme === value
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          )}
          onClick={() => setTheme(value)}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
