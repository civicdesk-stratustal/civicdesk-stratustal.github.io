import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./server-env";

const NYLAS_BASE = "https://api.us.nylas.com/v3";

/** Worker-level OAuth callback. The short-lived random state is looked up before any grant is saved. */
export async function handleCalendarCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const appUrl = (getServerEnv("APP_URL") ?? url.origin).replace(/\/$/, "");
  const redirect = (status: string) =>
    Response.redirect(`${appUrl}/settings?calendar=${status}`, 302);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code || url.searchParams.get("error")) return redirect("failed");
  const supabaseUrl = getServerEnv("SUPABASE_URL");
  const serviceKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = getServerEnv("NYLAS_CLIENT_ID");
  const apiKey = getServerEnv("NYLAS_API_KEY");
  if (!supabaseUrl || !serviceKey || !clientId || !apiKey) return redirect("failed");
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: connection } = await db
    .from("calendar_connections")
    .select("user_id,oauth_state_expires_at")
    .eq("oauth_state", state)
    .maybeSingle();
  if (!connection || new Date(connection.oauth_state_expires_at).getTime() < Date.now())
    return redirect("failed");
  const token = await fetch(`${NYLAS_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${appUrl}/api/calendar/callback`,
    }),
  });
  if (!token.ok) {
    console.error("Nylas token exchange failed", token.status);
    return redirect("failed");
  }
  const auth = (await token.json()) as { grant_id?: string };
  if (!auth.grant_id) return redirect("failed");
  const calendars = await fetch(
    `${NYLAS_BASE}/grants/${encodeURIComponent(auth.grant_id)}/calendars`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  const list = (await calendars.json().catch(() => ({}))) as {
    data?: Array<{ id: string; is_primary?: boolean }>;
  };
  const calendarId = list.data?.find((calendar) => calendar.is_primary)?.id ?? list.data?.[0]?.id;
  if (!calendarId) return redirect("failed");
  await db
    .from("calendar_connections")
    .update({
      grant_id: auth.grant_id,
      calendar_id: calendarId,
      oauth_state: null,
      oauth_state_expires_at: null,
      connected_at: new Date().toISOString(),
    })
    .eq("user_id", connection.user_id);
  await db
    .from("profiles")
    .update({ preferences: { calendar_sync: true, calendar_provider: "nylas" } })
    .eq("id", connection.user_id);
  return redirect("connected");
}
