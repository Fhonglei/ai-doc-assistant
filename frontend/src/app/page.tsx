"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import * as api from "@/lib/api-client";

export default function Home() {
  const [conversations, setConversations] = useState<
    Array<{
      conversation_id: string;
      title: string | null;
      created_at: string;
      message_count: number;
    }>
  >([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);

  // Fetch conversations on mount
  useEffect(() => {
    api.listConversations()
      .then((r) => setConversations(r.conversations))
      .catch(() => {});
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setChatKey((k) => k + 1);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setChatKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={
            conversations.find((c) => c.conversation_id === activeConversationId)
              ?.title || "AI Document Assistant"
          }
          onNewChat={handleNewConversation}
        />
        <ChatPanel
          key={`${activeConversationId || "new"}-${chatKey}`}
        />
      </div>
    </div>
  );
}
