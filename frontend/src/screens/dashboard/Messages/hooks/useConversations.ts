import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectAccessToken } from "@/redux/slices/authSlice";
import {
  useListConversationsQuery,
  useListMessagesQuery,
  useMarkConversationReadMutation,
} from "@/redux/services/messageApi";
import { getSocket } from "@/lib/socketClient";
import { apiSlice } from "@/redux/services/apiSlice";
import type { ChatMessage } from "@/screens/dashboard/Messages/types";

export function useConversations() {
  const currentUser = useSelector(selectCurrentUser);
  const role = currentUser?.userType === "guest" ? "guest" : "host";
  const { data, isLoading } = useListConversationsQuery(
    { role, currentUserId: currentUser?.id ?? "" },
    { skip: !currentUser },
  );
  return { data: data ?? [], isLoading };
}

export function useConversationMessages(conversationId: string | null) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const { data, isLoading } = useListMessagesQuery(conversationId!, {
    skip: !conversationId,
  });
  const [markRead] = useMarkConversationReadMutation();
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !accessToken) return;

    const socket = getSocket(accessToken);

    if (joinedRef.current !== conversationId) {
      socket.emit("join_conversation", conversationId);
      joinedRef.current = conversationId;
    }

    const onNewMessage = (
      message: ChatMessage & {
        conversation_id?: string;
        conversationId?: string;
      },
    ) => {
      const belongsHere =
        (message.conversationId ?? message.conversation_id) === conversationId;
      if (!belongsHere) return;
      dispatch(
        apiSlice.util.invalidateTags([
          { type: "Message", id: conversationId },
          "Conversation",
        ]),
      );
    };

    const onRead = () => {
      dispatch(
        apiSlice.util.invalidateTags([{ type: "Message", id: conversationId }]),
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:read", onRead);

    if (currentUser) markRead(conversationId).catch(() => {});

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:read", onRead);
    };
  }, [conversationId, accessToken, currentUser, dispatch, markRead]);

  const sendMessage = useCallback(
    (body: string) => {
      if (!conversationId || !body.trim() || !accessToken) return;
      const socket = getSocket(accessToken);
      socket.emit("send_message", { conversationId, body }, () => {
        dispatch(
          apiSlice.util.invalidateTags([
            { type: "Message", id: conversationId },
            "Conversation",
          ]),
        );
      });
    },
    [conversationId, accessToken, dispatch],
  );

  const emitTyping = useCallback(() => {
    if (!conversationId || !accessToken) return;
    getSocket(accessToken).emit("typing", conversationId);
  }, [conversationId, accessToken]);

  return { data: data ?? [], isLoading, sendMessage, emitTyping };
}
