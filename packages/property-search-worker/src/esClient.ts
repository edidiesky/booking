import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node:           process.env.ELASTICSEARCH_URL ?? "http://elasticsearch:9200",
  requestTimeout: 10_000,
  maxRetries:     3,
});

export const PROPERTY_INDEX = "properties";

export interface ESPropertyDoc {
  propertyId:    string;
  tenantId:      string;
  name:          string;
  description?:  string;
  city:          string;
  propertyType:  string;
  amenities:     string[];
  fromPriceNgn:  number | null;
  location:      { lat: number; lon: number } | null;
  isDeleted:     boolean;
  createdAt?:    string;
  updatedAt?:    string;
}