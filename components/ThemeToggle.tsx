"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-navy-panel/40 border border-[#00FF87]/20 hover:border-[#00FF87]/50 shadow-[0_0_15px_rgba(0,255,135,0.05)] hover:shadow-[0_0_15px_rgba(0,255,135,0.2)] text-[#00FF87] hover:text-[#60EFFF] transition-all duration-300 active:scale-90"
    >
      <div className="relative h-5 w-5 flex items-center justify-center overflow-hidden">
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-[spin_12s_linear_infinite] transition-transform" />
        ) : (
          <Moon className="h-5 w-5 text-[#4B0082] drop-shadow-[0_0_8px_rgba(75,0,130,0.4)] animate-[pulse_3s_ease-in-out_infinite] transition-transform" />
        )}
      </div>
    </button>
  );
}
