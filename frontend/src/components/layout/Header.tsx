interface HeaderProps {
  title?: string;
  onNewChat?: () => void;
}

export function Header({ title, onNewChat }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title || "AI Document Assistant"}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Chat
          </button>
        )}
      </div>
    </header>
  );
}
