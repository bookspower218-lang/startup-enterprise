import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function readAuthParams() {
  const fromSearch = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(hash);

  return {
    error: fromSearch.get("error") ?? fromHash.get("error"),
    errorCode: fromSearch.get("error_code") ?? fromHash.get("error_code"),
    errorDescription:
      fromSearch.get("error_description") ?? fromHash.get("error_description"),
  };
}

function clearAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.hash = "";
  window.history.replaceState({}, "", url.pathname + url.search);
}

/** Surfaces Supabase auth callback errors (e.g. expired confirmation links). */
const AuthCallbackHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { error, errorCode, errorDescription } = readAuthParams();
    if (!error && !errorCode) return;

    clearAuthParams();

    if (errorCode === "otp_expired") {
      toast.error(
        "This confirmation link was already used or has expired. If you already confirmed, sign in. Otherwise register again for a new link.",
        { duration: 8000 },
      );
      navigate("/login", { replace: true });
      return;
    }

    const message = errorDescription?.replace(/\+/g, " ") ?? error ?? "Sign-in failed";
    toast.error(message);
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
};

export default AuthCallbackHandler;
