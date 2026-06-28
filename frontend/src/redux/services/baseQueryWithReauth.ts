import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import type { RootState } from "@/redux/store";
import { setCredentials, clearCredentials } from "@/redux/slices/authSlice";
const refreshMutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    const slug  = state.auth.tenantSlug;   
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      
    }
    if (slug)  headers.set("x-tenant-slug", slug);   
    return headers;
  },
});

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await refreshMutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  if (refreshMutex.isLocked()) {
    await refreshMutex.waitForUnlock();
    result = await rawBaseQuery(args, api, extraOptions);
    return result;
  }

  const release = await refreshMutex.acquire();

  try {
    const storedRefreshToken = (api.getState() as RootState).auth.refreshToken;

    if (!storedRefreshToken) {
      api.dispatch(clearCredentials());
      redirectToLogin();
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url:    `/api/v1/auth/refresh-token`,
        method: "POST",
        body:   { refreshToken: storedRefreshToken },
        headers: { "Content-Type": "application/json" },
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const data = refreshResult.data as {
        success:      boolean;
        accessToken:  string;
        refreshToken: string;
      };

      const currentUser = (api.getState() as RootState).auth.user;

      if (currentUser && data.accessToken) {
        api.dispatch(
          setCredentials({
            user:         currentUser,
            accessToken:  data.accessToken,
            refreshToken: data.refreshToken ?? storedRefreshToken,
          }),
        );
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearCredentials());
        redirectToLogin();
      }
    } else {
      api.dispatch(clearCredentials());
      redirectToLogin();
    }
  } finally {
    release();
  }

  return result;
};