import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassInput } from "@/components/glass";
import { CATEGORIES, normalizeCategory, type Category } from "@/lib/civic";
import { analyzeDocument, type DocumentAnalysis } from "@/lib/ai.functions";
import { createCalendarEvent } from "@/utils/googleCalendar";

type Draft = {
  title: string;
  category: Category;
  summary: string;
  deadline_date: string;
  recommended_action: string;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function CaptureSheet({
  files,
  onClose,
  onSaved,
  calendarSync,
}: {
  files: File[];
  onClose: () => void;
  onSaved: () => void;
  calendarSync: boolean;
}) {
  const analyze = useServerFn(analyzeDocument);
  const [reading, setReading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await Promise.all(
          files.slice(0, 5).map(async (f) => ({
            name: f.name,
            mimeType: f.type || "application/octet-stream",
            dataUrl: await fileToDataUrl(f),
          })),
        );
        const result: DocumentAnalysis = await analyze({ data: { files: payload } });
        if (cancelled) return;
        setDraft({
          title: result.title,
          category: normalizeCategory(result.category),
          summary: result.summary,
          deadline_date: result.deadline_date ?? "",
          recommended_action: result.recommended_action,
        });
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "The document could not be read.");
        setDraft({
          title: files[0]?.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "",
          category: "Documents",
          summary: "",
          deadline_date: "",
          recommended_action: "",
        });
      } finally {
        if (!cancelled) setReading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Give this item a name");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("You are signed out");

      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          user_id: uid,
          title: draft.title.trim(),
          category: draft.category,
          summary: draft.summary.trim() || null,
        })
        .select("id")
        .single();
      if (itemError) throw itemError;

      for (const file of files) {
        const path = `${uid}/${item.id}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        await supabase.from("documents").insert({
          user_id: uid,
          item_id: item.id,
          file_path: upErr ? null : path,
          extracted_data: draft as unknown as Record<string, string>,
        });
        if (upErr) toast.error(`Could not store ${file.name}, but the details were saved.`);
      }

      if (draft.deadline_date) {
        let eventId: string | null = null;
        if (calendarSync) {
          const result = await createCalendarEvent({
            title: draft.title,
            date: draft.deadline_date,
            description: draft.recommended_action,
          });
          eventId = result.eventId;
          if (result.status === "unauthorized") {
            toast.error(
              "Google Calendar access expired. Calendar sync is off — re-authorize it in Settings.",
            );
          } else if (result.status === "no-token") {
            toast.message("Saved. Authorize Google Calendar in Settings to sync deadlines.");
          } else if (result.status === "failed") {
            toast.message("Saved, but the calendar event could not be created.");
          }
        }
        const { error: dlErr } = await supabase.from("deadlines").insert({
          user_id: uid,
          item_id: item.id,
          title: draft.title.trim(),
          deadline_date: new Date(`${draft.deadline_date}T12:00:00`).toISOString(),
          recommended_action: draft.recommended_action || null,
          status: "pending",
          google_event_id: eventId,
        });
        if (dlErr) throw dlErr;
      }

      toast.success("Saved to your vault");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-md">
      <div className="glass-strong max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {reading ? "Reading your document" : "Check the details"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="press p-2 text-foreground/60">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 truncate text-xs text-foreground/55">
          {files.map((f) => f.name).join(", ")}
        </p>

        {reading || !draft ? (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-foreground/60">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
            Pulling out the key dates and details…
          </div>
        ) : (
          <div className="space-y-3">
            <GlassInput
              label="Item"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-foreground/60">Category</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, category: c })}
                    className={`press min-h-11 rounded-full border px-4 text-xs font-medium ${
                      draft.category === c
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-foreground/[0.06] text-foreground/70"
                    }`}
                  >
                    {c}
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
              label="Deadline date"
              type="date"
              value={draft.deadline_date}
              onChange={(e) => setDraft({ ...draft, deadline_date: e.target.value })}
            />
            <GlassInput
              label="Recommended action"
              value={draft.recommended_action}
              onChange={(e) => setDraft({ ...draft, recommended_action: e.target.value })}
            />
            <GlassButton className="w-full" onClick={save} loading={saving}>
              Save to vault
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
}
