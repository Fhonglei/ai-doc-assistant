interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-red-800 dark:text-red-200 text-sm">{message}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-sm text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
