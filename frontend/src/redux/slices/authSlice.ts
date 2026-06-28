import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState }                  from "@/redux/store";
import type { User }                       from "@/types/api";

interface AuthState {
  user:                    User | null;
  accessToken:             string | null;
  refreshToken:            string | null;
  isAuthenticated:         boolean;
  onboardingStep:          number;
  onboardingShowVerify:    boolean;
  onboardingPendingEmail:  string;
}

const initialState: AuthState = {
  user:                   null,
  accessToken:            null,
  refreshToken:           null,
  isAuthenticated:        false,
  onboardingStep:         1,
  onboardingShowVerify:   false,
  onboardingPendingEmail: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string }>
    ) => {
      state.user            = action.payload.user;
      state.accessToken     = action.payload.accessToken;
      state.refreshToken    = action.payload.refreshToken ?? state.refreshToken;
      state.isAuthenticated = true;

      try {
        localStorage.setItem("auth:accessToken",  action.payload.accessToken);
        localStorage.setItem("auth:user",         JSON.stringify(action.payload.user));
        if (action.payload.refreshToken) {
          localStorage.setItem("auth:refreshToken", action.payload.refreshToken);
        }
      } catch { /* localStorage unavailable */ }
    },

    clearCredentials: (state) => {
      state.user                   = null;
      state.accessToken            = null;
      state.refreshToken           = null;
      state.isAuthenticated        = false;
      state.onboardingStep         = 1;
      state.onboardingShowVerify   = false;
      state.onboardingPendingEmail = "";

      try {
        localStorage.removeItem("auth:accessToken");
        localStorage.removeItem("auth:refreshToken");
        localStorage.removeItem("auth:user");
      } catch { /* ignore */ }
    },

    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboardingStep = action.payload;
    },

    setOnboardingShowVerify: (state, action: PayloadAction<boolean>) => {
      state.onboardingShowVerify = action.payload;
    },

    setOnboardingPendingEmail: (state, action: PayloadAction<string>) => {
      state.onboardingPendingEmail = action.payload;
    },

    resetOnboarding: (state) => {
      state.onboardingStep         = 1;
      state.onboardingShowVerify   = false;
      state.onboardingPendingEmail = "";
    },
  },
});

export const {
  setCredentials,
  clearCredentials,
  setOnboardingStep,
  setOnboardingShowVerify,
  setOnboardingPendingEmail,
  resetOnboarding,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser         = (s: RootState) => s.auth.user;
export const selectAccessToken         = (s: RootState) => s.auth.accessToken;
export const selectRefreshToken        = (s: RootState) => s.auth.refreshToken;
export const selectIsAuthenticated     = (s: RootState) => s.auth.isAuthenticated;
export const selectOnboardingStep      = (s: RootState) => s.auth.onboardingStep;
export const selectOnboardingShowVerify    = (s: RootState) => s.auth.onboardingShowVerify;
export const selectOnboardingPendingEmail  = (s: RootState) => s.auth.onboardingPendingEmail;