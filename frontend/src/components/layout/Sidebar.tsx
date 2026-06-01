"use client";

import { useRef } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { formatDateShort } from "@/lib/formatters";

interface SidebarProps {
  conversations: Array<{
    conversation_id: string;
    title: string | null;
    created_at: string;
    message_count: number;
  }>;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: SidebarProps) {
  const { documents, uploads, upload, remove } = useDocuments();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white text-lg">📄</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
              Doc Assistant
            </h1>
            <p className="text-xs text-slate-400">RAG Knowledge Base</p>
          </div>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          ✨ New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
          Conversations
        </p>
        {conversations.length === 0 ? (
          <p className="text-xs text-slate-400 px-2 py-4 text-center">
            No conversations yet.<br />Start a new chat to begin.
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.conversation_id}
                onClick={() => onSelectConversation(conv.conversation_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeConversationId === conv.conversation_id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="truncate font-medium text-sm">
                  {conv.title || "New conversation"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {formatDateShort(conv.created_at)} · {conv.message_count} msgs
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-3 py-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Documents
          </p>
          <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {documents.length}
          </span>
        </div>
        <DocumentUploader
          onUpload={upload}
          uploads={uploads}
          inputRef={uploadInputRef}
        />
        <DocumentList
          documents={documents}
          onDelete={remove}
        />
      </div>
    </aside>
  );
}
