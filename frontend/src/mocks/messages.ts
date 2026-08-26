import type { Conversation, ChatMessage } from "@/screens/dashboard/Messages/types";
export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participant: {
      id: "user-1",
      name: "John Shinoda",
      avatarUrl: undefined,
      isOnline: true,
    },
    lastMessage: {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-1",
      body: "Yeah, I'll send the updated details tonight for review.",
      sentAt: "2026-08-25T08:30:00.000Z",
      status: "read",
    },
    unreadCount: 0,
  },
  {
    id: "conv-2",
    participant: {
      id: "user-2",
      name: "Dina Harrison",
      avatarUrl: undefined,
      isOnline: true,
    },
    lastMessage: {
      id: "msg-2",
      conversationId: "conv-2",
      senderId: "user-2",
      body: "That sounds like a great idea! Let's discuss it.",
      sentAt: "2026-08-25T12:31:00.000Z",
      status: "delivered",
    },
    unreadCount: 2,
  },
  {
    id: "conv-3",
    participant: {
      id: "user-3",
      name: "Mandy Guoles",
      avatarUrl: undefined,
      isOnline: false,
      lastSeenAt: "2026-08-24T18:00:00.000Z",
    },
    lastMessage: {
      id: "msg-3",
      conversationId: "conv-3",
      senderId: "user-3",
      body: "Can you check the latest booking? I've flagged something.",
      sentAt: "2026-08-24T09:00:00.000Z",
      status: "read",
    },
    unreadCount: 0,
  },
];

export const mockMessagesByConversation: Record<string, ChatMessage[]> = {
  "conv-1": [
    {
      id: "m1",
      conversationId: "conv-1",
      senderId: "user-1",
      body: "Quick update regarding today's booking sync.",
      sentAt: "2026-08-25T08:00:00.000Z",
      status: "read",
    },
    {
      id: "m2",
      conversationId: "conv-1",
      senderId: "user-1",
      body: "Yeah, I'll send the updated details tonight for review.",
      sentAt: "2026-08-25T08:30:00.000Z",
      status: "read",
    },
  ],
  "conv-2": [
    {
      id: "m3",
      conversationId: "conv-2",
      senderId: "user-2",
      body: "That sounds like a great idea! Let's discuss it.",
      sentAt: "2026-08-25T12:31:00.000Z",
      status: "delivered",
    },
  ],
  "conv-3": [
    {
      id: "m4",
      conversationId: "conv-3",
      senderId: "user-3",
      body: "Can you check the latest booking? I've flagged something.",
      sentAt: "2026-08-24T09:00:00.000Z",
      status: "read",
    },
  ],
};