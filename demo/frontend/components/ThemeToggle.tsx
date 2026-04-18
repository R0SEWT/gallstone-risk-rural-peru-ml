"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABELS: Record<Theme, string> = {
  system: "SYS",
  light: "LIGHT",
  dark: "DARK",
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "light" || theme === "dark") {
    root.classList.add(theme);
  }
}

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStored());
    setMounted(true);
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema: ${LABELS[theme]}. Clic para cambiar.`}
      className="fixed right-4 top-4 z-50 inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-0)]/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted-strong)] backdrop-blur transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      <span>{mounted ? LABELS[theme] : LABELS.system}</span>
    </button>
  );
}
