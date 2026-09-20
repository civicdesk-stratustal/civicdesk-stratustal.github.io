import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft,
  CreditCard,
  FileText,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { SearchBar } from "@/components/SearchBar";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  CATEGORIES,
  fetchDeadlines,
  fetchItems,
  normalizeCategory,
  timeRemaining,
  type Category,
} from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({
    meta: [
      { title: "Vault | CivicDesk" },
      {
        name: "description",
        content:
          "Your documents, warranties, subscriptions, gift cards and return windows, sorted automatically.",
      },
      { property: "og:title", content: "Vault | CivicDesk" },
      { property: "og:description", content: "Everything you track, sorted into five folders." },
    ],
  }),
  component: VaultPage,
});

const ICONS: Record<Category, typeof FileText> = {
  Documents: FileText,
  Warranties: ShieldCheck,
  Subscriptions: RefreshCw,
  "Gift Cards": CreditCard,
  "Return Windows": RotateCcw,
};

function VaultPage() {
  const [open, setOpen] = useState<Category | null>(null);
  const [viewingItem, setViewingItem] = useState<string | null>(null);
  const { data: items, isLoading } = useQuery({ queryKey: ["items"], queryFn: fetchItems });
  const { data: deadlines } = useQuery({ queryKey: ["deadlines"], queryFn: fetchDeadlines });

  const all = items ?? [];
  const byItem = new Map((deadlines ?? []).map((d) => [d.item_id, d]));

  if (open) {
    const list = all.filter((i) => normalizeCategory(i.category) === open);
    return (
      <div className="safe-top px-5">
        <header className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setOpen(null)}
            aria-label="Back to vault"
            className="press glass flex h-11 w-11 items-center justify-center rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-foreground/80" />
          </button>
          <h1 className="truncate text-xl font-bold text-foreground">{open}</h1>
        </header>

        <div className="space-y-3">
          {list.length === 0 ? (
            <GlassCard className="text-center text-sm text-foreground/60">
              Nothing filed here yet.
            </GlassCard>
          ) : (
            list.map((item) => {
              const deadline = byItem.get(item.id);
              return (
                <GlassCard key={item.id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
                    {deadline ? (
                      <span className="shrink-0 text-xs font-semibold text-foreground/70">
                        {timeRemaining(deadline)}
                      </span>
                    ) : null}
                  </div>
                  {item.summary ? (
                    <p className="mt-2 text-xs leading-relaxed text-foreground/60">{item.summary}</p>
                  ) : null}
                  <GlassButton
                    variant="glass"
                    className="mt-3 w-full"
                    onClick={() => setViewingItem(item.id)}
                  >
                    <FileText className="h-4 w-4" /> View document
                  </GlassButton>
                </GlassCard>
              );
            })
          )}
        </div>
        {viewingItem ? (
          <DocumentViewer itemId={viewingItem} onClose={() => setViewingItem(null)} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="safe-top px-5">
      <h1 className="mb-4 text-xl font-bold text-foreground">Vault</h1>
      <div className="mb-5">
        <SearchBar onSelect={(item) => setOpen(normalizeCategory(item.category))} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c];
          const count = all.filter((i) => normalizeCategory(i.category) === c).length;
          return (
            <button
              key={c}
              onClick={() => setOpen(c)}
              className="press glass flex min-h-32 flex-col items-start justify-between rounded-3xl p-4 text-left"
            >
              <Icon className="h-7 w-7 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-foreground">{c}</span>
                <span className="block text-xs text-foreground/55">
                  {isLoading ? "…" : `${count} item${count === 1 ? "" : "s"}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
