import { logger } from "@booking/shared";
import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node:           process.env.ELASTICSEARCH_URL ?? "http://elasticsearch:9200",
  requestTimeout: 10_000,
  maxRetries:     3,
});

export const PROPERTY_INDEX = "properties";

export async function bootstrapPropertyIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: PROPERTY_INDEX });
  if (exists) {
    logger.info("es_property_index_exists", { event: "es_property_index_exists", index: PROPERTY_INDEX });
    return;
  }

  await esClient.indices.create({
    index: PROPERTY_INDEX,
    settings: {
      number_of_shards:   2,
      number_of_replicas: 1,
      max_ngram_diff:     7,
      analysis: {
        tokenizer: {
          ngram_tokenizer: {
            type:        "ngram" as const,
            min_gram:    3,
            max_gram:    10,
            token_chars: ["letter", "digit"] as const,
          },
        },
        analyzer: {
          ngram_analyzer: {
            type:      "custom" as const,
            tokenizer: "ngram_tokenizer",
            filter:    ["lowercase"],
          },
          search_analyzer: {
            type:      "custom" as const,
            tokenizer: "standard",
            filter:    ["lowercase", "stop"],
          },
        },
      },
    },
    mappings: {
      properties: {
        propertyId: { type: "keyword" as const },
        tenantId:   { type: "keyword" as const },
        name: {
          type:            "text" as const,
          analyzer:        "ngram_analyzer",
          search_analyzer: "search_analyzer",
          fields: { keyword: { type: "keyword" as const } },
        },
        description: {
          type:            "text" as const,
          analyzer:        "ngram_analyzer",
          search_analyzer: "search_analyzer",
        },
        city:          { type: "keyword" as const },
        propertyType:  { type: "keyword" as const },
        amenities:     { type: "keyword" as const },
        fromPriceNgn:  { type: "float"   as const },
        location:      { type: "geo_point" as const },
        isDeleted:     { type: "boolean" as const },
        createdAt:     { type: "date"    as const },
      },
    },
  });

  logger.info("es_property_index_created", { event: "es_property_index_created", index: PROPERTY_INDEX });
}