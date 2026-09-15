import { supabase } from "@/integrations/supabase/client";

export type Category = "Electronics" | "Subscriptions" | "Household" | "Documents";
export const CATEGORIES: Category[] = ["Electronics", "Subscriptions", "Household", "Documents"];

export type Item = {
  id: string;
  title: string;
  category: string;
  brand: string | null;
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

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export const MOCK_ITEMS: Item[] = [
  {
    id: "mock-1",
    title: 'Samsung 55" QLED TV',
    category: "Electronics",
    brand: "Samsung",
    purchase_date: "2026-08-20",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    title: "Netflix Premium",
    category: "Subscriptions",
    brand: "Netflix",
    purchase_date: "2026-01-11",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    title: "Passport Renewal",
    category: "Documents",
    brand: null,
    purchase_date: "2016-09-02",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    title: "Dyson V11 Vacuum",
    category: "Household",
    brand: "Dyson",
    purchase_date: "2025-03-14",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_DEADLINES: Deadline[] = [
  {
    id: "mock-d1",
    item_id: "mock-1",
    title: "TV return window closes",
    deadline_date: daysFromNow(-1),
    recommended_action: "Test the television today before the return window expires.",
    status: "pending",
    google_event_id: null,
    category: "Electronics",
  },
  {
    id: "mock-d2",
    item_id: "mock-2",
    title: "Netflix renews at higher price",
    deadline_date: daysFromNow(3),
    recommended_action: "Decide whether to downgrade the plan before renewal.",
    status: "pending",
    google_event_id: null,
    category: "Subscriptions",
  },
  {
    id: "mock-d3",
    item_id: "mock-3",
    title: "Passport expires",
    deadline_date: daysFromNow(21),
    recommended_action: "Book a renewal appointment and collect photos.",
    status: "pending",
    google_event_id: null,
    category: "Documents",
  },
  {
    id: "mock-d4",
    item_id: "mock-4",
    title: "Vacuum warranty ends",
    deadline_date: daysFromNow(-12),
    recommended_action: "Filter replaced under warranty.",
    status: "completed",
    google_event_id: null,
    category: "Household",
  },
];

export async function fetchItems(): Promise<{ data: Item[]; isMock: boolean }> {
  const { data, error } = await supabase
    .from("items")
    .select("id,title,category,brand,purchase_date,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return { data: MOCK_ITEMS, isMock: true };
  return { data: data as Item[], isMock: false };
}

export async function fetchDeadlines(): Promise<{ data: Deadline[]; isMock: boolean }> {
  const { data, error } = await supabase
    .from("deadlines")
    .select("id,item_id,title,deadline_date,recommended_action,status,google_event_id,items(category)")
    .order("deadline_date", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return { data: MOCK_DEADLINES, isMock: true };
  const rows = (data as unknown as (Deadline & { items?: { category?: string } | null })[]).map(
    (row) => ({ ...row, category: row.items?.category ?? "Documents" }),
  );
  return { data: rows, isMock: false };
}

export function urgencyOf(deadline: Deadline) {
  if (deadline.status === "completed") return "completed" as const;
  const diff = new Date(deadline.deadline_date).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "overdue" as const;
  if (days <= 0) return "today" as const;
  if (days <= 7) return "week" as const;
  return "later" as const;
}

export function timeRemaining(deadline: Deadline) {
  const days = Math.ceil((new Date(deadline.deadline_date).getTime() - Date.now()) / 86400000);
  if (deadline.status === "completed") return "Completed";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Ends tomorrow";
  return `Ends in ${days} days`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
