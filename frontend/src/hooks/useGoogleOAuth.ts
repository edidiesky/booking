import { generateCodeVerifier, generateCodeChallenge } from "@/utils/pkce";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export function useGoogleOAuth() {
  const startGoogleLogin = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateCodeVerifier();

    sessionStorage.setItem("google_oauth_verifier", verifier);
    sessionStorage.setItem("google_oauth_state", state);

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    console.log("google oauth params:", {
        params
    })
    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  };

  return { startGoogleLogin };
}