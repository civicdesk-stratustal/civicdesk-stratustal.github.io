import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "civicdesk.google_token";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function storeProviderToken(token?: string | null) {
  if (typeof window === "undefined" || !token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getProviderToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearProviderToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Starts the Google consent flow requesting offline calendar access. */
export async function authorizeGoogleCalendar() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      scopes: CALENDAR_SCOPE,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw error;
}

/** Turns calendar sync off for the signed-in user (used after a 401 from Google). */
export async function disableCalendarSync() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("profiles")
    .update({ preferences: { calendar_sync: false } })
    .eq("id", data.user.id);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type CalendarResult = {
  eventId: string | null;
  status: "created" | "no-token" | "unauthorized" | "failed";
};

/** Inserts an all-day Google Calendar event for a deadline. */
export async function createCalendarEvent(params: {
  title: string;
  date: string | Date;
  description?: string;
}): Promise<CalendarResult> {
  const token = getProviderToken();
  if (!token) return { eventId: null, status: "no-token" };

  const start = new Date(params.date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: `CivicDesk: ${params.title}`,
      description: params.description ?? "",
      start: { date: isoDate(start) },
      end: { date: isoDate(end) },
      reminders: { useDefault: true },
    }),
  });

  if (res.status === 401 || res.status === 403) {
    clearProviderToken();
    await disableCalendarSync();
    return { eventId: null, status: "unauthorized" };
  }

  if (!res.ok) {
    console.error("Google Calendar insert failed", res.status, await res.text());
    return { eventId: null, status: "failed" };
  }

  const data = (await res.json()) as { id?: string };
  return { eventId: data.id ?? null, status: "created" };
}
