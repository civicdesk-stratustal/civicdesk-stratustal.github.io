import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  "Documents",
  "Warranties",
  "Subscriptions",
  "Gift Cards",
  "Return Windows",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function normalizeCategory(value: string | null | undefined): Category {
  const match = CATEGORIES.find((c) => c.toLowerCase() === (value ?? "").trim().toLowerCase());
  return match ?? "Documents";
}

export type Item = {
  id: string;
  title: string;
  category: string;
  brand: string | null;
  summary: string | null;
  purchase_date: string | null;
  created_at: string;
};

export type Deadline = {
  id: string;
  item_id: string | null;
  title: string;
  deadline_date: string;
  recommended_action: string | null;
  status: string;
  google_event_id: string | null;
  category?: string;
};

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("id,title,category,brand,summary,purchase_date,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function fetchDeadlines(): Promise<Deadline[]> {
  const { data, error } = await supabase
    .from("deadlines")
    .select(
      "id,item_id,title,deadline_date,recommended_action,status,google_event_id,items(category)",
    )
    .order("deadline_date", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as (Deadline & { items?: { category?: string } | null })[];
  return rows.map((row) => ({ ...row, category: normalizeCategory(row.items?.category) }));
}

export async function searchItems(term: string): Promise<Item[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const { data, error } = await supabase
    .from("items")
    .select("id,title,category,brand,summary,purchase_date,created_at")
    .or(`title.ilike.${pattern},category.ilike.${pattern},summary.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as Item[];
}

export function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

/** Deadlines due within the next 7 days (including overdue), excluding completed ones. */
export function upcomingWithinWeek(deadlines: Deadline[]) {
  return deadlines
    .filter((d) => d.status !== "completed" && daysUntil(d.deadline_date) <= 7)
    .sort((a, b) => +new Date(a.deadline_date) - +new Date(b.deadline_date));
}

export function urgencyOf(deadline: Deadline) {
  if (deadline.status === "completed") return "completed" as const;
  const days = daysUntil(deadline.deadline_date);
  if (days < 0) return "overdue" as const;
  if (days === 0) return "today" as const;
  if (days <= 7) return "week" as const;
  return "later" as const;
}

export function timeRemaining(deadline: Deadline) {
  const days = daysUntil(deadline.deadline_date);
  if (deadline.status === "completed") return "Completed";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
