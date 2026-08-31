"use client";

import { useEffect, useState } from "react";
import { useMessages } from "./locale-context";

type ThemeChoice = "system" | "light" | "dark";

const storageKey = "tcptun-theme";

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  root.dataset.theme = choice;
  if (choice === "system") {
    root.style.colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return;
  }
  root.style.colorScheme = choice;
}

function savedTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(storageKey);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export default function ThemeToggle() {
  const t = useMessages();
  const choices: Array<{ label: string; value: ThemeChoice }> = [
    { label: t.theme.system, value: "system" },
    { label: t.theme.light, value: "light" },
    { label: t.theme.dark, value: "dark" },
  ];
  const [theme, setTheme] = useState<ThemeChoice>(() => savedTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemChange() {
      if (savedTheme() === "system") applyTheme("system");
    }
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  function choose(nextTheme: ThemeChoice) {
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="theme-toggle" role="group" aria-label={t.theme.group} suppressHydrationWarning>
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          aria-pressed={theme === choice.value}
          className={theme === choice.value ? "active" : ""}
          onClick={() => choose(choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
