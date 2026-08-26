import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { OnlineDot } from "@/screens/dashboard/Messages/OnlineDot";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/screens/dashboard/Messages/types";
import { Search } from "lucide-react";
import { useState } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { weekday: "short" });
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

  return (
    <div className={cn("flex h-full flex-col border-r border-border", className)}>
      <div className="border-b border-border p-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations"
          icon={<Search className="size-4" />}
          iconPosition="left"
        />
      </div>

      <ul className="flex-1 overflow-y-auto" role="list">
        {filtered.map((conv) => {
          const isSelected = conv.id === selectedId;
          return (
            <li key={conv.id}>
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-accent",
                  isSelected && "bg-accent",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar>
                    <AvatarImage src={conv.participant.avatarUrl} alt={conv.participant.name} />
                    <AvatarFallback>{initials(conv.participant.name)}</AvatarFallback>
                  </Avatar>
                  <OnlineDot isOnline={conv.participant.isOnline} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {conv.participant.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimestamp(conv.lastMessage.sentAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage?.body ?? "No messages yet"}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
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
          <li className="p-6 text-center text-sm text-muted-foreground">
            No conversations found.
          </li>
        )}
      </ul>
    </div>
  );
}