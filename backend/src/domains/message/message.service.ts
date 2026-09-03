import { withTransaction } from "@booking/shared";
import { messageRepository, type Message } from "./message.repository";
import { conversationRepository } from "../conversation/conversation.repository";
import { AppError } from "../../utils/AppError";
import { getIO } from "../../realtime/socketServer";

async function assertParticipantOrThrow(conversationId: string, userId: string) {
  const conversation = await conversationRepository.findById(conversationId);
  if (!conversation) throw AppError.notFound("Conversation not found.");
  if (!conversationRepository.assertParticipant(conversation, userId)) {
    throw AppError.notFound("Conversation not found.");
  }
  return conversation;
}

export class MessageService {
  async listMessages(
    conversationId: string,
    requestingUserId: string,
    page: number,
    limit: number,
  ): Promise<Message[]> {
    await assertParticipantOrThrow(conversationId, requestingUserId);
    return messageRepository.listByConversation(conversationId, page, limit);
  }

  /**
   * steps:
   * 1. fetch the conversaiton
   * 2. if none, throw a detailed error
   * 3. persist the message to the db
   * 4. push socket events (? we can use the outbox patetrn to fan it also)
   * 5. reds pub sub fanout the evetns to all conencted connection irrespective of what process that resides (async)
   * 6. return the message
   * @param params 
   * @returns 
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<Message> {
    const conversation = await assertParticipantOrThrow(params.conversationId, params.senderId);

    const message = await withTransaction(async (client) => {
      const created = await messageRepository.create(
        {
          conversationId: conversation.id,
          tenantId: conversation.tenant_id,
          senderId: params.senderId,
          body: params.body,
        },
        client,
      );
      await conversationRepository.touchLastMessageAt(conversation.id, client);
      return created;
    });

    const io = getIO();
    io.to(`user:${conversation.host_user_id}`).emit("message:new", message);
    io.to(`user:${conversation.guest_user_id}`).emit("message:new", message);

    return message;
  }

  async markRead(conversationId: string, readerUserId: string): Promise<void> {
    const conversation = await assertParticipantOrThrow(conversationId, readerUserId);

    await messageRepository.markRead(conversationId, readerUserId);

    const io = getIO();
    const otherUserId =
      conversation.host_user_id === readerUserId
        ? conversation.guest_user_id
        : conversation.host_user_id;
    io.to(`user:${otherUserId}`).emit("message:read", { conversationId, readByUserId: readerUserId });
  }
};

export const messageService = new MessageService()