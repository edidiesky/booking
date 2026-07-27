import type { QueryDslQueryContainer } from "@elastic/elasticsearch/lib/api/types";
import { esClient, PROPERTY_INDEX } from "../../config/elasticSearch";
import type { ESPropertyDoc, PropertySearchQuery } from "./propertysearch.dto";

export const propertySearchRepository = {
  async upsert(doc: ESPropertyDoc): Promise<void> {
    await esClient.index({ index: PROPERTY_INDEX, id: doc.propertyId, document: doc });
  },

  async partialUpdate(propertyId: string, fields: Partial<ESPropertyDoc>): Promise<void> {
    await esClient.update({ index: PROPERTY_INDEX, id: propertyId, doc: fields, doc_as_upsert: true });
  },

  async softDelete(propertyId: string): Promise<void> {
    await esClient.update({ index: PROPERTY_INDEX, id: propertyId, doc: { isDeleted: true }, doc_as_upsert: false });
  },

  async search(params: PropertySearchQuery): Promise<{ hits: ESPropertyDoc[]; total: number }> {
    const must:   QueryDslQueryContainer[] = [{ term: { isDeleted: false } }];
    const filter: QueryDslQueryContainer[] = [];

    if (params.q) {
      must.push({
        multi_match: {
          query:          params.q,
          fields:         ["name^3", "description"],
          fuzziness:      "AUTO",
          prefix_length:  2,
          max_expansions: 50,
        },
      });
    }

    if (params.city)         filter.push({ term: { city: params.city } });
    if (params.propertyType) filter.push({ term: { propertyType: params.propertyType } });
    if (params.amenities?.length) {
      for (const a of params.amenities) filter.push({ term: { amenities: a } });
    }
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const range: Record<string, number> = {};
      if (params.minPrice !== undefined) range["gte"] = params.minPrice;
      if (params.maxPrice !== undefined) range["lte"] = params.maxPrice;
      filter.push({ range: { fromPriceNgn: range } });
    }
    if (params.lat !== undefined && params.lon !== undefined && params.radiusKm !== undefined) {
      filter.push({
        geo_distance: {
          distance: `${params.radiusKm}km`,
          location: { lat: params.lat, lon: params.lon },
        },
      });
    }

    const page  = params.page  ?? 1;
    const limit = params.limit ?? 20;

    const result = await esClient.search<ESPropertyDoc>({
      index: PROPERTY_INDEX,
      query: { bool: { must, filter } },
      from:  (page - 1) * limit,
      size:  limit,
      sort: params.lat !== undefined && params.lon !== undefined
        ? [{ _geo_distance: { location: { lat: params.lat, lon: params.lon }, order: "asc" as const, unit: "km" as const } }]
        : undefined,
    });

    const hits  = result.hits.hits.map((h) => h._source as ESPropertyDoc);
    const total = typeof result.hits.total === "number" ? result.hits.total : (result.hits.total?.value ?? hits.length);

    return { hits, total };
  },
};