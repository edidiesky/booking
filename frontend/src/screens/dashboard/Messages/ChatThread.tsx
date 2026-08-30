import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OnlineDot } from "@/screens/dashboard/Messages/OnlineDot";
import { MessageComposer } from "@/screens/dashboard/Messages/MessageComposer";
import { TypingIndicator } from "@/screens/dashboard/Messages/TypingIndicator";
import { cn } from "@/lib/utils";
import type { ChatMessage, Conversation } from "@/screens/dashboard/Messages/types";
import { ArrowLeft, Check, CheckCheck, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSend: (body: string) => void;
  onBack?: () => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CURRENT_USER_ID = "me";

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  switch (status) {
    case "sending":
      return <Clock className="size-3" />;
    case "sent":
      return <Check className="size-3" />;
    case "delivered":
      return <CheckCheck className="size-3" />;
    case "read":
      return <CheckCheck className="size-3 text-primary" />;
    case "failed":
      return <span className="text-destructive">!</span>;
  }
}

export function ChatThread({ conversation, messages, onSend, onBack }: ChatThreadProps) {
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="Back to conversations"
            className="md:hidden"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="relative shrink-0">
          <Avatar>
            <AvatarImage src={conversation.participant.avatarUrl} alt={conversation.participant.name} />
            <AvatarFallback>{initials(conversation.participant.name)}</AvatarFallback>
          </Avatar>
          <OnlineDot isOnline={conversation.participant.isOnline} />
        </div>
        <div>
          <p className="text-sm font-medium">{conversation.participant.name}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.participant.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === CURRENT_USER_ID;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <p>{msg.body}</p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[10px]",
                    isMine ? "justify-end text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  <span>
                    {new Date(msg.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMine && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {otherPartyTyping && <TypingIndicator name={conversation.participant.name} />}

      <MessageComposer
        onSend={onSend}
        onTypingChange={() => {
          // Local-only demo of the typing indicator's visual state.
          // Toggling the OTHER party's indicator from our own typing
          // event only makes sense once a real backend echoes presence
          // back, left as a harmless no-op here rather than faked.
          setOtherPartyTyping(false);
        }}
      />
    </div>
  );
}