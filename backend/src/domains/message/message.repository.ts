import { PoolClient } from "pg";
import { query } from "@booking/shared";

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender_id: string;
  body: string;
  status: "sent" | "delivered" | "read";
  read_at: string | null;
  created_at: string;
}

export class MessageRepository {
  async create(
    params: {
      conversationId: string;
      tenantId: string;
      senderId: string;
      body: string;
    },
    client?: PoolClient,
  ): Promise<Message> {
    const sql = `
      INSERT INTO messages (conversation_id, tenant_id, sender_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const p = [
      params.conversationId,
      params.tenantId,
      params.senderId,
      params.body,
    ];

    if (client) return (await client.query(sql, p)).rows[0] as Message;
    return (await query<Message>(sql, p))[0];
  }

  async listByConversation(
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<Message[]> {
    return query<Message>(
      `SELECT * FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, (page - 1) * limit],
    );
  }

  async markRead(conversationId: string, readerUserId: string): Promise<void> {
    await query(
      `UPDATE messages
       SET status = 'read', read_at = now()
       WHERE conversation_id = $1 AND sender_id <> $2 AND status <> 'read'`,
      [conversationId, readerUserId],
    );
  }
}

export const messageRepository = new MessageRepository();
