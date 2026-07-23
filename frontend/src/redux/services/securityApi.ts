import { apiSlice } from "./apiSlice";
import { SECURITY_URL } from "@/constants/api";
import type {
  SecurityStatusResponse, RequestOtpResponse, OtpPurpose, ApiSuccessResponse,
} from "@/types/api";

export const securityApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSecurityStatus: builder.query<SecurityStatusResponse, void>({
      query: () => ({ url: `${SECURITY_URL}/status` }),
      providesTags: ["Security"],
    }),

    setPin: builder.mutation<ApiSuccessResponse, { pin: string }>({
      query: (body) => ({ url: `${SECURITY_URL}/pin`, method: "POST", body }),
      invalidatesTags: ["Security"],
    }),

    changePin: builder.mutation<ApiSuccessResponse, { currentPin: string; newPin: string }>({
      query: (body) => ({ url: `${SECURITY_URL}/pin`, method: "PATCH", body }),
      invalidatesTags: ["Security"],
    }),

    resetPin: builder.mutation<ApiSuccessResponse, { password: string; newPin: string }>({
      query: (body) => ({ url: `${SECURITY_URL}/pin/reset`, method: "POST", body }),
      invalidatesTags: ["Security"],
    }),

    requestOtp: builder.mutation<RequestOtpResponse, OtpPurpose>({
      query: (purpose) => ({ url: `${SECURITY_URL}/otp/${purpose}/request`, method: "POST" }),
    }),

    verifyOtp: builder.mutation<ApiSuccessResponse, { purpose: OtpPurpose; code: string }>({
      query: ({ purpose, code }) => ({
        url: `${SECURITY_URL}/otp/${purpose}/verify`,
        method: "POST",
        body: { code },
      }),
      invalidatesTags: ["Security"],
    }),

    setLoginWithPin: builder.mutation<ApiSuccessResponse, boolean>({
      query: (enabled) => ({ url: `${SECURITY_URL}/login-with-pin`, method: "PATCH", body: { enabled } }),
      invalidatesTags: ["Security"],
    }),

    setCountry: builder.mutation<ApiSuccessResponse, string>({
      query: (countryCode) => ({ url: `${SECURITY_URL}/country`, method: "PATCH", body: { countryCode } }),
      invalidatesTags: ["Security"],
    }),
  }),
});

export const {
  useGetSecurityStatusQuery,
  useSetPinMutation,
  useChangePinMutation,
  useResetPinMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useSetLoginWithPinMutation,
  useSetCountryMutation,
} = securityApi;