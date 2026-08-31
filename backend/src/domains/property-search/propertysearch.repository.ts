// import type { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
// import { esClient, PROPERTY_INDEX } from "../../config/elasticSearch";
// import type { ESPropertyDoc, PropertySearchQuery } from "./propertysearch.dto";

// export const propertySearchRepository = {
//   async upsert(doc: ESPropertyDoc): Promise<void> {
//     await esClient.index({ index: PROPERTY_INDEX, id: doc.propertyId, document: doc });
//   },

//   async partialUpdate(propertyId: string, fields: Partial<ESPropertyDoc>): Promise<void> {
//     await esClient.update({ index: PROPERTY_INDEX, id: propertyId, doc: fields, doc_as_upsert: true });
//   },

//   async softDelete(propertyId: string): Promise<void> {
//     await esClient.update({ index: PROPERTY_INDEX, id: propertyId, doc: { isDeleted: true }, doc_as_upsert: false });
//   },

//   async search(params: PropertySearchQuery): Promise<{ hits: ESPropertyDoc[]; total: number }> {
//     const must:   QueryDslQueryContainer[] = [{ term: { isDeleted: false } }];
//     const filter: QueryDslQueryContainer[] = [];

//     if (params.q) {
//       must.push({
//         multi_match: {
//           query:          params.q,
//           fields:         ["name^3", "description"],
//           fuzziness:      "AUTO",
//           prefix_length:  2,
//           max_expansions: 50,
//         },
//       });
//     }

//     if (params.city)         filter.push({ term: { city: params.city } });
//     if (params.propertyType) filter.push({ term: { propertyType: params.propertyType } });
//     if (params.amenities?.length) {
//       for (const a of params.amenities) filter.push({ term: { amenities: a } });
//     }
//     if (params.minPrice !== undefined || params.maxPrice !== undefined) {
//       const range: Record<string, number> = {};
//       if (params.minPrice !== undefined) range["gte"] = params.minPrice;
//       if (params.maxPrice !== undefined) range["lte"] = params.maxPrice;
//       filter.push({ range: { fromPriceNgn: range } });
//     }
//     if (params.lat !== undefined && params.lon !== undefined && params.radiusKm !== undefined) {
//       filter.push({
//         geo_distance: {
//           distance: `${params.radiusKm}km`,
//           location: { lat: params.lat, lon: params.lon },
//         },
//       });
//     }

//     const page  = params.page  ?? 1;
//     const limit = params.limit ?? 20;

//     const result = await esClient.search<ESPropertyDoc>({
//       index: PROPERTY_INDEX,
//       query: { bool: { must, filter } },
//       from:  (page - 1) * limit,
//       size:  limit,
//       sort: params.lat !== undefined && params.lon !== undefined
//         ? [{ _geo_distance: { location: { lat: params.lat, lon: params.lon }, order: "asc" as const, unit: "km" as const } }]
//         : undefined,
//     });

//     const hits  = result.hits.hits.map((h) => h._source as ESPropertyDoc);
//     const total = typeof result.hits.total === "number" ? result.hits.total : (result.hits.total?.value ?? hits.length);

//     return { hits, total };
//   },
// };

import { query } from "@booking/shared";
import type { ESPropertyDoc, PropertySearchQuery } from "./propertysearch.dto";

interface PropertySearchRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  city: string | null;
  property_type: string;
  amenities: string[];
  status: string;
  latitude: string | null;
  longitude: string | null;
  from_price_ngn: string | null;
  created_at: string;
  updated_at: string;
}

