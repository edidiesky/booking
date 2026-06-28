import { useAppDispatch }           from "@/hooks/useAppDispatch";
import { useNavigate, useLocation } from "react-router-dom";
import { setCredentials }           from "@/redux/slices/authSlice";
import { useLoginMutation }         from "@/redux/services/authApi";
import { tenantApi }                from "@/redux/services/tenantApi";
import { showToast }                from "@/components/common/Toast";
import type { LoginFormData }       from "../schema/login.schema";
import type { User }                from "@/types/api";

export function useLogin() {
  const dispatch = useAppDispatch(); 
  const navigate = useNavigate();
  const location = useLocation();
  const from     = (location.state as { from?: string } | null)?.from ?? "/";

  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (data: LoginFormData) => {
    try {
      const result = await login({ email: data.email, password: data.password }).unwrap();

      const user: User = result.data.user as unknown as User;
      const userType   = user.userType;

      dispatch(setCredentials({
        user,
        accessToken:  result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }));

      if (userType.startsWith("host:") && user.tenantId) {
        try {
          const tenantResult = await dispatch(
            tenantApi.endpoints.getMyTenant.initiate(undefined, { forceRefetch: true }),
          ).unwrap();

          dispatch(setCredentials({
            user,
            accessToken: result.data.accessToken,
            tenantSlug:  tenantResult.data.slug,
          }));
        } catch { /* non-blocking */ }
      }

      showToast("Welcome back!", "success");

      if (userType === "platform:admin") { navigate("/admin",     { replace: true }); return; }
      if (userType.startsWith("host:"))  { navigate("/dashboard", { replace: true }); return; }
      navigate(from, { replace: true });

    } catch { /* handled by rtkQueryErrorMiddleware */ }
  };

  return { handleLogin, isLoading };
}