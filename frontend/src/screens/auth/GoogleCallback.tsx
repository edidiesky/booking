import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGoogleOAuthLoginMutation } from "@/redux/services/authApi";
import { useLogin } from "./login/hooks/useLogin";
import { showToast } from "@/components/common/Toast";
import AuthLayout from "@/components/common/AuthLayout";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { finishLogin } = useLogin();
  const [exchange] = useGoogleOAuthLoginMutation();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const storedState = sessionStorage.getItem("google_oauth_state");
      const verifier = sessionStorage.getItem("google_oauth_verifier");

      sessionStorage.removeItem("google_oauth_state");
      sessionStorage.removeItem("google_oauth_verifier");

      if (!code || !state || !verifier || state !== storedState) {
        showToast("Google sign-in failed. Please try again.", "error");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const result = await exchange({ code, codeVerifier: verifier }).unwrap();
        await finishLogin(result);
      } catch {
        showToast("Google sign-in failed. Please try again.", "error");
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [searchParams, navigate, exchange, finishLogin]);

  return (
    <AuthLayout>
      <p className="text-xs lg:text-sm text-center" style={{ color: "var(--color-muted-stone)" }}>
        Signing you in...
      </p>
    </AuthLayout>
  );
}