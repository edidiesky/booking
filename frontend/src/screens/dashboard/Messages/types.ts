export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string; 
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string; // ISO timestamp
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface Conversation {
  id: string;
  participant: ChatParticipant;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}