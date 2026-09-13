import { useEffect, useState } from "react";
import { ConversationList } from "@/screens/dashboard/Messages/ConversationList";
import { ChatThread } from "@/screens/dashboard/Messages/ChatThread";
import {
  useConversations,
  useConversationMessages,
} from "@/screens/dashboard/Messages/hooks/useConversations";
import { cn } from "@/lib/utils";

/**
 * Full-height messaging shell.
 * Avoids pt-24 / calc flicker — fills the dashboard content area stably.
 */
export default function Messages() {
  const { data: conversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Select first conversation once data is available — no layout jump from
  // switching null → id on every render.
  useEffect(() => {
    if (hydrated) return;
    if (conversations.length > 0) {
      setSelectedId((prev) => prev ?? conversations[0]?.id ?? null);
      setHydrated(true);
    }
  }, [conversations, hydrated]);

  const { data: messages, sendMessage, emitTyping } =
    useConversationMessages(selectedId);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-[520px] w-full overflow-hidden bg-white">
      {/* Left rail */}
      <aside
        className={cn(
          "flex h-full w-full flex-col border-r border-[#ebebeb] bg-white md:w-[340px] md:shrink-0 lg:w-[360px]",
          selectedId && "hidden md:flex",
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>

      {/* Thread */}
      <section
        className={cn(
          "flex h-full min-w-0 flex-1 flex-col bg-[#fafafa]",
          !selectedId && "hidden md:flex",
        )}
      >
        {selectedConversation ? (
          <ChatThread
            conversation={selectedConversation}
            messages={messages}
            onSend={sendMessage}
            onTyping={emitTyping}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-[15px] font-medium text-[#222]">Your messages</p>
            <p className="text-[13px] text-[#717171]">
              Select a conversation to start chatting.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}