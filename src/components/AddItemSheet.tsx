import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, FileUp, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassInput } from "@/components/glass";
import { CATEGORIES } from "@/lib/civic";
import { createCalendarEvent } from "@/utils/googleCalendar";

type Extracted = {
  docType: string;
  title: string;
  brand: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  action: string;
};

function guessFromFile(file: File | null): Extracted {
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 14);
  const base = file ? file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") : "New purchase";
  return {
    docType: file?.type.includes("pdf") ? "Invoice (PDF)" : "Receipt photo",
    title: base.slice(0, 48) || "New purchase",
    brand: "",
    category: "Electronics",
    purchaseDate: today.toISOString().slice(0, 10),
    expiryDate: expiry.toISOString().slice(0, 10),
    action: "Test the item before the return window expires.",
  };
}

export function AddItemSheet({
  open,
  onClose,
  onCreated,
  calendarSync,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  calendarSync: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<Extracted | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function pick(f: File | null) {
    setFile(f);
    setScanning(true);
    setTimeout(() => {
      setDraft(guessFromFile(f));
      setScanning(false);
    }, 900);
  }

  function reset() {
    setFile(null);
    setDraft(null);
    setScanning(false);
    onClose();
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error("Give the item a name");
    if (!draft.expiryDate) return toast.error("Pick a deadline date");
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
          brand: draft.brand || null,
          purchase_date: draft.purchaseDate || null,
        })
        .select("id")
        .single();
      if (itemError) throw itemError;

      let filePath: string | null = null;
      if (file) {
        const path = `${uid}/${item.id}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        if (upErr) toast.error("Item saved, but the file upload failed.");
        else filePath = path;
      }

      await supabase.from("documents").insert({
        user_id: uid,
        item_id: item.id,
        file_path: filePath,
        extracted_data: draft as unknown as Record<string, string>,
      });

      let eventId: string | null = null;
      if (calendarSync) {
        eventId = await createCalendarEvent({
          title: draft.title,
          date: draft.expiryDate,
          description: draft.action,
        });
        if (!eventId) toast.message("Saved. Calendar sync needs a Google sign-in.");
      }

      const { error: dlErr } = await supabase.from("deadlines").insert({
        user_id: uid,
        item_id: item.id,
        title: `${draft.title} deadline`,
        deadline_date: new Date(`${draft.expiryDate}T12:00:00`).toISOString(),
        recommended_action: draft.action,
        status: "pending",
        google_event_id: eventId,
      });
      if (dlErr) throw dlErr;

      toast.success("Item and deadline added");
      onCreated();
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-md">
      <div className="glass max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {draft ? "Check the details" : "Add an item"}
          </h2>
          <button onClick={reset} aria-label="Close" className="press p-2 text-white/60">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!draft ? (
          <div className="space-y-3">
            <p className="text-sm text-white/60">
              Snap a receipt, warranty card or invoice. We pull out the key dates for you.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            <GlassButton className="w-full" onClick={() => fileRef.current?.click()} loading={scanning}>
              <Camera className="h-4 w-4" /> Scan or upload document
            </GlassButton>
            <GlassButton variant="glass" className="w-full" onClick={() => pick(null)}>
              <FileUp className="h-4 w-4" /> Enter details manually
            </GlassButton>
            {scanning ? (
              <p className="flex items-center justify-center gap-2 pt-2 text-xs text-white/60">
                <Sparkles className="h-4 w-4 animate-pulse" /> Reading your document…
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-3 text-xs text-white/60">
              Detected: <span className="text-white">{draft.docType}</span>
              {file ? <span className="block truncate">{file.name}</span> : null}
            </div>
            <GlassInput
              label="Item"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <GlassInput
              label="Brand"
              value={draft.brand}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Samsung"
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-white/60">Category</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, category: c })}
                    className={`press min-h-11 rounded-full border border-white/15 px-4 text-xs font-medium ${
                      draft.category === c ? "bg-primary text-white" : "bg-white/[0.06] text-white/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <GlassInput
              label="Purchase date"
              type="date"
              value={draft.purchaseDate}
              onChange={(e) => setDraft({ ...draft, purchaseDate: e.target.value })}
            />
            <GlassInput
              label="Deadline / warranty expiry"
              type="date"
              value={draft.expiryDate}
              onChange={(e) => setDraft({ ...draft, expiryDate: e.target.value })}
            />
            <GlassInput
              label="Recommended action"
              value={draft.action}
              onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            />
            <GlassButton className="w-full" onClick={save} loading={saving}>
              Looks good — save it
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
}
