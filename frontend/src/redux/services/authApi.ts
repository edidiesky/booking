import { apiSlice } from "./apiSlice";
import { AUTH_URL } from "@/constants/api";
import type {
  InitiateOnboardingPayload,
  InitiateOnboardingResponse,
  ConfirmEmailPayload,
  ResendOtpPayload,
  RegisterGuestPayload,
  RegisterHostPayload,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  AuthTokens,
  ApiSuccessResponse,
  LoginResponse,
} from "@/types/api";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateOnboarding: builder.mutation<
      InitiateOnboardingResponse,
      InitiateOnboardingPayload
    >({
      query: (body) => ({
        url: `${AUTH_URL}/onboarding/initiate`,
        method: "POST",
        body,
      }),
    }),

    confirmEmail: builder.mutation<ApiSuccessResponse, ConfirmEmailPayload>({
      query: (body) => ({
        url: `${AUTH_URL}/onboarding/confirm`,
        method: "POST",
        body,
      }),
    }),

    resendOtp: builder.mutation<ApiSuccessResponse, ResendOtpPayload>({
      query: (body) => ({
        url: `${AUTH_URL}/onboarding/resend`,
        method: "POST",
        body,
      }),
    }),

    registerGuest: builder.mutation<AuthTokens, RegisterGuestPayload>({
      query: (body) => ({
        url: `${AUTH_URL}/register/guest`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    registerHost: builder.mutation<AuthTokens, RegisterHostPayload>({
      query: (body) => ({
        url: `${AUTH_URL}/register/host`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({ url: `${AUTH_URL}/login`, method: "POST", body }),
    }),

    verifyTwoFactorLogin: builder.mutation<
      AuthTokens,
      { challengeToken: string; code: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/2fa/verify-login`,
        method: "POST",
        body,
      }),
    }),

    setupTwoFactor: builder.mutation<
      { success: boolean; data: { secret: string; qrCodeDataUrl: string } },
      void
    >({
      query: () => ({ url: `${AUTH_URL}/2fa/setup`, method: "POST" }),
    }),

    verifyEnableTwoFactor: builder.mutation<
      { success: boolean; message: string; data: { backupCodes: string[] } },
      { token: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/2fa/verify-enable`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    disableTwoFactor: builder.mutation<
      ApiSuccessResponse,
      { password: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/2fa/disable`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    getMe: builder.query<
      { success: boolean; data: AuthTokens["data"]["user"] },
      void
    >({
      query: () => ({ url: `${AUTH_URL}/me` }),
      providesTags: ["Auth"],
    }),

    refresh: builder.mutation<
      Pick<AuthTokens["data"], "accessToken">,
      RefreshPayload
    >({
      query: (body) => ({ url: `${AUTH_URL}/refresh`, method: "POST", body }),
    }),
    logout: builder.mutation<ApiSuccessResponse, LogoutPayload>({
      query: (body) => ({ url: `${AUTH_URL}/logout`, method: "POST", body }),
      invalidatesTags: ["Auth", "Booking", "Payment"],
    }),
    requestPasswordReset: builder.mutation<
      ApiSuccessResponse,
      { email: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/password-reset/request`,
        method: "POST",
        body,
      }),
    }),

    confirmPasswordReset: builder.mutation<
      ApiSuccessResponse,
      { token: string; password: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/password-reset/confirm`,
        method: "POST",
        body,
      }),
    }),

    changePassword: builder.mutation<
      ApiSuccessResponse,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/password`,
        method: "PATCH",
        body,
      }),
    }),
    googleOAuthLogin: builder.mutation<
      AuthTokens,
      { code: string; codeVerifier: string }
    >({
      query: (body) => ({
        url: `${AUTH_URL}/oauth/google`,
        method: "POST",
        body,
      }),
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
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useChangePasswordMutation,
  useVerifyTwoFactorLoginMutation,
  useGoogleOAuthLoginMutation,
  useDisableTwoFactorMutation
} = authApi;
