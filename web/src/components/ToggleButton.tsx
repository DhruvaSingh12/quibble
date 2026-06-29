"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative group rounded-full px-2 py-2 text-sm font-semibold transition-colors border-[2px] overflow-hidden
        ${
          isDark
            ? "bg-foreground text-background"
            : "bg-background text-foreground hover:bg-accent"
        }`}
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      aria-label="Toggle theme"
    >
      {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
    </button>
  );
}
