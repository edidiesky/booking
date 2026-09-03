import { withTransaction } from "@booking/shared";
import { conversationRepository, type Conversation, type ConversationListRow } from "./conversation.repository";

export const conversationService = {
  async startConversation(params: {
    tenantId: string;
    hostUserId: string;
    guestUserId: string;
    propertyId?: string;
    bookingId?: string;
  }): Promise<{ conversation: Conversation; wasCreated: boolean }> {
    return withTransaction((client) =>
      conversationRepository.findOrCreate(params, client),
    );
  },

  async listForHost(
    hostUserId: string,
    page: number,
    limit: number,
  ): Promise<ConversationListRow[]> {
    return conversationRepository.listForHost(hostUserId, page, limit);
  },

  async listForGuest(
    guestUserId: string,
    page: number,
    limit: number,
  ): Promise<ConversationListRow[]> {
    return conversationRepository.listForGuest(guestUserId, page, limit);
  },
};
