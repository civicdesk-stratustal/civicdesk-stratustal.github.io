import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getServerEnv } from "./server-env";

const NYLAS_BASE = "https://api.us.nylas.com/v3";
const EventInput = z.object({
  title: z.string().min(1).max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(1000).optional(),
});

export const startCalendarConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = getServerEnv("NYLAS_CLIENT_ID");
    const appUrl = getServerEnv("APP_URL");
    if (!clientId || !appUrl) throw new Error("Calendar sync is not configured yet.");
    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const db = context.supabase as any;
    const { error } = await db
      .from("calendar_connections")
      .upsert(
        { user_id: context.userId, oauth_state: state, oauth_state_expires_at: expiresAt },
        { onConflict: "user_id" },
      );
    if (error) throw new Error("Could not start calendar connection.");
    const url = new URL(`${NYLAS_BASE}/connect/auth`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", `${appUrl.replace(/\/$/, "")}/api/calendar/callback`);
    url.searchParams.set("response_type", "code");
    // Microsoft and iCloud avoid the Google OAuth verification/beta-tester issue.
    url.searchParams.set("provider", "microsoft,icloud");
    url.searchParams.set("scope", "calendar");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  });

export const createConnectedCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EventInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = getServerEnv("NYLAS_API_KEY");
    if (!key) return { status: "not-configured" as const, eventId: null };
    const db = context.supabase as any;
    const { data: connection } = await db
      .from("calendar_connections")
      .select("grant_id,calendar_id")
      .maybeSingle();
    if (!connection?.grant_id || !connection?.calendar_id)
      return { status: "not-connected" as const, eventId: null };
    const end = new Date(`${data.date}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    const response = await fetch(
      `${NYLAS_BASE}/grants/${encodeURIComponent(connection.grant_id)}/events?calendar_id=${encodeURIComponent(connection.calendar_id)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `CivicDesk: ${data.title}`,
          description: data.description ?? "",
          when: { start_date: data.date, end_date: end.toISOString().slice(0, 10) },
          busy: false,
        }),
      },
    );
    if (!response.ok) {
      console.error("Calendar event failed", response.status, await response.text());
      return { status: "failed" as const, eventId: null };
    }
    const result = (await response.json()) as { data?: { id?: string }; id?: string };
    return { status: "created" as const, eventId: result.data?.id ?? result.id ?? null };
  });
