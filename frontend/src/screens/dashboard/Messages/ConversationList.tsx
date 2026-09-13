import { useState } from "react";
import { Search } from "lucide-react";
import { OnlineDot } from "@/screens/dashboard/Messages/OnlineDot";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/screens/dashboard/Messages/types";
import Avatar from "@/components/common/Avatar";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function handleFromName(name: string): string {
  const part = name.trim().split(/\s+/)[0] ?? name;
  return `@${part.toLowerCase()}`;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  className,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnread = conversations.reduce(
    (n, c) => n + (c.unreadCount || 0),
    0,
  );

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="shrink-0 border-b border-[#ebebeb] px-5 pt-5 pb-4">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-[18px] font-semibold text-[#17191c]">Chatting</h1>
          {conversations.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#eef2ff] px-1.5 text-[11px] font-semibold text-[#4f46e5]">
              {totalUnread > 0 ? totalUnread : conversations.length}
            </span>
          )}
        </div>

        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Chats"
            className="h-10 w-full rounded-xl border border-[#e8e6e3] bg-[#f7f7f5] pl-9 pr-3 text-[13px] text-[#17191c] outline-none placeholder:text-[#a3a6af] focus:border-[#c4c6ce] focus:bg-white"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2" role="list">
        {filtered.map((conv) => {
          const isSelected = conv.id === selectedId;
          return (
            <li key={conv.id}>
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  isSelected ? "bg-[#f3f4f6]" : "hover:bg-[#fafaf9]",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={conv.participant.avatarUrl}
                    name={conv.participant.name}
                    size={44}
                  />
                  <OnlineDot isOnline={conv.participant.isOnline} />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#17191c]">
                        {conv.participant.name}
                      </p>
                      <p className="truncate text-[12px] text-[#a3a6af]">
                        {handleFromName(conv.participant.name)}
                      </p>
                    </div>
                    {conv.lastMessage && (
                      <span className="shrink-0 text-[11px] text-[#a3a6af]">
                        {relativeTime(conv.lastMessage.sentAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-[13px]",
                        conv.unreadCount > 0
                          ? "font-medium text-[#17191c]"
                          : "text-[#777b86]",
                      )}
                    >
                      {conv.lastMessage?.body ?? "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#4f46e5] px-1 text-[10px] font-semibold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li className="px-4 py-10 text-center text-[13px] text-[#a3a6af]">
            No conversations found.
          </li>
        )}
      </ul>
    </div>
  );
}