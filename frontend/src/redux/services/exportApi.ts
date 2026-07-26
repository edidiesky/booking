import { apiSlice } from "./apiSlice";

export const exportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    triggerExport: builder.mutation<{ success: boolean; data: { jobId: string } }, string>({
      query: (triggerUrl) => ({ url: triggerUrl, method: "POST" }),
    }),
  }),
});

export const { useTriggerExportMutation } = exportApi;