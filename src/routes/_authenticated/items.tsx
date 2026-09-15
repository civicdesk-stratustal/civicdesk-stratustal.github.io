import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { AddItemSheet } from "@/components/AddItemSheet";
import { CATEGORIES, fetchItems } from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/items")({
  head: () => ({
    meta: [
      { title: "Items | CivicDesk" },
      { name: "description", content: "Everything you track — electronics, subscriptions, household and documents." },
      { property: "og:title", content: "Items | CivicDesk" },
      { property: "og:description", content: "Everything you track in one place." },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  const qc = useQueryClient();
  const [cat, setCat] = useState<string>("All");
  const [adding, setAdding] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["items"], queryFn: fetchItems });

  const items = (data?.data ?? []).filter((i) => cat === "All" || i.category === cat);

  return (
    <div className="safe-top px-5">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-xl font-bold text-white">Your items</h1>
        <GlassButton onClick={() => setAdding(true)} className="shrink-0 px-3">
          <Plus className="h-4 w-4" /> Add
        </GlassButton>
      </header>

      <div className="mb-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`press min-h-11 shrink-0 rounded-full border border-white/15 px-4 text-xs font-semibold ${
              cat === c ? "bg-white text-slate-950" : "bg-white/[0.06] text-white/70"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {data?.isMock ? (
        <p className="mb-3 text-[11px] text-white/40">Sample items shown until you add your own.</p>
      ) : null}

      <div className="space-y-3">
        {isLoading ? (
          <GlassCard className="h-20 animate-pulse">{null}</GlassCard>
        ) : items.length === 0 ? (
          <GlassCard className="text-center text-sm text-white/60">
            Nothing in this category yet.
          </GlassCard>
        ) : (
          items.map((i) => (
            <GlassCard key={i.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{i.title}</h3>
                  <p className="truncate text-xs text-white/55">
                    {[i.brand, i.purchase_date ? `Bought ${i.purchase_date}` : null]
                      .filter(Boolean)
                      .join(" · ") || "No extra details"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/70">
                  {i.category}
                </span>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <AddItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        calendarSync={false}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["items"] });
          qc.invalidateQueries({ queryKey: ["deadlines"] });
        }}
      />
    </div>
  );
}
