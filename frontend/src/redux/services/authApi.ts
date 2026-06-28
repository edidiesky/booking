import { apiSlice }    from "./apiSlice";
import { AUTH_URL }    from "@/constants/api";
import type {
  InitiateOnboardingPayload, InitiateOnboardingResponse,
  ConfirmEmailPayload, ResendOtpPayload,
  RegisterGuestPayload, RegisterHostPayload,
  LoginPayload, LogoutPayload, RefreshPayload,
  AuthTokens, ApiSuccessResponse,
} from "@/types/api";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateOnboarding: builder.mutation<InitiateOnboardingResponse, InitiateOnboardingPayload>({
      query: (body) => ({ url: `${AUTH_URL}/onboarding/initiate`, method: "POST", body }),
    }),

    confirmEmail: builder.mutation<ApiSuccessResponse, ConfirmEmailPayload>({
      query: (body) => ({ url: `${AUTH_URL}/onboarding/confirm`, method: "POST", body }),
    }),

    resendOtp: builder.mutation<ApiSuccessResponse, ResendOtpPayload>({
      query: (body) => ({ url: `${AUTH_URL}/onboarding/resend`, method: "POST", body }),
    }),

    registerGuest: builder.mutation<AuthTokens, RegisterGuestPayload>({
      query: (body) => ({ url: `${AUTH_URL}/register/guest`, method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),

    registerHost: builder.mutation<AuthTokens, RegisterHostPayload>({
      query: (body) => ({ url: `${AUTH_URL}/register/host`, method: "POST", body }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<AuthTokens, LoginPayload>({
      query: (body) => ({ url: `${AUTH_URL}/login`, method: "POST", body }),
    }),

    refresh: builder.mutation<Pick<AuthTokens, "accessToken">, RefreshPayload>({
      query: (body) => ({ url: `${AUTH_URL}/refresh`, method: "POST", body }),
    }),

    logout: builder.mutation<ApiSuccessResponse, LogoutPayload>({
      query: (body) => ({ url: `${AUTH_URL}/logout`, method: "POST", body }),
      invalidatesTags: ["Auth", "Booking", "Payment"],
    }),

    getMe: builder.query<{ success: boolean; data: AuthTokens["user"] }, void>({
      query: () => ({ url: `${AUTH_URL}/me` }),
      providesTags: ["Auth"],
    }),
  }),
});

export const {
  useInitiateOnboardingMutation,
  useConfirmEmailMutation,
  useResendOtpMutation,
  useRegisterGuestMutation,
  useRegisterHostMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;