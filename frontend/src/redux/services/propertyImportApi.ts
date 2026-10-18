// frontend/src/redux/services/propertyImportApi.ts
import { apiSlice } from "./apiSlice";
import { PROPERTY_IMPORT_URL } from "@/constants/api";

export type ImportStage =
  | "queued"
  | "downloading"
  | "validating"
  | "importing"
  | "completed"
  | "failed";

export interface ImportRowError {
  row: number;
  column?: string;
  propertyRef?: string;
  message: string;
}

export interface ImportCreatedProperty {
  ref: string;
  propertyId: string;
  rooms: number;
  skippedExisting: boolean;
  missingCoordinates: boolean;
}

export interface ImportTotals {
  propertiesInFile: number;
  roomsInFile: number;
  created: number;
  skippedExisting: number;
  failed: number;
}

export interface ImportSnapshot {
  batchId: string;
  status: ImportStage;
  progress: number;
  fileName: string | null;
  totals: Partial<ImportTotals>;
  errors: ImportRowError[];
  createdProperties: ImportCreatedProperty[];
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type ImportEvent =
  | { type: "stage"; stage: ImportStage; progress: number }
  | { type: "row_errors"; errors: ImportRowError[] }
  | { type: "property_created"; property: ImportCreatedProperty }
  | { type: "completed"; totals: ImportTotals }
  | { type: "failed"; reason: string };

export interface ImportUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
}

export interface AttachImageResultItem {
  fileName: string;
  url: string;
  status: "linked" | "unmatched" | "invalid_url" | "invalid_name";
  propertyRef?: string;
  roomRef?: string;
  position?: number;
  propertyId?: string;
  roomTypeId?: string;
  message?: string;
}

export interface AttachImagesResult {
  linked: number;
  unmatched: number;
  example: string;
  results: AttachImageResultItem[];
}

export const propertyImportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getImportUploadSignature: builder.mutation<ImportUploadSignature, void>({
      query: () => ({
        url: `${PROPERTY_IMPORT_URL}/upload-signature`,
        method: "POST",
      }),
      transformResponse: (r: { data: ImportUploadSignature }) => r.data,
    }),
    startPropertyImport: builder.mutation<
      ImportSnapshot,
      { filePublicId: string; fileName?: string }
    >({
      query: (body) => ({ url: PROPERTY_IMPORT_URL, method: "POST", body }),
      transformResponse: (r: { data: ImportSnapshot }) => r.data,
    }),
    getPropertyImport: builder.query<ImportSnapshot, string>({
      query: (batchId) => ({ url: `${PROPERTY_IMPORT_URL}/${batchId}` }),
      transformResponse: (r: { data: ImportSnapshot }) => r.data,
    }),
    attachPropertyImages: builder.mutation<
      AttachImagesResult,
      {
        attachments: { fileName: string; url: string }[];
        batchId?: string;
      }
    >({
      query: (body) => ({
        url: `${PROPERTY_IMPORT_URL}/property-images`,
        method: "POST",
        body,
      }),
      transformResponse: (r: { data: AttachImagesResult }) => r.data,
      invalidatesTags: ["Property"],
    }),
    attachRoomImages: builder.mutation<
      AttachImagesResult,
      {
        attachments: { fileName: string; url: string }[];
        batchId?: string;
      }
    >({
      query: (body) => ({
        url: `${PROPERTY_IMPORT_URL}/room-images`,
        method: "POST",
        body,
      }),
      transformResponse: (r: { data: AttachImagesResult }) => r.data,
      invalidatesTags: ["RoomType", "Property"],
    }),
  }),
});

export const {
  useGetImportUploadSignatureMutation,
  useStartPropertyImportMutation,
  useAttachPropertyImagesMutation,
  useAttachRoomImagesMutation,
} = propertyImportApi;