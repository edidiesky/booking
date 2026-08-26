import { useState } from "react";
import { ConversationList } from "@/screens/dashboard/Messages/ConversationList";
import { ChatThread } from "@/screens/dashboard/Messages/ChatThread";
import {
  useConversations,
  useConversationMessages,
} from "@/screens/dashboard/Messages/hooks/useConversations";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { data: conversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const { data: messages, sendMessage } = useConversationMessages(selectedId);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-6rem)] pt-24 overflow-hidden rounded-lg border border-border bg-card">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        className={cn(
          "w-full md:w-80 md:shrink-0",
          selectedId && "hidden md:flex",
        )}
      />

      <div
        className={cn(
          "w-full flex-1",
          !selectedId && "hidden md:block",
        )}
      >
        {selectedConversation ? (
          <ChatThread
            conversation={selectedConversation}
            messages={messages}
            onSend={sendMessage}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}