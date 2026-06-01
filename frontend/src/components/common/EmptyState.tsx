export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="text-6xl mb-6">📄</div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        AI Document Assistant
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Upload a PDF, DOCX, or TXT file from the sidebar, then ask questions about the content.
        I&apos;ll find relevant information and show you the sources.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {[
          "Summarize the main points",
          "What are the key findings?",
          "Compare the documents",
          "Extract all action items",
        ].map((q) => (
          <span
            key={q}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}
