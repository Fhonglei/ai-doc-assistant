"use client";

import { formatDateShort } from "@/lib/formatters";
import { IconFile, IconPlus, IconTrash } from "@/components/common/Icons";
import type { ConversationListItem } from "@/lib/types";

interface ConversationSidebarProps {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-subtle bg-surface-elevated shadow-panel">
      <div className="border-b border-subtle p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md">
            <IconFile className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-primary">Doc Assistant</h1>
            <p className="text-xs text-muted">文档智能问答</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          <IconPlus className="h-4 w-4" />
          新对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          历史对话
        </p>
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted leading-relaxed">
            暂无历史记录。
            <br />
            上传文档后开始提问吧。
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conv) => {
              const active = activeConversationId === conv.conversation_id;
              return (
                <li key={conv.conversation_id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv.conversation_id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-accent-soft text-accent ring-1 ring-[var(--accent)]/30"
                        : "text-secondary hover:bg-surface-muted"
                    }`}
                  >
                    <div className="truncate font-medium pr-6">
                      {conv.title || "未命名对话"}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">
                      {formatDateShort(conv.created_at)} · {conv.message_count} 条消息
                    </div>
                  </button>
                  <button
                    type="button"
                    title="删除对话"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.conversation_id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted opacity-0 transition hover:bg-surface-inset hover:text-[var(--danger)] group-hover:opacity-100"
                  >
                    <IconTrash />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
