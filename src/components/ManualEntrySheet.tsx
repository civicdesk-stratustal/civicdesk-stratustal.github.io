import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, normalizeCategory, type Category } from "@/lib/civic";
import { createConnectedCalendarEvent } from "@/lib/calendar.functions";
import { GlassButton, GlassInput } from "./glass";

export function ManualEntrySheet({
  calendarSync,
  onClose,
  onSaved,
}: {
  calendarSync: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const createCalendarEvent = useServerFn(createConnectedCalendarEvent);
  const [draft, setDraft] = useState({
    title: "",
    category: "Subscriptions" as Category,
    summary: "",
    deadline: "",
    action: "",
  });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!draft.title.trim()) {
      toast.error("Give this item a name");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You are signed out");
      const { data: item, error } = await supabase
        .from("items")
        .insert({
          user_id: auth.user.id,
          title: draft.title.trim(),
          category: normalizeCategory(draft.category),
          summary: draft.summary.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (draft.deadline) {
        const event = calendarSync
          ? await createCalendarEvent({
              data: { title: draft.title, date: draft.deadline, description: draft.action },
            })
          : null;
        const { error: deadlineError } = await supabase.from("deadlines").insert({
          user_id: auth.user.id,
          item_id: item.id,
          title: draft.title.trim(),
          deadline_date: new Date(`${draft.deadline}T12:00:00`).toISOString(),
          recommended_action: draft.action || null,
          status: "pending",
          calendar_event_id: event?.eventId ?? null,
        });
        if (deadlineError) throw deadlineError;
      }
      toast.success("Saved to your vault");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this item");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md">
      <div className="glass-strong max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add manually</h2>
          <button onClick={onClose} aria-label="Close" className="press p-2 text-foreground/60">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <GlassInput
            label="Item"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <div>
            <span className="mb-1.5 block text-xs font-medium text-foreground/60">Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setDraft({ ...draft, category })}
                  className={`press min-h-11 rounded-full border px-4 text-xs font-medium ${draft.category === category ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-foreground/[0.06] text-foreground/70"}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <GlassInput
            label="Summary"
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          />
          <GlassInput
            label="Deadline, renewal, or expiry date"
            type="date"
            value={draft.deadline}
            onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
          />
          <GlassInput
            label="Recommended action"
            value={draft.action}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          />
          <GlassButton className="w-full" loading={saving} onClick={save}>
            Save to vault
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
