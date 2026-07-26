import { apiSlice } from "./apiSlice";
import { PROPERTY_URL, JOB_URL } from "@/constants/api";

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface JobState {
  jobId:      string;
  jobType:    string;
  state:      "queued" | "processing" | "done" | "error";
  progress:   number;
  updatedAt:  string;
  succeeded?: number;
  failed?:    number;
  errors?:    RowError[];
  error?:     string;
  result?:    { pdfUrl?: string };
}

export const roomImportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    importRoomTypes: builder.mutation<{ success: boolean; data: { jobId: string } }, { propertyId: string; fileUrl: string }>({
      query: ({ propertyId, fileUrl }) => ({
        url: `${PROPERTY_URL}/${propertyId}/room-types/import`,
        method: "POST",
        body: { fileUrl },
      }),
    }),

    // Polled, not SSE, a bulk import runs for seconds to low minutes, not
    // worth a persistent stream connection for that duration.
    getJobStatus: builder.query<{ success: boolean; data: JobState }, { jobType: string; jobId: string }>({
      query: ({ jobType, jobId }) => ({ url: `${JOB_URL}/${jobType}/${jobId}` }),
    }),
  }),
});

export const {
  useImportRoomTypesMutation,
  useLazyGetJobStatusQuery,
} = roomImportApi;