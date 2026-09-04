
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { expectAppError } from "../../helpers/expectAppError";
import { messageService } from "../../../domains/message/message.service";
import { messageRepository } from "../../../domains/message/message.repository";
import { conversationRepository } from "../../../domains/conversation/conversation.repository";

jest.mock("../../../domains/message/message.repository");
jest.mock("../../../domains/conversation/conversation.repository");
jest.mock("../../../realtime/socketServer", () => ({
  getIO: jest.fn(() => ({
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  })),
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockedMsgRepo = messageRepository as jest.Mocked<typeof messageRepository>;
const mockedConvRepo = conversationRepository as jest.Mocked<
  typeof conversationRepository
>;

const CONV_ID = "conv-1";
const GUEST_ID = "guest-1";
const HOST_ID = "host-1";
const OTHER_ID = "other-1";

describe("MessageService", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("listMessages", () => {
    it("returns messages for a participant", async () => {
      mockedConvRepo.assertParticipant.mockResolvedValue(undefined as never);
      mockedMsgRepo.listByConversation.mockResolvedValue({
        items: [],
        total: 0,
      } as never);
      const result = await messageService.listMessages(CONV_ID, GUEST_ID, 1, 20);
      expect(mockedConvRepo.assertParticipant).toHaveBeenCalledWith(
        CONV_ID,
        GUEST_ID,
      );
      expect(result).toEqual({ items: [], total: 0 });
    });

    it("rejects non-participant", async () => {
      mockedConvRepo.assertParticipant.mockRejectedValue({
        statusCode: 404,
        message: "Not found",
      } as never);
      await expectAppError(
        messageService.listMessages(CONV_ID, OTHER_ID, 1, 20),
        404,
      );
    });
  });

  describe("sendMessage", () => {
    it("creates message and fans out to other participant", async () => {
      mockedConvRepo.assertParticipant.mockResolvedValue(undefined as never);
      mockedConvRepo.findById.mockResolvedValue({
        id: CONV_ID,
        host_user_id: HOST_ID,
        guest_user_id: GUEST_ID,
      } as never);
      const created = {
        id: "msg-1",
        conversation_id: CONV_ID,
        sender_id: GUEST_ID,
        body: "Hello",
      };
      mockedMsgRepo.create.mockResolvedValue(created as never);
      mockedConvRepo.touchLastMessageAt.mockResolvedValue(undefined as never);

      const result = await messageService.sendMessage({
        conversationId: CONV_ID,
        senderId: GUEST_ID,
        body: "Hello",
      });
      expect(result).toEqual(created);
      expect(mockedMsgRepo.create).toHaveBeenCalled();
    });

    it("rejects empty body / non-participant", async () => {
      mockedConvRepo.assertParticipant.mockRejectedValue({
        statusCode: 404,
      } as never);
      await expectAppError(
        messageService.sendMessage({
          conversationId: CONV_ID,
          senderId: OTHER_ID,
          body: "Hi",
        }),
        404,
      );
    });
  });

  describe("markRead", () => {
    it("marks messages read for participant", async () => {
      mockedConvRepo.assertParticipant.mockResolvedValue(undefined as never);
      mockedMsgRepo.markRead.mockResolvedValue(3 as never);
      const n = await messageService.markRead(CONV_ID, GUEST_ID);
      expect(n).toBe(3);
    });

    it("rejects non-participant", async () => {
      mockedConvRepo.assertParticipant.mockRejectedValue({
        statusCode: 404,
      } as never);
      await expectAppError(messageService.markRead(CONV_ID, OTHER_ID), 404);
    });
  });
});