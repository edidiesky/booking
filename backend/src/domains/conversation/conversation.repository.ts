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

export interface ConversationListRow extends Conversation {
  participant_name: string | null;
  participant_avatar_url: string | null;
  last_message_id: string | null;
  last_message_sender_id: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_status: string | null;
  unread_count: number;
}

export const conversationRepository = {
  async findOrCreate(
    params: {
      tenantId: string;
      hostUserId: string;
      guestUserId: string;
      propertyId?: string | null;
      bookingId?: string | null;
    },
    client?: PoolClient,
  ): Promise<{ conversation: Conversation; wasCreated: boolean }> {
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

    if (existing) return { conversation: existing as Conversation, wasCreated: false };

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

    return { conversation: created as Conversation, wasCreated: true };
  },

  async findById(conversationId: string): Promise<Conversation | null> {
    return queryOne<Conversation>(`SELECT * FROM conversations WHERE id = $1`, [conversationId]);
  },

  async listForHost(hostUserId: string, page: number, limit: number): Promise<ConversationListRow[]> {
    return query<ConversationListRow>(
      `SELECT c.*,
              p.display_name AS participant_name,
              p.avatar_url   AS participant_avatar_url,
              lm.id          AS last_message_id,
              lm.sender_id   AS last_message_sender_id,
              lm.body        AS last_message_body,
              lm.created_at  AS last_message_created_at,
              lm.status      AS last_message_status,
              COALESCE(unread.count, 0)::int AS unread_count
       FROM conversations c
       LEFT JOIN profiles p ON p.user_id = c.guest_user_id
       LEFT JOIN LATERAL (
         SELECT id, sender_id, body, created_at, status
         FROM messages WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT count(*) FROM messages
         WHERE conversation_id = c.id AND sender_id != $1 AND status != 'read'
       ) unread ON true
       WHERE c.host_user_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostUserId, limit, (page - 1) * limit],
    );
  },

  async listForGuest(guestUserId: string, page: number, limit: number): Promise<ConversationListRow[]> {
    return query<ConversationListRow>(
      `SELECT c.*,
              p.display_name AS participant_name,
              p.avatar_url   AS participant_avatar_url,
              lm.id          AS last_message_id,
              lm.sender_id   AS last_message_sender_id,
              lm.body        AS last_message_body,
              lm.created_at  AS last_message_created_at,
              lm.status      AS last_message_status,
              COALESCE(unread.count, 0)::int AS unread_count
       FROM conversations c
       LEFT JOIN profiles p ON p.user_id = c.host_user_id
       LEFT JOIN LATERAL (
         SELECT id, sender_id, body, created_at, status
         FROM messages WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT count(*) FROM messages
         WHERE conversation_id = c.id AND sender_id != $1 AND status != 'read'
       ) unread ON true
       WHERE c.guest_user_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [guestUserId, limit, (page - 1) * limit],
    );
  },

  async touchLastMessageAt(conversationId: string, client?: PoolClient): Promise<void> {
    const sql = `UPDATE conversations SET last_message_at = now(), updated_at = now() WHERE id = $1`;
    if (client) { await client.query(sql, [conversationId]); return; }
    await query(sql, [conversationId]);
  },

  assertParticipant(conversation: Conversation, userId: string): boolean {
    return conversation.host_user_id === userId || conversation.guest_user_id === userId;
  },
};