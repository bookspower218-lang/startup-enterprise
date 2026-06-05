import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OAuthAccountType } from "@/lib/oauth";

const OAuthComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let cancelled = false;
    const accountType: OAuthAccountType | null =
      searchParams.get("type") === "startup" || searchParams.get("type") === "company"
        ? (searchParams.get("type") as OAuthAccountType)
        : null;

    const syncAccountType = async (uid: string) => {
      if (!accountType) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", uid)
        .maybeSingle();

      if (profile?.account_type !== accountType) {
        await supabase.from("profiles").update({ account_type: accountType }).eq("user_id", uid);
        const role = accountType === "company" ? "company" : "startup";
        await supabase.from("user_roles").upsert(
          { user_id: uid, role },
          { onConflict: "user_id,role" },
        );
        await supabase.auth.updateUser({ data: { account_type: accountType } });
      }
    };

    const finish = async (uid: string) => {
      if (cancelled) return;
      await syncAccountType(uid);
      toast.success("Signed in with Google");
      navigate("/dashboard", { replace: true });
    };

    // detectSessionInUrl (in client.ts) exchanges the PKCE code automatically —
    // do NOT call exchangeCodeForSession here or the verifier is consumed twice.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        await finish(session.user.id);
      }
    });

    const timeout = window.setTimeout(async () => {
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await finish(session.user.id);
        return;
      }
      setMessage("Sign-in failed.");
      toast.error(
        "Google sign-in could not be completed. Use the same browser tab and try again.",
      );
      navigate("/login", { replace: true });
    }, 8000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      {message}
    </div>
  );
};

export default OAuthComplete;
