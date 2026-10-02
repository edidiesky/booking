/**
 * Compatibility adapter. Every existing call site keeps importing
 * PropertyCard, and now renders the new ListingCard. The old variants
 * ("default" | "compact" | "minimal" | "search" | "home") all map to the
 * same card on purpose: one card, one set of rules, everywhere.
 */
import ListingCard from "@/components/listing/ListingCard";
import {
  toListingCard,
  type ListingSource,
} from "@/components/listing/toListingCard";

export interface PropertyCardData {
  id: string;
  name: string;
  images?: string[];
  amenities?: string[];
  property_type?: string;
  propertyType?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    lat?: number | string;
    lng?: number | string;
  };
  city?: string;
  roomTypes?: {
    images?: string[];
    amenities?: string[];
    base_price_ngn: number | string;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    maxOccupancy?: number;
  }[];
  rating?: number;
  reviewCount?: number;
  isGuestFavorite?: boolean;
  isSuperhost?: boolean;
  instantBook?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  fromPrice?: number | null;
  from_price?: number | null;
}

export type PropertyCardVariant =
  | "default"
  | "compact"
  | "minimal"
  | "search"
  | "home";

interface Props {
  property: PropertyCardData;
  index?: number;
  isFavorited?: boolean;
  variant?: PropertyCardVariant;
}

export default function PropertyCard({ property, isFavorited = false }: Props) {
  return (
    <ListingCard
      listing={toListingCard(property as ListingSource)}
      isSaved={isFavorited}
    />
  );
}
