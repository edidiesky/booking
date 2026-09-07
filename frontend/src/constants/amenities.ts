
export const AMENITY_OPTIONS: {
  id: string;
  label: string;
  group: "essentials" | "features" | "safety" | "outdoor";
}[] = [
  { id: "wifi", label: "Wifi", group: "essentials" },
  { id: "tv", label: "TV", group: "essentials" },
  { id: "kitchen", label: "Kitchen", group: "essentials" },
  { id: "washer", label: "Washer", group: "essentials" },
  { id: "dryer", label: "Dryer", group: "essentials" },
  { id: "ac", label: "Air conditioning", group: "essentials" },
  { id: "heating", label: "Heating", group: "essentials" },
  { id: "workspace", label: "Dedicated workspace", group: "essentials" },
  { id: "iron", label: "Iron", group: "essentials" },
  { id: "hair_dryer", label: "Hair dryer", group: "essentials" },
  { id: "parking", label: "Free parking", group: "features" },
  { id: "pool", label: "Pool", group: "features" },
  { id: "hot_tub", label: "Hot tub", group: "features" },
  { id: "gym", label: "Gym", group: "features" },
  { id: "elevator", label: "Elevator", group: "features" },
  { id: "self_checkin", label: "Self check-in", group: "features" },
  { id: "pets", label: "Pets allowed", group: "features" },
  { id: "ev_charger", label: "EV charger", group: "features" },
  { id: "breakfast", label: "Breakfast", group: "features" },
  { id: "bathtub", label: "Bathtub", group: "features" },
  { id: "garden", label: "Garden", group: "outdoor" },
  { id: "bbq", label: "BBQ grill", group: "outdoor" },
  { id: "patio", label: "Patio", group: "outdoor" },
  { id: "balcony", label: "Balcony", group: "outdoor" },
  { id: "beach_access", label: "Beach access", group: "outdoor" },
  { id: "smoke_alarm", label: "Smoke alarm", group: "safety" },
  { id: "carbon_monoxide", label: "Carbon monoxide alarm", group: "safety" },
  { id: "first_aid", label: "First aid kit", group: "safety" },
  { id: "fire_extinguisher", label: "Fire extinguisher", group: "safety" },
  { id: "security_cameras", label: "Security cameras", group: "safety" },
];

export const AMENITY_GROUPS: {
  key: (typeof AMENITY_OPTIONS)[number]["group"];
  title: string;
}[] = [
  { key: "essentials", title: "Essentials" },
  { key: "features", title: "Features" },
  { key: "outdoor", title: "Outdoor" },
  { key: "safety", title: "Safety" },
];

export const PROPERTY_TYPES = [
  { value: "shortlet", label: "Shortlet" },
  { value: "hotel", label: "Hotel" },
  { value: "guesthouse", label: "Guesthouse" },
] as const;