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

    const [profile, roles, pitchesSent, pitchesReceived, responses, messages, notifications, payments, ratings, attachments, meetings, prefs, onboarding] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", uid),
      admin.from("user_roles").select("*").eq("user_id", uid),
      admin.from("pitches").select("*").eq("startup_id", uid),
      admin.from("pitches").select("*").eq("target_company_id", uid),
      admin.from("pitch_responses").select("*").eq("company_id", uid),
      admin.from("messages").select("*").eq("sender_id", uid),
      admin.from("notifications").select("*").eq("user_id", uid),
      admin.from("pitch_payments").select("*").eq("payer_id", uid),
      admin.from("pitch_ratings").select("*").or(`rater_id.eq.${uid},ratee_id.eq.${uid}`),
      admin.from("pitch_attachments").select("*").eq("uploader_id", uid),
      admin.from("pitch_meetings").select("*").eq("proposer_id", uid),
      admin.from("user_notification_prefs").select("*").eq("user_id", uid),
      admin.from("onboarding_state").select("*").eq("user_id", uid),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user: { id: uid, email: user.email },
      profile: profile.data,
      roles: roles.data,
      pitches_sent: pitchesSent.data,
      pitches_received: pitchesReceived.data,
      pitch_responses: responses.data,
      messages: messages.data,
      notifications: notifications.data,
      pitch_payments: payments.data,
      pitch_ratings: ratings.data,
      pitch_attachments: attachments.data,
      pitch_meetings: meetings.data,
      notification_prefs: prefs.data,
      onboarding_state: onboarding.data,
    };
    return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});