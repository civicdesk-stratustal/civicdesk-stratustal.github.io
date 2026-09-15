import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassCard } from "@/components/glass";
import { AddItemSheet } from "@/components/AddItemSheet";
import { fetchDeadlines, greeting, timeRemaining, urgencyOf, type Deadline } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Today | CivicDesk" },
      { name: "description", content: "Your deadlines, sorted by urgency, with the next action to take." },
      { property: "og:title", content: "Today | CivicDesk" },
      { property: "og:description", content: "Your deadlines, sorted by urgency." },
    ],
  }),
  component: HomePage,
});

const FILTERS = ["All", "Needs Attention", "Upcoming", "Completed"] as const;

function HomePage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("there");
  const [sync, setSync] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["deadlines"], queryFn: fetchDeadlines });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      const meta = u.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name?.split(" ")[0] ?? u.user?.email?.split("@")[0] ?? "there");
    });
    supabase
      .from("profiles")
      .select("preferences")
      .maybeSingle()
      .then(({ data: p }) => {
        const prefs = p?.preferences as { calendar_sync?: boolean } | null;
        setSync(!!prefs?.calendar_sync);
      });
  }, []);

  const deadlines = data?.data ?? [];
  const order = { overdue: 0, today: 1, week: 2, later: 3, completed: 4 } as const;
  const visible = deadlines
    .filter((d) => {
      const u = urgencyOf(d);
      if (filter === "Completed") return u === "completed";
      if (filter === "Needs Attention") return u === "overdue" || u === "today";
      if (filter === "Upcoming") return u === "week" || u === "later";
      return true;
    })
    .sort((a, b) => order[urgencyOf(a)] - order[urgencyOf(b)]);

  async function complete(d: Deadline) {
    if (d.id.startsWith("mock")) {
      toast.message("This is sample data — add your own item to get started.");
      return;
    }
    const { error } = await supabase.from("deadlines").update({ status: "completed" }).eq("id", d.id);
    if (error) return toast.error("Could not update this one");
    toast.success("Marked complete");
    qc.invalidateQueries({ queryKey: ["deadlines"] });
  }

  return (
    <div className="safe-top px-5">
      <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white">
            {greeting()}, {name}
          </h1>
          <p className="text-[11px] text-white/45">CivicDesk Beta by Stratustal</p>
        </div>
        <button
          aria-label="Notifications"
          onClick={() => toast.message("Reminders arrive as your deadlines get close.")}
          className="press glass flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Bell className="h-5 w-5 text-white/80" />
        </button>
      </header>

      <GlassButton className="mb-5 w-full" onClick={() => setAdding(true)}>
        <Plus className="h-4 w-4" /> Add item
      </GlassButton>

      <div className="mb-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`press min-h-11 shrink-0 rounded-full border border-white/15 px-4 text-xs font-semibold ${
              filter === f ? "bg-white text-slate-950" : "bg-white/[0.06] text-white/70"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {data?.isMock ? (
        <p className="mb-3 text-[11px] text-white/40">Showing sample data until you add your first item.</p>
      ) : null}

      <div className="space-y-3">
        {isLoading ? (
          <GlassCard className="h-28 animate-pulse" children={null} />
        ) : visible.length === 0 ? (
          <GlassCard className="text-center text-sm text-white/60">
            Nothing here right now.
          </GlassCard>
        ) : (
          visible.map((d) => <ActionCard key={d.id} deadline={d} onComplete={() => complete(d)} />)
        )}
      </div>

      <AddItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        calendarSync={sync}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["deadlines"] });
          qc.invalidateQueries({ queryKey: ["items"] });
        }}
      />
    </div>
  );
}

export function ActionCard({
  deadline,
  onComplete,
}: {
  deadline: Deadline;
  onComplete: () => void;
}) {
  const u = urgencyOf(deadline);
  const tone =
    u === "overdue"
      ? "text-destructive"
      : u === "today"
        ? "text-amber-400"
        : u === "completed"
          ? "text-emerald-400"
          : "text-white/70";

  return (
    <GlassCard>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{deadline.title}</h3>
          <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
            {deadline.category ?? "Documents"}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-semibold ${tone}`}>{timeRemaining(deadline)}</span>
      </div>
      {deadline.recommended_action ? (
        <p className="mt-3 text-xs leading-relaxed text-white/65">{deadline.recommended_action}</p>
      ) : null}
      {deadline.status !== "completed" ? (
        <GlassButton variant="glass" className="mt-3 w-full" onClick={onComplete}>
          <CheckCircle2 className="h-4 w-4" /> Mark complete
        </GlassButton>
      ) : null}
    </GlassCard>
  );
}
