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
    <aside className="w-72 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Logo + New Chat */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📄</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">Doc Assistant</span>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">
          Conversations
        </p>
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-400 px-2">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.conversation_id}
                onClick={() => onSelectConversation(conv.conversation_id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  activeConversationId === conv.conversation_id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <div className="truncate font-medium">
                  {conv.title || "New conversation"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatDateShort(conv.created_at)} · {conv.message_count} msgs
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">
          Documents ({documents.length})
        </p>
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
