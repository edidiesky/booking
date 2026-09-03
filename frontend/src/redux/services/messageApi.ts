import { apiSlice } from "./apiSlice";
import { BASE } from "@/constants/api";
import type {
  Conversation,
  ChatMessage,
} from "@/screens/dashboard/Messages/types";

const CONVERSATION_URL = `${BASE}/api/v1/conversations`;

interface RawConversation {
  id: string;
  host_user_id: string;
  guest_user_id: string;
  participant_name: string | null;
  participant_avatar_url: string | null;
  last_message_id: string | null;
  last_message_sender_id: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_status: string | null;
  unread_count: number;
}

interface RawMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  status: string;
  created_at: string;
}

function toChatMessage(raw: RawMessage): ChatMessage {
  return {
    id: raw.id,
    conversationId: raw.conversation_id,
    senderId: raw.sender_id,
    body: raw.body,
    sentAt: raw.created_at,
    status: raw.status as ChatMessage["status"],
  };
}

function toConversation(
  raw: RawConversation,
  currentUserId: string,
): Conversation {
  const otherUserId =
    raw.host_user_id === currentUserId ? raw.guest_user_id : raw.host_user_id;

  return {
    id: raw.id,
    participant: {
      id: otherUserId,
      name: raw.participant_name ?? "User",
      avatarUrl: raw.participant_avatar_url ?? undefined,
      isOnline: false,
    },
    lastMessage: raw.last_message_id
      ? {
          id: raw.last_message_id,
          conversationId: raw.id,
          senderId: raw.last_message_sender_id!,
          body: raw.last_message_body!,
          sentAt: raw.last_message_created_at!,
          status: (raw.last_message_status as ChatMessage["status"]) ?? "sent",
        }
      : null,
    unreadCount: raw.unread_count,
  };
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listConversations: builder.query<
      Conversation[],
      { role: "host" | "guest"; currentUserId: string }
    >({
      query: ({ role }) => ({
        url: `${CONVERSATION_URL}/${role === "host" ? "tenant" : "mine"}`,
      }),
      transformResponse: (res: ListResponse<RawConversation>, _meta, arg) =>
        res.data.map((c) => toConversation(c, arg.currentUserId)),
      providesTags: ["Conversation"],
    }),

    listMessages: builder.query<ChatMessage[], string>({
      query: (conversationId) => ({
        url: `${CONVERSATION_URL}/${conversationId}/messages`,
      }),
      transformResponse: (res: ListResponse<RawMessage>) =>
        res.data.map(toChatMessage),
      providesTags: (_r, _e, conversationId) => [
        { type: "Message", id: conversationId },
      ],
    }),

    markConversationRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `${CONVERSATION_URL}/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Conversation"],
    }),

    startConversation: builder.mutation<
      Conversation,
      {
        guestUserId: string;
        propertyId?: string;
        bookingId?: string;
        currentUserId: string;
      }
    >({
      query: ({ ...body }) => ({
        url: CONVERSATION_URL,
        method: "POST",
        body,
      }),
      transformResponse: (
        res: { success: boolean; data: RawConversation },
        _meta,
        arg,
      ) => toConversation(res.data, arg.currentUserId),
      invalidatesTags: ["Conversation"],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useListMessagesQuery,
  useMarkConversationReadMutation,
  useStartConversationMutation,
} = messageApi;

export { toChatMessage };
