import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    // Cascade in dependency order
    await admin.from("pitch_ratings").delete().or(`rater_id.eq.${uid},ratee_id.eq.${uid}`);
    await admin.from("messages").delete().eq("sender_id", uid);
    await admin.from("pitch_attachments").delete().eq("uploader_id", uid);
    await admin.from("pitch_meetings").delete().eq("proposer_id", uid);
    await admin.from("pitch_payments").delete().eq("payer_id", uid);
    await admin.from("notifications").delete().eq("user_id", uid);
    await admin.from("pitch_responses").delete().eq("company_id", uid);
    // Get pitch ids first to also clean dependent rows for pitches owned by user
    const { data: ownedPitches } = await admin.from("pitches").select("id").eq("startup_id", uid);
    const pitchIds = (ownedPitches ?? []).map((p: any) => p.id);
    if (pitchIds.length) {
      await admin.from("messages").delete().in("pitch_id", pitchIds);
      await admin.from("pitch_responses").delete().in("pitch_id", pitchIds);
      await admin.from("pitch_attachments").delete().in("pitch_id", pitchIds);
      await admin.from("pitch_meetings").delete().in("pitch_id", pitchIds);
      await admin.from("pitch_payments").delete().in("pitch_id", pitchIds);
      await admin.from("pitch_ratings").delete().in("pitch_id", pitchIds);
    }
    await admin.from("pitches").delete().eq("startup_id", uid);
    await admin.from("pitches").delete().eq("target_company_id", uid);
    await admin.from("user_notification_prefs").delete().eq("user_id", uid);
    await admin.from("onboarding_state").delete().eq("user_id", uid);
    await admin.from("user_roles").delete().eq("user_id", uid);
    await admin.from("profiles").delete().eq("user_id", uid);

    // Storage cleanup
    const buckets = ["pitch-files", "logos"];
    for (const b of buckets) {
      const { data: list } = await admin.storage.from(b).list(uid, { limit: 1000 });
      if (list && list.length) {
        await admin.storage.from(b).remove(list.map((f: any) => `${uid}/${f.name}`));
      }
    }

    // Audit + delete auth user
    await admin.from("audit_log").insert({ actor_id: uid, action: "self_delete_account", target_type: "user", target_id: uid });
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});