"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ConversationSidebar } from "@/components/layout/ConversationSidebar";
import { DocumentsPanel } from "@/components/layout/DocumentsPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useChatStore } from "@/stores/chat-store";
import * as api from "@/lib/api-client";
import type { ConversationListItem } from "@/lib/types";
import type { Message } from "@/lib/types";

export function AppShell() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileDocs, setMobileDocs] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const clearChat = useChatStore((s) => s.clearChat);

  const refreshConversations = useCallback(async () => {
    try {
      const r = await api.listConversations();
      setConversations(r.conversations);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshConversations();
    api
      .checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, [refreshConversations]);

  const handleNewConversation = useCallback(() => {
    clearChat();
    setChatKey((k) => k + 1);
    setMobileNav(false);
  }, [clearChat]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveConversation(id);
      setChatKey((k) => k + 1);
      setMobileNav(false);
      try {
        const conv = await api.getConversation(id);
        const messages: Message[] = conv.messages.map((m, i) => ({
          id: `hist_${id}_${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources,
          timestamp: m.timestamp,
        }));
        loadMessages(messages);
      } catch {
        loadMessages([]);
      }
    },
    [setActiveConversation, loadMessages]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await api.deleteConversation(id);
        if (activeConversationId === id) {
          handleNewConversation();
        }
        await refreshConversations();
      } catch {
        /* ignore */
      }
    },
    [activeConversationId, handleNewConversation, refreshConversations]
  );

  const activeTitle =
    conversations.find((c) => c.conversation_id === activeConversationId)?.title ||
    (activeConversationId ? "对话" : "新对话");

  return (
    <div className="flex h-full bg-surface-base">
      {/* Mobile overlay */}
      {(mobileNav || mobileDocs) && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="关闭菜单"
          onClick={() => {
            setMobileNav(false);
            setMobileDocs(false);
          }}
        />
      )}

      {/* Conversations */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-[min(100%,280px)] shrink-0 transform transition-transform duration-200
          lg:translate-x-0
          ${mobileNav ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          title={activeTitle}
          backendOk={backendOk}
          onOpenConversations={() => setMobileNav(true)}
          onOpenDocuments={() => setMobileDocs(true)}
        />
        <main className="flex flex-1 flex-col min-h-0 bg-surface-base">
          <ChatPanel
            key={`${activeConversationId ?? "new"}-${chatKey}`}
            onConversationUpdated={refreshConversations}
          />
        </main>
      </div>

      {/* Documents */}
      <div
        className={`
          fixed lg:static inset-y-0 right-0 z-50 lg:z-auto
          w-[min(100%,320px)] shrink-0 transform transition-transform duration-200
          lg:translate-x-0
          ${mobileDocs ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
        <DocumentsPanel onClose={() => setMobileDocs(false)} />
      </div>
    </div>
  );
}
