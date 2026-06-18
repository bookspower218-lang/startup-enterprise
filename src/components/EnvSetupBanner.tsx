import { isSupabaseConfigured } from "@/integrations/supabase/client";

const EnvSetupBanner = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-3 text-center text-sm text-foreground">
      Supabase is not configured. Copy <code className="font-mono text-xs">.env.example</code> to{" "}
      <code className="font-mono text-xs">.env</code> and add your project URL and publishable key.
    </div>
  );
};

export default EnvSetupBanner;
