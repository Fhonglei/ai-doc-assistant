interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-900/40 dark:text-red-300"
      >
        !
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-red-800 dark:text-red-200 text-sm">{message}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            重试
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="关闭错误提示"
            className="text-sm text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
