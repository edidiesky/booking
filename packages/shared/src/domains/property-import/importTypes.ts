export interface ImportRowError {
  row: number;
  column?: string;
  propertyRef?: string;
  message: string;
}

export interface ImportRoom {
  ref: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  basePriceNgn: number;
  quantity: number;
  amenities: string[];
  row: number;
}

export interface ImportProperty {
  ref: string;
  name: string;
  propertyType: "shortlet" | "hotel" | "guesthouse";
  description: string | null;
  address: { street: string; city: string; state: string; country: string };
  latitude: number | null;
  longitude: number | null;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  rooms: ImportRoom[];
  rows: number[];
}

export interface ImportTotals {
  propertiesInFile: number;
  roomsInFile: number;
  created: number;
  skippedExisting: number;
  failed: number;
}

export type ImportStage =
  | "queued"
  | "downloading"
  | "validating"
  | "importing"
  | "completed"
  | "failed";

export interface ImportCreatedProperty {
  ref: string;
  propertyId: string;
  rooms: number;
  skippedExisting: boolean;
  missingCoordinates: boolean;
}

export type ImportEvent =
  | { type: "stage"; stage: ImportStage; progress: number }
  | { type: "row_errors"; errors: ImportRowError[] }
  | { type: "property_created"; property: ImportCreatedProperty }
  | { type: "completed"; totals: ImportTotals }
  | { type: "failed"; reason: string };