function toDoc(row: PropertySearchRow): ESPropertyDoc {
  return {
    propertyId: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description ?? undefined,
    city: row.city ?? "",
    propertyType: row.property_type,
    amenities: row.amenities ?? [],
    fromPriceNgn: row.from_price_ngn !== null ? Number(row.from_price_ngn) : null,
    location: row.latitude !== null && row.longitude !== null ? { lat: Number(row.latitude), lon: Number(row.longitude) } : null,
    isDeleted: row.status !== "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRICE_CTE = `
  price_agg AS (
    SELECT property_id, MIN(base_price_ngn) AS from_price_ngn
    FROM room_types
    GROUP BY property_id
  )
`;

function buildQuery(
  params: PropertySearchQuery,
  offset: number,
  limit: number,
  textMode: "tsquery" | "trigram" | "none",
): { sql: string; countSql: string; values: unknown[] } {
  const values: unknown[] = [];
  const clauses: string[] = [`p.status = 'active'`];
  let rankExpr = "NULL";
  let textParamIndex: number | null = null;

  if (textMode !== "none" && params.q?.trim()) {
    values.push(params.q.trim());
    textParamIndex = values.length;
    if (textMode === "tsquery") {
      clauses.push(`p.search_vector @@ plainto_tsquery('english', $${textParamIndex})`);
      rankExpr = `ts_rank(p.search_vector, plainto_tsquery('english', $${textParamIndex}))`;
    } else {
      clauses.push(`p.name % $${textParamIndex}`);
      rankExpr = `similarity(p.name, $${textParamIndex})`;
    }
  }

  if (params.city) {
    values.push(params.city);
    clauses.push(`p.address->>'city' ILIKE $${values.length}`);
  }
  if (params.propertyType) {
    values.push(params.propertyType);
    clauses.push(`p.property_type = $${values.length}`);
  }
  if (params.amenities?.length) {
    values.push(params.amenities);
    clauses.push(`p.amenities @> $${values.length}::text[]`);
  }
  if (params.minPrice !== undefined) {
    values.push(params.minPrice);
    clauses.push(`pa.from_price_ngn >= $${values.length}`);
  }
  if (params.maxPrice !== undefined) {
    values.push(params.maxPrice);
    clauses.push(`pa.from_price_ngn <= $${values.length}`);
  }

  let latParamIndex: number | null = null;
  let lonParamIndex: number | null = null;
  if (params.lat !== undefined && params.lon !== undefined) {
    values.push(params.lat);
    latParamIndex = values.length;
    values.push(params.lon);
    lonParamIndex = values.length;

    if (params.radiusKm !== undefined) {
      values.push(params.radiusKm * 1000);
      clauses.push(
        `p.latitude IS NOT NULL AND p.longitude IS NOT NULL ` +
        `AND earth_distance(ll_to_earth($${latParamIndex}, $${lonParamIndex}), ll_to_earth(p.latitude, p.longitude)) <= $${values.length}`,
      );
    }
  }

  const orderBy =
    latParamIndex !== null && lonParamIndex !== null
      ? `earth_distance(ll_to_earth($${latParamIndex}, $${lonParamIndex}), ll_to_earth(p.latitude, p.longitude)) ASC`
      : textParamIndex !== null
        ? `${rankExpr} DESC`
        : `p.created_at DESC`;

  const whereClause = clauses.join(" AND ");
  const selectRank = textParamIndex !== null ? `, ${rankExpr} AS rank` : "";

  const baseSelect = `
    SELECT p.id, p.tenant_id, p.name, p.description, p.address->>'city' AS city,
           p.property_type, p.amenities, p.status, p.latitude, p.longitude,
           pa.from_price_ngn, p.created_at, p.updated_at${selectRank}
    FROM properties p
    LEFT JOIN price_agg pa ON pa.property_id = p.id
    WHERE ${whereClause}
  `;

  const limitIndex = values.length + 1;
  const offsetIndex = values.length + 2;

  return {
    sql: `WITH ${PRICE_CTE} ${baseSelect} ORDER BY ${orderBy} LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    countSql: `WITH ${PRICE_CTE} SELECT count(*)::int AS total FROM properties p LEFT JOIN price_agg pa ON pa.property_id = p.id WHERE ${whereClause}`,
    values: [...values, limit, offset],
  };
}

export const propertySearchRepository = {
  async search(params: PropertySearchQuery): Promise<{ hits: ESPropertyDoc[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;
    const hasQuery = !!params.q?.trim();

    const result = await this.run(params, offset, limit, hasQuery ? "tsquery" : "none");
    if (!hasQuery || result.hits.length > 0) return result;

    return this.run(params, offset, limit, "trigram");
  },

  async run(
    params: PropertySearchQuery,
    offset: number,
    limit: number,
    textMode: "tsquery" | "trigram" | "none",
  ): Promise<{ hits: ESPropertyDoc[]; total: number }> {
    const { sql, countSql, values } = buildQuery(params, offset, limit, textMode);
    const rows = await query<PropertySearchRow>(sql, values);
    const countRows = await query<{ total: number }>(countSql, values.slice(0, values.length - 2));
    return { hits: rows.map(toDoc), total: countRows[0]?.total ?? 0 };
  },
};