import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/slices/authSlice";
import { authApi } from "@/redux/services/authApi";
import { tenantApi } from "@/redux/services/tenantApi";
import { useLogin } from "@/screens/auth/login/hooks/useLogin";

vi.mock("@/redux/services/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/redux/services/authApi")>();
  return { ...actual, useLoginMutation: vi.fn() };
});

vi.mock("@/components/common/Toast", () => ({ showToast: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer, [tenantApi.reducerPath]: tenantApi.reducer },
    middleware: (gdm) => gdm().concat(authApi.middleware, tenantApi.middleware),
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={makeStore()}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

describe("useLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("navigates to /admin for platform:admin", async () => {
    const unwrap = vi.fn().mockResolvedValue({
      data: { accessToken: "t", refreshToken: "r", user: { id: "1", userType: "platform:admin", tenantId: null } },
    });
    const loginMock = vi.fn(() => ({ unwrap }));
    vi.mocked(await import("@/redux/services/authApi")).useLoginMutation = () => [loginMock, { isLoading: false }] as never;

    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => { await result.current.handleLogin({ email: "a@b.com", password: "x" }); });

    expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
  });

  it("navigates to /dashboard for a host, without fetching tenant if tenantId is missing", async () => {
    const unwrap = vi.fn().mockResolvedValue({
      data: { accessToken: "t", refreshToken: "r", user: { id: "1", userType: "host:admin", tenantId: null } },
    });
    const loginMock = vi.fn(() => ({ unwrap }));
    vi.mocked(await import("@/redux/services/authApi")).useLoginMutation = () => [loginMock, { isLoading: false }] as never;

    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => { await result.current.handleLogin({ email: "a@b.com", password: "x" }); });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("swallows a login failure silently, relies on rtkQueryErrorMiddleware", async () => {
    const loginMock = vi.fn(() => ({ unwrap: vi.fn().mockRejectedValue(new Error("401")) }));
    vi.mocked(await import("@/redux/services/authApi")).useLoginMutation = () => [loginMock, { isLoading: false }] as never;

    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => { await result.current.handleLogin({ email: "a@b.com", password: "wrong" }); });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});