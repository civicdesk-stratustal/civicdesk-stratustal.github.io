import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, FileText, FileUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GlassButton, GlassCard } from "@/components/glass";
import { SearchBar } from "@/components/SearchBar";
import { CaptureSheet } from "@/components/CaptureSheet";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  fetchDeadlines,
  greeting,
  timeRemaining,
  upcomingWithinWeek,
  urgencyOf,
  type Deadline,
} from "@/lib/civic";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Today | CivicDesk" },
      {
        name: "description",
        content: "Scan or upload a document and see every deadline due in the next seven days.",
      },
      { property: "og:title", content: "Today | CivicDesk" },
      { property: "og:description", content: "Your deadlines for the next seven days." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [sync, setSync] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["deadlines"], queryFn: fetchDeadlines });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      const meta = u.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name?.split(" ")[0] ?? u.user?.email?.split("@")[0] ?? "");
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

  const upcoming = upcomingWithinWeek(data ?? []);

  async function complete(d: Deadline) {
    const { error } = await supabase.from("deadlines").update({ status: "completed" }).eq("id", d.id);
    if (error) {
      toast.error("Could not update this one");
      return;
    }
    toast.success("Marked complete");
    qc.invalidateQueries({ queryKey: ["deadlines"] });
  }

  function choose(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length) setPending(files);
  }

  return (
    <div className="safe-top px-5">
      <header className="mb-4">
        <h1 className="truncate text-xl font-bold text-foreground">
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="text-xs text-foreground/45">CivicDesk by Stratustal</p>
      </header>

      <div className="mb-5">
        <SearchBar onSelect={() => navigate({ to: "/vault" })} />
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => choose(e.target.files)}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => choose(e.target.files)}
      />

      <div className="mb-7 grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="press glass flex min-h-36 flex-col items-center justify-center gap-3 rounded-3xl p-4"
        >
          <Camera className="h-8 w-8 text-primary" />
          <span className="text-sm font-semibold text-foreground">Scan Document</span>
        </button>
        <button
          onClick={() => uploadRef.current?.click()}
          className="press glass flex min-h-36 flex-col items-center justify-center gap-3 rounded-3xl p-4"
        >
          <FileUp className="h-8 w-8 text-primary" />
          <span className="text-sm font-semibold text-foreground">Upload Files</span>
        </button>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground/80">Upcoming · next 7 days</h2>
      <div className="space-y-3">
        {isLoading ? (
          <GlassCard className="h-28 animate-pulse">{null}</GlassCard>
        ) : upcoming.length === 0 ? (
          <GlassCard className="text-center text-sm text-foreground/60">
            Nothing due in the next seven days.
          </GlassCard>
        ) : (
          upcoming.map((d) => <ActionCard key={d.id} deadline={d} onComplete={() => complete(d)} />)
        )}
      </div>

      {pending.length ? (
        <CaptureSheet
          files={pending}
          calendarSync={sync}
          onClose={() => {
            setPending([]);
            if (cameraRef.current) cameraRef.current.value = "";
            if (uploadRef.current) uploadRef.current.value = "";
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["deadlines"] });
            qc.invalidateQueries({ queryKey: ["items"] });
          }}
        />
      ) : null}
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
  const [viewing, setViewing] = useState(false);
  const u = urgencyOf(deadline);
  const tone =
    u === "overdue"
      ? "text-destructive"
      : u === "today"
        ? "text-amber-500"
        : u === "completed"
          ? "text-emerald-500"
          : "text-foreground/70";

  return (
    <GlassCard>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{deadline.title}</h3>
          <span className="mt-1 inline-block rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/60">
            {deadline.category ?? "Documents"}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-semibold ${tone}`}>{timeRemaining(deadline)}</span>
      </div>
      {deadline.recommended_action ? (
        <p className="mt-3 text-xs leading-relaxed text-foreground/65">
          {deadline.recommended_action}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2">
        {deadline.item_id ? (
          <GlassButton variant="glass" className="w-full" onClick={() => setViewing(true)}>
            <FileText className="h-4 w-4" /> View document
          </GlassButton>
        ) : null}
        {deadline.status !== "completed" ? (
          <GlassButton variant="glass" className="w-full" onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4" /> Mark complete
          </GlassButton>
        ) : null}
      </div>
      {viewing && deadline.item_id ? (
        <DocumentViewer itemId={deadline.item_id} onClose={() => setViewing(false)} />
      ) : null}
    </GlassCard>
  );
}
