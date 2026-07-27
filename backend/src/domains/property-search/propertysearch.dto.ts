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

export interface PropertySearchQuery {
  q?:          string;
  city?:       string;
  propertyType?: string;
  minPrice?:   number;
  maxPrice?:   number;
  amenities?:  string[];
  lat?:        number;
  lon?:        number;
  radiusKm?:   number;
  page?:       number;
  limit?:      number;
}