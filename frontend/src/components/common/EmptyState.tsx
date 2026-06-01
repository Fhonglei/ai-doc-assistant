export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 select-none">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <span className="text-5xl">📄</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-md">
          <span className="text-white text-sm">✨</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
        Ask your documents anything
      </h2>

      {/* Description */}
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        Upload PDF, DOCX, or TXT files in the sidebar, then ask questions.
        AI will search through your documents and answer with cited sources.
      </p>

      {/* Suggested questions */}
      <div className="space-y-2 max-w-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Try asking
        </p>
        {[
          { icon: "📋", text: "Summarize the main points of the document" },
          { icon: "🔍", text: "What are the key findings and conclusions?" },
          { icon: "⚡", text: "Compare the main arguments across all documents" },
          { icon: "📌", text: "Extract all action items and recommendations" },
        ].map((q) => (
          <div
            key={q.text}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400"
          >
            <span className="text-base flex-shrink-0">{q.icon}</span>
            <span className="text-left">{q.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
