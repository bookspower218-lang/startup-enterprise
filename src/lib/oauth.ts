import { supabase } from "@/integrations/supabase/client";

export type OAuthAccountType = "startup" | "company";

/** Google sign-in via Supabase Auth (not Lovable). */
export async function signInWithGoogle(accountType?: OAuthAccountType) {
  const origin = window.location.origin;
  const redirectTo = accountType
    ? `${origin}/auth/complete?type=${accountType}`
    : `${origin}/auth/complete`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  return { error };
}
