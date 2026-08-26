import { useState, useCallback } from "react";
import type { Conversation, ChatMessage } from "@/screens/dashboard/Messages/types";
import { mockConversations, mockMessagesByConversation } from "@/mocks/messages";

// Shape deliberately mirrors what useGetConversationsQuery() from a future
// RTK Query messageApi.ts would return ({ data, isLoading }), so this hook
// is swappable later without touching any component that consumes it.
export function useConversations() {
  const [conversations] = useState<Conversation[]>(mockConversations);
  return { data: conversations, isLoading: false };
}

export function useConversationMessages(conversationId: string | null) {
  const [messagesByConversation, setMessagesByConversation] = useState(
    mockMessagesByConversation,
  );

  const messages = conversationId
    ? (messagesByConversation[conversationId] ?? [])
    : [];

  // Stand-in for a real send mutation. Optimistically appends locally;
  // the real implementation posts to the backend and the message arrives
  // back over the socket connection, this local-only version exists so
  // the UI is demonstrable before that backend exists.
  const sendMessage = useCallback(
    (body: string) => {
      if (!conversationId || !body.trim()) return;
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversationId,
        senderId: "me",
        body,
        sentAt: new Date().toISOString(),
        status: "sending",
      };
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimistic],
      }));
    },
    [conversationId],
  );

  return { data: messages, isLoading: false, sendMessage };
}