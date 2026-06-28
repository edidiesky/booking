import { useDispatch }              from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { setCredentials }           from "@/redux/slices/authSlice";
import { useLoginMutation }         from "@/redux/services/authApi";
import { showToast }                from "@/components/common/Toast";
import type { LoginFormData }       from "../schema/login.schema";
import type { User }                from "@/types/api";

export function useLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = (location.state as { from?: string } | null)?.from ?? "/";

  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async (data: LoginFormData) => {
    try {
      const result = await login({ email: data.email, password: data.password }).unwrap();

      dispatch(setCredentials({
        user:         result.user as unknown as User,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      }));

      showToast("Welcome back!", "success");

      const userType = (result.user as unknown as User).userType;

      if (userType === "platform:admin") { navigate("/admin",     { replace: true }); return; }
      if (userType.startsWith("host:"))  { navigate("/dashboard", { replace: true }); return; }
      navigate(from, { replace: true });
    } catch {
      // handled by rtkQueryErrorMiddleware
    }
  };

  return { handleLogin, isLoading };
}