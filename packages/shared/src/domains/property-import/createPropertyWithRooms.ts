import type { PoolClient } from "pg";
import type { ImportProperty } from "./importTypes";
import { withTransaction } from "../../config/database";
import { outboxRepository } from "../outbox/outbox.repository";

export const SEED_WINDOW_DAYS = 365;

export type ImportActor = { type: "user"; id: string } | { type: "system" };

export interface CreatePropertyWithRoomsResult {
  propertyId: string;
  roomTypeIds: string[];
  created: boolean;
}

async function insertAudit(
  client: PoolClient,
  e: {
    tenantId: string;
    actor: ImportActor;
    action: string;
    targetType: string;
    targetId: string;
    metadata: Record<string, unknown>;
  },
): Promise<void> {
  // Mirrors the columns written by the backend auditEventRepository.record.
  await client.query(
    `INSERT INTO audit_events
       (tenant_id, actor_type, actor_id, action, target_type, target_id, outcome, metadata, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'allowed', $7::jsonb, now())`,
    [
      e.tenantId,
      e.actor.type,
      e.actor.type === "user" ? e.actor.id : null,
      e.action,
      e.targetType,
      e.targetId,
      JSON.stringify(e.metadata),
    ],
  );
}

/**
 * Creates one property with all of its room types in a single transaction:
 * property (always draft), rooms, a year of availability, outbox event and
 * audit events. Either all of it exists afterwards or none of it does.
 *
 * Idempotent per (tenant, property_ref): a second call with the same ref
 * returns created=false and writes nothing, which makes re-sending a file and
 * RabbitMQ redelivery safe.
 */
export async function createPropertyWithRooms(input: {
  tenantId: string;
  actor: ImportActor;
  property: ImportProperty;
  importBatchId?: string;
}): Promise<CreatePropertyWithRoomsResult> {
  const { tenantId, actor, property: p, importBatchId } = input;

  return withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);

    const inserted = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO properties
         (tenant_id, name, description, property_type, address, amenities, images,
          check_in_time, check_out_time, latitude, longitude, status,
          external_ref, import_batch_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, '{}', $7, $8, $9, $10, 'draft', $11, $12)
       ON CONFLICT (tenant_id, external_ref) WHERE external_ref IS NOT NULL
       DO NOTHING
       RETURNING id, created_at`,
      [
        tenantId,
        p.name,
        p.description,
        p.propertyType,
        JSON.stringify(p.address),
        p.amenities,
        p.checkInTime,
        p.checkOutTime,
        p.latitude,
        p.longitude,
        p.ref,
        importBatchId ?? null,
      ],
    );

    if (inserted.rowCount === 0) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM properties WHERE tenant_id = $1 AND external_ref = $2`,
        [tenantId, p.ref],
      );
      return {
        propertyId: existing.rows[0].id,
        roomTypeIds: [],
        created: false,
      };
    }

    const propertyId = inserted.rows[0].id;

    const params: unknown[] = [];
    const tuples = p.rooms.map((r) => {
      const base = params.length;
      params.push(
        propertyId,
        tenantId,
        r.name,
        r.description,
        r.maxOccupancy,
        r.basePriceNgn,
        r.amenities,
        r.quantity,
        r.ref,
        importBatchId ?? null,
      );
      const ph = Array.from({ length: 10 }, (_, k) => `$${base + k + 1}`);
      return `(${ph[0]}, ${ph[1]}, ${ph[2]}, ${ph[3]}, ${ph[4]}, ${ph[5]}, '{}', ${ph[6]}, ${ph[7]}, 'active', ${ph[8]}, ${ph[9]})`;
    });

    const rooms = await client.query<{ id: string }>(
      `INSERT INTO room_types
         (property_id, tenant_id, name, description, max_occupancy, base_price_ngn,
          images, amenities, quantity, status, external_ref, import_batch_id)
       VALUES ${tuples.join(", ")}
       RETURNING id`,
      params,
    );
    const roomTypeIds = rooms.rows.map((r) => r.id);

    await client.query(
      `INSERT INTO availability_calendar (room_type_id, tenant_id, date, available_count)
       SELECT rt.id, rt.tenant_id, d::date, rt.quantity
         FROM room_types rt
        CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + ($2::int - 1), interval '1 day') AS d
        WHERE rt.id = ANY($1::uuid[])
       ON CONFLICT ON CONSTRAINT uq_availability DO NOTHING`,
      [roomTypeIds, SEED_WINDOW_DAYS],
    );

    await outboxRepository.create(
      "property.created",
      {
        propertyId,
        tenantId,
        name: p.name,
        description: p.description,
        city: p.address.city,
        propertyType: p.propertyType,
        amenities: p.amenities,
        latitude: p.latitude,
        longitude: p.longitude,
        createdAt: inserted.rows[0].created_at,
      },
      client,
    );

    await insertAudit(client, {
      tenantId,
      actor,
      action: "property.created",
      targetType: "property",
      targetId: propertyId,
      metadata: { source: "csv_import", importBatchId, externalRef: p.ref },
    });
    await insertAudit(client, {
      tenantId,
      actor,
      action: "property.room_types_imported",
      targetType: "property",
      targetId: propertyId,
      metadata: { importBatchId, roomTypeIds, count: roomTypeIds.length },
    });

    return { propertyId, roomTypeIds, created: true };
  });
}
