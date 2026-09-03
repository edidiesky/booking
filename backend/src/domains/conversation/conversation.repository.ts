import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";

export interface Conversation {
  id: string;
  tenant_id: string;
  host_user_id: string;
  guest_user_id: string;
  property_id: string | null;
  booking_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ConversationRepository {
  async findOrCreate(
    params: {
      tenantId: string;
      hostUserId: string;
      guestUserId: string;
      propertyId?: string | null;
      bookingId?: string | null;
    },
    client?: PoolClient,
  ): Promise<Conversation> {
    const findSql = `
      SELECT * FROM conversations
      WHERE tenant_id = $1 AND host_user_id = $2 AND guest_user_id = $3
        AND property_id IS NOT DISTINCT FROM $4`;
    const findParams = [
      params.tenantId,
      params.hostUserId,
      params.guestUserId,
      params.propertyId ?? null,
    ];

    const existing = client
      ? (await client.query(findSql, findParams)).rows[0]
      : await queryOne<Conversation>(findSql, findParams);

    if (existing) return existing as Conversation;

    const insertSql = `
      INSERT INTO conversations (tenant_id, host_user_id, guest_user_id, property_id, booking_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const insertParams = [
      params.tenantId,
      params.hostUserId,
      params.guestUserId,
      params.propertyId ?? null,
      params.bookingId ?? null,
    ];

    const created = client
      ? (await client.query(insertSql, insertParams)).rows[0]
      : (await query<Conversation>(insertSql, insertParams))[0];

    return created as Conversation;
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    return queryOne<Conversation>(`SELECT * FROM conversations WHERE id = $1`, [
      conversationId,
    ]);
  }

  async listForHost(
    hostUserId: string,
    page: number,
    limit: number,
  ): Promise<Conversation[]> {
    return query<Conversation>(
      `SELECT * FROM conversations
       WHERE host_user_id = $1
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostUserId, limit, (page - 1) * limit],
    );
  }

  async listForGuest(
    guestUserId: string,
    page: number,
    limit: number,
  ): Promise<Conversation[]> {
    return query<Conversation>(
      `SELECT * FROM conversations
       WHERE guest_user_id = $1
       ORDER BY last_message_at DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [guestUserId, limit, (page - 1) * limit],
    );
  }

  async touchLastMessageAt(
    conversationId: string,
    client?: PoolClient,
  ): Promise<void> {
    const sql = `UPDATE conversations SET last_message_at = now(), updated_at = now() WHERE id = $1`;
    if (client) {
      await client.query(sql, [conversationId]);
      return;
    }
    await query(sql, [conversationId]);
  }

  assertParticipant(conversation: Conversation, userId: string): boolean {
    return (
      conversation.host_user_id === userId ||
      conversation.guest_user_id === userId
    );
  }
}

export const conversationRepository = new ConversationRepository();
