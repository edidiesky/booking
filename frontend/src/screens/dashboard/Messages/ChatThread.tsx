import { useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Phone,
  MoreHorizontal,
} from "lucide-react";
import Avatar from "@/components/common/Avatar";
import { OnlineDot } from "@/screens/dashboard/Messages/OnlineDot";
import { MessageComposer } from "@/screens/dashboard/Messages/MessageComposer";
import { TypingIndicator } from "@/screens/dashboard/Messages/TypingIndicator";
import { cn } from "@/lib/utils";
import type {
  ChatMessage,
  Conversation,
} from "@/screens/dashboard/Messages/types";

interface ChatThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSend: (body: string) => void;
  onTyping?: () => void;
  onBack?: () => void;
}

const CURRENT_USER_ID = "me";

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  switch (status) {
    case "sending":
      return <Clock className="size-3 opacity-70" />;
    case "sent":
      return <Check className="size-3 opacity-70" />;
    case "delivered":
      return <CheckCheck className="size-3 opacity-70" />;
    case "read":
      return <CheckCheck className="size-3 text-[#4f46e5]" />;
    case "failed":
      return <span className="text-red-500">!</span>;
    default:
      return null;
  }
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDay(messages: ChatMessage[]) {
  const groups: { label: string; items: ChatMessage[] }[] = [];
  let current = "";
  for (const msg of messages) {
    const label = dayLabel(msg.sentAt);
    if (label !== current) {
      current = label;
      groups.push({ label, items: [msg] });
    } else {
      groups[groups.length - 1]!.items.push(msg);
    }
  }
  return groups;
}

export function ChatThread({
  conversation,
  messages,
  onSend,
  onTyping,
  onBack,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByDay(messages), [messages]);

  // Scroll only the thread pane — not the whole page (avoids jump to top)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, conversation.id]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebebeb] bg-white px-4 py-3 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-[#f5f5f3] md:hidden"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="relative shrink-0">
            <Avatar
              src={conversation.participant.avatarUrl}
              name={conversation.participant.name}
              size={40}
            />
            <OnlineDot isOnline={conversation.participant.isOnline} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#17191c]">
              {conversation.participant.name}
            </p>
            <p className="text-[12px] text-[#777b86]">
              {conversation.participant.isOnline ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  Online
                </span>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-[#e8e6e3] px-3 text-[13px] font-medium text-[#17191c] hover:bg-[#fafaf9] sm:inline-flex"
          >
            <Phone size={14} className="text-[#777b86]" />
            Call
          </button>
          <button
            type="button"
            className="h-9 rounded-full bg-[#17191c] px-3.5 text-[13px] font-medium text-white hover:bg-black"
          >
            See Profile
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f3]"
            aria-label="More"
          >
            <MoreHorizontal size={18} className="text-[#777b86]" />
          </button>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-[11px] font-medium text-[#777b86]">
                  {group.label}
                </span>
              </div>

              {group.items.map((msg) => {
                const isMine = msg.senderId === CURRENT_USER_ID;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isMine && (
                      <Avatar
                        src={conversation.participant.avatarUrl}
                        name={conversation.participant.name}
                        size={28}
                        className="mb-0.5 shrink-0"
                      />
                    )}
                    <div
                      className={cn(
                        "max-w-[min(75%,420px)] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                        isMine
                          ? "rounded-br-md bg-[#17191c] text-white"
                          : "rounded-bl-md bg-[#f3f4f6] text-[#17191c]",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-[10px]",
                          isMine
                            ? "justify-end text-white/60"
                            : "text-[#a3a6af]",
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
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <TypingIndicator name={conversation.participant.name} hidden />

      <MessageComposer onSend={onSend} onTyping={onTyping} />
    </div>
  );
}