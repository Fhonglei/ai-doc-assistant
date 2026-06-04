"use client";

import { useTheme } from "@/components/common/ThemeProvider";
import { IconMenu, IconMoon, IconSun } from "@/components/common/Icons";

interface HeaderProps {
  title?: string;
  backendOk?: boolean | null;
  onOpenConversations?: () => void;
  onOpenDocuments?: () => void;
}

export function Header({
  title,
  backendOk,
  onOpenConversations,
  onOpenDocuments,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-subtle bg-surface-elevated/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenConversations}
          className="lg:hidden rounded-lg p-2 text-secondary hover:bg-surface-muted"
          aria-label="打开对话列表"
        >
          <IconMenu />
        </button>
        <h1 className="truncate text-base font-semibold text-primary">
          {title || "AI Document Assistant"}
        </h1>
        {backendOk !== null && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              backendOk
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendOk ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {backendOk ? "已连接" : "后端离线"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenDocuments}
          className="lg:hidden rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft"
        >
          文档
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-secondary transition hover:bg-surface-muted"
          aria-label="切换主题"
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
