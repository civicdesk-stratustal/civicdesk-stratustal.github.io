const TOKEN_KEY = "civicdesk.google_token";

export function storeProviderToken(token?: string | null) {
  if (typeof window === "undefined" || !token) return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getProviderToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearProviderToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Inserts an all-day Google Calendar event for a deadline.
 * Returns the created event id, or null when sync is off / no token / failure.
 */
export async function createCalendarEvent(params: {
  title: string;
  date: string | Date;
  description?: string;
}): Promise<string | null> {
  const token = getProviderToken();
  if (!token) return null;

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

  if (!res.ok) {
    console.error("Google Calendar insert failed", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { id?: string };
  return data.id ?? null;
}
