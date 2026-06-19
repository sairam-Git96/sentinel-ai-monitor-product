import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const KEY = "sentinel.theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY);
      const isDark = v === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch { /* ignore */ }
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { window.localStorage.setItem(KEY, next ? "dark" : "light"); } catch { /* ignore */ }
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggle}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          className="h-9 w-9 grid place-items-center rounded-md border bg-background hover:bg-muted"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{dark ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
