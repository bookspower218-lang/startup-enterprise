import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "admin@startup-enterprise.app";
const ADMIN_PASSWORD = "admin123";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Find existing admin user
    const { data: list } = await admin.auth.admin.listUsers();
    let adminUser = list?.users.find((u) => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Administrator", account_type: "company" },
      });
      if (cErr) throw cErr;
      adminUser = created.user!;
    } else {
      // Reset password to known value (idempotent)
      await admin.auth.admin.updateUserById(adminUser.id, { password: ADMIN_PASSWORD, email_confirm: true });
    }

    // Ensure admin role
    await admin.from("user_roles").upsert(
      { user_id: adminUser.id, role: "admin" },
      { onConflict: "user_id,role" },
    );

    return new Response(JSON.stringify({ ok: true, user_id: adminUser.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
